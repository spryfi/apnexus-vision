import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log('Processing receipt:', imageUrl);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all information from this receipt and return as JSON. Include:
- vendor: merchant/vendor name
- date: transaction date in YYYY-MM-DD format
- total: total amount
- subtotal: subtotal (if present)
- tax: tax amount (if present)
- lineItems: array of {item, quantity, price}
- category: suggested expense category based on items
- confidenceScores: object with confidence 0-100 for each field

Return ONLY valid JSON, no markdown formatting.`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    let extractedData;
    try {
      const content = data.choices[0].message.content;
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse OCR response');
    }

    // Validate extracted data
    const validation = {
      dateValid: true,
      amountValid: true,
      vendorValid: true,
      warnings: [] as string[],
    };

    // Validate date
    if (extractedData.date) {
      const date = new Date(extractedData.date);
      if (date > new Date()) {
        validation.dateValid = false;
        validation.warnings.push('Date cannot be in the future');
      }
    }

    // Validate amounts
    if (extractedData.total && extractedData.subtotal && extractedData.tax) {
      const calculatedTotal = parseFloat(extractedData.subtotal) + parseFloat(extractedData.tax);
      const actualTotal = parseFloat(extractedData.total);
      if (Math.abs(calculatedTotal - actualTotal) > 0.02) {
        validation.amountValid = false;
        validation.warnings.push('Total does not match subtotal + tax');
      }
    }

    // Validate vendor
    if (!extractedData.vendor || extractedData.vendor.trim().length === 0) {
      validation.vendorValid = false;
      validation.warnings.push('Vendor name is empty');
    }

    // Calculate quality score
    const scores = extractedData.confidenceScores || {};
    const avgScore = Object.values(scores).reduce((sum: number, val: any) => sum + val, 0) / 
                     Object.keys(scores).length || 50;
    
    let qualityScore = avgScore;
    if (!validation.dateValid) qualityScore -= 10;
    if (!validation.amountValid) qualityScore -= 10;
    if (!validation.vendorValid) qualityScore -= 10;

    // Determine quality badge
    let qualityBadge = 'poor';
    if (qualityScore >= 90) qualityBadge = 'excellent';
    else if (qualityScore >= 70) qualityBadge = 'good';
    else if (qualityScore >= 50) qualityBadge = 'fair';

    const result = {
      extractedData,
      validation,
      qualityScore,
      qualityBadge,
      confidenceScores: scores,
    };

    console.log('OCR result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-receipt-ocr:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process receipt' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
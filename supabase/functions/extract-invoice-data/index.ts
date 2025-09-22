import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_data, file_type, file_name } = await req.json();

    console.log('Starting invoice extraction for file:', file_name);

    // Prepare the prompt for GPT-4 Vision
    const extractionPrompt = `
    You are an expert invoice data extraction system. Analyze this invoice/receipt image and extract the following information in JSON format:

    {
      "vendor_name": "Company or vendor name",
      "amount": "Total amount as a number (extract just the number, no currency symbols)",
      "invoice_date": "Invoice date in YYYY-MM-DD format",
      "due_date": "Due date in YYYY-MM-DD format (if available)",
      "invoice_number": "Invoice or reference number",
      "description": "Brief description of goods/services"
    }

    Rules:
    - For amount, extract only the total amount as a number (e.g., 150.50, not $150.50)
    - For dates, convert to YYYY-MM-DD format
    - If due date is not explicitly stated, try to infer from payment terms (e.g., "Net 30" means 30 days from invoice date)
    - If information is not available, use null
    - Be as accurate as possible with vendor name extraction
    - Focus on the primary total amount, not subtotals or tax amounts

    Return only valid JSON, no additional text.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
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
                text: extractionPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${file_type};base64,${file_data}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    let extractedData;
    try {
      const extractedText = data.choices[0].message.content.trim();
      console.log('Raw extracted text:', extractedText);
      
      // Clean up the response to ensure it's valid JSON
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(extractedText);
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.log('Raw content:', data.choices[0].message.content);
      
      // Fallback extraction
      extractedData = {
        vendor_name: null,
        amount: null,
        invoice_date: null,
        due_date: null,
        invoice_number: null,
        description: null
      };
    }

    console.log('Successfully extracted data:', extractedData);

    return new Response(JSON.stringify({ 
      success: true,
      extracted_data: extractedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-invoice-data function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      extracted_data: {
        vendor_name: null,
        amount: null,
        invoice_date: null,
        due_date: null,
        invoice_number: null,
        description: null
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
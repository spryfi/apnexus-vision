import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedData {
  vendor_name?: string;
  transaction_date?: string;
  total_amount?: number;
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { document_url } = await req.json();
    
    if (!document_url) {
      throw new Error('Document URL is required');
    }

    console.log('Processing document for AI extraction:', document_url);

    // Call OpenAI Vision API to analyze the document
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
            role: 'system',
            content: `You are an expert accounts payable clerk. Analyze this receipt/invoice and extract structured data. 

Return a JSON object with this exact structure:
{
  "vendor_name": "string",
  "transaction_date": "YYYY-MM-DD",
  "total_amount": number,
  "line_items": [
    {
      "description": "string",
      "quantity": number,
      "unit_price": number,
      "total_price": number
    }
  ]
}

Rules:
- Extract ALL individual line items with their descriptions, quantities, and prices
- Ensure quantity * unit_price = total_price for each line item
- If no line items are visible, create one item with the description "General expense" and the total amount
- Use the exact vendor name as shown on the document
- Date must be in YYYY-MM-DD format`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this receipt/invoice and extract the vendor name, transaction date, total amount, and all line items with their descriptions, quantities, and prices.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: document_url
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const extractedText = data.choices[0].message.content;
    console.log('Extracted text:', extractedText);

    // Parse the JSON response from OpenAI
    let extractedData: ExtractedData;
    try {
      // Remove any markdown formatting if present
      const jsonMatch = extractedText.match(/```json\n?(.*?)\n?```/s) || extractedText.match(/\{.*\}/s);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : extractedText;
      
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse extracted data from AI response');
    }

    // Validate and clean the extracted data
    const cleanedData: ExtractedData = {
      vendor_name: extractedData.vendor_name || '',
      transaction_date: extractedData.transaction_date || '',
      total_amount: typeof extractedData.total_amount === 'number' ? extractedData.total_amount : 0,
      line_items: extractedData.line_items || []
    };

    // Ensure line items have valid numeric values
    if (cleanedData.line_items) {
      cleanedData.line_items = cleanedData.line_items.map(item => ({
        description: item.description || 'Unknown item',
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        unit_price: typeof item.unit_price === 'number' ? item.unit_price : 0,
        total_price: typeof item.total_price === 'number' ? item.total_price : 0
      }));
    }

    console.log('Cleaned extracted data:', cleanedData);

    return new Response(JSON.stringify(cleanedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-receipt-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to extract receipt data',
        details: error.toString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
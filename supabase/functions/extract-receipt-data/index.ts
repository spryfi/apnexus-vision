import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  document_url?: string;
  fileUrl?: string;
  extractionType?: string;
}

interface ExtractedData {
  vendor_name?: string;
  vendorName?: string;
  transaction_date?: string;
  transactionDate?: string;
  serviceDate?: string;
  total_amount?: number;
  totalAmount?: number;
  totalCost?: number;
  odometerReading?: number;
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    part_number?: string;
    partNumber?: string;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unit_price?: number;
    unitPrice?: number;
    total_price?: number;
    totalPrice?: number;
    part_number?: string;
    partNumber?: string;
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

    const { document_url, fileUrl, extractionType = 'expense' }: RequestBody = await req.json();
    const documentUrl = document_url || fileUrl;
    
    if (!documentUrl) {
      throw new Error('Document URL is required');
    }

    console.log('Processing document for AI extraction:', documentUrl, 'Type:', extractionType);

    // Prepare the prompt based on extraction type
    let systemPrompt = '';
    
    if (extractionType === 'maintenance') {
      systemPrompt = `You are an expert service advisor analyzing vehicle maintenance invoices. 
      
      Extract the following information from this service invoice:
      1. Service Provider's Name
      2. Service Date (format: YYYY-MM-DD)
      3. Vehicle's Odometer reading (if visible)
      4. Final Total Cost
      5. All individual line items for parts and labor with:
         - Description (e.g., "Oil Change", "Air Filter Replacement")
         - Part number (if available)
         - Quantity
         - Unit price
         - Total price for that line item
      
      Return as JSON with this exact structure:
      {
        "vendorName": "string",
        "serviceDate": "YYYY-MM-DD",
        "odometerReading": number,
        "totalCost": number,
        "lineItems": [
          {
            "description": "string",
            "partNumber": "string",
            "quantity": number,
            "unitPrice": number,
            "totalPrice": number
          }
        ]
      }`;
    } else {
      systemPrompt = `You are an expert accounts payable clerk analyzing business receipts and invoices.
      
      Extract the following information:
      1. Vendor Name
      2. Transaction Date (format: YYYY-MM-DD)
      3. Final Total Amount
      4. All individual line items with:
         - Description
         - Quantity
         - Price per unit
         - Total price for that line item
      
      Return as JSON with this exact structure:
      {
        "vendorName": "string",
        "transactionDate": "YYYY-MM-DD",
        "totalAmount": number,
        "lineItems": [
          {
            "description": "string",
            "quantity": number,
            "unitPrice": number,
            "totalPrice": number
          }
        ]
      }`;
    }
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: extractionType === 'maintenance' 
                  ? 'Please analyze this vehicle service invoice and extract the service provider, date, odometer reading, total cost, and all line items.'
                  : 'Please analyze this receipt/invoice and extract the vendor name, transaction date, total amount, and all line items with their descriptions, quantities, and prices.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: documentUrl
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

    return new Response(JSON.stringify({
      extractedData: cleanedData,
      message: 'Receipt data extracted successfully'
    }), {
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
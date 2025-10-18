import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transaction, flagReason } = await req.json();

    const prompt = `You are a financial analyst reviewing a flagged transaction. 

Transaction Details:
- Date: ${transaction.transaction_date}
- Amount: $${transaction.amount}
- Vendor: ${transaction.vendor_name || transaction.merchant || 'Unknown'}
- Description: ${transaction.description || transaction.purchase_description || 'No description'}
- Category: ${transaction.category_name || 'Uncategorized'}
- Has Receipt: ${transaction.receipt_uploaded ? 'Yes' : 'No'}

Flag Reason: ${flagReason}

Please analyze this transaction and provide:
1. Assessment of the flag validity
2. Potential risks or concerns
3. Recommendation (Approve/Reject/Request More Info)
4. Suggested actions

Keep the analysis concise and professional.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a financial analyst specializing in transaction validation and fraud detection. Provide clear, concise analysis.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-transaction function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

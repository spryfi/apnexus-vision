import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditRequest {
  transactionId: string;
}

interface TransactionData {
  id: string;
  amount: number;
  vendors: { vendor_name: string };
  expense_categories: { category_name: string };
  transaction_memo: string;
  invoice_receipt_url: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactionId }: AuditRequest = await req.json();
    console.log('Starting AI audit for transaction:', transactionId);

    // Fetch transaction details
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select(`
        *,
        vendors(vendor_name),
        expense_categories(category_name)
      `)
      .eq('id', transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new Error('Transaction not found');
    }

    console.log('Transaction fetched:', transaction.vendors?.vendor_name, transaction.amount);

    // Run anomaly detection
    const anomalies = await detectAnomalies(transaction);
    
    if (anomalies.length > 0) {
      console.log('Anomalies detected:', anomalies);

      // Update transaction with AI flag
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          ai_flagged_status: true,
          ai_flag_reason: anomalies.join('; ')
        })
        .eq('id', transactionId);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }

      // Send email notification to admin
      await sendAdminNotification(transaction, anomalies);

      return new Response(
        JSON.stringify({ 
          flagged: true, 
          reason: anomalies.join('; '),
          message: 'Transaction flagged for admin review'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        flagged: false, 
        message: 'Transaction passed AI audit'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in AI audit:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
};

async function detectAnomalies(transaction: TransactionData): Promise<string[]> {
  const anomalies: string[] = [];
  
  // Anomaly 1: Amount vs Category check
  const categoryAmountCheck = checkAmountVsCategory(transaction);
  if (categoryAmountCheck) {
    anomalies.push(categoryAmountCheck);
  }

  // Anomaly 2: Vendor vs Category mismatch
  const vendorCategoryCheck = checkVendorVsCategory(transaction);
  if (vendorCategoryCheck) {
    anomalies.push(vendorCategoryCheck);
  }

  // Anomaly 3: Keyword analysis
  const keywordCheck = await analyzeKeywords(transaction);
  if (keywordCheck) {
    anomalies.push(keywordCheck);
  }

  // Anomaly 4: High amount threshold
  if (transaction.amount > 5000) {
    anomalies.push(`High amount transaction: $${transaction.amount.toFixed(2)} exceeds $5,000 threshold`);
  }

  return anomalies;
}

function checkAmountVsCategory(transaction: TransactionData): string | null {
  const amount = transaction.amount;
  const category = transaction.expense_categories?.category_name?.toLowerCase() || '';

  // Office supplies shouldn't be over $500
  if (category.includes('office') && amount > 500) {
    return `Unusual office expense: $${amount.toFixed(2)} seems high for office supplies`;
  }

  // Meals shouldn't be over $200 per transaction
  if ((category.includes('meal') || category.includes('food')) && amount > 200) {
    return `High meal expense: $${amount.toFixed(2)} exceeds typical meal threshold`;
  }

  // Travel expenses over $2000 should be flagged
  if (category.includes('travel') && amount > 2000) {
    return `High travel expense: $${amount.toFixed(2)} requires review`;
  }

  return null;
}

function checkVendorVsCategory(transaction: TransactionData): string | null {
  const vendor = transaction.vendors?.vendor_name?.toLowerCase() || '';
  const category = transaction.expense_categories?.category_name?.toLowerCase() || '';

  // Gas stations should be fuel expenses
  const gasStations = ['shell', 'bp', 'exxon', 'chevron', 'mobil', 'texaco', 'sunoco'];
  if (gasStations.some(station => vendor.includes(station)) && !category.includes('fuel')) {
    return `Vendor/Category mismatch: ${transaction.vendors?.vendor_name} appears to be a gas station but categorized as ${transaction.expense_categories?.category_name}`;
  }

  // Restaurants should be meals
  const restaurants = ['restaurant', 'cafe', 'diner', 'bistro', 'grill', 'pizza'];
  if (restaurants.some(rest => vendor.includes(rest)) && !category.includes('meal') && !category.includes('food')) {
    return `Vendor/Category mismatch: ${transaction.vendors?.vendor_name} appears to be a restaurant but categorized as ${transaction.expense_categories?.category_name}`;
  }

  return null;
}

async function analyzeKeywords(transaction: TransactionData): Promise<string | null> {
  const memo = transaction.transaction_memo?.toLowerCase() || '';
  
  // Check for personal keywords
  const personalKeywords = ['personal', 'family', 'gift', 'birthday', 'anniversary', 'vacation'];
  const foundPersonal = personalKeywords.find(keyword => memo.includes(keyword));
  
  if (foundPersonal) {
    return `Potential personal expense: memo contains "${foundPersonal}"`;
  }

  // Check for unusual patterns
  if (memo.includes('cash') && transaction.amount > 1000) {
    return `Large cash transaction: $${transaction.amount.toFixed(2)} with cash mentioned in memo`;
  }

  return null;
}

async function sendAdminNotification(transaction: TransactionData, anomalies: string[]): Promise<void> {
  try {
    console.log('Sending admin notification for flagged transaction');
    
    // Here you would integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll log the notification details
    const notificationData = {
      to: 'paul@spryfi.net',
      subject: '🚨 AI Transaction Audit Alert',
      transaction: {
        id: transaction.id,
        vendor: transaction.vendors?.vendor_name,
        amount: transaction.amount,
        category: transaction.expense_categories?.category_name,
        memo: transaction.transaction_memo
      },
      anomalies: anomalies,
      timestamp: new Date().toISOString()
    };

    console.log('Admin notification prepared:', JSON.stringify(notificationData, null, 2));
    
    // TODO: Implement actual email sending
    // await sendEmail(notificationData);
    
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

serve(handler);
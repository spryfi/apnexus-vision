import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  'Trans ID': string;
  'Trans Date': string;
  'Custom Vehicle/Asset ID': string;
  'Driver First Name': string;
  'Driver Last Name': string;
  'Units': string;
  'Unit Cost': string;
  'Total Fuel Cost': string;
  'Current Odometer': string;
  'Merchant Name': string;
}

interface ProcessedTransaction {
  sourceTransactionId: string;
  transactionDate: string;
  vehicleId: string;
  employeeName: string;
  gallons: number;
  costPerGallon: number;
  totalCost: number;
  odometer: number;
  merchantName: string;
  status: 'new' | 'duplicate' | 'flagged';
  flagReason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing fuel statement file:', file.name);

    // Read and parse CSV content
    const csvContent = await file.text();
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    console.log('CSV headers found:', headers);

    const processedTransactions: ProcessedTransaction[] = [];

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      
      if (values.length < headers.length) continue;

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      try {
        const transaction = await processTransaction(row as unknown as CSVRow, supabase);
        processedTransactions.push(transaction);
      } catch (error) {
        console.error('Error processing transaction:', error);
        // Skip invalid rows
      }
    }

    console.log(`Processed ${processedTransactions.length} transactions`);

    return new Response(
      JSON.stringify({ 
        transactions: processedTransactions,
        summary: {
          total: processedTransactions.length,
          new: processedTransactions.filter(t => t.status === 'new').length,
          duplicate: processedTransactions.filter(t => t.status === 'duplicate').length,
          flagged: processedTransactions.filter(t => t.status === 'flagged').length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-fuel-statement function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processTransaction(row: CSVRow, supabase: any): Promise<ProcessedTransaction> {
  const sourceTransactionId = row['Trans ID'];
  const transactionDate = new Date(row['Trans Date']).toISOString();
  const vehicleId = row['Custom Vehicle/Asset ID'];
  const employeeName = `${row['Driver First Name']} ${row['Driver Last Name']}`.trim();
  const gallons = parseFloat(row['Units']);
  const costPerGallon = parseFloat(row['Unit Cost']);
  const totalCost = parseFloat(row['Total Fuel Cost']);
  const odometer = parseInt(row['Current Odometer']);
  const merchantName = row['Merchant Name'];

  // Check for duplicate
  const { data: existing } = await supabase
    .from('fuel_transactions_new')
    .select('id')
    .eq('source_transaction_id', sourceTransactionId)
    .single();

  if (existing) {
    return {
      sourceTransactionId,
      transactionDate,
      vehicleId,
      employeeName,
      gallons,
      costPerGallon,
      totalCost,
      odometer,
      merchantName,
      status: 'duplicate'
    };
  }

  // AI Anomaly Detection
  const flagCheck = await checkForAnomalies(
    vehicleId,
    employeeName,
    gallons,
    totalCost,
    transactionDate,
    odometer,
    supabase
  );

  return {
    sourceTransactionId,
    transactionDate,
    vehicleId,
    employeeName,
    gallons,
    costPerGallon,
    totalCost,
    odometer,
    merchantName,
    status: flagCheck.shouldFlag ? 'flagged' : 'new',
    flagReason: flagCheck.reason
  };
}

async function checkForAnomalies(
  vehicleId: string,
  employeeName: string,
  gallons: number,
  totalCost: number,
  transactionDate: string,
  odometer: number,
  supabase: any
): Promise<{ shouldFlag: boolean; reason?: string }> {
  
  // Check transaction time (weekends/after hours)
  const date = new Date(transactionDate);
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = date.getHours();
  
  if (day === 0 || day === 6) {
    return { shouldFlag: true, reason: 'Weekend transaction' };
  }
  
  if (hour > 19 || hour < 6) {
    return { shouldFlag: true, reason: 'After-hours transaction' };
  }

  // Get historical data for the vehicle
  const { data: vehicleHistory } = await supabase
    .from('fuel_transactions_new')
    .select('gallons, total_cost, odometer')
    .eq('vehicle_id', vehicleId)
    .order('transaction_date', { ascending: false })
    .limit(10);

  if (vehicleHistory && vehicleHistory.length > 0) {
    // Check for unusually high cost
    const avgCost = vehicleHistory.reduce((sum, t) => sum + Number(t.total_cost), 0) / vehicleHistory.length;
    if (totalCost > avgCost * 1.5) {
      return { shouldFlag: true, reason: 'Unusually high cost' };
    }

    // Check for unusually high gallons
    const avgGallons = vehicleHistory.reduce((sum, t) => sum + Number(t.gallons), 0) / vehicleHistory.length;
    if (gallons > avgGallons * 1.5) {
      return { shouldFlag: true, reason: 'Unusually high fuel amount' };
    }

    // Check fuel economy if we have odometer data
    const lastTransaction = vehicleHistory[0];
    if (lastTransaction.odometer && odometer > lastTransaction.odometer) {
      const milesDriven = odometer - lastTransaction.odometer;
      const mpg = milesDriven / gallons;
      
      if (mpg < 5 || mpg > 50) {
        return { shouldFlag: true, reason: 'Unusual fuel economy' };
      }
    }
  }

  return { shouldFlag: false };
}
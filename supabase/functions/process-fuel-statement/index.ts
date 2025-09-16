import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to properly parse CSV lines with quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result;
}

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
  matchedVehicleId?: string;
  matchedVehicleName?: string;
  matchType: 'Direct ID Match' | 'Odometer Match' | 'Unmatched';
}

serve(async (req) => {
  console.log('Edge function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Parsing form data...');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file provided in form data');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing fuel statement file:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Read and parse CSV content
    const csvContent = await file.text();
    console.log('File content length:', csvContent.length);
    console.log('First 500 characters:', csvContent.substring(0, 500));
    
    // Better CSV parsing that handles quoted values
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log('Total lines found:', lines.length);
    
    if (lines.length === 0) {
      throw new Error('File appears to be empty');
    }
    
    // Parse CSV header row
    const headers = parseCSVLine(lines[0]);
    console.log('CSV headers found:', headers);

    const processedTransactions: ProcessedTransaction[] = [];

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length === 0 || values.every(v => !v.trim())) {
        console.log(`Skipping empty row ${i + 1}`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      console.log(`Processing row ${i + 1}:`, row);

      try {
        const transaction = await processTransaction(row as unknown as CSVRow, supabase);
        processedTransactions.push(transaction);
        console.log(`Successfully processed transaction for ${transaction.employeeName}`);
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        console.error('Row data:', row);
        // Skip invalid rows but continue processing
      }
    }

    console.log(`Processed ${processedTransactions.length} transactions`);

    const result = {
      transactions: processedTransactions,
      summary: {
        total: processedTransactions.length,
        new: processedTransactions.filter(t => t.status === 'new').length,
        duplicate: processedTransactions.filter(t => t.status === 'duplicate').length,
        flagged: processedTransactions.filter(t => t.status === 'flagged').length
      }
    };

    console.log('Returning result:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-fuel-statement function:', error);
    console.error('Error details:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processTransaction(row: CSVRow, supabase: any): Promise<ProcessedTransaction> {
  // Log the raw row data for debugging
  console.log('Raw CSV row:', row);
  
  const sourceTransactionId = row['Trans ID'];
  if (!sourceTransactionId) {
    throw new Error('Missing Trans ID');
  }
  
  const transactionDateStr = row['Transaction Date'];
  if (!transactionDateStr) {
    throw new Error('Missing Transaction Date');
  }
  
  // Combine Transaction Date and Transaction Time if available
  const transactionTimeStr = row['Transaction Time'] || '00:00:00';
  const fullDateTimeStr = `${transactionDateStr} ${transactionTimeStr}`;
  const transactionDate = new Date(fullDateTimeStr).toISOString();
  const rawVehicleId = row['Custom Vehicle/Asset ID'];
  const employeeName = `${row['Driver First Name'] || ''} ${row['Driver Last Name'] || ''}`.trim();
  const gallons = parseFloat(row['Units']) || 0;
  const costPerGallon = parseFloat(row['Unit Cost']) || 0;
  const totalCost = parseFloat(row['Total Fuel Cost']) || 0;
  const odometer = parseInt(row['Current Odometer']) || 0;
  const merchantName = row['Merchant Name'] || '';
  
  console.log('Parsed transaction data:', {
    sourceTransactionId,
    transactionDate,
    rawVehicleId,
    employeeName,
    gallons,
    costPerGallon,
    totalCost,
    odometer,
    merchantName
  });

  // Intelligent Vehicle Matching
  const matchResult = await performVehicleMatching(rawVehicleId, odometer, supabase);
  console.log('Vehicle matching result:', matchResult);

  // Check for duplicate
  const { data: existing, error: duplicateError } = await supabase
    .from('fuel_transactions_new')
    .select('id')
    .eq('source_transaction_id', sourceTransactionId)
    .maybeSingle();
    
  if (duplicateError) {
    console.error('Error checking for duplicates:', duplicateError);
  }

  if (existing) {
    return {
      sourceTransactionId,
      transactionDate,
      vehicleId: matchResult.vehicleId,
      employeeName,
      gallons,
      costPerGallon,
      totalCost,
      odometer,
      merchantName,
      status: 'duplicate',
      matchedVehicleId: matchResult.matchedVehicleId,
      matchedVehicleName: matchResult.matchedVehicleName,
      matchType: matchResult.matchType
    };
  }

  // Paul McKnight Allowlist - Skip AI anomaly detection
  let flagCheck = { shouldFlag: false, reason: undefined };
  
  if (employeeName === "Paul McKnight") {
    console.log('Paul McKnight detected - skipping anomaly checks, setting status to Verified');
    // Skip anomaly detection for Paul McKnight, status will be 'new' which gets processed as 'Verified'
  } else {
    // AI Anomaly Detection for all other employees
    flagCheck = await checkForAnomalies(
      matchResult.vehicleId,
      employeeName,
      gallons,
      totalCost,
      transactionDate,
      odometer,
      supabase
    );
  }

  return {
    sourceTransactionId,
    transactionDate,
    vehicleId: matchResult.vehicleId,
    employeeName,
    gallons,
    costPerGallon,
    totalCost,
    odometer,
    merchantName,
    status: flagCheck.shouldFlag ? 'flagged' : 'new',
    flagReason: flagCheck.reason,
    matchedVehicleId: matchResult.matchedVehicleId,
    matchedVehicleName: matchResult.matchedVehicleName,
    matchType: matchResult.matchType
  };
}

async function performVehicleMatching(rawVehicleId: string, odometer: number, supabase: any): Promise<{
  vehicleId: string;
  matchedVehicleId?: string;
  matchedVehicleName?: string;
  matchType: 'Direct ID Match' | 'Odometer Match' | 'Unmatched';
}> {
  console.log('Starting vehicle matching for:', { rawVehicleId, odometer });

  // Check for Direct ID Match first (Happy Path)
  if (rawVehicleId && rawVehicleId.trim()) {
    const { data: directMatch, error } = await supabase
      .from('vehicles')
      .select('id, asset_id, make, model, year')
      .eq('asset_id', rawVehicleId.trim())
      .maybeSingle();

    if (error) {
      console.error('Error checking direct vehicle match:', error);
    }

    if (directMatch) {
      console.log('Direct ID match found:', directMatch);
      return {
        vehicleId: rawVehicleId.trim(),
        matchedVehicleId: directMatch.id,
        matchedVehicleName: `${directMatch.year} ${directMatch.make} ${directMatch.model}`,
        matchType: 'Direct ID Match'
      };
    }
  }

  // Intelligent Odometer Matching (Smart Path)
  if (odometer > 0) {
    console.log('Attempting odometer-based matching for odometer:', odometer);
    
    const { data: odometerMatches, error } = await supabase
      .from('vehicles')
      .select('id, asset_id, make, model, year, current_odometer')
      .lte('current_odometer', odometer)
      .order('current_odometer', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking odometer matches:', error);
    }

    if (odometerMatches && odometerMatches.length > 0) {
      const match = odometerMatches[0];
      console.log('Odometer match found:', match);
      return {
        vehicleId: match.asset_id || match.id,
        matchedVehicleId: match.id,
        matchedVehicleName: `${match.year} ${match.make} ${match.model}`,
        matchType: 'Odometer Match'
      };
    }
  }

  // No match found
  console.log('No vehicle match found');
  return {
    vehicleId: rawVehicleId || '',
    matchType: 'Unmatched'
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
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifiedTransaction {
  source_transaction_id: string;
  transaction_date: string;
  vehicle_id: string | null;
  employee_name: string;
  gallons: number;
  cost_per_gallon: number;
  total_cost: number;
  odometer: number;
  merchant_name: string;
  status: string;
  flag_reason?: string;
  matched_vehicle_id?: string;
  transaction_type: string;
}

serve(async (req) => {
  console.log('Import function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { transactions, createExpenseTransactions, statementId }: { 
      transactions: VerifiedTransaction[], 
      createExpenseTransactions?: boolean,
      statementId?: string 
    } = await req.json();
    
    console.log('Received transactions for import:', transactions.length);
    console.log('Create expense transactions:', createExpenseTransactions);
    console.log('Statement ID:', statementId);

    // Get the current user from the auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }

    // Insert fuel transactions
    const { data: insertedFuelTransactions, error: insertError } = await supabase
      .from('fuel_transactions_new')
      .insert(transactions.map(t => ({
        source_transaction_id: t.source_transaction_id,
        transaction_date: t.transaction_date,
        vehicle_id: t.vehicle_id,
        employee_name: t.employee_name,
        gallons: t.gallons,
        cost_per_gallon: t.cost_per_gallon,
        total_cost: t.total_cost,
        odometer: t.odometer,
        merchant_name: t.merchant_name,
        status: t.status,
        flag_reason: t.flag_reason,
        transaction_type: t.transaction_type
      })))
      .select();

    if (insertError) {
      console.error('Error inserting transactions:', insertError);
      throw insertError;
    }

    console.log('Successfully inserted fuel transactions');

    // Create expense transactions if requested
    let expenseCount = 0;
    if (createExpenseTransactions && insertedFuelTransactions) {
      console.log('Creating expense transactions for fuel purchases...');
      
      const expenseTransactions = insertedFuelTransactions
        .filter(ft => ft.status === 'verified' || ft.status === 'flagged')
        .map(ft => ({
          transaction_date: ft.transaction_date,
          expense_type: 'fuel_purchase',
          amount: ft.total_cost,
          description: `Fuel - ${ft.merchant_name}${ft.vehicle_id ? ` - ${ft.vehicle_id}` : ' - Unmatched'}`,
          vendor_name: ft.merchant_name,
          invoice_number: ft.source_transaction_id || statementId,
          fuel_statement_id: statementId,
          receipt_url: null,
          has_receipt: false,
          receipt_required: true,
          payment_status: 'paid',
          approval_status: ft.status === 'verified' ? 'auto_approved' : 'pending_review',
          approved_at: ft.status === 'verified' ? new Date().toISOString() : null,
          approved_by: ft.status === 'verified' ? userId : null,
          created_by: userId,
          flagged_for_review: ft.status === 'flagged',
          flag_reason: ft.flag_reason || null
        }));

      const { data: insertedExpenses, error: expenseError } = await supabase
        .from('expense_transactions')
        .insert(expenseTransactions)
        .select();

      if (expenseError) {
        console.error('Error creating expense transactions:', expenseError);
      } else {
        expenseCount = insertedExpenses?.length || 0;
        console.log(`Created ${expenseCount} expense transactions`);
      }

      // Update fuel statement status if applicable
      if (statementId) {
        await supabase
          .from('fuel_statements')
          .update({
            status: 'Imported to AP',
            ai_processing_notes: `${expenseCount} transactions imported to Accounts Payable`
          })
          .eq('id', statementId);
      }
    }

    // Update vehicle odometers - ONLY for Fleet Vehicle transactions
    const odometerUpdates: Array<{ vehicleId: string; odometer: number }> = [];
    
    for (const transaction of transactions) {
      if (transaction.transaction_type === 'Fleet Vehicle' && transaction.matched_vehicle_id && transaction.odometer > 0) {
        // Check if this odometer reading is higher than current
        const { data: currentVehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .select('current_odometer')
          .eq('id', transaction.matched_vehicle_id)
          .single();

        if (vehicleError) {
          console.error('Error fetching current odometer:', vehicleError);
          continue;
        }

        if (!currentVehicle.current_odometer || transaction.odometer > currentVehicle.current_odometer) {
          odometerUpdates.push({
            vehicleId: transaction.matched_vehicle_id,
            odometer: transaction.odometer
          });
        }
      }
    }

    // Perform odometer updates
    for (const update of odometerUpdates) {
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ 
          current_odometer: update.odometer,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.vehicleId);

      if (updateError) {
        console.error(`Error updating odometer for vehicle ${update.vehicleId}:`, updateError);
        // Continue with other updates even if one fails
      } else {
        console.log(`Updated vehicle ${update.vehicleId} odometer to ${update.odometer}`);
      }
    }

    const result = {
      success: true,
      transactionsImported: transactions.length,
      odometerUpdates: odometerUpdates.length,
      expenseTransactionsCreated: expenseCount
    };

    console.log('Import completed successfully:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-verified-fuel-transactions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
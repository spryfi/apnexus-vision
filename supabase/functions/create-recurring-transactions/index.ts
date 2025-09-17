import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringExpense {
  id: string;
  template_transaction_id: string;
  frequency: 'Monthly' | 'Quarterly' | 'Annually';
  day_of_month_to_generate: number;
  next_generation_date: string;
  end_date?: string;
  is_active: boolean;
}

interface TemplateTransaction {
  id: string;
  vendor_id: string;
  employee_id: string;
  expense_category_id: string;
  amount: number;
  payment_method: string;
  transaction_memo?: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting recurring transaction generation process...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`📅 Checking for recurring expenses due on or before: ${today}`);

    // Find all active recurring rules that are due for generation
    const { data: recurringExpenses, error: fetchError } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('is_active', true)
      .lte('next_generation_date', today);

    if (fetchError) {
      console.error('❌ Error fetching recurring expenses:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${recurringExpenses?.length || 0} recurring expenses to process`);

    if (!recurringExpenses || recurringExpenses.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No recurring expenses due for generation', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    const errors: string[] = [];

    for (const recurringExpense of recurringExpenses as RecurringExpense[]) {
      try {
        console.log(`🔄 Processing recurring expense: ${recurringExpense.id}`);

        // Check if end date has passed
        if (recurringExpense.end_date) {
          const endDate = new Date(recurringExpense.end_date);
          const todayDate = new Date(today);
          if (todayDate > endDate) {
            console.log(`⏰ Recurring expense ${recurringExpense.id} has ended, deactivating...`);
            await supabase
              .from('recurring_expenses')
              .update({ is_active: false })
              .eq('id', recurringExpense.id);
            continue;
          }
        }

        // Get the template transaction
        const { data: templateTransaction, error: templateError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', recurringExpense.template_transaction_id)
          .single();

        if (templateError || !templateTransaction) {
          console.error(`❌ Error fetching template transaction for ${recurringExpense.id}:`, templateError);
          errors.push(`Failed to fetch template for recurring expense ${recurringExpense.id}`);
          continue;
        }

        // Get the template line items
        const { data: templateLineItems, error: lineItemsError } = await supabase
          .from('transaction_line_items')
          .select('*')
          .eq('transaction_id', recurringExpense.template_transaction_id);

        if (lineItemsError) {
          console.error(`❌ Error fetching template line items for ${recurringExpense.id}:`, lineItemsError);
          errors.push(`Failed to fetch line items for recurring expense ${recurringExpense.id}`);
          continue;
        }

        // Create new transaction based on template
        const newTransaction = {
          vendor_id: templateTransaction.vendor_id,
          employee_id: templateTransaction.employee_id,
          expense_category_id: templateTransaction.expense_category_id,
          amount: templateTransaction.amount,
          payment_method: templateTransaction.payment_method,
          transaction_memo: templateTransaction.transaction_memo,
          invoice_date: today,
          status: 'Entry Required' as const,
          invoice_receipt_url: null // Leave empty for manual upload
        };

        const { data: createdTransaction, error: createError } = await supabase
          .from('transactions')
          .insert(newTransaction)
          .select()
          .single();

        if (createError || !createdTransaction) {
          console.error(`❌ Error creating new transaction for ${recurringExpense.id}:`, createError);
          errors.push(`Failed to create transaction for recurring expense ${recurringExpense.id}`);
          continue;
        }

        console.log(`✅ Created new transaction: ${createdTransaction.id}`);

        // Create line items if they exist
        if (templateLineItems && templateLineItems.length > 0) {
          const newLineItems = templateLineItems.map((item: LineItem & { transaction_id: string }) => ({
            transaction_id: createdTransaction.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }));

          const { error: lineItemsInsertError } = await supabase
            .from('transaction_line_items')
            .insert(newLineItems);

          if (lineItemsInsertError) {
            console.error(`❌ Error creating line items for ${recurringExpense.id}:`, lineItemsInsertError);
            errors.push(`Failed to create line items for recurring expense ${recurringExpense.id}`);
            continue;
          }

          console.log(`✅ Created ${newLineItems.length} line items for transaction: ${createdTransaction.id}`);
        }

        // Calculate next generation date
        const nextDate = new Date(recurringExpense.next_generation_date);
        
        switch (recurringExpense.frequency) {
          case 'Monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'Quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'Annually':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        const nextGenerationDate = nextDate.toISOString().split('T')[0];

        // Update the recurring expense with next generation date
        const { error: updateError } = await supabase
          .from('recurring_expenses')
          .update({ next_generation_date: nextGenerationDate })
          .eq('id', recurringExpense.id);

        if (updateError) {
          console.error(`❌ Error updating next generation date for ${recurringExpense.id}:`, updateError);
          errors.push(`Failed to update next generation date for recurring expense ${recurringExpense.id}`);
          continue;
        }

        console.log(`✅ Updated next generation date to: ${nextGenerationDate}`);
        processedCount++;

      } catch (error) {
        console.error(`❌ Unexpected error processing recurring expense ${recurringExpense.id}:`, error);
        errors.push(`Unexpected error for recurring expense ${recurringExpense.id}: ${error.message}`);
      }
    }

    const result = {
      message: `Processed ${processedCount} recurring expenses successfully`,
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Recurring transaction generation completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errors.length > 0 ? 207 : 200 // 207 Multi-Status if there were some errors
      }
    );

  } catch (error) {
    console.error('❌ Critical error in recurring transaction generation:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
    console.log('Starting due date check...');

    // Get current date
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Query for invoices due within 7 days that are approved for payment
    const { data: dueSoonInvoices, error: dueSoonError } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'Approved for Payment')
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', sevenDaysFromNow.toISOString().split('T')[0]);

    if (dueSoonError) {
      console.error('Error fetching due soon invoices:', dueSoonError);
      throw dueSoonError;
    }

    // Query for overdue invoices
    const { data: overdueInvoices, error: overdueError } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'Approved for Payment')
      .lt('due_date', today.toISOString().split('T')[0]);

    if (overdueError) {
      console.error('Error fetching overdue invoices:', overdueError);
      throw overdueError;
    }

    console.log(`Found ${dueSoonInvoices?.length || 0} invoices due soon`);
    console.log(`Found ${overdueInvoices?.length || 0} overdue invoices`);

    // Store the results in a table for the UI to display
    if (dueSoonInvoices && dueSoonInvoices.length > 0) {
      // Create or update alert record
      const alertData = {
        alert_type: 'invoices_due_soon',
        message: `You have ${dueSoonInvoices.length} invoice(s) due for payment within the next 7 days`,
        count: dueSoonInvoices.length,
        invoice_ids: dueSoonInvoices.map(inv => inv.id),
        created_at: new Date().toISOString(),
        is_active: true
      };

      // First, deactivate any existing alerts of this type
      await supabase
        .from('payment_alerts')
        .update({ is_active: false })
        .eq('alert_type', 'invoices_due_soon');

      // Insert new alert
      const { error: alertError } = await supabase
        .from('payment_alerts')
        .insert([alertData]);

      if (alertError) {
        console.error('Error creating alert:', alertError);
      }
    }

    // Send email for overdue invoices
    if (overdueInvoices && overdueInvoices.length > 0 && resend) {
      const overdueList = overdueInvoices.map(inv => 
        `- ${inv.vendor_name}: $${inv.amount} (Due: ${inv.due_date})`
      ).join('\n');

      try {
        await resend.emails.send({
          from: "AP Fortress <alerts@spryfi.net>",
          to: ["paul@spryfi.net"],
          subject: `🚨 URGENT: ${overdueInvoices.length} Overdue Invoice(s) Require Immediate Payment`,
          html: `
            <h2>Overdue Invoice Alert</h2>
            <p>The following invoices are now overdue and require immediate attention:</p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
${overdueList}
            </pre>
            <p><strong>Total Overdue Amount: $${overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}</strong></p>
            <p>Please log into AP Fortress immediately to process these payments and avoid any late fees or vendor relationship issues.</p>
            <p><a href="https://your-app-url.com/transactions" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Overdue Invoices</a></p>
          `,
        });

        console.log('Overdue invoice alert email sent successfully');
      } catch (emailError) {
        console.error('Error sending overdue email:', emailError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      due_soon_count: dueSoonInvoices?.length || 0,
      overdue_count: overdueInvoices?.length || 0,
      message: 'Due date check completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-due-dates function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskCompletionId, validationType, data } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    let validationResult = {};

    switch (validationType) {
      case 'payroll':
        validationResult = await validatePayroll(data, OPENAI_API_KEY);
        break;
      case 'fuel':
        validationResult = await validateFuelReport(data, OPENAI_API_KEY);
        break;
      case 'expenses':
        validationResult = await validateExpenses(data, OPENAI_API_KEY);
        break;
      default:
        throw new Error(`Unknown validation type: ${validationType}`);
    }

    // Update task completion with validation result
    const { error } = await supabase
      .from('task_completions')
      .update({
        validation_result: validationResult,
        status: validationResult.passed ? 'validated' : 'completed',
        validated_at: validationResult.passed ? new Date().toISOString() : null
      })
      .eq('id', taskCompletionId);

    if (error) throw error;

    return new Response(JSON.stringify(validationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in validate-tasks function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function validatePayroll(data: any, apiKey: string) {
  const { payrollRecords, employees, weekInfo } = data;
  
  const prompt = `
    Analyze this weekly payroll data for completeness and accuracy:
    
    Week: ${weekInfo.week} of ${weekInfo.year}
    Total Employees in System: ${employees.length}
    Payroll Records Submitted: ${payrollRecords.length}
    
    Employee Names in System: ${employees.map((e: any) => e.employee_name).join(', ')}
    
    Payroll Records:
    ${payrollRecords.map((r: any) => 
      `- ${r.employees?.employee_name}: ${r.is_salary ? 'Salary' : 'Hourly'}, ` +
      `Regular: ${r.regular_hours}h, Overtime: ${r.overtime_hours}h, ` +
      `Total Pay: $${r.total_gross_pay}`
    ).join('\n')}
    
    Validate:
    1. Are all employees included in payroll?
    2. Do hour calculations look reasonable (0-80 hours/week)?
    3. Are pay calculations mathematically correct?
    4. Any red flags or inconsistencies?
    
    Respond with JSON format:
    {
      "passed": boolean,
      "issues": string[],
      "summary": string,
      "completeness_score": number (0-100)
    }
  `;

  return await callOpenAI(prompt, apiKey);
}

async function validateFuelReport(data: any, apiKey: string) {
  const { transactions, invoice, monthInfo } = data;
  
  const totalTransactions = transactions.reduce((sum: number, t: any) => sum + t.total_cost, 0);
  const invoiceAmount = invoice?.total_amount || 0;
  
  const prompt = `
    Validate this monthly fuel report against invoice:
    
    Month: ${monthInfo.month}/${monthInfo.year}
    
    Transaction Summary:
    - Total Transactions: ${transactions.length}
    - Total Amount from Transactions: $${totalTransactions.toFixed(2)}
    - Invoice Amount: $${invoiceAmount.toFixed(2)}
    - Difference: $${Math.abs(totalTransactions - invoiceAmount).toFixed(2)}
    
    Individual Transactions:
    ${transactions.map((t: any) => 
      `- ${t.transaction_date}: ${t.vehicle}, ${t.gallons}gal @ $${t.cost_per_gallon}/gal = $${t.total_cost}`
    ).join('\n')}
    
    Validate:
    1. Does transaction count and amounts match invoice?
    2. Are individual transaction amounts reasonable?
    3. Any duplicate or suspicious transactions?
    4. Is the variance within acceptable range (5%)?
    
    Respond with JSON format:
    {
      "passed": boolean,
      "variance_percent": number,
      "issues": string[],
      "summary": string,
      "transaction_count_match": boolean,
      "amount_match": boolean
    }
  `;

  return await callOpenAI(prompt, apiKey);
}

async function validateExpenses(data: any, apiKey: string) {
  const { expenses, receipts, monthInfo } = data;
  
  const prompt = `
    Validate this monthly expense report:
    
    Month: ${monthInfo.month}/${monthInfo.year}
    Total Expenses: ${expenses.length}
    Receipts Provided: ${receipts.length}
    
    Expenses by Category:
    ${expenses.reduce((acc: any, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})}
    
    Validate:
    1. Do all expenses have required documentation?
    2. Are expense categories appropriate?
    3. Any unusually high amounts that need review?
    4. Receipt to expense matching?
    
    Respond with JSON format:
    {
      "passed": boolean,
      "issues": string[],
      "summary": string,
      "documentation_complete": boolean,
      "flagged_expenses": any[]
    }
  `;

  return await callOpenAI(prompt, apiKey);
}

async function callOpenAI(prompt: string, apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a financial validation expert. Analyze data for accuracy, completeness, and potential issues. Always respond with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      return {
        passed: false,
        issues: ['AI validation failed - could not parse response'],
        summary: 'Validation system error'
      };
    }
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    return {
      passed: false,
      issues: [`Validation failed: ${error.message}`],
      summary: 'Could not complete AI validation'
    };
  }
}
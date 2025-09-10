-- Create table for managing company cards (credit/debit cards)
CREATE TABLE IF NOT EXISTS public.company_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'debit', 'fuel')),
  card_brand TEXT NOT NULL, -- Visa, Mastercard, Amex, etc.
  first_four TEXT NOT NULL CHECK (length(first_four) = 4),
  last_four TEXT NOT NULL CHECK (length(last_four) = 4),
  cardholder_name TEXT NOT NULL,
  assigned_to UUID REFERENCES public.employees(id),
  driver_number TEXT, -- For fuel cards
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view cards" 
ON public.company_cards 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage cards" 
ON public.company_cards 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_company_cards_updated_at
BEFORE UPDATE ON public.company_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update task templates with more specific requirements
UPDATE public.task_templates 
SET 
  description = 'Process weekly payroll for all employees. Verify hours, calculate pay, and ensure all employees are included.',
  required_fields = '{"employees_processed": "number", "total_hours": "number", "total_gross_pay": "number"}',
  validation_rules = '{"min_employees": 1, "required_fields": ["employees_processed", "total_hours", "total_gross_pay"]}'
WHERE name = 'Weekly Payroll Processing';

UPDATE public.task_templates 
SET 
  description = 'Review and validate monthly fuel transactions. Ensure all driver purchases are recorded and reconciled.',
  required_fields = '{"total_transactions": "number", "total_gallons": "number", "total_cost": "number", "drivers_count": "number"}',
  validation_rules = '{"min_transactions": 1, "required_fields": ["total_transactions", "total_gallons", "total_cost"]}'
WHERE name = 'Monthly Fuel Report Validation';

-- Insert new task template for credit card reconciliation
INSERT INTO public.task_templates (name, description, task_type, category, required_fields, validation_rules)
VALUES (
  'Monthly Credit Card Reconciliation',
  'Reconcile all company credit and debit card transactions against statements. Ensure every transaction is entered into APNexus.',
  'monthly',
  'expenses',
  '{"cards_reconciled": "number", "total_transactions": "number", "statement_amount": "number", "apnexus_amount": "number"}',
  '{"required_fields": ["cards_reconciled", "total_transactions", "statement_amount", "apnexus_amount"], "tolerance": 0.01}'
);
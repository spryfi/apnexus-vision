-- Create task management tables for weekly and monthly tracking
CREATE TABLE public.task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('weekly', 'monthly')),
  category TEXT NOT NULL, -- 'payroll', 'fuel', 'expenses', etc.
  required_fields JSONB DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'validated')),
  completion_data JSONB DEFAULT '{}'::jsonb,
  validation_result JSONB DEFAULT '{}'::jsonb,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_template_id, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read task templates" 
ON public.task_templates FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage task templates" 
ON public.task_templates FOR ALL 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Authenticated users can read task completions" 
ON public.task_completions FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert task completions" 
ON public.task_completions FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own task completions" 
ON public.task_completions FOR UPDATE 
USING (completed_by = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Insert default task templates
INSERT INTO public.task_templates (name, description, task_type, category, required_fields, validation_rules) VALUES
('Weekly Payroll Processing', 'Process weekly payroll for all employees', 'weekly', 'payroll', 
 '["employee_records", "hours_verification", "pay_calculations"]'::jsonb,
 '{"min_employees": 1, "require_all_employees": true, "validate_hours": true}'::jsonb),
 
('Monthly Fuel Report Validation', 'Validate fuel transactions against invoice', 'monthly', 'fuel',
 '["transaction_records", "invoice_upload", "amount_verification"]'::jsonb,
 '{"validate_amounts": true, "validate_transaction_count": true, "tolerance_percent": 5}'::jsonb),
 
('Monthly Expense Report', 'Process and categorize monthly expenses', 'monthly', 'expenses',
 '["expense_entries", "receipt_uploads", "categorization"]'::jsonb,
 '{"require_receipts": true, "validate_categories": true}'::jsonb);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_updated_at();

CREATE TRIGGER update_task_completions_updated_at
  BEFORE UPDATE ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_updated_at();
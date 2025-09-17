-- Create recurring_expenses table for intelligent recurring expense management
CREATE TABLE public.recurring_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_transaction_id uuid NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('Monthly', 'Quarterly', 'Annually')),
  day_of_month_to_generate integer NOT NULL CHECK (day_of_month_to_generate BETWEEN 1 AND 31),
  next_generation_date date NOT NULL,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on recurring_expenses
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for recurring_expenses
CREATE POLICY "Authenticated users can view recurring expenses"
ON public.recurring_expenses
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create recurring expenses"
ON public.recurring_expenses
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update recurring expenses"
ON public.recurring_expenses
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete recurring expenses"
ON public.recurring_expenses
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_recurring_expenses_updated_at
BEFORE UPDATE ON public.recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance on the daily cron job query
CREATE INDEX idx_recurring_expenses_next_generation 
ON public.recurring_expenses (next_generation_date, is_active) 
WHERE is_active = true;
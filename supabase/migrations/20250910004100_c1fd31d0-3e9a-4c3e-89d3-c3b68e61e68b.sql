-- Create payroll table for pay records
CREATE TABLE public.payroll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  hours_worked NUMERIC(8,2),
  overtime_hours NUMERIC(8,2) DEFAULT 0,
  gross_pay NUMERIC(12,2) NOT NULL,
  overtime_pay NUMERIC(12,2) DEFAULT 0,
  total_gross_pay NUMERIC(12,2) NOT NULL,
  deductions NUMERIC(12,2) DEFAULT 0,
  net_pay NUMERIC(12,2),
  pay_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can manage payroll" 
ON public.payroll 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payroll_updated_at
BEFORE UPDATE ON public.payroll
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
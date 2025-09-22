-- First, check if we need to enhance the employees table or create it
-- Create enhanced employees table with all required payroll fields
CREATE TABLE IF NOT EXISTS public.employees_enhanced (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  job_title TEXT,
  hire_date DATE,
  pay_type TEXT CHECK (pay_type IN ('Hourly', 'Salary')),
  pay_rate DECIMAL(10,2) NOT NULL,
  pto_sick_hours_accrued_annually INTEGER DEFAULT 40,
  pto_vacation_hours_accrued_annually INTEGER DEFAULT 80,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Terminated')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stipends table for recurring payments
CREATE TABLE public.stipends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees_enhanced(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('Weekly', 'Bi-Weekly', 'Monthly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time_off_records table for PTO tracking
CREATE TABLE public.time_off_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees_enhanced(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Sick', 'Vacation')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours_used DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employees_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stipends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_records ENABLE ROW LEVEL SECURITY;

-- Create policies for employees_enhanced
CREATE POLICY "Authenticated users can manage employees" 
ON public.employees_enhanced FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for stipends
CREATE POLICY "Authenticated users can manage stipends" 
ON public.stipends FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for time_off_records
CREATE POLICY "Authenticated users can manage time off records" 
ON public.time_off_records FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to calculate PTO balances
CREATE OR REPLACE FUNCTION public.calculate_pto_balance(
  p_employee_id UUID,
  p_leave_type TEXT
)
RETURNS DECIMAL AS $$
DECLARE
  total_accrued DECIMAL;
  total_used DECIMAL;
BEGIN
  -- Get total accrued hours based on leave type
  SELECT 
    CASE 
      WHEN p_leave_type = 'Vacation' THEN pto_vacation_hours_accrued_annually
      WHEN p_leave_type = 'Sick' THEN pto_sick_hours_accrued_annually
      ELSE 0
    END
  INTO total_accrued
  FROM public.employees_enhanced
  WHERE id = p_employee_id;
  
  -- Get total used hours
  SELECT COALESCE(SUM(hours_used), 0)
  INTO total_used
  FROM public.time_off_records
  WHERE employee_id = p_employee_id 
    AND leave_type = p_leave_type
    AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  RETURN COALESCE(total_accrued, 0) - COALESCE(total_used, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_employees()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employees_updated_at
  BEFORE UPDATE ON public.employees_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_employees();

CREATE TRIGGER trigger_update_stipends_updated_at
  BEFORE UPDATE ON public.stipends
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_time_off_updated_at
  BEFORE UPDATE ON public.time_off_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
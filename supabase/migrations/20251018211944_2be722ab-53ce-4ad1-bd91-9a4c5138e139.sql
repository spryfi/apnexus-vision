-- Enhanced Employee Management Migration

-- Add missing columns to employees_enhanced table
ALTER TABLE public.employees_enhanced
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS employment_status text DEFAULT 'Full-Time',
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS vacation_days_allocated integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS sick_days_allocated integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS personal_days_allocated integer DEFAULT 3;

-- Create employee_spending_summary view
CREATE OR REPLACE VIEW employee_spending_summary AS
SELECT 
  e.id as employee_id,
  e.full_name,
  COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM cct.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
    AND EXTRACT(YEAR FROM cct.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE) 
    THEN cct.amount ELSE 0 END), 0) as spending_this_month,
  COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM cct.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') 
    AND EXTRACT(YEAR FROM cct.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month') 
    THEN cct.amount ELSE 0 END), 0) as spending_last_month,
  COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM cct.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE) 
    THEN cct.amount ELSE 0 END), 0) as spending_this_year,
  COALESCE(COUNT(CASE WHEN EXTRACT(MONTH FROM cct.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
    AND EXTRACT(YEAR FROM cct.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE) 
    THEN 1 END), 0) as transaction_count_this_month
FROM public.employees_enhanced e
LEFT JOIN public.credit_card_transactions cct ON cct.employee_id = e.id
GROUP BY e.id, e.full_name;

-- Create employee_fuel_summary view
CREATE OR REPLACE VIEW employee_fuel_summary AS
SELECT 
  e.id as employee_id,
  e.full_name,
  COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM ft.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
    AND EXTRACT(YEAR FROM ft.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE) 
    THEN ft.total_cost ELSE 0 END), 0) as fuel_spending_this_month,
  COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM ft.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
    AND EXTRACT(YEAR FROM ft.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE) 
    THEN ft.gallons ELSE 0 END), 0) as gallons_this_month,
  COALESCE(COUNT(CASE WHEN EXTRACT(MONTH FROM ft.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
    AND EXTRACT(YEAR FROM ft.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE) 
    THEN 1 END), 0) as fillups_this_month,
  COALESCE(AVG(CASE WHEN EXTRACT(MONTH FROM ft.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
    AND EXTRACT(YEAR FROM ft.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE) 
    THEN ft.cost_per_gallon END), 0) as avg_price_per_gallon
FROM public.employees_enhanced e
LEFT JOIN public.fuel_transactions_new ft ON ft.employee_name = e.full_name
GROUP BY e.id, e.full_name;

-- Enable RLS on employee_devices (if not already enabled)
ALTER TABLE public.employee_devices ENABLE ROW LEVEL SECURITY;

-- RLS policy for employee_devices
DROP POLICY IF EXISTS "Authenticated users can view devices" ON public.employee_devices;
CREATE POLICY "Authenticated users can view devices"
ON public.employee_devices FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage devices" ON public.employee_devices;
CREATE POLICY "Authenticated users can manage devices"
ON public.employee_devices FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_employee_date 
ON public.credit_card_transactions(employee_id, transaction_date);

CREATE INDEX IF NOT EXISTS idx_fuel_transactions_employee_date 
ON public.fuel_transactions_new(employee_name, transaction_date);

CREATE INDEX IF NOT EXISTS idx_employee_devices_employee 
ON public.employee_devices(employee_id);

CREATE INDEX IF NOT EXISTS idx_time_off_records_employee 
ON public.time_off_records(employee_id);

-- Grant permissions on views
GRANT SELECT ON employee_spending_summary TO authenticated;
GRANT SELECT ON employee_fuel_summary TO authenticated;
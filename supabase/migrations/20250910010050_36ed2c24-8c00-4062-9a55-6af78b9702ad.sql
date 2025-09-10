-- Update payroll table for weekly tracking
ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS week_number integer,
ADD COLUMN IF NOT EXISTS year integer,
ADD COLUMN IF NOT EXISTS is_salary boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2),
ADD COLUMN IF NOT EXISTS regular_hours numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS week_start_date date,
ADD COLUMN IF NOT EXISTS week_end_date date;

-- Update existing records to have current year if not set
UPDATE public.payroll 
SET year = EXTRACT(YEAR FROM created_at),
    week_number = EXTRACT(WEEK FROM created_at)
WHERE year IS NULL;

-- Add constraint to ensure either salary or hourly rate is provided
ALTER TABLE public.payroll 
ADD CONSTRAINT payroll_compensation_check 
CHECK (
  (is_salary = true) OR 
  (is_salary = false AND hourly_rate IS NOT NULL AND hourly_rate > 0)
);

-- Create index for efficient week-based queries
CREATE INDEX IF NOT EXISTS idx_payroll_week_year 
ON public.payroll(year, week_number, employee_id);
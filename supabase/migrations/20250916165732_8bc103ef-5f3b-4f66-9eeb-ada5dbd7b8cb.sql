-- Enable Row-Level Security for key management tables
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all staff records" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can view staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can manage all employee records" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can access employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can manage all expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can access expense_categories" ON public.expense_categories;

-- Create a security definer function to get user role to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_profiles 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Staff table policies - Full CRUD access for admins
CREATE POLICY "Admins have full access to manage staff"
ON public.staff
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Read-only access for non-admins
CREATE POLICY "Authenticated users can view staff"
ON public.staff
FOR SELECT
TO authenticated
USING (true);

-- Employees table policies - Full CRUD access for admins
CREATE POLICY "Admins have full access to manage employees"
ON public.employees
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Read-only access for non-admins
CREATE POLICY "Authenticated users can view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (true);

-- Expense categories policies - Full CRUD access for admins
CREATE POLICY "Admins have full access to manage expense categories"
ON public.expense_categories
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Read-only access for non-admins
CREATE POLICY "Authenticated users can view expense categories"
ON public.expense_categories
FOR SELECT
TO authenticated
USING (true);

-- Update existing user profile for paul@spryfi.net to admin role
UPDATE public.user_profiles 
SET role = 'admin', 
    updated_at = now()
WHERE email = 'paul@spryfi.net';
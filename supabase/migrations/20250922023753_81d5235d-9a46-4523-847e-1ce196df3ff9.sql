-- Fix infinite recursion in RLS policies by cleaning up conflicting policies and creating proper security definer functions

-- First, drop all conflicting policies on profiles table to stop infinite recursion
DROP POLICY IF EXISTS "Admin and office can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Office can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create or update the security definer function to get user role without causing recursion
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

-- Create simple, non-recursive policies for profiles table
CREATE POLICY "Allow users to view their own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Allow admins to view all profiles"
ON public.profiles
FOR SELECT
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Allow admins to update all profiles"
ON public.profiles
FOR UPDATE
USING (public.get_current_user_role() = 'admin');

-- Ensure RLS is enabled for task tables
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Clean up any duplicate policies on task tables
DROP POLICY IF EXISTS "Allow authenticated users to manage task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Authenticated users can insert task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Authenticated users can read task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Users can update their own task completions" ON public.task_completions;

DROP POLICY IF EXISTS "Admin can manage task templates" ON public.task_templates;
DROP POLICY IF EXISTS "Authenticated users can read task templates" ON public.task_templates;

-- Create clean, simple policies for task tables
CREATE POLICY "Authenticated users can manage task completions"
ON public.task_completions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can view task templates"
ON public.task_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage task templates"
ON public.task_templates
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');
-- First, ensure Row-Level Security is enabled for both tables.
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Drop any old, potentially incorrect policies to start fresh.
DROP POLICY IF EXISTS "Allow authenticated users to view task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Allow authenticated users to view task templates" ON public.task_templates;
DROP POLICY IF EXISTS "Allow authenticated users to manage task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Allow authenticated users to manage task templates" ON public.task_templates;

-- Create the SELECT policy for 'task_completions'.
-- This rule allows any user who is logged in to read all task completion records.
CREATE POLICY "Allow authenticated users to view task completions"
ON public.task_completions
FOR SELECT
TO authenticated
USING (true);

-- Create the SELECT policy for 'task_templates'.
-- Task templates are likely public to all team members.
CREATE POLICY "Allow authenticated users to view task templates"
ON public.task_templates
FOR SELECT
TO authenticated
USING (true);

-- Also allow authenticated users to insert/update task completions for functionality
CREATE POLICY "Allow authenticated users to manage task completions"
ON public.task_completions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
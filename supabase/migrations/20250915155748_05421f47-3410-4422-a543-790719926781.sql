-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Authenticated users can access vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can manage vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can view vendors" ON public.vendors;

-- Create a single comprehensive policy for all operations
CREATE POLICY "Authenticated users can manage vendors" 
ON public.vendors 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);
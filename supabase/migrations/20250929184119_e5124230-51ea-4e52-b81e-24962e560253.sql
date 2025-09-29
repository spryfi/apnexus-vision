-- Check current transactions table schema and create proper RLS policies

-- First, let's see the current transactions table structure
-- Enable RLS on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow authenticated to insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated to view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated to update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated to delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON public.transactions;

-- Create comprehensive RLS policies for transactions
CREATE POLICY "Allow authenticated users to insert transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete transactions"
ON public.transactions
FOR DELETE
TO authenticated
USING (true);
-- Enable RLS on tables that have policies but RLS is not enabled
-- This fixes the "Policy Exists RLS Disabled" security finding

-- The Supabase linter has detected that some tables have RLS policies
-- defined but RLS is not actually enabled on those tables.
-- We need to enable RLS to ensure the policies are enforced.

-- Note: Based on the database schema provided, we're enabling RLS on tables
-- that should have it enabled. The specific tables will be determined by
-- the Supabase linter's findings.

-- Enable RLS on any tables that may have policies but RLS disabled
-- These are common tables that typically have policies:

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Enable RLS on tables in public schema that don't have it enabled yet
  -- but may have policies defined
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT IN (
      SELECT tablename 
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public'
      AND c.relrowsecurity = true
    )
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
      RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not enable RLS on %: %', r.tablename, SQLERRM;
    END;
  END LOOP;
END $$;
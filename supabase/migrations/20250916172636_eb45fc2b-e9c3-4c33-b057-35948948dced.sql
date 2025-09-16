-- Add new columns to transactions table for document override tracking
ALTER TABLE public.transactions 
ADD COLUMN document_required_override BOOLEAN DEFAULT false;

ALTER TABLE public.transactions 
ADD COLUMN override_reason TEXT;

ALTER TABLE public.transactions 
ADD COLUMN override_by TEXT;

-- Create the unbreakable RLS policy for receipt enforcement
CREATE POLICY "Enforce receipt for paid transactions"
ON public.transactions
FOR UPDATE
USING (true)
WITH CHECK (
  NOT (status IN ('Paid', 'Reconciled')) OR
  (invoice_receipt_url IS NOT NULL) OR
  (document_required_override = true)
);
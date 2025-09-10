-- AP-Fortress Database Refactoring
-- Update transactions table to match AP-Fortress specification

-- First, add the missing fields to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_source_detail text,
ADD COLUMN IF NOT EXISTS ai_flagged_status boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_flag_reason text;

-- Update status enum to match AP-Fortress specifications
ALTER TYPE transaction_status RENAME TO old_transaction_status;
CREATE TYPE transaction_status AS ENUM (
  'Entry Required',
  'Pending Approval', 
  'Approved for Payment',
  'Paid',
  'Reconciled'
);

-- Update the column to use new enum
ALTER TABLE public.transactions ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.transactions ALTER COLUMN status TYPE transaction_status USING status::text::transaction_status;
ALTER TABLE public.transactions ALTER COLUMN status SET DEFAULT 'Entry Required'::transaction_status;

-- Drop old enum
DROP TYPE old_transaction_status;

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method_name text NOT NULL,
  method_type text NOT NULL, -- e.g., 'Credit Card', 'Bank Account', 'Fuel Card'
  account_details text, -- e.g., 'Amex Gold x1005', 'Checking Account x9876'
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create flagged_transactions table (for admin only)
CREATE TABLE public.flagged_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_transaction_id uuid NOT NULL REFERENCES public.transactions(id),
  flagged_at timestamp with time zone DEFAULT now(),
  flag_reason text NOT NULL,
  reviewed boolean DEFAULT false,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  transaction_data jsonb NOT NULL -- Full copy of transaction data at time of flagging
);

-- Enable RLS on new tables
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagged_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Authenticated users can view payment methods" 
ON public.payment_methods FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage payment methods" 
ON public.payment_methods FOR ALL 
USING (auth.uid() IS NOT NULL);

-- RLS Policies for flagged_transactions (admin only)
CREATE POLICY "Only admins can view flagged transactions" 
ON public.flagged_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'paul@spryfi.net'
  )
);

CREATE POLICY "System can insert flagged transactions" 
ON public.flagged_transactions FOR INSERT 
WITH CHECK (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update transactions table constraints
-- Make invoice_receipt_url required for status changes
ALTER TABLE public.transactions 
ALTER COLUMN purchase_description SET NOT NULL;

-- Add constraint to enforce minimum description length
ALTER TABLE public.transactions 
ADD CONSTRAINT purchase_description_min_length 
CHECK (char_length(purchase_description) >= 20);

-- Insert default payment methods
INSERT INTO public.payment_methods (method_name, method_type, account_details) VALUES
('American Express Gold Card', 'Credit Card', 'Amex Gold x1005'),
('Fleet Fuel Card', 'Fuel Card', 'Fleet Card #5432'),
('Business Checking', 'Bank Account', 'Checking Account x9876'),
('Corporate Debit Card', 'Debit Card', 'Debit Card x4321');

-- Function to prevent status changes without receipt
CREATE OR REPLACE FUNCTION public.validate_transaction_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing to Paid or Reconciled without receipt
  IF NEW.status IN ('Paid', 'Reconciled') AND 
     (NEW.invoice_receipt_url IS NULL OR NEW.invoice_receipt_url = '') THEN
    RAISE EXCEPTION 'Cannot change status to % without uploading a receipt', NEW.status;
  END IF;
  
  -- Prevent changing from Entry Required without description
  IF OLD.status = 'Entry Required' AND NEW.status != 'Entry Required' AND 
     (NEW.purchase_description IS NULL OR char_length(NEW.purchase_description) < 20) THEN
    RAISE EXCEPTION 'Cannot change status from Entry Required without a proper description (minimum 20 characters)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the validation trigger
CREATE TRIGGER enforce_transaction_guardrails
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_transaction_status_change();
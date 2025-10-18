-- Add receipt and payment columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_file_name TEXT,
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
ADD COLUMN IF NOT EXISTS payment_receipt_file_name TEXT,
ADD COLUMN IF NOT EXISTS paid_date DATE,
ADD COLUMN IF NOT EXISTS check_number TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for invoice receipts if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-receipts', 'invoice-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for invoice receipts
CREATE POLICY "Authenticated users can upload invoice receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoice-receipts');

CREATE POLICY "Authenticated users can view invoice receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoice-receipts');

CREATE POLICY "Authenticated users can update invoice receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'invoice-receipts');

CREATE POLICY "Authenticated users can delete invoice receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoice-receipts');

-- Create payment_records table for tracking payments
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  check_number TEXT,
  payment_notes TEXT,
  payment_receipt_url TEXT,
  payment_receipt_file_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payment_records
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_records
CREATE POLICY "Authenticated users can view payment records"
ON public.payment_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert payment records"
ON public.payment_records FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment records"
ON public.payment_records FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete payment records"
ON public.payment_records FOR DELETE
TO authenticated
USING (true);
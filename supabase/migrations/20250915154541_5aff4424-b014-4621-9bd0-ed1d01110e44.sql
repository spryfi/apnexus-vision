-- Enhance vendors table with additional fields for comprehensive vendor management
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS primary_contact_name text,
ADD COLUMN IF NOT EXISTS primary_contact_email text,
ADD COLUMN IF NOT EXISTS primary_contact_phone text,
ADD COLUMN IF NOT EXISTS your_account_number text,
ADD COLUMN IF NOT EXISTS tax_id_ein text,
ADD COLUMN IF NOT EXISTS default_expense_category_id uuid REFERENCES public.expense_categories(id),
ADD COLUMN IF NOT EXISTS preferred_payment_method text CHECK (preferred_payment_method IN ('ACH', 'Check', 'Credit Card')),
ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'Net 30' CHECK (payment_terms IN ('Net 30', 'Net 15', 'Due on Receipt', 'Net 60', 'COD')),
ADD COLUMN IF NOT EXISTS internal_notes text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create vendor_documents table for storing compliance files
CREATE TABLE IF NOT EXISTS public.vendor_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('W-9', 'Certificate of Insurance', 'Contract', 'Other')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  expiry_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on vendor_documents
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_documents
CREATE POLICY "Authenticated users can view vendor_documents" 
ON public.vendor_documents 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage vendor_documents" 
ON public.vendor_documents 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger for updating vendor updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_vendor_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_updated_at();

-- Add trigger for updating vendor_documents updated_at timestamp
CREATE TRIGGER update_vendor_documents_updated_at
  BEFORE UPDATE ON public.vendor_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for vendor documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-documents', 'vendor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for vendor documents
CREATE POLICY "Authenticated users can view vendor documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vendor-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload vendor documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vendor-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update vendor documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vendor-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete vendor documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vendor-documents' AND auth.uid() IS NOT NULL);
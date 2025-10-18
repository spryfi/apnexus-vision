-- AI Receipt Processing Tables

-- Create processed_receipts table
CREATE TABLE IF NOT EXISTS public.processed_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices_receivable(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees_enhanced(id),
  image_url TEXT NOT NULL,
  image_hash TEXT,
  extracted_data JSONB NOT NULL,
  confidence_scores JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  quality_score NUMERIC,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create receipt_flags table
CREATE TABLE IF NOT EXISTS public.receipt_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES public.processed_receipts(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'duplicate', 
    'low_confidence', 
    'policy_violation', 
    'unusual_amount', 
    'unusual_vendor', 
    'unusual_category',
    'high_frequency',
    'unusual_location',
    'missing_receipt',
    'new_vendor'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  flag_reason TEXT NOT NULL,
  flag_details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create duplicate_detection table
CREATE TABLE IF NOT EXISTS public.duplicate_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES public.processed_receipts(id) ON DELETE CASCADE,
  potential_duplicate_id UUID REFERENCES public.processed_receipts(id) ON DELETE CASCADE,
  similarity_score NUMERIC NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('exact_image', 'similar_transaction', 'same_details')),
  match_details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed_duplicate', 'not_duplicate')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vendor_learning table (for improving extraction accuracy)
CREATE TABLE IF NOT EXISTS public.vendor_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extracted_vendor TEXT NOT NULL,
  corrected_vendor TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id),
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(extracted_vendor, corrected_vendor)
);

-- Create category_learning table
CREATE TABLE IF NOT EXISTS public.category_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id),
  category_id UUID REFERENCES public.expense_categories(id),
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(vendor_id, category_id)
);

-- Create accuracy_metrics table
CREATE TABLE IF NOT EXISTS public.ocr_accuracy_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_processed INTEGER DEFAULT 0,
  vendor_accuracy NUMERIC,
  amount_accuracy NUMERIC,
  date_accuracy NUMERIC,
  category_accuracy NUMERIC,
  overall_accuracy NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(metric_date)
);

-- Enable RLS on all tables
ALTER TABLE public.processed_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_accuracy_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view receipts" ON public.processed_receipts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage receipts" ON public.processed_receipts
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view flags" ON public.receipt_flags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage flags" ON public.receipt_flags
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view duplicates" ON public.duplicate_receipts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage duplicates" ON public.duplicate_receipts
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view vendor learning" ON public.vendor_learning
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage vendor learning" ON public.vendor_learning
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view category learning" ON public.category_learning
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage category learning" ON public.category_learning
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view metrics" ON public.ocr_accuracy_metrics
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage metrics" ON public.ocr_accuracy_metrics
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_processed_receipts_transaction 
ON public.processed_receipts(transaction_id);

CREATE INDEX IF NOT EXISTS idx_processed_receipts_employee 
ON public.processed_receipts(employee_id);

CREATE INDEX IF NOT EXISTS idx_processed_receipts_status 
ON public.processed_receipts(status);

CREATE INDEX IF NOT EXISTS idx_processed_receipts_hash 
ON public.processed_receipts(image_hash);

CREATE INDEX IF NOT EXISTS idx_receipt_flags_receipt 
ON public.receipt_flags(receipt_id);

CREATE INDEX IF NOT EXISTS idx_receipt_flags_status 
ON public.receipt_flags(status);

CREATE INDEX IF NOT EXISTS idx_duplicate_receipts_receipt 
ON public.duplicate_receipts(receipt_id);

CREATE INDEX IF NOT EXISTS idx_vendor_learning_extracted 
ON public.vendor_learning(extracted_vendor);

-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipt-images', 'receipt-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for receipt images
DROP POLICY IF EXISTS "Authenticated users can view receipt images" ON storage.objects;
CREATE POLICY "Authenticated users can view receipt images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipt-images' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Authenticated users can upload receipt images" ON storage.objects;
CREATE POLICY "Authenticated users can upload receipt images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipt-images' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Authenticated users can update receipt images" ON storage.objects;
CREATE POLICY "Authenticated users can update receipt images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'receipt-images' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Authenticated users can delete receipt images" ON storage.objects;
CREATE POLICY "Authenticated users can delete receipt images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'receipt-images' AND auth.uid() IS NOT NULL
  );
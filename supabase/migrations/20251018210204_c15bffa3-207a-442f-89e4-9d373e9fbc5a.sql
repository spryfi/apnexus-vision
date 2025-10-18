-- Create invoice_line_items table for storing invoice line items
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices_receivable(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_invoice_line_items_invoice_id ON public.invoice_line_items(invoice_id);

-- Enable RLS
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view line items"
  ON public.invoice_line_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert line items"
  ON public.invoice_line_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update line items"
  ON public.invoice_line_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete line items"
  ON public.invoice_line_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create ar_payments table for tracking AR payments
CREATE TABLE IF NOT EXISTS public.ar_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices_receivable(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_ar_payments_invoice_id ON public.ar_payments(invoice_id);

-- Enable RLS
ALTER TABLE public.ar_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view payments"
  ON public.ar_payments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert payments"
  ON public.ar_payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update payments"
  ON public.ar_payments FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete payments"
  ON public.ar_payments FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add trigger to update updated_at on line items
CREATE OR REPLACE FUNCTION update_invoice_line_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_line_items_updated_at
  BEFORE UPDATE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_line_items_updated_at();

-- Add trigger to update updated_at on ar_payments
CREATE TRIGGER update_ar_payments_updated_at
  BEFORE UPDATE ON public.ar_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
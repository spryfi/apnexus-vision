-- Create transaction_line_items table for detailed line item tracking
CREATE TABLE public.transaction_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE public.transaction_line_items 
ADD CONSTRAINT transaction_line_items_transaction_id_fkey 
FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.transaction_line_items ENABLE ROW LEVEL SECURITY;

-- Create policies for line items
CREATE POLICY "Authenticated users can view line items" 
ON public.transaction_line_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create line items" 
ON public.transaction_line_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update line items" 
ON public.transaction_line_items 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete line items" 
ON public.transaction_line_items 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Modify transactions table - rename purchase_description to transaction_memo and make optional
ALTER TABLE public.transactions 
RENAME COLUMN purchase_description TO transaction_memo;

ALTER TABLE public.transactions 
ALTER COLUMN transaction_memo DROP NOT NULL;

-- Add trigger for updated_at on line items
CREATE TRIGGER update_transaction_line_items_updated_at
BEFORE UPDATE ON public.transaction_line_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
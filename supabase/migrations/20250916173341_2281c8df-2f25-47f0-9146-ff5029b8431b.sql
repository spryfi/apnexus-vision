-- Create maintenance_line_items table for detailed service tracking
CREATE TABLE public.maintenance_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_record_id UUID NOT NULL,
  description TEXT NOT NULL,
  part_number TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC,
  total_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE public.maintenance_line_items 
ADD CONSTRAINT maintenance_line_items_maintenance_record_id_fkey 
FOREIGN KEY (maintenance_record_id) REFERENCES public.maintenance_records(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.maintenance_line_items ENABLE ROW LEVEL SECURITY;

-- Create policies for line items
CREATE POLICY "Authenticated users can view maintenance line items" 
ON public.maintenance_line_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create maintenance line items" 
ON public.maintenance_line_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update maintenance line items" 
ON public.maintenance_line_items 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete maintenance line items" 
ON public.maintenance_line_items 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add missing columns to maintenance_records if they don't exist
ALTER TABLE public.maintenance_records 
ADD COLUMN IF NOT EXISTS service_summary TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Completed';

-- Add trigger for updated_at on maintenance line items
CREATE TRIGGER update_maintenance_line_items_updated_at
BEFORE UPDATE ON public.maintenance_line_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
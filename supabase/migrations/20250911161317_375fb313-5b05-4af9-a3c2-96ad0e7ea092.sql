-- Create the new intelligent fuel_transactions table
CREATE TABLE public.fuel_transactions_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_transaction_id TEXT UNIQUE, -- Critical for deduplication
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  vehicle_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  gallons NUMERIC NOT NULL,
  cost_per_gallon NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  odometer INTEGER NOT NULL,
  merchant_name TEXT,
  status TEXT NOT NULL DEFAULT 'Verified', -- 'Verified', 'Flagged for Review'
  flag_reason TEXT, -- Reason for flagging
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fuel_transactions_new ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view fuel transactions" 
ON public.fuel_transactions_new 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create fuel transactions" 
ON public.fuel_transactions_new 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update fuel transactions" 
ON public.fuel_transactions_new 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete fuel transactions" 
ON public.fuel_transactions_new 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_fuel_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fuel_transactions_updated_at
BEFORE UPDATE ON public.fuel_transactions_new
FOR EACH ROW
EXECUTE FUNCTION public.update_fuel_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_fuel_transactions_new_source_id ON public.fuel_transactions_new(source_transaction_id);
CREATE INDEX idx_fuel_transactions_new_date ON public.fuel_transactions_new(transaction_date);
CREATE INDEX idx_fuel_transactions_new_vehicle ON public.fuel_transactions_new(vehicle_id);
CREATE INDEX idx_fuel_transactions_new_status ON public.fuel_transactions_new(status);

-- Add storage bucket for fuel statements if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fuel-statements', 'fuel-statements', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for fuel statements
CREATE POLICY "Authenticated users can upload fuel statements" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'fuel-statements' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view fuel statements" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fuel-statements' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete fuel statements" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'fuel-statements' AND auth.uid() IS NOT NULL);
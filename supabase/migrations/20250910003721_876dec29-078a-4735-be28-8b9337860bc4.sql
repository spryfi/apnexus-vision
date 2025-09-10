-- Create fuel_transactions table
CREATE TABLE public.fuel_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_name TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  gallons NUMERIC(8,2) NOT NULL,
  cost_per_gallon NUMERIC(8,3) NOT NULL,
  total_cost NUMERIC(10,2) NOT NULL,
  location TEXT NOT NULL,
  odometer_reading INTEGER,
  card_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fuel_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view fuel transactions" 
ON public.fuel_transactions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create fuel transactions" 
ON public.fuel_transactions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update fuel transactions" 
ON public.fuel_transactions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete fuel transactions" 
ON public.fuel_transactions 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fuel_transactions_updated_at
BEFORE UPDATE ON public.fuel_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
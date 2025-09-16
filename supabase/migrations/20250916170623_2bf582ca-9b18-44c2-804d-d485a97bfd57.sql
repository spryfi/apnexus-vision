-- Add transaction_type column to fuel_transactions_new table
ALTER TABLE public.fuel_transactions_new 
ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'Fleet Vehicle';

-- Add check constraint for valid transaction types
ALTER TABLE public.fuel_transactions_new 
ADD CONSTRAINT fuel_transactions_transaction_type_check 
CHECK (transaction_type IN ('Fleet Vehicle', 'Auxiliary Fuel', 'Rental Equipment'));

-- Make vehicle_id nullable to support auxiliary fuel transactions
ALTER TABLE public.fuel_transactions_new 
ALTER COLUMN vehicle_id DROP NOT NULL;
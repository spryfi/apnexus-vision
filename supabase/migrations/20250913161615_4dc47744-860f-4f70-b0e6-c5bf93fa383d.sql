-- Create comprehensive Fleet Management tables

-- Create vehicles table - master list of all company vehicles
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_name TEXT NOT NULL,
  asset_id TEXT NOT NULL UNIQUE, -- Must match Custom Vehicle/Asset ID from fuel statements
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT UNIQUE,
  license_plate TEXT,
  current_odometer INTEGER DEFAULT 0,
  registration_expiry_date DATE,
  insurance_policy_number TEXT,
  insurance_expiry_date DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'In Shop', 'Sold', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance_records table - service log for vehicles
CREATE TABLE public.maintenance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_provider_vendor_id UUID REFERENCES public.vendors(id),
  service_description TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL,
  odometer_at_service INTEGER NOT NULL,
  receipt_scan_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vehicles
CREATE POLICY "Authenticated users can view vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage vehicles"
ON public.vehicles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create RLS policies for maintenance_records
CREATE POLICY "Authenticated users can view maintenance records"
ON public.maintenance_records
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage maintenance records"
ON public.maintenance_records
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger function for automatic updated_at
CREATE OR REPLACE FUNCTION public.update_vehicle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vehicle_updated_at();

CREATE TRIGGER update_maintenance_records_updated_at
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vehicle_updated_at();

-- Create function to automatically update vehicle odometer
CREATE OR REPLACE FUNCTION public.update_vehicle_odometer()
RETURNS TRIGGER AS $$
DECLARE
  current_vehicle_odometer INTEGER;
  vehicle_asset_id TEXT;
BEGIN
  -- Handle fuel transactions
  IF TG_TABLE_NAME = 'fuel_transactions_new' THEN
    -- Get current odometer for the vehicle with matching asset_id
    SELECT current_odometer, asset_id INTO current_vehicle_odometer, vehicle_asset_id
    FROM public.vehicles
    WHERE asset_id = NEW.vehicle_id;
    
    -- Update if new odometer reading is higher
    IF FOUND AND NEW.odometer > current_vehicle_odometer THEN
      UPDATE public.vehicles
      SET current_odometer = NEW.odometer,
          updated_at = now()
      WHERE asset_id = NEW.vehicle_id;
    END IF;
    
  -- Handle maintenance records  
  ELSIF TG_TABLE_NAME = 'maintenance_records' THEN
    -- Get current odometer for the vehicle
    SELECT current_odometer INTO current_vehicle_odometer
    FROM public.vehicles
    WHERE id = NEW.vehicle_id;
    
    -- Update if new odometer reading is higher
    IF FOUND AND NEW.odometer_at_service > current_vehicle_odometer THEN
      UPDATE public.vehicles
      SET current_odometer = NEW.odometer_at_service,
          updated_at = now()
      WHERE id = NEW.vehicle_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic odometer updates
CREATE TRIGGER update_odometer_from_fuel
  AFTER INSERT OR UPDATE ON public.fuel_transactions_new
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vehicle_odometer();

CREATE TRIGGER update_odometer_from_maintenance
  AFTER INSERT OR UPDATE ON public.maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vehicle_odometer();
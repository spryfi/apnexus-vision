-- Create vehicle_insurance table
CREATE TABLE IF NOT EXISTS public.vehicle_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  coverage_type TEXT NOT NULL,
  premium_amount NUMERIC,
  deductible NUMERIC,
  policy_document_url TEXT,
  insurance_card_front_url TEXT,
  insurance_card_back_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create vehicle_registrations table
CREATE TABLE IF NOT EXISTS public.vehicle_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  state TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  registration_fee NUMERIC,
  registration_document_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Current' CHECK (status IN ('Current', 'Expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create maintenance_schedules table
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  interval_type TEXT NOT NULL CHECK (interval_type IN ('Mileage', 'Time', 'Both')),
  interval_miles INTEGER,
  interval_months INTEGER,
  last_service_date DATE,
  last_service_odometer INTEGER,
  next_due_date DATE,
  next_due_odometer INTEGER,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Due Soon', 'Overdue', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vehicle_reminders table
CREATE TABLE IF NOT EXISTS public.vehicle_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('Insurance', 'Registration', 'Maintenance')),
  reference_id UUID,
  reminder_date DATE NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Dismissed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vehicle_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view insurance" ON public.vehicle_insurance
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage insurance" ON public.vehicle_insurance
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view registrations" ON public.vehicle_registrations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage registrations" ON public.vehicle_registrations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view schedules" ON public.maintenance_schedules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage schedules" ON public.maintenance_schedules
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view reminders" ON public.vehicle_reminders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage reminders" ON public.vehicle_reminders
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for better query performance (with conditional creation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicle_insurance_vehicle_id') THEN
    CREATE INDEX idx_vehicle_insurance_vehicle_id ON public.vehicle_insurance(vehicle_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicle_insurance_expiry') THEN
    CREATE INDEX idx_vehicle_insurance_expiry ON public.vehicle_insurance(expiry_date);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicle_registrations_vehicle_id') THEN
    CREATE INDEX idx_vehicle_registrations_vehicle_id ON public.vehicle_registrations(vehicle_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicle_registrations_expiry') THEN
    CREATE INDEX idx_vehicle_registrations_expiry ON public.vehicle_registrations(expiry_date);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_maintenance_schedules_vehicle_id') THEN
    CREATE INDEX idx_maintenance_schedules_vehicle_id ON public.maintenance_schedules(vehicle_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_maintenance_schedules_next_due') THEN
    CREATE INDEX idx_maintenance_schedules_next_due ON public.maintenance_schedules(next_due_date);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicle_reminders_vehicle_id') THEN
    CREATE INDEX idx_vehicle_reminders_vehicle_id ON public.vehicle_reminders(vehicle_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicle_reminders_date') THEN
    CREATE INDEX idx_vehicle_reminders_date ON public.vehicle_reminders(reminder_date);
  END IF;
END $$;

-- Create function to auto-update status based on expiry dates
CREATE OR REPLACE FUNCTION public.update_insurance_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'Expired';
  ELSE
    NEW.status := 'Active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_registration_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'Expired';
  ELSE
    NEW.status := 'Current';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (drop if exists first)
DROP TRIGGER IF EXISTS check_insurance_status ON public.vehicle_insurance;
CREATE TRIGGER check_insurance_status
  BEFORE INSERT OR UPDATE ON public.vehicle_insurance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_insurance_status();

DROP TRIGGER IF EXISTS check_registration_status ON public.vehicle_registrations;
CREATE TRIGGER check_registration_status
  BEFORE INSERT OR UPDATE ON public.vehicle_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_registration_status();

-- Create storage buckets for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-documents', 'vehicle-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete vehicle documents" ON storage.objects;

-- Create storage policies
CREATE POLICY "Authenticated users can view vehicle documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vehicle-documents' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can upload vehicle documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vehicle-documents' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can update vehicle documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'vehicle-documents' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete vehicle documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vehicle-documents' AND auth.uid() IS NOT NULL
  );
-- Create vehicle_odometer_history table
CREATE TABLE IF NOT EXISTS public.vehicle_odometer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT NOT NULL,
  previous_odometer INTEGER,
  new_odometer INTEGER NOT NULL,
  odometer_change INTEGER,
  source TEXT NOT NULL DEFAULT 'fuel_transaction',
  source_id UUID,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Add index for faster lookups
CREATE INDEX idx_odometer_history_vehicle ON public.vehicle_odometer_history(vehicle_id);
CREATE INDEX idx_odometer_history_date ON public.vehicle_odometer_history(updated_at DESC);

-- Enable RLS
ALTER TABLE public.vehicle_odometer_history ENABLE ROW LEVEL SECURITY;

-- RLS policy: authenticated users can view
CREATE POLICY "Authenticated users can view odometer history"
  ON public.vehicle_odometer_history
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS policy: system can insert
CREATE POLICY "System can insert odometer history"
  ON public.vehicle_odometer_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create auto_review_rules table
CREATE TABLE IF NOT EXISTS public.auto_review_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL, -- 'card_to_vehicle', 'odometer_range'
  card_number TEXT,
  odometer_min INTEGER,
  odometer_max INTEGER,
  vehicle_id TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Add index
CREATE INDEX idx_auto_review_rules_active ON public.auto_review_rules(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.auto_review_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can manage auto-review rules"
  ON public.auto_review_rules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
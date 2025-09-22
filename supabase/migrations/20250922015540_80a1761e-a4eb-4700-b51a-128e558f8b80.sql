-- Create odometer_log table for tracking odometer changes
CREATE TABLE public.odometer_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  previous_reading INTEGER,
  new_reading INTEGER NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on odometer_log
ALTER TABLE public.odometer_log ENABLE ROW LEVEL SECURITY;

-- Create policies for odometer_log
CREATE POLICY "Authenticated users can view odometer logs" 
ON public.odometer_log 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert odometer logs" 
ON public.odometer_log 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to automatically log odometer changes
CREATE OR REPLACE FUNCTION public.log_odometer_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if odometer actually changed
  IF OLD.current_odometer IS DISTINCT FROM NEW.current_odometer THEN
    INSERT INTO public.odometer_log (
      vehicle_id,
      previous_reading,
      new_reading,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.current_odometer,
      NEW.current_odometer,
      auth.uid(),
      CASE 
        WHEN OLD.current_odometer IS NULL THEN 'Initial value set during vehicle creation'
        ELSE 'Manually updated by office administrator'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log odometer changes
CREATE TRIGGER trigger_log_odometer_change
  AFTER INSERT OR UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_odometer_change();
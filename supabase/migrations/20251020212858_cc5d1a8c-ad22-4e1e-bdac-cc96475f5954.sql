-- Add flagging columns to maintenance_records if they don't exist
ALTER TABLE maintenance_records 
ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- Create function to validate odometer readings chronologically
CREATE OR REPLACE FUNCTION validate_maintenance_odometer()
RETURNS TRIGGER AS $$
DECLARE
  conflicting_record RECORD;
  earlier_record RECORD;
  later_record RECORD;
BEGIN
  -- Only check if odometer_at_service is provided
  IF NEW.odometer_at_service IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check for earlier dates with higher odometer readings
  SELECT id, service_date, odometer_at_service
  INTO earlier_record
  FROM maintenance_records
  WHERE vehicle_id = NEW.vehicle_id
    AND id != NEW.id
    AND service_date < NEW.service_date
    AND odometer_at_service > NEW.odometer_at_service
  ORDER BY service_date DESC
  LIMIT 1;

  IF FOUND THEN
    NEW.flagged_for_review := TRUE;
    NEW.flag_reason := format(
      'Odometer reading (%s mi) is lower than earlier record from %s (%s mi)',
      NEW.odometer_at_service,
      to_char(earlier_record.service_date, 'MM/DD/YYYY'),
      earlier_record.odometer_at_service
    );
    RETURN NEW;
  END IF;

  -- Check for later dates with lower odometer readings
  SELECT id, service_date, odometer_at_service
  INTO later_record
  FROM maintenance_records
  WHERE vehicle_id = NEW.vehicle_id
    AND id != NEW.id
    AND service_date > NEW.service_date
    AND odometer_at_service < NEW.odometer_at_service
  ORDER BY service_date ASC
  LIMIT 1;

  IF FOUND THEN
    NEW.flagged_for_review := TRUE;
    NEW.flag_reason := format(
      'Odometer reading (%s mi) is higher than later record from %s (%s mi)',
      NEW.odometer_at_service,
      to_char(later_record.service_date, 'MM/DD/YYYY'),
      later_record.odometer_at_service
    );
    RETURN NEW;
  END IF;

  -- If we get here, odometer is valid
  NEW.flagged_for_review := FALSE;
  NEW.flag_reason := NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run validation on insert/update
DROP TRIGGER IF EXISTS check_maintenance_odometer ON maintenance_records;
CREATE TRIGGER check_maintenance_odometer
  BEFORE INSERT OR UPDATE OF odometer_at_service, service_date
  ON maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION validate_maintenance_odometer();

-- Create function to revalidate all records for a vehicle (useful after updates)
CREATE OR REPLACE FUNCTION revalidate_vehicle_maintenance(p_vehicle_id UUID)
RETURNS void AS $$
DECLARE
  record_to_check RECORD;
BEGIN
  FOR record_to_check IN 
    SELECT id FROM maintenance_records 
    WHERE vehicle_id = p_vehicle_id 
    ORDER BY service_date
  LOOP
    -- Trigger will run on update
    UPDATE maintenance_records 
    SET updated_at = now() 
    WHERE id = record_to_check.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add index for faster odometer validation queries
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date_odometer 
ON maintenance_records(vehicle_id, service_date, odometer_at_service);

-- Add comment explaining the validation
COMMENT ON COLUMN maintenance_records.flagged_for_review IS 'Auto-flagged if odometer reading is chronologically inconsistent';
COMMENT ON COLUMN maintenance_records.flag_reason IS 'Explanation of why the record was flagged';
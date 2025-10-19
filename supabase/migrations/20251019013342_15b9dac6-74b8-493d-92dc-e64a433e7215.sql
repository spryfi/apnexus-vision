-- Fix the validate_transaction_status_change function
-- The trigger is checking for 'purchase_description' field which doesn't exist
-- Update it to use 'transaction_memo' instead

CREATE OR REPLACE FUNCTION public.validate_transaction_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Prevent changing to Paid or Reconciled without receipt
  IF NEW.status IN ('Paid', 'Reconciled') AND 
     (NEW.invoice_receipt_url IS NULL OR NEW.invoice_receipt_url = '') THEN
    RAISE EXCEPTION 'Cannot change status to % without uploading a receipt', NEW.status;
  END IF;
  
  -- Prevent changing from Entry Required without description
  -- Updated to use transaction_memo instead of purchase_description
  IF OLD.status = 'Entry Required' AND NEW.status != 'Entry Required' AND 
     (NEW.transaction_memo IS NULL OR char_length(NEW.transaction_memo) < 20) THEN
    RAISE EXCEPTION 'Cannot change status from Entry Required without a proper description (minimum 20 characters)';
  END IF;
  
  RETURN NEW;
END;
$function$;
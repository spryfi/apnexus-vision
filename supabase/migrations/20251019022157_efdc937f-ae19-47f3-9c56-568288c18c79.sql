-- Create legacy fuel statement for existing transactions
DO $$
DECLARE
  legacy_statement_id UUID;
  min_date TIMESTAMP WITH TIME ZONE;
  max_date TIMESTAMP WITH TIME ZONE;
  total_count INTEGER;
  total_spent NUMERIC;
  total_gals NUMERIC;
BEGIN
  -- Check if there are any fuel transactions
  SELECT 
    MIN(transaction_date),
    MAX(transaction_date),
    COUNT(*),
    COALESCE(SUM(total_cost), 0),
    COALESCE(SUM(gallons), 0)
  INTO min_date, max_date, total_count, total_spent, total_gals
  FROM fuel_transactions_new;

  -- Only create legacy statement if there are transactions
  IF total_count > 0 THEN
    -- Create a legacy fuel statement
    INSERT INTO fuel_statements (
      file_name,
      statement_start_date,
      statement_end_date,
      total_transactions,
      total_amount,
      total_gallons,
      status,
      upload_date,
      ai_processing_notes
    ) VALUES (
      'Legacy Data (Imported)',
      CAST(min_date AS DATE),
      CAST(max_date AS DATE),
      total_count,
      total_spent,
      total_gals,
      'Completed',
      CURRENT_TIMESTAMP,
      'Legacy fuel transactions imported from fuel_transactions_new table. Total of ' || total_count || ' transactions covering ' || CAST(min_date AS DATE) || ' to ' || CAST(max_date AS DATE)
    )
    RETURNING id INTO legacy_statement_id;

    RAISE NOTICE 'Created legacy fuel statement with ID: % containing % transactions', legacy_statement_id, total_count;
  ELSE
    RAISE NOTICE 'No fuel transactions found in fuel_transactions_new table';
  END IF;
END $$;
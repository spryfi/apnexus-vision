-- ===============================================
-- MIGRATION SCRIPT: Consolidate Expense Data
-- ===============================================
-- This migration consolidates data from multiple tables into
-- the unified expense_transactions table for centralized 
-- expense management and approval workflows.
--
-- Tables being migrated:
-- 1. transactions (accounts_payable_invoices) → expense_transactions
-- 2. fuel_transactions_new → expense_transactions  
-- 3. credit_card_transactions → expense_transactions
-- 
-- Run this migration AFTER the expense_transactions table has been created
-- ===============================================

-- STEP 1: Migrate existing vendor invoices from transactions table
-- These are the current accounts payable invoices
INSERT INTO expense_transactions (
  transaction_date,
  expense_type,
  amount,
  description,
  vendor_id,
  vendor_name,
  invoice_number,
  due_date,
  receipt_url,
  has_receipt,
  receipt_required,
  payment_status,
  payment_date,
  payment_method,
  payment_confirmation_url,
  approval_status,
  approved_by,
  approved_at,
  created_by,
  created_at,
  updated_at
)
SELECT
  invoice_date as transaction_date,
  'vendor_invoice' as expense_type,
  amount,
  COALESCE(transaction_memo, 'Vendor Invoice') as description,
  vendor_id,
  vendors.vendor_name,
  COALESCE(invoice_number, 'NI') as invoice_number,
  due_date,
  receipt_url,
  (receipt_url IS NOT NULL AND receipt_url != '') as has_receipt,
  CASE 
    WHEN amount >= 500 THEN true
    ELSE false
  END as receipt_required,
  CASE status
    WHEN 'Paid' THEN 'paid'
    WHEN 'Approved for Payment' THEN 'approved'
    WHEN 'Pending Approval' THEN 'pending'
    ELSE 'pending'
  END as payment_status,
  paid_date as payment_date,
  payment_method::text as payment_method,
  payment_receipt_url as payment_confirmation_url,
  CASE 
    WHEN status = 'Paid' OR status = 'Approved for Payment' THEN 'admin_approved'
    WHEN amount < 2500 THEN 'auto_approved'
    ELSE 'pending_review'
  END as approval_status,
  approved_by,
  approved_at,
  auth.uid() as created_by, -- Use current user or set to a system user
  created_at,
  updated_at
FROM transactions
LEFT JOIN vendors ON transactions.vendor_id = vendors.id
WHERE NOT EXISTS (
  -- Prevent duplicates if running migration multiple times
  SELECT 1 FROM expense_transactions 
  WHERE expense_transactions.invoice_number = COALESCE(transactions.invoice_number, 'NI')
  AND expense_transactions.transaction_date = transactions.invoice_date
);

-- STEP 2: Migrate fuel transactions from fuel_transactions_new
-- These were imported from WEX statements
INSERT INTO expense_transactions (
  transaction_date,
  expense_type,
  amount,
  description,
  vendor_name,
  invoice_number,
  fuel_statement_id,
  employee_id,
  receipt_url,
  has_receipt,
  receipt_required,
  payment_status,
  approval_status,
  approved_at,
  flagged_for_review,
  flag_reason,
  created_by,
  created_at,
  updated_at
)
SELECT
  transaction_date,
  'fuel_purchase' as expense_type,
  total_cost as amount,
  CONCAT(
    'Fuel - ', 
    merchant_name, 
    CASE 
      WHEN vehicle_id IS NOT NULL THEN CONCAT(' - ', vehicle_id)
      ELSE ' - Unmatched'
    END
  ) as description,
  merchant_name as vendor_name,
  COALESCE(source_transaction_id, 'FUEL-' || id::text) as invoice_number,
  NULL as fuel_statement_id, -- Link if statement_id exists in your data
  NULL as employee_id, -- Map if you have driver mapping
  NULL as receipt_url,
  false as has_receipt,
  true as receipt_required,
  'paid' as payment_status, -- Fuel is pre-paid via WEX card
  CASE status
    WHEN 'verified' THEN 'auto_approved'
    WHEN 'flagged' THEN 'pending_review'
    ELSE 'auto_approved'
  END as approval_status,
  CASE 
    WHEN status = 'verified' THEN transaction_date
    ELSE NULL
  END as approved_at,
  (status = 'flagged') as flagged_for_review,
  flag_reason,
  auth.uid() as created_by,
  created_at,
  updated_at
FROM fuel_transactions_new
WHERE NOT EXISTS (
  -- Prevent duplicates
  SELECT 1 FROM expense_transactions 
  WHERE expense_transactions.expense_type = 'fuel_purchase'
  AND expense_transactions.invoice_number = COALESCE(fuel_transactions_new.source_transaction_id, 'FUEL-' || fuel_transactions_new.id::text)
);

-- STEP 3: Migrate credit card transactions
-- These are employee credit card purchases
INSERT INTO expense_transactions (
  transaction_date,
  expense_type,
  amount,
  description,
  vendor_name,
  category_id,
  employee_id,
  receipt_url,
  has_receipt,
  receipt_required,
  payment_status,
  approval_status,
  approved_at,
  created_by,
  created_at,
  updated_at,
  credit_card_id
)
SELECT
  transaction_date,
  'credit_card_purchase' as expense_type,
  amount,
  COALESCE(description, 'Credit Card Purchase - ' || merchant) as description,
  merchant as vendor_name,
  category_id,
  employee_id,
  receipt_url,
  receipt_uploaded as has_receipt,
  true as receipt_required, -- Credit card purchases always require receipts
  CASE status
    WHEN 'Paid' THEN 'paid'
    WHEN 'Pending' THEN 'pending'
    ELSE 'pending'
  END as payment_status,
  CASE 
    WHEN receipt_uploaded = true AND status = 'Paid' THEN 'auto_approved'
    WHEN receipt_uploaded = false THEN 'pending_review'
    ELSE 'auto_approved'
  END as approval_status,
  CASE 
    WHEN status = 'Paid' THEN transaction_date
    ELSE NULL
  END as approved_at,
  auth.uid() as created_by,
  created_at,
  updated_at,
  card_id as credit_card_id
FROM credit_card_transactions
WHERE NOT EXISTS (
  -- Prevent duplicates
  SELECT 1 FROM expense_transactions 
  WHERE expense_transactions.expense_type = 'credit_card_purchase'
  AND expense_transactions.transaction_date = credit_card_transactions.transaction_date
  AND expense_transactions.amount = credit_card_transactions.amount
  AND expense_transactions.vendor_name = credit_card_transactions.merchant
);

-- STEP 4: Update statistics and verify migration
-- Get counts before migration (run this first to compare)
-- SELECT 
--   'transactions' as source_table,
--   COUNT(*) as record_count
-- FROM transactions
-- UNION ALL
-- SELECT 
--   'fuel_transactions_new' as source_table,
--   COUNT(*) as record_count
-- FROM fuel_transactions_new
-- UNION ALL
-- SELECT 
--   'credit_card_transactions' as source_table,
--   COUNT(*) as record_count
-- FROM credit_card_transactions;

-- Verify migration results
SELECT 
  expense_type,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  COUNT(CASE WHEN has_receipt = true THEN 1 END) as with_receipts,
  COUNT(CASE WHEN receipt_required = true AND has_receipt = false THEN 1 END) as missing_required_receipts,
  COUNT(CASE WHEN approval_status = 'pending_review' THEN 1 END) as pending_review
FROM expense_transactions
GROUP BY expense_type
ORDER BY expense_type;

-- STEP 5: Flag expenses that need attention
-- Update expenses missing required receipts to be flagged for review
UPDATE expense_transactions
SET 
  flagged_for_review = true,
  flag_reason = 'Receipt required but not uploaded',
  approval_status = 'pending_review'
WHERE 
  receipt_required = true 
  AND has_receipt = false
  AND approval_status != 'rejected';

-- STEP 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expense_transactions_expense_type ON expense_transactions(expense_type);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_payment_status ON expense_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_approval_status ON expense_transactions(approval_status);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_vendor_id ON expense_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_employee_id ON expense_transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_transaction_date ON expense_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_flagged ON expense_transactions(flagged_for_review) WHERE flagged_for_review = true;
CREATE INDEX IF NOT EXISTS idx_expense_transactions_pending_review ON expense_transactions(approval_status) WHERE approval_status = 'pending_review';

-- MIGRATION COMPLETE
-- 
-- Post-migration checklist:
-- ✅ Verify record counts match source tables
-- ✅ Check that all expenses have correct approval_status
-- ✅ Verify receipt_required flags are correct
-- ✅ Test the AP dashboard to ensure all data displays correctly
-- ✅ Test filtering, sorting, and search functionality
-- ✅ Verify pending review queue shows flagged items
-- ✅ Consider backing up old tables before dropping them
--
-- Once verified, you can optionally rename or drop old tables:
-- ALTER TABLE transactions RENAME TO transactions_archived;
-- ALTER TABLE fuel_transactions_new RENAME TO fuel_transactions_archived;
-- ALTER TABLE credit_card_transactions RENAME TO credit_card_transactions_archived;

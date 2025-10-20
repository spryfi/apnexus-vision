-- Create unified expense transactions table
CREATE TABLE IF NOT EXISTS expense_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Fields
  transaction_date DATE NOT NULL,
  expense_type TEXT NOT NULL CHECK (expense_type IN (
    'vendor_invoice',
    'credit_card_purchase', 
    'fuel_purchase',
    'check_payment',
    'employee_reimbursement',
    'recurring_bill',
    'other'
  )),
  
  -- Financial Details
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  vendor_id UUID REFERENCES vendors(id),
  vendor_name TEXT, -- Denormalized for quick display
  category_id UUID REFERENCES expense_categories(id),
  
  -- Type-Specific Fields (nullable based on expense_type)
  invoice_number TEXT, -- Required for vendor_invoice, fuel_purchase
  check_number TEXT, -- Required for check_payment
  credit_card_id UUID REFERENCES credit_cards(id), -- For credit_card_purchase
  employee_id UUID REFERENCES employees(id), -- For credit_card_purchase, employee_reimbursement
  fuel_statement_id UUID REFERENCES fuel_statements(id), -- For fuel_purchase
  
  -- Receipt Management
  receipt_url TEXT,
  receipt_uploaded_at TIMESTAMPTZ,
  receipt_uploaded_by UUID REFERENCES auth.users(id),
  has_receipt BOOLEAN DEFAULT false,
  receipt_required BOOLEAN DEFAULT true, -- Auto-calculated based on rules
  
  -- Payment Tracking
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending',
    'approved',
    'paid',
    'overdue',
    'cancelled'
  )),
  due_date DATE,
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IN (
    'check',
    'ach_transfer',
    'credit_card',
    'cash',
    'wire_transfer',
    'auto_debit'
  )),
  payment_confirmation_url TEXT, -- Proof of payment
  
  -- Approval Workflow
  approval_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (approval_status IN (
    'pending_review', -- Needs admin review (missing receipt, etc.)
    'auto_approved', -- Auto-approved based on rules
    'admin_approved', -- Manually approved by admin
    'rejected'
  )),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Flags & Alerts
  flagged_for_review BOOLEAN DEFAULT false,
  flag_reason TEXT,
  is_overdue BOOLEAN DEFAULT false,
  days_until_due INTEGER,
  
  -- Audit Trail
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Notes & Attachments
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb -- Array of {url, filename, uploaded_at, uploaded_by}
);

-- Indexes for performance
CREATE INDEX idx_expense_transactions_date ON expense_transactions(transaction_date DESC);
CREATE INDEX idx_expense_transactions_type ON expense_transactions(expense_type);
CREATE INDEX idx_expense_transactions_status ON expense_transactions(payment_status);
CREATE INDEX idx_expense_transactions_vendor ON expense_transactions(vendor_id);
CREATE INDEX idx_expense_transactions_employee ON expense_transactions(employee_id);
CREATE INDEX idx_expense_transactions_overdue ON expense_transactions(is_overdue) WHERE is_overdue = true;
CREATE INDEX idx_expense_transactions_flagged ON expense_transactions(flagged_for_review) WHERE flagged_for_review = true;
CREATE INDEX idx_expense_transactions_approval ON expense_transactions(approval_status);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_expense_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expense_transactions_updated_at
  BEFORE UPDATE ON expense_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_transaction_timestamp();

-- Auto-calculate receipt_required and computed fields based on business rules
CREATE OR REPLACE FUNCTION calculate_receipt_required()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate days_until_due
  IF NEW.due_date IS NOT NULL AND NEW.payment_status NOT IN ('paid', 'cancelled') THEN
    NEW.days_until_due = NEW.due_date - CURRENT_DATE;
  ELSE
    NEW.days_until_due = NULL;
  END IF;
  
  -- Calculate is_overdue
  IF NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE AND NEW.payment_status NOT IN ('paid', 'cancelled') THEN
    NEW.is_overdue = true;
  ELSE
    NEW.is_overdue = false;
  END IF;
  
  -- Receipt REQUIRED for:
  -- 1. All credit card purchases
  -- 2. All employee reimbursements
  -- 3. All check payments
  -- 4. Any expense >= $500
  -- 5. Fuel purchases (auto-attached from WEX)
  
  IF NEW.expense_type IN ('credit_card_purchase', 'employee_reimbursement', 'check_payment', 'fuel_purchase') THEN
    NEW.receipt_required = true;
  ELSIF NEW.amount >= 500 THEN
    NEW.receipt_required = true;
  ELSE
    NEW.receipt_required = false;
  END IF;
  
  -- Update has_receipt flag
  IF NEW.receipt_url IS NOT NULL AND NEW.receipt_url != '' THEN
    NEW.has_receipt = true;
  ELSE
    NEW.has_receipt = false;
  END IF;
  
  -- Auto-flag for review if receipt required but not uploaded
  IF NEW.receipt_required = true AND NEW.has_receipt = false THEN
    NEW.flagged_for_review = true;
    NEW.flag_reason = 'Receipt required but not uploaded';
    NEW.approval_status = 'pending_review';
  END IF;
  
  -- Auto-approve if receipt not required and amount < $2500
  IF NEW.receipt_required = false AND NEW.amount < 2500 AND NEW.approval_status = 'pending_review' THEN
    NEW.approval_status = 'auto_approved';
    NEW.approved_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expense_transactions_calculate_receipt
  BEFORE INSERT OR UPDATE ON expense_transactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_receipt_required();

-- Row Level Security
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all expense transactions"
  ON expense_transactions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert expense transactions"
  ON expense_transactions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own expense transactions"
  ON expense_transactions FOR UPDATE
  USING (created_by = auth.uid());

-- Notification trigger for flagged expenses
CREATE OR REPLACE FUNCTION notify_admin_flagged_expense()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.flagged_for_review = true AND (OLD.flagged_for_review IS NULL OR OLD.flagged_for_review = false) THEN
    -- Insert notification for admin (you can implement your notification system here)
    -- For now, we'll just log it
    RAISE NOTICE 'Expense flagged for review: % - % - $%', NEW.id, NEW.description, NEW.amount;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expense_flagged_notification
  AFTER INSERT OR UPDATE ON expense_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_flagged_expense();
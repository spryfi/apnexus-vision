-- Add missing foreign key relationships for credit card transactions
ALTER TABLE credit_card_transactions
DROP CONSTRAINT IF EXISTS credit_card_transactions_card_id_fkey,
ADD CONSTRAINT credit_card_transactions_card_id_fkey 
  FOREIGN KEY (card_id) REFERENCES company_cards(id) ON DELETE SET NULL;

ALTER TABLE credit_card_transactions
DROP CONSTRAINT IF EXISTS credit_card_transactions_employee_id_fkey,
ADD CONSTRAINT credit_card_transactions_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES employees_enhanced(id) ON DELETE SET NULL;

ALTER TABLE credit_card_transactions
DROP CONSTRAINT IF EXISTS credit_card_transactions_category_id_fkey,
ADD CONSTRAINT credit_card_transactions_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL;
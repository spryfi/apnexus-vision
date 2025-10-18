-- Add fuel-specific fields to company_cards table
ALTER TABLE public.company_cards
ADD COLUMN IF NOT EXISTS spending_limit NUMERIC,
ADD COLUMN IF NOT EXISTS allowed_fuel_types TEXT[] DEFAULT ARRAY['Unleaded', 'Diesel'],
ADD COLUMN IF NOT EXISTS last_used_date DATE,
ADD COLUMN IF NOT EXISTS monthly_spending NUMERIC DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_company_cards_assigned_to ON public.company_cards(assigned_to);
CREATE INDEX IF NOT EXISTS idx_company_cards_is_active ON public.company_cards(is_active);

-- Create a view for card spending summary
CREATE OR REPLACE VIEW public.fuel_card_spending_summary AS
SELECT 
  cc.id as card_id,
  cc.last_four,
  cc.cardholder_name,
  cc.assigned_to,
  cc.spending_limit,
  cc.monthly_spending,
  COALESCE(SUM(ft.total_cost), 0) as current_month_spending,
  COUNT(ft.id) as transaction_count,
  MAX(ft.transaction_date) as last_transaction_date
FROM public.company_cards cc
LEFT JOIN public.fuel_transactions_new ft ON ft.vehicle_id IN (
  SELECT asset_id FROM public.vehicles WHERE id = cc.assigned_to
)
AND EXTRACT(MONTH FROM ft.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(YEAR FROM ft.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE cc.is_active = true
GROUP BY cc.id, cc.last_four, cc.cardholder_name, cc.assigned_to, cc.spending_limit, cc.monthly_spending;

-- Grant access to the view
GRANT SELECT ON public.fuel_card_spending_summary TO authenticated;
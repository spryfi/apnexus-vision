-- Update RLS policy to allow office staff to manage expense categories
DROP POLICY IF EXISTS "Admins have full access to manage expense categories" ON expense_categories;

CREATE POLICY "Admins and office staff can manage expense categories"
ON expense_categories
FOR ALL
TO authenticated
USING (
  get_current_user_role() = 'admin' OR 
  get_current_user_role() = 'office'
)
WITH CHECK (
  get_current_user_role() = 'admin' OR 
  get_current_user_role() = 'office'
);
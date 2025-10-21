-- Ensure receipt-images storage bucket exists with proper policies
DO $$
BEGIN
  -- Insert bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('receipt-images', 'receipt-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to receipt-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from receipt-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view receipts" ON storage.objects;

-- Allow authenticated users to upload receipts
CREATE POLICY "Allow authenticated users to upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipt-images');

-- Allow authenticated users to update their receipts
CREATE POLICY "Allow authenticated users to update receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'receipt-images');

-- Allow public read access to receipts
CREATE POLICY "Allow public to view receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipt-images');

-- Allow authenticated users to delete receipts
CREATE POLICY "Allow authenticated users to delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'receipt-images');

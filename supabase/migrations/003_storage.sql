-- ============================================================
-- Storage: images bucket
-- ============================================================

-- Create the images bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "authenticated_upload_images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to update their uploads
CREATE POLICY "authenticated_update_images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images');

-- Allow public read access
CREATE POLICY "public_read_images" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

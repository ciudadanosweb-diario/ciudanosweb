-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the article-images bucket
CREATE POLICY "Anyone can view article images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can upload article images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'article-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can update their own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'article-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'article-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can delete their own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'article-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can delete any article images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'article-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

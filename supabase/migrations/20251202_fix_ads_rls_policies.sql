-- Drop existing policies for ads table
DROP POLICY IF EXISTS "Anyone can view active ads" ON ads;
DROP POLICY IF EXISTS "Authenticated users can view all ads" ON ads;
DROP POLICY IF EXISTS "Authenticated users can insert ads" ON ads;
DROP POLICY IF EXISTS "Authenticated users can update ads" ON ads;
DROP POLICY IF EXISTS "Authenticated users can delete ads" ON ads;
DROP POLICY IF EXISTS "Admins can view all ads" ON ads;
DROP POLICY IF EXISTS "Only admins can insert ads" ON ads;
DROP POLICY IF EXISTS "Only admins can update ads" ON ads;
DROP POLICY IF EXISTS "Only admins can delete ads" ON ads;

-- Create new policies for ads table with proper admin check

-- Policy to allow anyone (including anonymous users) to view active ads
CREATE POLICY "Anyone can view active ads"
ON ads FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Policy to allow admins to view all ads
CREATE POLICY "Admins can view all ads"
ON ads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy to allow only admins to insert ads
CREATE POLICY "Only admins can insert ads"
ON ads FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy to allow only admins to update ads
CREATE POLICY "Only admins can update ads"
ON ads FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy to allow only admins to delete ads
CREATE POLICY "Only admins can delete ads"
ON ads FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Fix storage policies for article-images bucket
-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view article images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any article images" ON storage.objects;
DROP POLICY IF EXISTS "article_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "article_images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "article_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "article_images_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "article_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "article_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "article_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "article_images_delete_policy" ON storage.objects;

-- Ensure the article-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Create new simplified storage policies for article-images

-- Anyone can view article images
CREATE POLICY "article_images_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article-images');

-- Only admins can upload article images
CREATE POLICY "article_images_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Only admins can update article images
CREATE POLICY "article_images_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'article-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Only admins can delete article images
CREATE POLICY "article_images_delete_policy"
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

-- Fix storage policies for ads bucket
-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view ads images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload ads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update ads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete ads" ON storage.objects;
DROP POLICY IF EXISTS "Public ads are viewable by anyone" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload ads images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update ads images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete ads images" ON storage.objects;
DROP POLICY IF EXISTS "ads_public_read" ON storage.objects;
DROP POLICY IF EXISTS "ads_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "ads_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "ads_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "ads_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "ads_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "ads_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "ads_delete_policy" ON storage.objects;

-- Ensure the ads bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Create new simplified storage policies for ads bucket

-- Anyone can view ads
CREATE POLICY "ads_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ads');

-- Only admins can upload ads
CREATE POLICY "ads_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ads' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Only admins can update ads
CREATE POLICY "ads_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ads' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'ads' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Only admins can delete ads
CREATE POLICY "ads_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ads' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Fix article-images bucket configuration and RLS policies

-- First, ensure the article-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view article images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any article images" ON storage.objects;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simplified, permissive RLS policies for article-images bucket

-- Policy 1: PUBLIC can SELECT (view) any article images - no restrictions
CREATE POLICY "article_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- Policy 2: AUTHENTICATED can INSERT (upload) article images
CREATE POLICY "article_images_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images');

-- Policy 3: AUTHENTICATED can UPDATE article images
CREATE POLICY "article_images_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'article-images')
WITH CHECK (bucket_id = 'article-images');

-- Policy 4: AUTHENTICATED can DELETE article images
CREATE POLICY "article_images_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-images');

-- Grant appropriate permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
-- Fix ads bucket configuration and RLS policies

-- First, ensure the ads bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Public can view ads images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload ads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update ads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete ads" ON storage.objects;
DROP POLICY IF EXISTS "Public ads are viewable by anyone" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload ads images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update ads images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete ads images" ON storage.objects;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simplified, permissive RLS policies for ads bucket

-- Policy 1: PUBLIC can SELECT (view) any ads images - no restrictions
CREATE POLICY "ads_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads');

-- Policy 2: AUTHENTICATED can INSERT (upload) ads
CREATE POLICY "ads_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ads');

-- Policy 3: AUTHENTICATED can UPDATE ads
CREATE POLICY "ads_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ads')
WITH CHECK (bucket_id = 'ads');

-- Policy 4: AUTHENTICATED can DELETE ads
CREATE POLICY "ads_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ads');

-- Grant appropriate permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

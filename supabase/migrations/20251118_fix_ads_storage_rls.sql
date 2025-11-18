-- Fix RLS policies for ads bucket to allow public viewing of images

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public ads are viewable by anyone" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload ads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update ads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete ads" ON storage.objects;

-- Create new RLS policies for ads bucket

-- Policy 1: Anyone (public and authenticated) can SELECT (view) ads images
CREATE POLICY "Public can view ads images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads');

-- Policy 2: Authenticated users can INSERT (upload) ads
CREATE POLICY "Authenticated users can upload ads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ads');

-- Policy 3: Authenticated users can UPDATE ads
CREATE POLICY "Authenticated users can update ads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ads')
WITH CHECK (bucket_id = 'ads');

-- Policy 4: Authenticated users can DELETE ads
CREATE POLICY "Authenticated users can delete ads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ads');

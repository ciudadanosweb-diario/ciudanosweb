-- Create ads storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public viewing of ads
CREATE POLICY "Public ads are viewable by anyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads');

-- Policy to allow authenticated users to upload ads
CREATE POLICY "Authenticated users can upload ads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ads');

-- Policy to allow authenticated users to update ads
CREATE POLICY "Authenticated users can update ads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ads')
WITH CHECK (bucket_id = 'ads');

-- Policy to allow authenticated users to delete ads
CREATE POLICY "Authenticated users can delete ads"
ON storage.objects FOR DELETE
USING (bucket_id = 'ads');

-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on ads table
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to view active ads
CREATE POLICY "Anyone can view active ads"
ON ads FOR SELECT
USING (is_active = true);

-- Policy to allow authenticated users to view all ads (for admin panel)
CREATE POLICY "Authenticated users can view all ads"
ON ads FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert ads
CREATE POLICY "Authenticated users can insert ads"
ON ads FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update ads
CREATE POLICY "Authenticated users can update ads"
ON ads FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated users to delete ads
CREATE POLICY "Authenticated users can delete ads"
ON ads FOR DELETE
USING (auth.role() = 'authenticated');

-- Create index for better query performance
CREATE INDEX idx_ads_position ON ads(position);
CREATE INDEX idx_ads_is_active ON ads(is_active);
CREATE INDEX idx_ads_created_by ON ads(created_by);

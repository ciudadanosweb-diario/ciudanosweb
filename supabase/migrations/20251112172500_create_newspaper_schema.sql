/*
  # Create Ciudadanos Digital Newspaper Schema

  ## Overview
  This migration sets up the complete database schema for the Ciudadanos digital newspaper,
  including user authentication, article management, and category organization.

  ## New Tables
  
  ### 1. categories
  - `id` (uuid, primary key) - Unique identifier for each category
  - `name` (text, unique) - Category name (e.g., "Política", "Deportes", "Cultura")
  - `slug` (text, unique) - URL-friendly version of the name
  - `color` (text) - Color code for category display
  - `created_at` (timestamptz) - When the category was created
  
  ### 2. articles
  - `id` (uuid, primary key) - Unique identifier for each article
  - `title` (text) - Article headline
  - `subtitle` (text) - Article subheadline
  - `content` (text) - Full article content
  - `excerpt` (text) - Short summary for previews
  - `category_id` (uuid, foreign key) - Links to categories table
  - `author_id` (uuid, foreign key) - Links to auth.users
  - `image_url` (text) - Main article image URL
  - `is_featured` (boolean) - Whether article appears in carousel
  - `view_count` (integer) - Number of times article has been viewed
  - `published_at` (timestamptz) - When the article was published
  - `created_at` (timestamptz) - When the article was created
  - `updated_at` (timestamptz) - When the article was last updated
  
  ### 3. profiles
  - `id` (uuid, primary key, foreign key to auth.users) - User identifier
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `is_admin` (boolean) - Whether user has admin privileges
  - `created_at` (timestamptz) - When the profile was created

  ## Security
  
  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Public users can read published articles and categories
  - Only authenticated admin users can create, update, or delete content
  - Users can only modify their own profiles
  
  ### Policies
  
  #### Categories
  - Anyone can view categories
  - Only admins can create, update, or delete categories
  
  #### Articles
  - Anyone can view published articles
  - Only admins can create articles
  - Only admins can update articles
  - Only admins can delete articles
  
  #### Profiles
  - Users can view their own profile
  - Users can update their own profile
  - Only admins can view all profiles

  ## Indexes
  - Index on articles.category_id for faster category filtering
  - Index on articles.published_at for chronological sorting
  - Index on articles.is_featured for carousel queries
  - Index on articles.view_count for "most read" queries

  ## Notes
  - Articles use soft publishing (published_at field) rather than a separate published boolean
  - View counts are incremented when articles are viewed
  - Featured articles appear in the homepage carousel
  - All timestamps use timestamptz for timezone awareness
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  content text NOT NULL,
  excerpt text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url text,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_articles_views ON articles(view_count DESC);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update categories"
  ON categories FOR UPDATE
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

CREATE POLICY "Only admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Anyone can view published articles"
  ON articles FOR SELECT
  TO anon, authenticated
  USING (published_at IS NOT NULL);

CREATE POLICY "Admins can view all articles"
  ON articles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can insert articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update articles"
  ON articles FOR UPDATE
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

CREATE POLICY "Only admins can delete articles"
  ON articles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

INSERT INTO categories (name, slug, color) VALUES
  ('Política', 'politica', '#EF4444'),
  ('Economía', 'economia', '#10B981'),
  ('Deportes', 'deportes', '#F59E0B'),
  ('Cultura', 'cultura', '#8B5CF6'),
  ('Tecnología', 'tecnologia', '#06B6D4'),
  ('Sociedad', 'sociedad', '#EC4899')
ON CONFLICT (name) DO NOTHING;
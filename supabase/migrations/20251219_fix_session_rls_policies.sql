-- Fix RLS policies to handle session persistence correctly
-- This migration simplifies admin checks and ensures they work after tab switching

-- PASO 1: Eliminar TODAS las políticas que usan la función is_admin()
DROP POLICY IF EXISTS "Anyone can view published articles" ON articles;
DROP POLICY IF EXISTS "Admins can view all articles" ON articles;
DROP POLICY IF EXISTS "Only admins can insert articles" ON articles;
DROP POLICY IF EXISTS "Only admins can update articles" ON articles;
DROP POLICY IF EXISTS "Only admins can delete articles" ON articles;
DROP POLICY IF EXISTS "Only admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- PASO 2: Ahora sí podemos eliminar la función is_admin
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- Create a helper function to check if user is admin (with better caching)
CREATE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(is_admin, false)
    FROM profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- PASO 3: Recrear políticas de artículos con la nueva función
CREATE POLICY "articles_select_public"
  ON articles FOR SELECT
  TO anon, authenticated
  USING (published_at IS NOT NULL OR is_admin());

CREATE POLICY "articles_insert_admin"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "articles_update_admin"
  ON articles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "articles_delete_admin"
  ON articles FOR DELETE
  TO authenticated
  USING (is_admin());

-- PASO 4: Recrear políticas de categorías (ya las eliminamos arriba)
CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  TO authenticated
  USING (is_admin());

-- PASO 5: Recrear política de profiles si existía
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

-- PASO 6: Add index to speed up admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(id, is_admin) WHERE is_admin = true;

-- Add comment explaining the fix
COMMENT ON FUNCTION is_admin() IS 'Helper function to check admin status with STABLE caching for better performance after tab switches';

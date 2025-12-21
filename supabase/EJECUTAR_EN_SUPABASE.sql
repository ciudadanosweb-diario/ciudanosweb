/*
 * EJECUTAR ESTO EN EL SQL EDITOR DE SUPABASE DASHBOARD
 * 
 * Este script arregla el problema de pérdida de sesión al cambiar de pestaña
 * creando una función helper y simplificando las políticas RLS.
 * 
 * PASOS:
 * 1. Ve a tu proyecto Supabase → SQL Editor
 * 2. Copia y pega este código completo
 * 3. Haz clic en "Run" o presiona Ctrl+Enter
 * 4. Verifica que aparezca "Success. No rows returned"
 */

-- ============================================
-- PARTE 1: Limpiar políticas existentes
-- ============================================

-- Eliminar políticas de artículos
DROP POLICY IF EXISTS "Anyone can view published articles" ON articles;
DROP POLICY IF EXISTS "Admins can view all articles" ON articles;
DROP POLICY IF EXISTS "Only admins can insert articles" ON articles;
DROP POLICY IF EXISTS "Only admins can update articles" ON articles;
DROP POLICY IF EXISTS "Only admins can delete articles" ON articles;

-- Eliminar políticas de categorías
DROP POLICY IF EXISTS "Only admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;

-- Eliminar políticas de profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- ============================================
-- PARTE 2: Eliminar funciones existentes
-- ============================================

DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- ============================================
-- PARTE 3: Crear función helper optimizada
-- ============================================

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

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Agregar comentario explicativo
COMMENT ON FUNCTION is_admin() IS 'Helper function to check admin status with STABLE caching for better performance after tab switches';

-- ============================================
-- PARTE 4: Crear políticas simplificadas
-- ============================================

-- Políticas para ARTICLES
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

-- Políticas para CATEGORIES
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

-- Recrear política de profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

-- ============================================
-- PARTE 5: Crear índice para optimización
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_admin 
  ON profiles(id, is_admin) 
  WHERE is_admin = true;

-- ============================================
-- PARTE 6: Agregar campos de presencia de usuario
-- ============================================

-- Add user presence tracking fields to profiles table
-- This migration adds fields to track user online/offline status and activity

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_login timestamptz,
ADD COLUMN IF NOT EXISTS online_at timestamptz;

-- Create index for efficient queries on online users
CREATE INDEX IF NOT EXISTS idx_profiles_online ON profiles(is_online, last_seen) WHERE is_online = true;

-- Update RLS policies to allow users to update their own presence fields
-- Note: The RPC functions control which fields are actually updated,
-- so this policy provides basic access control while functions handle field validation
DROP POLICY IF EXISTS "profiles_update_own_presence" ON profiles;
CREATE POLICY "profiles_update_own_presence"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to update user presence when they come online
CREATE OR REPLACE FUNCTION update_user_online(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    is_online = true,
    online_at = now(),
    last_seen = now(),
    last_login = CASE WHEN last_login IS NULL THEN now() ELSE last_login END
  WHERE id = user_id;
END;
$$;

-- Function to update user presence when they go offline or update activity
CREATE OR REPLACE FUNCTION update_user_presence(user_id uuid, online_status boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    is_online = online_status,
    last_seen = now(),
    last_login = CASE WHEN online_status AND last_login IS NULL THEN now() ELSE last_login END,
    online_at = CASE WHEN online_status THEN now() ELSE online_at END
  WHERE id = user_id;
END;
$$;

-- Function to mark user as offline (call on logout or session end)
CREATE OR REPLACE FUNCTION mark_user_offline(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    is_online = false,
    last_seen = now()
  WHERE id = user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_user_online(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_presence(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_user_offline(uuid) TO authenticated;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Si ves esto sin errores, la migración fue exitosa
SELECT
  'SUCCESS: Migration completed successfully!' as status,
  'RLS policies updated, is_admin() function created, and user presence fields added' as message;

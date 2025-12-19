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
-- VERIFICACIÓN
-- ============================================

-- Si ves esto sin errores, la migración fue exitosa
SELECT 
  'SUCCESS: Migration completed successfully!' as status,
  'RLS policies updated and is_admin() function created' as message;

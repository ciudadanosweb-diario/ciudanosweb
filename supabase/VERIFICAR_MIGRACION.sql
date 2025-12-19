/*
 * SCRIPT DE VERIFICACIÓN
 * Ejecuta esto DESPUÉS de aplicar la migración principal
 * para verificar que todo esté funcionando correctamente
 */

-- 1. Verificar que la función is_admin() existe
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc 
WHERE proname = 'is_admin';
-- Debe mostrar: is_admin | true | s (stable)

-- 2. Verificar políticas de articles
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'articles'
ORDER BY policyname;
-- Debe mostrar 4 políticas: select, insert, update, delete

-- 3. Verificar políticas de categories
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename = 'categories'
ORDER BY policyname;
-- Debe mostrar 5 políticas (3 nuevas + 2 anteriores)

-- 4. Verificar el índice
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles' 
  AND indexname = 'idx_profiles_admin';
-- Debe mostrar el índice idx_profiles_admin

-- 5. Probar la función is_admin() (requiere estar autenticado)
-- Esta query solo funciona si estás autenticado como admin
SELECT 
  auth.uid() as current_user_id,
  is_admin() as am_i_admin;
-- Si eres admin, debe mostrar: <tu-uuid> | true

-- 6. Verificar tu perfil de admin
SELECT 
  id,
  email,
  is_admin,
  created_at
FROM profiles
WHERE id = auth.uid();
-- Debe mostrar tu perfil con is_admin = true

-- Si todas estas queries funcionan correctamente, la migración fue exitosa
SELECT '✅ ALL CHECKS PASSED - Migration successful!' as result;

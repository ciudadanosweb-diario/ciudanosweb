-- Verificación de la migración de campos de presencia de usuario
-- Fecha: Diciembre 20, 2025
-- Ejecutar DESPUÉS de haber corrido la migración

-- 1. Verificar que los campos se agregaron correctamente
SELECT
  'Campos agregados:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('is_online', 'last_seen', 'last_login', 'online_at')
ORDER BY column_name;

-- 2. Verificar que las funciones se crearon
SELECT
  'Funciones creadas:' as info,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('update_user_online', 'update_user_presence', 'mark_user_offline')
AND routine_schema = 'public';

-- 3. Verificar que el índice se creó
SELECT
  'Índice creado:' as info,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
AND indexname = 'idx_profiles_online';

-- 4. Verificar políticas RLS
SELECT
  'Políticas RLS:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Verificación final
SELECT
  CASE
    WHEN (
      SELECT COUNT(*) FROM information_schema.columns
      WHERE table_name = 'profiles'
      AND column_name IN ('is_online', 'last_seen', 'last_login', 'online_at')
    ) = 4
    AND (
      SELECT COUNT(*) FROM information_schema.routines
      WHERE routine_name IN ('update_user_online', 'update_user_presence', 'mark_user_offline')
      AND routine_schema = 'public'
    ) = 3
    AND EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'profiles' AND indexname = 'idx_profiles_online'
    )
    THEN 'SUCCESS: All presence fields, functions, and index created successfully!'
    ELSE 'WARNING: Some components may be missing. Check the results above.'
  END as verification_status;
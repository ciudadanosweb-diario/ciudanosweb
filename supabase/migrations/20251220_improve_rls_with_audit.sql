-- Migración Mejorada: Función de Admin y Políticas RLS más robustas
-- Este script mejora la función anterior con verificaciones adicionales

-- 1. Verificar que la tabla profiles existe y tiene is_admin
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'is_admin';

-- 2. Actualizar la función is_admin_user con mejor manejo de errores
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id LIMIT 1),
    false
  );
$$;

-- 3. Log de verificación - crear tabla de audit para debugging
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  is_admin_result boolean,
  timestamp timestamp with time zone DEFAULT now(),
  notes jsonb
);

-- 4. Actualizar políticas de articles con mejor logging
DROP POLICY IF EXISTS "Anyone can view published articles" ON articles;
DROP POLICY IF EXISTS "Admins can view all articles" ON articles;
DROP POLICY IF EXISTS "Admins can insert articles" ON articles;
DROP POLICY IF EXISTS "Admins can update articles" ON articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON articles;

-- Política pública: Ver artículos publicados
CREATE POLICY "Anyone can view published articles"
ON articles FOR SELECT
TO anon, authenticated
USING (published_at IS NOT NULL);

-- Política admin: Ver todos los artículos
CREATE POLICY "Admins can view all articles"
ON articles FOR SELECT
TO authenticated
USING (
  public.is_admin_user(auth.uid())
);

-- Política admin: Insertar artículos
CREATE POLICY "Admins can insert articles"
ON articles FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_user(auth.uid())
);

-- Política admin: Actualizar artículos
CREATE POLICY "Admins can update articles"
ON articles FOR UPDATE
TO authenticated
USING (
  public.is_admin_user(auth.uid())
)
WITH CHECK (
  public.is_admin_user(auth.uid())
);

-- Política admin: Eliminar artículos
CREATE POLICY "Admins can delete articles"
ON articles FOR DELETE
TO authenticated
USING (
  public.is_admin_user(auth.uid())
);

-- 5. Actualizar políticas de ads
DROP POLICY IF EXISTS "Anyone can view active ads" ON ads;
DROP POLICY IF EXISTS "Admins can view all ads" ON ads;
DROP POLICY IF EXISTS "Only admins can insert ads" ON ads;
DROP POLICY IF EXISTS "Only admins can update ads" ON ads;
DROP POLICY IF EXISTS "Only admins can delete ads" ON ads;

-- Política pública: Ver anuncios activos
CREATE POLICY "Anyone can view active ads"
ON ads FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Política admin: Ver todos los anuncios
CREATE POLICY "Admins can view all ads"
ON ads FOR SELECT
TO authenticated
USING (
  public.is_admin_user(auth.uid())
);

-- Política admin: Insertar anuncios
CREATE POLICY "Only admins can insert ads"
ON ads FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_user(auth.uid())
);

-- Política admin: Actualizar anuncios
CREATE POLICY "Only admins can update ads"
ON ads FOR UPDATE
TO authenticated
USING (
  public.is_admin_user(auth.uid())
)
WITH CHECK (
  public.is_admin_user(auth.uid())
);

-- Política admin: Eliminar anuncios
CREATE POLICY "Only admins can delete ads"
ON ads FOR DELETE
TO authenticated
USING (
  public.is_admin_user(auth.uid())
);

-- 6. Actualizar políticas de profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Política: Ver propio perfil
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política admin: Ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  public.is_admin_user(auth.uid())
);

-- Política: Actualizar propio perfil
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política admin: Actualizar cualquier perfil
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  public.is_admin_user(auth.uid())
)
WITH CHECK (
  public.is_admin_user(auth.uid())
);

-- 7. Permisos en la función
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated, anon, service_role;

-- 8. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_id_is_admin ON public.profiles(id, is_admin);

-- 9. Verificación final: Asegurar que hay al menos un admin
-- (Esto es para debugging, comentar después de verificar)
-- SELECT 'Current admins:' as info, COUNT(*) as count FROM public.profiles WHERE is_admin = true;

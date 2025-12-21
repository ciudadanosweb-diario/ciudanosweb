-- Mejora de RLS: Función de verificación de admin para mejor rendimiento entre tabs
-- Este script crea una función que cachea mejor el resultado de verificación de admin

-- 1. Crear función is_admin_user() que se reutiliza en todas las políticas
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = user_id),
    false
  );
$$;

-- 2. Actualizar políticas de articles para usar la función
DROP POLICY IF EXISTS "Anyone can view published articles" ON articles;
DROP POLICY IF EXISTS "Admins can view all articles" ON articles;
DROP POLICY IF EXISTS "Authors can update their own articles" ON articles;
DROP POLICY IF EXISTS "Admins can insert articles" ON articles;
DROP POLICY IF EXISTS "Admins can update articles" ON articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON articles;

-- Ver todos los artículos publicados
CREATE POLICY "Anyone can view published articles"
ON articles FOR SELECT
TO anon, authenticated
USING (published_at IS NOT NULL);

-- Admins pueden ver todos los artículos
CREATE POLICY "Admins can view all articles"
ON articles FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Admins pueden insertar artículos
CREATE POLICY "Admins can insert articles"
ON articles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user(auth.uid()));

-- Admins pueden actualizar artículos
CREATE POLICY "Admins can update articles"
ON articles FOR UPDATE
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Admins pueden eliminar artículos
CREATE POLICY "Admins can delete articles"
ON articles FOR DELETE
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- 3. Actualizar políticas de ads para usar la función
DROP POLICY IF EXISTS "Anyone can view active ads" ON ads;
DROP POLICY IF EXISTS "Admins can view all ads" ON ads;
DROP POLICY IF EXISTS "Only admins can insert ads" ON ads;
DROP POLICY IF EXISTS "Only admins can update ads" ON ads;
DROP POLICY IF EXISTS "Only admins can delete ads" ON ads;

-- Ver anuncios activos
CREATE POLICY "Anyone can view active ads"
ON ads FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admins pueden ver todos los anuncios
CREATE POLICY "Admins can view all ads"
ON ads FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Solo admins pueden insertar anuncios
CREATE POLICY "Only admins can insert ads"
ON ads FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user(auth.uid()));

-- Solo admins pueden actualizar anuncios
CREATE POLICY "Only admins can update ads"
ON ads FOR UPDATE
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Solo admins pueden eliminar anuncios
CREATE POLICY "Only admins can delete ads"
ON ads FOR DELETE
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- 4. Actualizar políticas de profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins pueden actualizar cualquier perfil
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- 5. Asegurar que la función es segura y eficiente
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated, anon;

-- 6. Crear índice en is_admin si no existe (mejora rendimiento)
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

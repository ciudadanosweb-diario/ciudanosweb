-- Solución definitiva: RPC Functions para guardar artículos
-- Esto evita problemas de RLS policies que fallan entre cambios de contexto

-- 1. Crear función RPC para insertar artículos (solo admins)
CREATE OR REPLACE FUNCTION public.rpc_insert_article(
  p_title text,
  p_subtitle text,
  p_content text,
  p_excerpt text,
  p_category_id uuid,
  p_image_url text,
  p_is_featured boolean,
  p_published_at timestamp with time zone,
  p_author_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_article_id uuid;
  v_result jsonb;
BEGIN
  -- Verificar que el usuario es admin
  SELECT is_admin INTO v_is_admin FROM public.profiles 
  WHERE id = auth.uid() LIMIT 1;
  
  IF NOT COALESCE(v_is_admin, false) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No tienes permisos para crear artículos',
      'code', 'PERMISSION_DENIED'
    );
  END IF;

  -- Insertar artículo
  INSERT INTO public.articles (
    title, subtitle, content, excerpt, 
    category_id, image_url, is_featured, 
    published_at, author_id
  ) VALUES (
    p_title, p_subtitle, p_content, p_excerpt,
    p_category_id, p_image_url, p_is_featured,
    p_published_at, p_author_id
  )
  RETURNING id INTO v_article_id;

  RETURN jsonb_build_object(
    'success', true,
    'article_id', v_article_id,
    'message', 'Artículo creado exitosamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$;

-- 2. Crear función RPC para actualizar artículos (solo admins)
CREATE OR REPLACE FUNCTION public.rpc_update_article(
  p_article_id uuid,
  p_title text,
  p_subtitle text,
  p_content text,
  p_excerpt text,
  p_category_id uuid,
  p_image_url text,
  p_is_featured boolean,
  p_published_at timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_result jsonb;
BEGIN
  -- Verificar que el usuario es admin
  SELECT is_admin INTO v_is_admin FROM public.profiles 
  WHERE id = auth.uid() LIMIT 1;
  
  IF NOT COALESCE(v_is_admin, false) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No tienes permisos para actualizar artículos',
      'code', 'PERMISSION_DENIED'
    );
  END IF;

  -- Verificar que el artículo existe
  IF NOT EXISTS (SELECT 1 FROM public.articles WHERE id = p_article_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El artículo no existe',
      'code', 'NOT_FOUND'
    );
  END IF;

  -- Actualizar artículo
  UPDATE public.articles SET
    title = p_title,
    subtitle = p_subtitle,
    content = p_content,
    excerpt = p_excerpt,
    category_id = p_category_id,
    image_url = p_image_url,
    is_featured = p_is_featured,
    published_at = p_published_at,
    updated_at = now()
  WHERE id = p_article_id;

  RETURN jsonb_build_object(
    'success', true,
    'article_id', p_article_id,
    'message', 'Artículo actualizado exitosamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$;

-- 3. Dar permisos para ejecutar las funciones
GRANT EXECUTE ON FUNCTION public.rpc_insert_article(text, text, text, text, uuid, text, boolean, timestamp with time zone, uuid) 
  TO authenticated;

GRANT EXECUTE ON FUNCTION public.rpc_update_article(uuid, text, text, text, text, uuid, text, boolean, timestamp with time zone) 
  TO authenticated;

-- 4. Simplificar las políticas RLS para artículos (sin verificaciones complejas)
DROP POLICY IF EXISTS "Anyone can view published articles" ON articles;
DROP POLICY IF EXISTS "Admins can view all articles" ON articles;
DROP POLICY IF EXISTS "Admins can insert articles" ON articles;
DROP POLICY IF EXISTS "Admins can update articles" ON articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON articles;

-- Solo permitir lectura de artículos publicados
CREATE POLICY "Anyone can view published articles"
ON articles FOR SELECT
TO anon, authenticated
USING (published_at IS NOT NULL);

-- Admins pueden ver TODOS los artículos
CREATE POLICY "Admins can view all articles"
ON articles FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Insertar/Actualizar/Eliminar SOLO a través de RPC functions
-- Esto previene acceso directo sin verificación
DROP POLICY IF EXISTS "Prevent direct insert on articles" ON articles;
DROP POLICY IF EXISTS "Prevent direct update on articles" ON articles;
DROP POLICY IF EXISTS "Prevent direct delete on articles" ON articles;

-- Permitir operaciones directas para admins en lugar de solo RPC
DROP POLICY IF EXISTS "Prevent direct insert on articles" ON articles;
DROP POLICY IF EXISTS "Prevent direct update on articles" ON articles;
DROP POLICY IF EXISTS "Prevent direct delete on articles" ON articles;

-- Permitir inserciones directas para admins
CREATE POLICY "Admins can insert articles directly"
ON articles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Permitir actualizaciones directas para admins
CREATE POLICY "Admins can update articles directly"
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

-- Permitir eliminaciones directas para admins
CREATE POLICY "Admins can delete articles directly"
ON articles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 5. Crear función auxiliar para verificar admin (simplificada)
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_is_admin() 
  TO authenticated, anon;

-- 6. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_id_is_admin ON public.profiles(id, is_admin);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at);

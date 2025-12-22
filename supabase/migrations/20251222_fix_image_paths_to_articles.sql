-- Migración para normalizar las rutas de imágenes de artículos a 'imagenes'
-- Esta migración actualiza las URLs de las imágenes para que apunten a la carpeta 'imagenes'
-- que es donde están la mayoría de las imágenes en el bucket de Supabase Storage.

-- Actualizar URLs de imágenes en la tabla articles
-- Reemplaza cualquier carpeta después de '/article-images/' con 'imagenes/'
UPDATE articles
SET image_url = regexp_replace(
  image_url,
  '(.*article-images/)[^/]+/',
  '\1imagenes/'
)
WHERE image_url IS NOT NULL
  AND image_url LIKE '%article-images/%'
  AND image_url NOT LIKE '%article-images/imagenes/%';

-- Comentario: Esta migración normaliza todas las URLs a 'imagenes/'
-- La función article-image.mjs intentará primero 'imagenes/', luego 'articles/' si falla
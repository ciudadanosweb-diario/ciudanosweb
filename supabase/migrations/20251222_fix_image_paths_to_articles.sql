-- Migración para actualizar las rutas de imágenes de artículos de 'imagenes' a 'articles'
-- Esta migración actualiza las URLs de las imágenes para que apunten a la carpeta 'articles'
-- en lugar de 'imagenes' en el bucket de Supabase Storage.

-- Actualizar URLs de imágenes en la tabla articles
-- Reemplaza '/imagenes/' con '/articles/' en las URLs
UPDATE articles
SET image_url = replace(image_url, '/imagenes/', '/articles/')
WHERE image_url IS NOT NULL
  AND image_url LIKE '%/imagenes/%';

-- Comentario: Esta migración asume que las imágenes están en la carpeta 'articles/'
-- en el bucket de Supabase Storage. Si no es así, ajusta la carpeta según corresponda.
-- Migración para actualizar las rutas de imágenes de artículos a la carpeta 'imagenes'
-- Esta migración actualiza las URLs de las imágenes que están en carpetas de usuario
-- a la nueva estructura con la carpeta 'imagenes'

-- Actualizar URLs de imágenes en la tabla articles
-- Extrae solo el nombre del archivo (después de la última /) y reconstruye la URL con 'imagenes/'
UPDATE articles
SET image_url = regexp_replace(
  image_url, 
  '(.*article-images/)[^/]+/(.*)', 
  '\1imagenes/\2'
)
WHERE image_url IS NOT NULL 
  AND image_url LIKE '%article-images/%'
  AND image_url NOT LIKE '%article-images/imagenes/%';

-- Comentario: Esta migración asume que las imágenes físicamente ya han sido movidas
-- a la carpeta 'imagenes/' en el bucket de Supabase Storage.
-- Si las imágenes aún no se han movido, deberás hacerlo manualmente desde el panel
-- de Supabase Storage antes de ejecutar esta migración.

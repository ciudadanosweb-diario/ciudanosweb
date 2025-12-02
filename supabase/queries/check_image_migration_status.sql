-- Query para ver todas las URLs de imágenes actuales en los artículos
-- Ejecuta esto en el SQL Editor de Supabase para ver qué imágenes necesitan migración

SELECT 
  id,
  title,
  image_url,
  CASE 
    WHEN image_url LIKE '%article-images/imagenes/%' THEN '✅ Ya migrada'
    WHEN image_url LIKE '%article-images/%' THEN '⚠️ Necesita migración'
    ELSE '❌ URL inválida'
  END as estado_migracion
FROM articles
WHERE image_url IS NOT NULL
ORDER BY created_at DESC;

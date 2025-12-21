/*
  # Simplificación: Cambiar categorías de tabla a ENUM

  ## Cambios

  1. Crear tipo ENUM con todas las categorías
  2. Agregar columna 'category' a articles
  3. Migrar datos de category_id a category usando los nombres
  4. Eliminar columna category_id
  5. Eliminar funciones RPC innecesarias
  6. Eliminar tabla categories
  
  ## Categorías incluidas
  
  - adultos-mayores
  - cultura
  - deportes
  - economia
  - educacion
  - efemerides
  - espectaculos
  - la-banda
  - locales
  - mujer
  - ninez
  - obras
  - politica
  - religion
  - salud
  - sociedad
  - tecnologia
  - transporte
*/

-- PASO 1: Crear tipo ENUM con todas las categorías
CREATE TYPE article_category AS ENUM (
  'adultos-mayores',
  'cultura',
  'deportes',
  'economia',
  'educacion',
  'efemerides',
  'espectaculos',
  'la-banda',
  'locales',
  'mujer',
  'ninez',
  'obras',
  'politica',
  'religion',
  'salud',
  'sociedad',
  'tecnologia',
  'transporte'
);

-- PASO 2: Agregar columna 'category' a articles
ALTER TABLE articles 
ADD COLUMN category article_category;

-- PASO 3: Migrar datos de category_id a category usando mapeo de UUIDs a slugs
UPDATE articles SET category = 'adultos-mayores' WHERE category_id = '09d945d5-e58c-43b3-ab84-a980354ffde4';
UPDATE articles SET category = 'cultura' WHERE category_id = '259650f0-8425-48b8-9499-2914cfeea2cc';
UPDATE articles SET category = 'deportes' WHERE category_id = 'bb7508e7-53ec-438a-8ad7-e4cb0ca479e4';
UPDATE articles SET category = 'economia' WHERE category_id = '98b9f292-8909-4ef5-a1a1-ccceace36d1e';
UPDATE articles SET category = 'educacion' WHERE category_id = 'c67a076d-35b0-4781-a261-b47c897284e1';
UPDATE articles SET category = 'efemerides' WHERE category_id = '0e557acc-5c4f-4fc4-be6d-5024954cd234';
UPDATE articles SET category = 'espectaculos' WHERE category_id = '0699eb6e-191b-4c5b-aa0f-4d6cdfbbbc83';
UPDATE articles SET category = 'la-banda' WHERE category_id = '64b85745-73be-4377-b10f-02937d2c457f';
UPDATE articles SET category = 'locales' WHERE category_id = 'fbe71183-a71e-4490-84af-f2163e26395f';
UPDATE articles SET category = 'mujer' WHERE category_id = '4fa1154b-b5c3-4dbb-9378-49bf4c366ea3';
UPDATE articles SET category = 'ninez' WHERE category_id IN ('36343d6c-430e-4ad7-8df9-b5d649edf5da', 'e9bbbe37-37f9-4e01-9e18-68f2dc3fd120');
UPDATE articles SET category = 'obras' WHERE category_id = '97ab8834-2654-4d0d-b67e-6bfe06ad3de5';
UPDATE articles SET category = 'politica' WHERE category_id = 'c387e63d-1865-4263-b817-0e2405c3b23b';
UPDATE articles SET category = 'religion' WHERE category_id = '0e32923e-6443-4eb5-a073-b6800ea1d0ae';
UPDATE articles SET category = 'salud' WHERE category_id = '3c85bbf5-676d-4e46-b2c9-2ff6648a5199';
UPDATE articles SET category = 'sociedad' WHERE category_id = 'e9b7c492-06b0-410a-b608-47b94f4a556e';
UPDATE articles SET category = 'tecnologia' WHERE category_id = 'dd1d31f3-a5bb-4558-8a42-99dd8017706d';
UPDATE articles SET category = 'transporte' WHERE category_id = '08535314-0bbc-483d-adde-819ac717385e';

-- PASO 4: Eliminar el índice y la columna category_id
DROP INDEX IF EXISTS idx_articles_category;
ALTER TABLE articles 
DROP COLUMN IF EXISTS category_id;

-- PASO 5: Crear índice para la nueva columna category
CREATE INDEX idx_articles_category ON articles(category);

-- PASO 6: Eliminar funciones RPC si existen
DROP FUNCTION IF EXISTS public.rpc_insert_article(text, text, text, text, uuid, text, boolean, timestamp with time zone, uuid);
DROP FUNCTION IF EXISTS public.rpc_update_article(uuid, text, text, text, text, uuid, text, boolean, timestamp with time zone);

-- PASO 7: Eliminar políticas de la tabla categories antes de eliminarla
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Only admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;
DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
DROP POLICY IF EXISTS "categories_update_admin" ON categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON categories;

-- PASO 8: Eliminar tabla categories ya que ahora es un ENUM
DROP TABLE IF EXISTS categories;

-- Agregar comentario explicativo
COMMENT ON TYPE article_category IS 'Categorías fijas para artículos - más simple y sin JOINs innecesarios';
COMMENT ON COLUMN articles.category IS 'Categoría del artículo usando ENUM para mayor simplicidad';

-- Crear tabla categories para gestión dinámica
-- Fecha: 2026-01-11

-- Crear tabla categories
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#14b8a6', -- teal-500
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_active ON categories(is_active);

-- Políticas RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden gestionar categorías
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert categories" ON categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update categories" ON categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete categories" ON categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insertar categorías existentes
INSERT INTO categories (name, slug, description, color, sort_order) VALUES
  ('Adultos Mayores', 'adultos-mayores', 'Noticias sobre adultos mayores', '#14b8a6', 1),
  ('Cultura', 'cultura', 'Arte, cultura y entretenimiento', '#14b8a6', 2),
  ('Deportes', 'deportes', 'Deportes y competiciones', '#14b8a6', 3),
  ('Economía', 'economia', 'Economía, finanzas y negocios', '#14b8a6', 4),
  ('Educación', 'educacion', 'Educación y formación', '#14b8a6', 5),
  ('Efemérides', 'efemerides', 'Efemérides y fechas importantes', '#14b8a6', 6),
  ('Espectáculos', 'espectaculos', 'Espectáculos y entretenimiento', '#14b8a6', 7),
  ('La Banda', 'la-banda', 'Noticias de La Banda', '#14b8a6', 8),
  ('Locales', 'locales', 'Noticias locales', '#14b8a6', 9),
  ('Mujer', 'mujer', 'Noticias sobre la mujer', '#14b8a6', 10),
  ('Niñez', 'ninez', 'Noticias sobre la niñez', '#14b8a6', 11),
  ('Obras', 'obras', 'Obras públicas e infraestructura', '#14b8a6', 12),
  ('Política', 'politica', 'Noticias políticas locales e internacionales', '#14b8a6', 13),
  ('Religión', 'religion', 'Religión y espiritualidad', '#14b8a6', 14),
  ('Salud', 'salud', 'Salud y bienestar', '#14b8a6', 15),
  ('Servicios', 'servicios', 'Servicios públicos y comunitarios', '#14b8a6', 16),
  ('Sociedad', 'sociedad', 'Temas sociales y comunidad', '#14b8a6', 17),
  ('Tecnología', 'tecnologia', 'Tecnología e innovación', '#14b8a6', 18),
  ('Transporte', 'transporte', 'Transporte público y movilidad', '#14b8a6', 19);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Permitir operaciones directas en artículos para admins
-- Fecha: 2025-12-21

-- Eliminar políticas restrictivas
DROP POLICY IF EXISTS "Prevent direct insert on articles" ON articles;
DROP POLICY IF EXISTS "Prevent direct update on articles" ON articles;
DROP POLICY IF EXISTS "Prevent direct delete on articles" ON articles;

-- Permitir operaciones directas para administradores
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
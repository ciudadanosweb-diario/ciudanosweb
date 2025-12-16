# Solución al Error de RLS en Publicidades e Imágenes

## Problema
Error: `new row violates row-level security policy` al intentar:
- Insertar, actualizar o eliminar publicidades
- Subir imágenes de artículos o publicidades

## Causa
Las políticas de RLS (Row Level Security) están verificando incorrectamente los permisos:
- En la tabla `ads`: verifica `auth.role()` en lugar de `profiles.is_admin`
- En storage buckets: no verifican correctamente que el usuario sea administrador

## Solución

Ejecuta la migración SQL actualizada que corrige todas las políticas RLS.

### Opción 1: Desde el SQL Editor de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Copia y pega el contenido completo del archivo: `supabase/migrations/20251202_fix_ads_rls_policies.sql`
4. Ejecuta la consulta

### Opción 2: Usar la CLI de Supabase

Si tienes la CLI de Supabase instalada:

```bash
cd /workspaces/ciudanosweb
supabase db push
```

## ⚠️ IMPORTANTE: Verificar que eres Admin

Antes de usar las funciones de administrador, asegúrate de que tu usuario tenga permisos de admin:

```sql
SELECT id, email, is_admin 
FROM profiles 
WHERE email = 'tu-email@ejemplo.com';
```

Si `is_admin` es `false`, actualízalo:

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'tu-email@ejemplo.com';
```

## Políticas Actualizadas

### Tabla `ads`
- ✅ Usuarios anónimos pueden ver publicidades activas
- ✅ Solo administradores pueden ver todas las publicidades
- ✅ Solo administradores pueden crear publicidades
- ✅ Solo administradores pueden editar publicidades
- ✅ Solo administradores pueden eliminar publicidades

### Storage: Bucket `article-images`
- ✅ Todos pueden ver imágenes de artículos (público)
- ✅ Solo administradores pueden subir imágenes de artículos
- ✅ Solo administradores pueden actualizar imágenes de artículos
- ✅ Solo administradores pueden eliminar imágenes de artículos

### Storage: Bucket `ads`
- ✅ Todos pueden ver imágenes de publicidades (público)
- ✅ Solo administradores pueden subir imágenes de publicidades
- ✅ Solo administradores pueden actualizar imágenes de publicidades
- ✅ Solo administradores pueden eliminar imágenes de publicidades

## Verificación de Admin

La migración corrige todas las políticas para verificar correctamente:

```sql
EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.is_admin = true
)
```

## Pasos Post-Migración

1. Ejecutar la migración SQL
2. Verificar que tu usuario sea admin
3. Cerrar sesión en la aplicación
4. Volver a iniciar sesión
5. Probar crear/editar artículos y publicidades
6. Probar subir imágenes

## Solución de Problemas

### Si sigues viendo errores de RLS:

1. Verifica que las políticas se aplicaron correctamente:
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('ads', 'articles', 'categories')
ORDER BY tablename, policyname;
```

2. Verifica las políticas de storage:
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
```

3. Confirma que RLS está habilitado:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('ads', 'articles', 'categories');
```

### Si los buckets no existen:

```sql
SELECT id, name, public 
FROM storage.buckets 
WHERE id IN ('article-images', 'ads');
```

Si no aparecen, la migración los creará automáticamente.

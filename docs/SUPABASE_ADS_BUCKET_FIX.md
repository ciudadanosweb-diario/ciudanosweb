# Reparación de Bucket de Ads en Supabase

## Problema
Las imágenes en el bucket `ads` de Supabase Storage retornan error 500, aunque las URLs parecen ser correctas.

## Causa
La configuración RLS (Row Level Security) del bucket puede tener políticas conflictivas o incompletas.

## Solución

### Opción 1: Ejecutar migración SQL (Recomendado)
1. Ve a tu proyecto en Supabase: https://app.supabase.com/projects
2. Selecciona el proyecto `wmuunmfwdqifpbbucnmz`
3. Ve a **SQL Editor** en el sidebar
4. Haz click en "New Query"
5. Copia el contenido de este archivo:
   ```
   supabase/migrations/20251118_fix_ads_bucket_configuration.sql
   ```
6. Ejecuta la query (Ctrl+Enter o Cmd+Enter)

### Opción 2: Usar Supabase CLI
Si tienes Supabase CLI instalado:
```bash
supabase migration up --project-id wmuunmfwdqifpbbucnmz
```

## Verificación
Después de ejecutar la migración, verifica que:
1. El bucket `ads` existe y es público
2. Las políticas RLS están configuradas correctamente
3. Las imágenes se cargan sin error 500

Para verificar en Supabase Dashboard:
1. Ve a **Storage** → **ads**
2. Ve a la pestaña **Policies**
3. Deberías ver 4 políticas:
   - `ads_public_read` (SELECT para público)
   - `ads_authenticated_insert` (INSERT para autenticados)
   - `ads_authenticated_update` (UPDATE para autenticados)
   - `ads_authenticated_delete` (DELETE para autenticados)

## Cambios en el código
También se actualizó `AdsManager.tsx` para generar URLs más robustas que incluyen parámetros de transformación.

## Si persiste el problema
1. Verifica que tu anon key tenga permisos suficientes en Supabase Settings
2. Comprueba que el bucket `ads` existe en Storage
3. Intenta eliminar todas las políticas y crear nuevas desde cero en el Supabase Dashboard

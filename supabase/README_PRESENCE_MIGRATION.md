# Migración: Campos de Presencia de Usuario

Esta migración agrega campos para rastrear el estado online/offline de los usuarios en la tabla `profiles`.

## Campos Agregados

- `is_online` (boolean): Indica si el usuario está actualmente online
- `last_seen` (timestamptz): Última actividad del usuario
- `last_login` (timestamptz): Fecha del último inicio de sesión
- `online_at` (timestamptz): Cuando el usuario se conectó por última vez

## Cómo Ejecutar

### Opción 1: Script Completo (Recomendado)
Ejecutar `supabase/MIGRAR_PRESENCE_COMPLETA.sql` en Supabase SQL Editor.

### Opción 2: Verificación por Separado
1. Ejecutar `supabase/migrations/20251220_add_user_presence_fields.sql`
2. Ejecutar `supabase/VERIFICAR_PRESENCE_MIGRATION.sql` para verificar

### Opción 3: Usar EJECUTAR_EN_SUPABASE.sql
Si estás ejecutando todas las migraciones, ya está incluido en `supabase/EJECUTAR_EN_SUPABASE.sql`.

## Funciones Creadas

- `update_user_online(user_id)`: Marca usuario como online
- `update_user_presence(user_id, online_status)`: Actualiza presencia
- `mark_user_offline(user_id)`: Marca usuario como offline

## Seguridad

- Políticas RLS actualizadas para permitir actualizaciones de presencia
- Funciones usan `SECURITY DEFINER` para control preciso de campos
- Solo usuarios autenticados pueden ejecutar las funciones

## Verificación

Después de ejecutar, deberías ver:
- 4 nuevos campos en `profiles`
- 3 nuevas funciones
- 1 nuevo índice
- 1 nueva política RLS</content>
<parameter name="filePath">/workspaces/ciudanosweb/supabase/README_PRESENCE_MIGRATION.md
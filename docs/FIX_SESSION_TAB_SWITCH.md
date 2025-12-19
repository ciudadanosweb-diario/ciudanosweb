# FIX: Pérdida de Sesión al Cambiar de Pestaña

## Problema
Al cambiar de pestaña o ventana mientras se edita un artículo, la sesión se pierde y no se puede guardar el artículo. Esto ocurre porque las políticas RLS realizan verificaciones complejas que fallan cuando `auth.uid()` no está correctamente disponible después del cambio de contexto.

## Causa Raíz
Las políticas RLS estaban usando subconsultas repetidas para verificar si el usuario es admin:
```sql
EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
```

Estas verificaciones pueden fallar después de cambiar de pestaña porque el contexto de autenticación puede no persistir correctamente.

## Solución Implementada

### 1. Nueva Función Helper `is_admin()`
Creé una función PostgreSQL marcada como `STABLE` y `SECURITY DEFINER` que:
- Cachea mejor el resultado durante la transacción
- Simplifica las políticas RLS
- Mejora el rendimiento

### 2. Políticas RLS Simplificadas
Las políticas ahora usan `is_admin()` en lugar de subconsultas complejas.

### 3. Mejoras en el Cliente Supabase
- Activado modo debug en desarrollo
- Configuración mejorada de persistencia de sesión

### 4. Listeners de Visibilidad
- Detecta cuando vuelves a la pestaña
- Refresca automáticamente el token si está próximo a expirar
- Verifica la sesión antes de cada operación crítica

## Cómo Aplicar

### Opción A: Dashboard de Supabase (Recomendado)
1. Ve a tu proyecto en Supabase Dashboard
2. Abre el SQL Editor
3. Crea una nueva query
4. Copia y pega el contenido de `supabase/migrations/20251219_fix_session_rls_policies.sql`
5. Ejecuta la migración

### Opción B: CLI de Supabase (si lo tienes configurado)
```bash
supabase db push
```

## Verificación

Después de aplicar la migración, verifica que funciona:

1. Inicia sesión en el admin panel
2. Crea un nuevo artículo
3. Sube una imagen
4. **Cambia de pestaña** y espera 30 segundos
5. **Vuelve a la pestaña**
6. Guarda el artículo

Deberías ver en la consola:
```
👁️ Pestaña visible nuevamente, verificando sesión...
⏱️ Token expira en X minutos
✅ Sesión válida, no requiere refresh
💾 Iniciando guardado de artículo...
✅ Artículo guardado exitosamente
```

## Archivos Modificados

1. `/supabase/migrations/20251219_fix_session_rls_policies.sql` - Nueva migración
2. `/src/lib/supabase.ts` - Configuración mejorada del cliente
3. `/src/contexts/AuthContext.tsx` - Listener de visibilidad
4. `/src/pages/ArticleEditPage.tsx` - Verificación de sesión mejorada

## Beneficios

- ✅ Sesión persiste al cambiar de pestaña
- ✅ Token se refresca automáticamente
- ✅ Políticas RLS más eficientes
- ✅ Mejor experiencia de usuario
- ✅ Logs detallados para debugging

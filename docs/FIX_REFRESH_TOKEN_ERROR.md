# Solución al Error de Refresh Token Expirado

## Problema
Error: `Invalid Refresh Token: Refresh Token Not Found` o `JWT expired`

## Causa
El token de refresh de Supabase ha expirado, lo que requiere que el usuario inicie sesión nuevamente.

## Solución Automática

El código ya ha sido actualizado para manejar automáticamente este error:

### ✅ Mejoras Implementadas

1. **Manejo de Errores en AuthContext**:
   - Detecta automáticamente errores de refresh token
   - Limpia el estado local cuando ocurre
   - Registra errores en consola para debugging

2. **Limpieza de Sesión**:
   - Remueve datos de sesión expirados
   - Restablece estado de usuario y perfil
   - Previene bucles de error

## Pasos para Resolver

### Opción 1: Recarga la Página
1. Presiona `Ctrl + R` (o `Cmd + R` en Mac) para recargar la página
2. El sistema detectará automáticamente el token expirado y limpiará la sesión
3. Inicia sesión nuevamente

### Opción 2: Limpieza Manual
1. Abre la consola del navegador (`F12` → `Console`)
2. Ejecuta este comando para limpiar el almacenamiento local:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
3. Recarga la página
4. Inicia sesión nuevamente

### Opción 3: Modo Incógnito
1. Abre una nueva ventana en modo incógnito/privado
2. Ve a tu aplicación
3. Inicia sesión nuevamente

## Prevención

### Configuración de Supabase (Opcional)
Si quieres tokens más duraderos, puedes ajustar la configuración en Supabase:

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Authentication** → **Settings**
3. Ajusta **JWT Expiry** (por defecto 3600 segundos = 1 hora)
4. Ajusta **Refresh Token Expiry** (por defecto 7 días)

## Verificación

Después de aplicar cualquiera de las soluciones:

1. La aplicación debería cargar sin errores de autenticación
2. Si estabas logueado, serás redirigido a la página de login
3. Podrás iniciar sesión normalmente

## Código Actualizado

El `AuthContext` ahora incluye:

```typescript
const handleAuthError = (error: any) => {
  if (error?.message?.includes('Invalid Refresh Token') ||
      error?.message?.includes('Refresh Token Not Found') ||
      error?.message?.includes('JWT expired')) {
    console.warn('Refresh token expired, clearing session');
    clearSession();
    return true; // Error manejado
  }
  return false; // Error no manejado
};
```

Esto asegura que los errores de refresh token sean manejados automáticamente sin romper la aplicación.
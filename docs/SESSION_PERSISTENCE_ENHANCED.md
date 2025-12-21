# Persistencia de Sesión Mejorada - Supabase

## 📋 Resumen

Se ha implementado un sistema robusto de persistencia de sesión que mantiene al usuario autenticado incluso al cambiar de ventana, cerrar y reabrir el navegador, o al perder temporalmente la conexión.

## 🔧 Cambios Implementados

### 1. AuthContext.tsx - Sistema de Respaldo de Sesión

#### Características Principales:

- **Doble Persistencia**: Además del almacenamiento automático de Supabase, se mantiene un backup adicional en `localStorage` con la clave `supabase_session_backup`

- **Rehidratación Inteligente**: Al iniciar la aplicación:
  1. Primero intenta cargar la sesión desde el backup
  2. Si existe, usa `setSession()` para reactivar la sesión en Supabase
  3. Si falla, intenta obtener la sesión existente de Supabase
  4. Si ambos fallan, el usuario permanece sin sesión

- **Recuperación Automática**: Cuando la pestaña vuelve a ser visible:
  - Verifica la sesión actual
  - Si la sesión se perdió, intenta recuperarla desde el backup
  - Actualiza la presencia del usuario

#### Flujo de Trabajo:

```typescript
// 1. INICIALIZACIÓN
useEffect(() => {
  // Intentar rehidratar desde backup
  const storedSession = localStorage.getItem('supabase_session_backup');
  if (storedSession) {
    supabase.auth.setSession({
      access_token: parsedSession.access_token,
      refresh_token: parsedSession.refresh_token
    });
  }
  
  // Listener de cambios de autenticación
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // Guardar backup
      localStorage.setItem('supabase_session_backup', JSON.stringify(session));
    } else {
      // Limpiar backup
      localStorage.removeItem('supabase_session_backup');
    }
  });
}, []);

// 2. RECUPERACIÓN AL VOLVER A LA PESTAÑA
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Intentar recuperar desde backup
      const storedSession = localStorage.getItem('supabase_session_backup');
      if (storedSession) {
        await supabase.auth.setSession(parsedSession);
      }
    }
  }
});
```

### 2. supabase.ts - Configuración Optimizada del Cliente

#### Mejoras:

1. **Configuración Clara**:
   ```typescript
   {
     auth: {
       persistSession: true,        // Persistir sesión automáticamente
       autoRefreshToken: true,      // Refrescar tokens automáticamente
       storage: window.localStorage, // Usar localStorage del navegador
       storageKey: 'sb-ciudanosweb-auth',
       flowType: 'pkce'             // Mayor seguridad
     }
   }
   ```

2. **Sincronización entre Pestañas**:
   - Escucha eventos de `storage` para detectar cambios en otras pestañas
   - Sincroniza automáticamente el estado de sesión

3. **Monitoreo Mejorado**:
   - Logs detallados de todos los eventos de autenticación
   - Verificación periódica de sesión cada 5 minutos
   - Alertas cuando la sesión está por expirar

4. **Eventos Manejados**:
   - `SIGNED_IN`: Usuario inició sesión
   - `SIGNED_OUT`: Usuario cerró sesión
   - `TOKEN_REFRESHED`: Token refrescado automáticamente
   - `USER_UPDATED`: Datos del usuario actualizados
   - `PASSWORD_RECOVERY`: Recuperación de contraseña

### 3. Estado de Sesión Exportado

Ahora el contexto exporta también el objeto `session` completo:

```typescript
const { user, profile, session, loading, isAdmin } = useAuth();

// session contiene:
// - access_token
// - refresh_token  
// - expires_at
// - user (objeto completo del usuario)
```

## 🎯 Ventajas del Sistema

### Persistencia Robusta:
- ✅ Sesión persiste al cambiar de ventana
- ✅ Sesión persiste al cerrar y reabrir el navegador
- ✅ Recuperación automática si se pierde temporalmente la conexión
- ✅ Sincronización entre múltiples pestañas

### Seguridad:
- ✅ Usa PKCE flow para mayor seguridad
- ✅ Tokens se refrescan automáticamente antes de expirar
- ✅ Limpieza automática de datos al cerrar sesión

### Experiencia de Usuario:
- ✅ Usuario no necesita iniciar sesión repetidamente
- ✅ Transiciones suaves entre pestañas
- ✅ Actualizaciones de presencia en tiempo real
- ✅ Feedback claro en la consola (modo desarrollo)

## 🔍 Monitoreo y Debugging

### En Modo Desarrollo:

La consola mostrará información detallada:

```
🔄 Inicializando autenticación...
💾 Sesión encontrada en backup, rehidratando...
✅ Sesión rehidratada exitosamente
🟢 Usuario conectado
📊 Estado de sesión: {
  evento: 'SIGNED_IN',
  usuarioLogueado: true,
  tiempoExpiracion: '50 minutos'
}
```

### Verificación Periódica:

Cada 5 minutos verás:
```
✅ [Session Check] Sesión activa (expira en 50 min)
💓 Heartbeat: actualizando presencia
```

### Al Cambiar de Pestaña:

```
👁️ Pestaña visible nuevamente
✅ Sesión activa detectada
💾 Sesión guardada en backup
```

## 🛡️ Manejo de Errores

### Si la Sesión Falla:

1. **Error al Rehidratar**:
   ```
   ❌ Error al rehidratar sesión: [error]
   ```
   → Se limpia el backup y se intenta obtener sesión de Supabase

2. **Sesión Perdida**:
   ```
   ⚠️ Sesión perdida, intentando recuperar...
   ✅ Sesión recuperada exitosamente
   ```
   → Se intenta recuperar desde backup automáticamente

3. **Token por Expirar**:
   ```
   ⏰ [Session Check] Sesión expira pronto (3 min)
   ```
   → Supabase refrescará el token automáticamente

## 📝 Uso en Componentes

No se requieren cambios en los componentes existentes. El hook `useAuth()` funciona igual:

```typescript
import { useAuth } from './contexts/AuthContext';

function MiComponente() {
  const { user, session, loading, isAdmin } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  if (!user) {
    return <div>No autenticado</div>;
  }
  
  return <div>Bienvenido {user.email}</div>;
}
```

## ⚙️ Configuración de Supabase

No se requiere configuración adicional en el proyecto Supabase. La persistencia funciona con la configuración estándar de autenticación.

### Recomendaciones:

1. **JWT Expiration**: Mantener el valor predeterminado (1 hora)
2. **Refresh Token Rotation**: Habilitar para mayor seguridad
3. **Session Duration**: Puede configurarse según necesidades (predeterminado: 7 días)

## 🚀 Testing

### Pruebas Recomendadas:

1. **Persistencia Básica**:
   - Iniciar sesión
   - Cerrar pestaña
   - Reabrir → Usuario debe seguir autenticado

2. **Cambio de Pestañas**:
   - Iniciar sesión en pestaña A
   - Cambiar a otra aplicación por 10 minutos
   - Volver a pestaña A → Usuario debe seguir autenticado

3. **Múltiples Pestañas**:
   - Abrir 2 pestañas de la aplicación
   - Iniciar sesión en pestaña A
   - Verificar que pestaña B se actualice automáticamente

4. **Recuperación de Sesión**:
   - Iniciar sesión
   - Desconectar internet temporalmente
   - Reconectar → Sesión debe recuperarse

5. **Cierre de Sesión**:
   - Cerrar sesión en pestaña A
   - Verificar que pestaña B también cierre sesión

## 📊 Datos Almacenados

### localStorage Keys:

1. **`sb-ciudanosweb-auth`** (Supabase)
   - Token de acceso
   - Token de refresco
   - Datos del usuario
   - Fecha de expiración

2. **`supabase_session_backup`** (Backup)
   - Copia completa de la sesión
   - Usado para recuperación

### Limpieza:

Ambas claves se eliminan automáticamente al:
- Cerrar sesión
- Fallar la recuperación de sesión
- Token inválido o expirado

## 🔄 Actualización de Versiones Anteriores

Si ya tenías una versión anterior del sistema de autenticación:

1. Los usuarios existentes mantendrán su sesión
2. El backup se creará automáticamente en el próximo inicio de sesión
3. No se requiere migración de datos

## 📚 Referencias

- [Supabase Auth Documentation](https://supabase.com/docs/reference/javascript/auth-session)
- [onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Session Management](https://supabase.com/docs/guides/auth/sessions)

---

**Fecha de Implementación**: 21 de Diciembre, 2025
**Versión**: 2.0 - Sistema de Persistencia Mejorado

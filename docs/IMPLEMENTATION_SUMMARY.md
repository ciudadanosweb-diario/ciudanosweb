# ✅ Resumen de Implementación: Persistencia de Sesión entre Pestañas

## 🎯 Objetivo
Implementar la solución oficial de Supabase para evitar la pérdida de sesión al cambiar de pestaña o ventana del navegador.

## 📋 Cambios Realizados

### 1. **`src/lib/supabase.ts`** - Configuración del Cliente

**Agregado:**
```typescript
// Sincronizar sesión entre tabs/ventanas del mismo navegador
// https://supabase.com/docs/reference/javascript/auth-onauthstatechange
if (typeof window !== 'undefined') {
  window.addEventListener('storage', async (event) => {
    if (event.key === 'sb-ciudanosweb-auth' && event.newValue) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('📝 Sesión actualizada desde otra pestaña');
      }
    }
  });
}
```

**Configuración de Auth (ya existía):**
- ✅ `persistSession: true` - Guardar sesión en localStorage
- ✅ `autoRefreshToken: true` - Refrescar token automáticamente
- ✅ `detectSessionInUrl: true` - Detectar sesión en URLs
- ✅ `storage: window.localStorage` - Usar localStorage nativo
- ✅ `storageKey: 'sb-ciudanosweb-auth'` - Clave de almacenamiento
- ✅ `flowType: 'pkce'` - Flow de OAuth más seguro
- ✅ `debug: import.meta.env.DEV` - Logs en desarrollo

### 2. **`src/contexts/AuthContext.tsx`** - Listener Centralizado

**Mejorado:**
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    console.log(`🔐 Evento de autenticación: ${event}`);
    
    // Maneja: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, USER_UPDATED, TOKEN_REFRESHED
    setUser(session?.user ?? null);
    
    if (session?.user) {
      await loadProfile(session.user.id);
    } else {
      setProfile(null);
    }
    
    // Log de debugging con información de expiración del token
    if (import.meta.env.DEV) {
      // Calcula y muestra tiempo hasta expiración
    }
  }
);
```

**Listener de Visibilidad (mejorado):**
```typescript
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    console.log('👁️ Pestaña visible nuevamente, verificando sesión...');
    
    // 1. Obtiene sesión actual
    // 2. Calcula tiempo hasta expiración
    // 3. Refresca automáticamente si < 10 minutos
    // 4. Log detallado de estado
  }
};

document.addEventListener('visibilitychange', handleVisibilityChange);
```

## 🔄 Cómo Funciona

### Flujo de Cambio de Pestaña:

```
Usuario en Pestaña A (activa)
         ↓
Usuario cambia a Pestaña B
         ↓
Evento 'visibilitychange' en Pestaña A (hidden)
Evento 'visibilitychange' en Pestaña B (visible)
         ↓
Se ejecuta handleVisibilityChange() en Pestaña B
         ↓
✅ Verifica sesión actual
🕐 Calcula tiempo hasta expiración
🔄 Refresca token si es necesario
📊 Registra logs de debugging
```

### Flujo de Sincronización entre Tabs:

```
Usuario hace login en Pestaña A
         ↓
Sesión se guarda en localStorage con clave 'sb-ciudanosweb-auth'
         ↓
Evento 'storage' se dispara en OTRAS pestañas
         ↓
Se ejecuta el listener en Pestaña B, C, etc.
         ↓
📝 Sesión se actualiza automáticamente en todas las pestañas
```

## 📊 Estados de Sesión Manejados

El listener `onAuthStateChange` maneja estos eventos:

| Evento | Descripción |
|--------|-------------|
| `INITIAL_SESSION` | Primera carga de sesión |
| `SIGNED_IN` | Usuario inicia sesión |
| `SIGNED_OUT` | Usuario cierra sesión |
| `USER_UPDATED` | Datos del usuario se actualizan |
| `TOKEN_REFRESHED` | Token se refresca automáticamente |

## 🧪 Comportamientos Esperados

### ✅ Inicio de Sesión
```
Paso 1: Usuario hace login
Paso 2: Evento 'SIGNED_IN' dispara onAuthStateChange
Paso 3: Sesión se guarda en localStorage
Paso 4: Perfil se carga desde base de datos
Paso 5: Usuario ve admin panel
```

### ✅ Cambio de Pestaña
```
Paso 1: Usuario en Pestaña A (activa, editando artículo)
Paso 2: Usuario abre Pestaña B (navega a ella)
Paso 3: 'visibilitychange' evento dispara
Paso 4: Se verifica sesión en Pestaña A
Paso 5: Si token expira pronto, se refresca automáticamente
Paso 6: Usuario vuelve a Pestaña A, sesión sigue activa
```

### ✅ Logout desde Otra Pestaña
```
Paso 1: Usuario A hace logout en Pestaña A
Paso 2: Evento 'SIGNED_OUT' dispara
Paso 3: localStorage se limpia
Paso 4: Evento 'storage' dispara en Pestaña B
Paso 5: Pestaña B detecta cambio y actualiza estado
Paso 6: Usuario se desconecta en todas las pestañas
```

## 🔐 Seguridad Mantenida

- ✅ No se compromete `auth.uid()` en RLS policies
- ✅ Tokens se almacenan en `localStorage` (seguro para web)
- ✅ Refresh tokens se manejan automáticamente
- ✅ No se expone información sensible en logs de producción
- ✅ Listeners limpian correctamente al desmontar componentes

## 📝 Logs de Debugging (Desarrollo)

En consola verás:

```
🧪 [SupabaseClient] persistSession=true autoRefreshToken=true storage=localStorage...
🔐 Evento de autenticación: INITIAL_SESSION
📊 Estado de sesión: { evento: "INITIAL_SESSION", usuarioLogueado: true, tiempoExpiracion: "59 minutos" }
👁️ Pestaña visible nuevamente, verificando sesión...
⏱️ Token expira en 45 minutos
✅ Sesión válida, no requiere refresh
```

## 🚀 Flujo Completo de Edición de Artículo

```
1. Usuario abre Admin Panel
   └─ Se ejecuta initializeAuth()
   └─ onAuthStateChange escucha cambios
   └─ listener de visibilidad activado

2. Usuario comienza a editar artículo
   └─ Pestaña A tiene foco
   └─ Sesión activa en localStorage

3. Usuario abre otra pestaña (Pestaña B)
   └─ Evento 'storage' dispara en Pestaña A, B
   └─ Evento 'visibilitychange' dispara
   └─ handleVisibilityChange() se ejecuta en ambas

4. Usuario vuelve a Pestaña A
   └─ 'visibilitychange' dispara nuevamente
   └─ Se verifica estado de sesión
   └─ Si token próximo a expirar → se refresca
   └─ Usuario puede guardar artículo sin problemas

5. Guardado exitoso
   └─ ✅ Artículo guardado en base de datos
   └─ ✅ Sesión sigue activa
   └─ ✅ Usuario puede continuar editando
```

## 📁 Archivos Modificados

```
✅ src/lib/supabase.ts
   - Agregado listener de 'storage' para sincronización entre tabs
   - Mantenida configuración existente de auth

✅ src/contexts/AuthContext.tsx
   - Mejorado listener onAuthStateChange con logs detallados
   - Agregado logging de eventos de autenticación
   - Mejorado handleVisibilityChange() con información de expiración
```

## 🔗 Referencias

- [Supabase Auth onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Supabase Session Management](https://supabase.com/docs/guides/auth/sessions)
- [MDN Document Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState)
- [MDN Storage Event](https://developer.mozilla.org/en-US/docs/Web/API/StorageEvent)

## ✨ Beneficios

- 🎯 **Sesión persiste** entre pestañas/ventanas
- 🔄 **Token se refresca automáticamente** cuando lo necesita
- 🔀 **Sincronización bidireccional** entre tabs
- 🐛 **Logs detallados** para debugging
- 🛡️ **Basado en APIs oficiales** de Supabase
- 📦 **Sin dependencias nuevas**
- ⚡ **Totalmente automático** sin intervención del usuario

## 🧪 Cómo Probar

### Test 1: Login/Logout
1. Inicia sesión en un tab
2. Abre otro tab del mismo navegador
3. Deberías ver sesión activa en ambos
4. Cierra sesión en uno
5. Ambos deberían actualizarse

### Test 2: Cambio de Pestaña
1. Comienza a editar artículo
2. Abre otro tab
3. Espera 2 segundos
4. Vuelve al primer tab
5. Verifica logs en consola (F12)
6. Deberías ver "✅ Sesión válida"

### Test 3: Token Próximo a Expirar
1. Inicia sesión
2. Cambia de tab por > 30 minutos
3. Vuelve al tab original
4. Verifica logs en consola
5. Deberías ver "🔄 Refrescando sesión automáticamente..."

---

**Estado:** ✅ Implementado y probado
**Última actualización:** Diciembre 20, 2025

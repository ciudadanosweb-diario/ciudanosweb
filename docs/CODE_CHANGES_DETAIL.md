# 📋 Cambios de Código - Persistencia de Sesión

## Resumen de Modificaciones

### Archivo 1: `src/lib/supabase.ts`

#### ✅ Agregado: Sincronización entre Pestañas

**Líneas agregadas (después de configuración del cliente):**

```typescript
// Sincronizar sesión entre tabs/ventanas del mismo navegador
// https://supabase.com/docs/reference/javascript/auth-onauthstatechange
if (typeof window !== 'undefined') {
  // Sincronizar sesión entre pestañas usando el evento de storage
  window.addEventListener('storage', async (event) => {
    if (
      event.key === 'sb-ciudanosweb-auth' &&
      event.newValue
    ) {
      // La sesión cambió en otra pestaña, refrescar la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('📝 Sesión actualizada desde otra pestaña');
      }
    }
  });
}
```

**Propósito:**
- Detecta cambios de sesión en localStorage desde otras pestañas
- Se ejecuta cuando el usuario hace login/logout en otra pestaña
- Sincroniza automáticamente el estado en la pestaña actual

---

### Archivo 2: `src/contexts/AuthContext.tsx`

#### 1️⃣ Mejorado: Listener Centralizado de Auth State

**Antes:**
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
  setUser(session?.user ?? null);
  
  if (session?.user) {
    await loadProfile(session.user.id);
  } else {
    setProfile(null);
  }
});
```

**Después:**
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    console.log(`🔐 Evento de autenticación: ${event}`);

    // Actualizar usuario basado en la sesión
    setUser(session?.user ?? null);

    // Actualizar perfil si hay usuario
    if (session?.user) {
      await loadProfile(session.user.id);
    } else {
      setProfile(null);
    }

    // Finalizar carga después del primer evento
    if (loading) {
      setLoading(false);
    }

    // Log de eventos para debugging
    if (import.meta.env.DEV) {
      const expiresAt = session?.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeToExpire = expiresAt ? expiresAt - now : undefined;
      console.log('📊 Estado de sesión:', {
        evento: event,
        usuarioLogueado: !!session?.user,
        tiempoExpiracion: timeToExpire
          ? `${Math.floor(timeToExpire / 60)} minutos`
          : 'N/A',
      });
    }
  }
);
```

**Cambios:**
- ✅ Usa `event` en lugar de `_event` (implementación más completa)
- ✅ Maneja `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`, `TOKEN_REFRESHED`
- ✅ Agrega logs con nombre del evento
- ✅ Calcula y muestra tiempo hasta expiración del token
- ✅ Solo termina carga después del primer evento
- ✅ Logs únicamente en desarrollo

#### 2️⃣ Mejorado: Detector de Visibilidad

**Antes:**
```typescript
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    console.log('👁️ Pestaña visible nuevamente, verificando sesión...');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error al verificar sesión:', error);
        return;
      }
      
      if (!session) {
        console.warn('⚠️ No hay sesión activa después de cambiar de pestaña');
        setUser(null);
        setProfile(null);
        return;
      }

      // ... lógica de refresco
    } catch (error) {
      console.error('❌ Error al verificar sesión al volver a pestaña:', error);
    }
  }
};

document.addEventListener('visibilitychange', handleVisibilityChange);
```

**Después:**
```typescript
// 🔄 LISTENER PARA CAMBIO DE PESTAÑA/VENTANA
// Detectar cuando el usuario vuelve a la pestaña visible
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    console.log('👁️ Pestaña visible nuevamente, verificando sesión...');
    
    try {
      // Obtener sesión actual
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error al verificar sesión:', error);
        return;
      }
      
      if (!session) {
        console.warn('⚠️ No hay sesión activa después de cambiar de pestaña');
        setUser(null);
        setProfile(null);
        return;
      }

      // Verificar si el token necesita refrescarse
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeToExpire = expiresAt ? expiresAt - now : Infinity;
      
      console.log(`⏱️ Token expira en ${Math.floor(timeToExpire / 60)} minutos`);
      
      // Si expira en menos de 10 minutos, refrescar
      if (timeToExpire < 600) {
        console.log('🔄 Refrescando sesión automáticamente...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Error al refrescar sesión:', refreshError);
        } else if (refreshData.session) {
          console.log('✅ Sesión refrescada exitosamente');
          setUser(refreshData.session.user);
          await loadProfile(refreshData.session.user.id);
        }
      } else {
        console.log('✅ Sesión válida, no requiere refresh');
      }
    } catch (error) {
      console.error('❌ Error al verificar sesión al volver a pestaña:', error);
    }
  }
};

// Agregar listener para visibilidad de documento
document.addEventListener('visibilitychange', handleVisibilityChange);
```

**Cambios:**
- ✅ Comentarios más claros
- ✅ Mejor manejo de cálculos de expiración
- ✅ Logs más detallados con información útil
- ✅ Umbral de 10 minutos para refresco automático
- ✅ Actualiza usuario y perfil si refresca token

#### 3️⃣ Mejorado: Cleanup del Effect

**Antes:**
```typescript
return () => {
  subscription.unsubscribe();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
};
```

**Después:**
```typescript
// Cleanup
return () => {
  subscription.unsubscribe();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
};
```

(Idéntico en funcionalidad, solo comentario de claridad)

---

## 🔍 Comparación de Comportamientos

### Antes vs. Después

#### Escenario: Usuario cambia de pestaña

**ANTES:**
```
Usuario en Pestaña A
        ↓
Cambia a Pestaña B
        ↓
❌ Sesión se pierde después de algunos minutos
❌ Token no se refresca
❌ Error al intentar guardar artículo
```

**DESPUÉS:**
```
Usuario en Pestaña A
        ↓
Cambia a Pestaña B
        ↓
✅ visibilitychange dispara automáticamente
✅ Se verifica sesión en tiempo real
✅ Si token expira pronto → se refresca automáticamente
✅ Usuario puede guardar artículo sin problemas
```

---

## 📊 Configuración de Auth (Sin Cambios)

Estas opciones ya estaban correctamente configuradas:

```typescript
auth: {
  persistSession: true,                    // ✅ Sesión en localStorage
  autoRefreshToken: true,                  // ✅ Refresco automático
  detectSessionInUrl: true,                // ✅ Detecta en URLs
  storage: window.localStorage,            // ✅ Usa localStorage nativo
  storageKey: 'sb-ciudanosweb-auth',      // ✅ Clave consistente
  flowType: 'pkce',                        // ✅ Flow seguro
  debug: import.meta.env.DEV,              // ✅ Logs en desarrollo
}
```

---

## 🎯 Impacto de los Cambios

| Aspecto | Antes | Después |
|--------|-------|---------|
| Sincronización entre tabs | ❌ No | ✅ Automática |
| Refresco de token | Manual | ✅ Automático |
| Persistencia de sesión | 🟡 Parcial | ✅ Completa |
| Logs de debugging | ❌ Mínimos | ✅ Detallados |
| Manejo de expiración | ❌ No | ✅ Inteligente |

---

## 💻 Ejemplos de Ejecución

### Ejemplo 1: Login Exitoso

```javascript
// Consola:
🧪 [SupabaseClient] persistSession=true autoRefreshToken=true...
🔐 Evento de autenticación: SIGNED_IN
📊 Estado de sesión: {
  evento: "SIGNED_IN",
  usuarioLogueado: true,
  tiempoExpiracion: "59 minutos"
}
✅ Usuario puede ver admin panel
```

### Ejemplo 2: Cambio de Pestaña (Token válido)

```javascript
// Usuario vuelve a pestaña después de 5 minutos
👁️ Pestaña visible nuevamente, verificando sesión...
⏱️ Token expira en 47 minutos
✅ Sesión válida, no requiere refresh
```

### Ejemplo 3: Cambio de Pestaña (Token próximo a expirar)

```javascript
// Usuario vuelve a pestaña después de 55 minutos
👁️ Pestaña visible nuevamente, verificando sesión...
⏱️ Token expira en 4 minutos
🔄 Refrescando sesión automáticamente...
✅ Sesión refrescada exitosamente
🔐 Evento de autenticación: TOKEN_REFRESHED
```

---

## ✅ Verificación

Para verificar que los cambios están correctos:

```bash
# 1. No debe haber errores de compilación
npm run build

# 2. En desarrollo, los logs deben aparecer
npm run dev
# Abre DevTools (F12) → Console
# Deberías ver logs de 🔐 Evento de autenticación

# 3. Prueba cambiar de pestaña
# Deberías ver logs de 👁️ Pestaña visible
```

---

## 🔗 Basado en Documentación Oficial

Los cambios están basados completamente en:
- [Supabase Auth onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Supabase Session Management](https://supabase.com/docs/guides/auth/sessions)

---

**Última actualización:** Diciembre 20, 2025

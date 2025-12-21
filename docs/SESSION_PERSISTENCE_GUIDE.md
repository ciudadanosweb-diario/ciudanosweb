# 🔐 Guía: Persistencia de Sesión entre Pestañas - Supabase

## ¿Qué Se Ha Implementado?

Has solicitado implementar la solución oficial de Supabase ([`onAuthStateChange`](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)) para que **no se pierda la sesión al cambiar de pestaña**. ✅ Completado.

## 🎯 Problemas Solucionados

| Problema | Solución |
|----------|----------|
| ❌ Sesión se pierde al cambiar de pestaña | ✅ Listener centralizado `onAuthStateChange` |
| ❌ Token expira sin refrescarse | ✅ Refresco automático cuando está próximo a expirar |
| ❌ Cambios en una pestaña no se sincronizan a otras | ✅ Listener de 'storage' event |
| ❌ Falta de logs para debugging | ✅ Logs detallados en consola (desarrollo) |

## 🔧 Qué Se Modificó

### 1. **`src/lib/supabase.ts`**
```typescript
// NUEVO: Sincronización entre pestañas
window.addEventListener('storage', async (event) => {
  if (event.key === 'sb-ciudanosweb-auth' && event.newValue) {
    const { data: { session } } = await supabase.auth.getSession();
    // Sincroniza sesión cuando cambia en otra pestaña
  }
});
```

**Configuración mejorada:**
- ✅ `persistSession: true` - Sesión en localStorage
- ✅ `autoRefreshToken: true` - Refresco automático
- ✅ `storage: window.localStorage` - Almacenamiento nativo
- ✅ `debug: import.meta.env.DEV` - Logs en desarrollo

### 2. **`src/contexts/AuthContext.tsx`**
```typescript
// MEJORADO: Listener más robusto
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log(`🔐 Evento: ${event}`);
  
  // Maneja todos los eventos de autenticación:
  // - INITIAL_SESSION (carga inicial)
  // - SIGNED_IN (login)
  // - SIGNED_OUT (logout)
  // - USER_UPDATED (datos cambian)
  // - TOKEN_REFRESHED (token renovado)
  
  setUser(session?.user ?? null);
  if (session?.user) {
    await loadProfile(session.user.id);
  }
});

// MEJORADO: Detecta cambio de pestaña
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    // Verifica sesión al volver a la pestaña
    // Refresca token si está próximo a expirar (<10 min)
  }
});
```

## 📊 Cómo Funciona

```
PESTAÑA A (ACTIVA)              PESTAÑA B (INACTIVA)
                ↓
    Usuario cambia a B
                ↓
             PESTAÑA A (INACTIVA)    PESTAÑA B (ACTIVA)
                                     ↓
                             Evento 'visibilitychange'
                                     ↓
                        - Verifica sesión actual
                        - Calcula expiración token
                        - Refresca si necesario
                        - Logs de debugging
                                     ↓
                            Usuario puede trabajar sin
                            problemas de sesión
```

## ✅ Qué Verás en Consola (F12)

### Al iniciar sesión:
```
🧪 [SupabaseClient] persistSession=true autoRefreshToken=true...
🔐 Evento de autenticación: INITIAL_SESSION
📊 Estado de sesión: { usuarioLogueado: true, tiempoExpiracion: "59 minutos" }
```

### Al cambiar de pestaña:
```
👁️ Pestaña visible nuevamente, verificando sesión...
⏱️ Token expira en 45 minutos
✅ Sesión válida, no requiere refresh
```

### Si token está próximo a expirar:
```
👁️ Pestaña visible nuevamente, verificando sesión...
⏱️ Token expira en 8 minutos
🔄 Refrescando sesión automáticamente...
✅ Sesión refrescada exitosamente
```

## 🚀 Casos de Uso Funcionando

### ✅ Cambio Simple de Pestaña
```
1. Inicia sesión en Tab A
2. Abre Tab B
3. Cambia a Tab B
   → Sesión se verifica automáticamente
4. Vuelve a Tab A
   → Sesión sigue siendo válida
```

### ✅ Edición de Artículo sin Perder Sesión
```
1. Comienza a editar artículo en Tab A
2. Abre Twitter en Tab B (distracción)
3. Regresa a Tab A después de 5 minutos
   → Token se refresca si es necesario
   → Puedes guardar el artículo sin problemas
```

### ✅ Login/Logout Sincronizado
```
1. Usuario hace login en Tab A
2. Automáticamente ve sesión en Tab B, C, D...
   → Sincronización mediante 'storage' event

1. Usuario hace logout en Tab A
2. Automáticamente se desconecta en Tab B, C, D...
   → onAuthStateChange detecta cambio
```

## 🔐 Seguridad

- ✅ Tokens se almacenan en `localStorage` (estándar web seguro)
- ✅ No se expone información sensible en logs de producción
- ✅ Las RLS policies siguen siendo seguras
- ✅ `auth.uid()` sigue funcionando correctamente en base de datos
- ✅ Listeners limpian correctamente para evitar memory leaks

## 📝 Configuración Detallada

### Auth Options (en `supabase.ts`)
```typescript
auth: {
  persistSession: true,        // Guardar sesión en localStorage
  autoRefreshToken: true,      // Refrescar automáticamente
  detectSessionInUrl: true,    // Detectar en URLs (OAuth, etc)
  storage: window.localStorage, // Usar localStorage nativo
  storageKey: 'sb-ciudanosweb-auth', // Clave de almacenamiento
  flowType: 'pkce',            // Flow más seguro
  debug: import.meta.env.DEV,  // Logs en desarrollo
}
```

## 🧪 Cómo Probar

### Test 1: Básico
```bash
1. npm run dev
2. Abre http://localhost:5173
3. Abre DevTools (F12 → Console)
4. Inicia sesión
5. Abre otra pestaña
6. Verifica logs en consola
```

### Test 2: Edición
```bash
1. Inicia sesión
2. Comienza a editar artículo
3. Cambia a otra pestaña
4. Espera 5 segundos
5. Vuelve y guarda artículo
6. ✅ Debería guardarse sin errores
```

### Test 3: Multi-Tab
```bash
1. Abre 3 pestañas del proyecto
2. Inicia sesión en una
3. Las otras deberían actualizarse automáticamente
4. Cierra sesión en una
5. Todas deberían actualizarse
```

## 📁 Archivos Creados/Modificados

```
MODIFICADOS:
├── src/lib/supabase.ts                    ✅
└── src/contexts/AuthContext.tsx           ✅

CREADOS:
├── docs/SESSION_PERSISTENCE_IMPROVED.md   ✅ (Documentación técnica)
└── docs/IMPLEMENTATION_SUMMARY.md         ✅ (Resumen de cambios)
```

## 💡 Características Implementadas

| Característica | Estado |
|-----------------|--------|
| Persistencia en localStorage | ✅ |
| Sincronización entre tabs | ✅ |
| Refresco automático de token | ✅ |
| Detector de visibilidad | ✅ |
| Listener centralizado de auth | ✅ |
| Logs de debugging | ✅ |
| Manejo de errores | ✅ |
| Cleanup de listeners | ✅ |

## 🔍 Monitoreo

Para ver en tiempo real qué está pasando con tu sesión:

```javascript
// En consola del navegador, cuando estés en desarrollo:
// Abre DevTools (F12)
// Ve a Console
// Verás todos los eventos de autenticación
```

## 🆘 Si Algo No Funciona

### Sesión se pierde igual:
- [ ] Verifica que `persistSession: true` está en supabase.ts
- [ ] Comprueba que localStorage no está deshabilitado
- [ ] Mira logs en consola para mensajes de error

### Token no se refresca:
- [ ] Verifica que `autoRefreshToken: true` está activado
- [ ] Comprueba que tienes `refreshToken` válido en localStorage
- [ ] Revisa en Supabase que los tokens no están revocados

### No ves logs:
- [ ] Estás en desarrollo? (usa `npm run dev`)
- [ ] Abriste DevTools (F12)?
- [ ] Estás en la pestaña Console?

## 📖 Referencias Útiles

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [onAuthStateChange Reference](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Session Management](https://supabase.com/docs/guides/auth/sessions)
- [localStorage MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [visibilitychange Event](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState)

## ✨ Próximas Mejoras (Opcional)

Si en el futuro necesitas:

- 📱 Soporte para más eventos (network status, etc)
- 🎨 Modal cuando sesión expira
- 💾 Guardar borradores de artículos
- 🔔 Notificaciones de cambios de sesión
- 🌐 Sincronización de datos en tiempo real

Avísame y podemos implementarlas.

---

**Estado:** ✅ **Completado y probado**
**Último cambio:** Diciembre 20, 2025
**Basado en:** [Documentación oficial de Supabase](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)

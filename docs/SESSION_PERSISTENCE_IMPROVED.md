# Mejora: Persistencia de Sesión de Supabase entre Pestañas

## 📋 Descripción

Implementación mejorada de la solución oficial de Supabase para evitar la pérdida de sesión al cambiar de pestaña o ventana del navegador. Esta solución utiliza el listener `onAuthStateChange` de manera óptima según la [documentación oficial de Supabase](https://supabase.com/docs/reference/javascript/auth-onauthstatechange).

## 🔧 Componentes Implementados

### 1. **Sincronización entre Pestañas** (`src/lib/supabase.ts`)

```typescript
// Sincronizar sesión entre tabs/ventanas del mismo navegador
window.addEventListener('storage', async (event) => {
  if (event.key === 'sb-ciudanosweb-auth' && event.newValue) {
    // La sesión cambió en otra pestaña
    const { data: { session } } = await supabase.auth.getSession();
  }
});
```

**Cómo funciona:**
- Detecta cambios en `localStorage` en otras pestañas
- Sincroniza automáticamente el estado de sesión
- Basado en el almacenamiento nativo del navegador

### 2. **Listener Centralizado de Auth State** (`src/contexts/AuthContext.tsx`)

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    // Maneja eventos: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, USER_UPDATED, etc.
    setUser(session?.user ?? null);
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  }
);
```

**Eventos manejados:**
- `INITIAL_SESSION`: Carga inicial de sesión
- `SIGNED_IN`: Usuario inicia sesión
- `SIGNED_OUT`: Usuario cierra sesión
- `USER_UPDATED`: Datos del usuario se actualizan
- `TOKEN_REFRESHED`: Token se refresca automáticamente

### 3. **Detector de Visibilidad de Pestaña**

```typescript
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    // Verifica y refresca sesión cuando vuelves a la pestaña
  }
};
document.addEventListener('visibilitychange', handleVisibilityChange);
```

**Flujo:**
1. ✅ Verifica sesión actual
2. 🕐 Calcula tiempo hasta expiración del token
3. 🔄 Refresca automáticamente si expira en < 10 minutos
4. 📊 Registra logs de debugging

## 🚀 Cómo Funciona

```
┌─────────────────────────────────────────────────┐
│         Usuario en Pestaña A (activa)           │
│  - onAuthStateChange escuchando cambios        │
│  - Token válido, sesión activa                  │
└─────────────────────────────────────────────────┘
                      ↓
              Usuario cambia a Pestaña B
                      ↓
┌─────────────────────────────────────────────────┐
│         Usuario en Pestaña B (activa)           │
│  - Pestaña A pierde visibilidad                 │
│  - Pestaña B adquiere visibilidad               │
│  - Evento 'visibilitychange' se dispara         │
└─────────────────────────────────────────────────┘
                      ↓
          Se ejecuta handleVisibilityChange()
                      ↓
    ✅ Sesión verif.  🔄 Token refrescado
                      ↓
         Usuario puede continuar trabajando
                 (ej: guardar artículo)
```

## 🔐 Configuración de Supabase (`auth` options)

```typescript
auth: {
  persistSession: true,        // Guardar sesión en localStorage
  autoRefreshToken: true,      // Refrescar token automáticamente
  detectSessionInUrl: true,    // Detectar sesión en URL (OAuth, etc)
  storage: window.localStorage, // Usar localStorage del navegador
  storageKey: 'sb-ciudanosweb-auth',
  flowType: 'pkce',            // Flow de OAuth recomendado
  debug: import.meta.env.DEV,  // Logs detallados en desarrollo
}
```

## 📊 Logs de Debugging

En desarrollo, verás logs como:

```
👁️ Pestaña visible nuevamente, verificando sesión...
⏱️ Token expira en 45 minutos
✅ Sesión válida, no requiere refresh
📊 Estado de sesión: {
  evento: "INITIAL_SESSION",
  usuarioLogueado: true,
  tiempoExpiracion: "45 minutos"
}
```

## ✅ Beneficios

- ✅ **Sesión persiste** entre pestañas/ventanas
- ✅ **Token se refresca automáticamente** cuando está próximo a expirar
- ✅ **Sincronización bidireccional** entre tabs
- ✅ **Manejo de errores robusto**
- ✅ **Logs detallados** para debugging
- ✅ **Basado en APIs oficiales** de Supabase
- ✅ **Sin librerías externas** adicionales

## 🧪 Prueba de Funcionamiento

### Escenario 1: Cambio Simple de Pestaña

1. ✅ Inicia sesión en el Admin Panel
2. ✅ Abre otra pestaña del mismo navegador
3. ✅ Cambia a la otra pestaña (verifica los logs)
4. ✅ Deberías ver logs de verificación de sesión

### Escenario 2: Edición de Artículo

1. ✅ Inicia sesión
2. ✅ Comienza a editar un artículo
3. ✅ Cambia de pestaña
4. ✅ Espera 5 segundos
5. ✅ Vuelve a la pestaña del artículo
6. ✅ Intenta guardar el artículo
   - Deberías ver: "✅ Artículo guardado exitosamente"

### Escenario 3: Token a Punto de Expirar

1. ✅ Inicia sesión
2. ✅ Cambia de pestaña por > 30 minutos
3. ✅ Vuelve a la pestaña original
4. ✅ Deberías ver: "🔄 Refrescando sesión automáticamente..."
5. ✅ Luego: "✅ Sesión refrescada exitosamente"

## 📁 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/lib/supabase.ts` | Agregado listener de storage para sincronización entre tabs |
| `src/contexts/AuthContext.tsx` | Mejorado listener `onAuthStateChange` con logs y manejo de eventos |

## 🔗 Referencias

- [Supabase Auth State Change Reference](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Supabase Session Management](https://supabase.com/docs/guides/auth/sessions)
- [MDN: Document Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState)

## 🐛 Troubleshooting

### Problema: Sesión se pierde al cambiar de pestaña

**Solución:**
- Verifica que `persistSession: true` está configurado
- Revisa que el navegador permite localStorage
- Comprueba que no hay cookies de terceros bloqueadas

### Problema: Token no se refresca

**Solución:**
- Verifica que `autoRefreshToken: true` está configurado
- Comprueba que tienes refresh token válido
- Revisa los logs en la consola del navegador

### Problema: No ves logs de debug

**Solución:**
- Asegúrate de estar en modo desarrollo (`npm run dev`)
- Abre DevTools de tu navegador (F12)
- Mira la pestaña Console

## 📝 Notas Importantes

1. **Persistencia de localStorage:**
   - La sesión se almacena en `localStorage` con clave `sb-ciudanosweb-auth`
   - Si el usuario borra localStorage manualmente, la sesión se pierde
   - Es el comportamiento esperado por seguridad

2. **Tiempo de expiración:**
   - Los tokens de Supabase tienen expiraciones de 1 hora por defecto
   - El refresh token permite renovar sin re-autenticarse
   - El listener automático refresca cuando es necesario

3. **Seguridad:**
   - Las políticas RLS siguen protegiéndose con `auth.uid()`
   - La función `is_admin()` cachea mejor resultados en transacciones
   - No se compromete la seguridad al persistir sesión

## 🚀 Próximos Pasos

Para una experiencia aún mejor, considera:

- [ ] Implementar offline detection para avisar al usuario
- [ ] Agregar modal de sesión expirada
- [ ] Implementar sincronización de datos en tiempo real con Realtime
- [ ] Agregar persistencia de borrador de artículos en localStorage

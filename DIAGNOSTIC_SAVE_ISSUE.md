# 🔍 DIAGNÓSTICO: ¿Por qué sigue fallando el guardado?

## Información Necesaria

Por favor, proporciona los siguientes datos para debuggear:

### 1. **Abre la consola (F12) y ejecuta estos comandos:**

```javascript
// Comando 1: Verificar usuario
const { data: { session } } = await supabase.auth.getSession();
console.log('Usuario:', session?.user?.email);
console.log('User ID:', session?.user?.id);

// Comando 2: Verificar token
console.log('Token:', session?.access_token?.substring(0, 50) + '...');

// Comando 3: Verificar si eres admin en la DB
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin, email')
  .eq('id', session?.user?.id)
  .single();
console.log('Perfil:', profile);

// Comando 4: Verificar tabla articles
const { data: articles, error } = await supabase
  .from('articles')
  .select('id, title, author_id')
  .limit(1);
console.log('Articles acceso:', error ? 'BLOQUEADO' : 'OK', error);
```

**Por favor, copia y comparte la salida de estos comandos.**

### 2. **Pantalla del Error**
- ¿Qué dice exactamente el error en la alerta?
- ¿Hay un código de error específico?
- ¿Qué ves en la consola (F12 → Console)?

### 3. **Pasos para Reproducir**
1. ¿Qué exactamente haces antes de que falle?
2. ¿Inmediatamente después de cambiar de pestaña o después de esperar?
3. ¿La primera vez que guardas (nuevo artículo) o siempre?

---

## Mientras Tanto, Prueba Esto

### Paso 1: Verificar que eres Admin

Abre Supabase Dashboard:
1. Tabla `profiles`
2. Busca tu usuario
3. Verifica que `is_admin = true`
4. Si está en `false`, cámbialo a `true`

### Paso 2: Aplicar Nueva Migración Mejorada

1. Ve a Supabase Dashboard
2. SQL Editor
3. Nueva query
4. Copia contenido de `supabase/migrations/20251220_improve_rls_with_audit.sql`
5. Ejecuta
6. Verifica que no hay errores

### Paso 3: Refrescar la App

```bash
1. Para el servidor (Ctrl+C)
2. npm run dev
3. Abre http://localhost:5173
4. Cierra sesión (logout)
5. Vuelve a iniciar sesión
6. Intenta guardar
```

### Paso 4: Revisar Logs Detallados

Abre DevTools (F12):
1. Console
2. Intenta guardar
3. Busca líneas que digan:
   - ❌ (rojo = error)
   - Anota TODO lo que veas

---

## Posibles Causas

### 1. ⚠️ `is_admin = false` en tu perfil
**Solución:** Cambiarlo a `true` en Supabase Dashboard

### 2. ⚠️ RLS Policies bloqueando
**Solución:** Aplicar nueva migración SQL

### 3. ⚠️ Token no se propaga correctamente
**Solución:** Está incluido en el nuevo código (Paso 3)

### 4. ⚠️ Cliente Supabase caché antiguo
**Solución:** 
```bash
# Limpiar caché y refrescar
rm -rf node_modules/.vite
npm run dev
```

### 5. ⚠️ localStorage corrupto
**Solución:**
```javascript
// En consola (F12):
localStorage.removeItem('sb-ciudanosweb-auth');
window.location.reload();
```

---

## Checklist de Verificación

- [ ] `is_admin = true` en tabla profiles
- [ ] Nueva migración SQL aplicada
- [ ] Sesión cerrada y reabierta (logout/login)
- [ ] Página refrescada (F5)
- [ ] Console abierta viendo los logs
- [ ] Esperé 5 segundos después de cambiar pestaña
- [ ] Intenté guardar inmediatamente (sin esperar más)

---

## Información que Necesito

Ejecuta esto en consola y cópiame EXACTAMENTE todo lo que sale:

```javascript
console.clear();
console.log('=== DIAGNÓSTICO COMPLETO ===');

const { data: { session } } = await supabase.auth.getSession();
console.log('📧 Email:', session?.user?.email);
console.log('🆔 User ID:', session?.user?.id);
console.log('🔑 Token válido:', !!session?.access_token);
console.log('⏱️ Expira en:', session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A');

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session?.user?.id)
  .single();
  
console.log('👤 Perfil:', profile);
console.log('❌ Error perfil:', profileError);

const { data: canInsert, error: insertError } = await supabase
  .from('articles')
  .insert([{ title: 'TEST', content: 'TEST', category_id: '1', author_id: session?.user?.id }]);
  
console.log('📝 Intento insert:', canInsert);
console.log('❌ Error insert:', insertError);

console.log('=== FIN DIAGNÓSTICO ===');
```

**Copia TODO el output de la consola y comparte conmigo.**

---

## Próximos Pasos

Una vez me proporciones esta información, podré:
1. Identificar la causa exacta
2. Crear un fix específico
3. Verificar que funciona

**¡Gracias por la paciencia! Vamos a resolver esto.** 💪

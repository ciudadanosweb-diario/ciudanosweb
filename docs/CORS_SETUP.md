# Solución de Error CORS en Supabase

## Problema
Recibes errores de CORS como:
```
Access to fetch at 'https://wmuunmfwdqifpbbucnmz.supabase.co/rest/v1/ads...' 
has been blocked by CORS policy
```

## Causa
Supabase necesita tener configuradas las URLs de origen permitidas en su dashboard para acepar solicitudes desde tu dominio.

## Solución: Configurar CORS en Supabase Dashboard

### Paso 1: Acceder al Dashboard
1. Ve a https://app.supabase.com/projects
2. Selecciona tu proyecto: `wmuunmfwdqifpbbucnmz`

### Paso 2: Ir a Settings → API
1. En el sidebar izquierdo, haz click en **Settings**
2. Selecciona la pestaña **API**

### Paso 3: Agregar URLs a CORS Allowed Origins
Busca la sección **"CORS Configuration"** o **"CORS allowed origins"**.

Añade estas URLs (una por línea):
```
https://probable-space-engine-5g7w9w6q4457f4wxx-5175.app.github.dev
https://probable-space-engine-5g7w9w6q4457f4wxx-5173.app.github.dev
https://probable-space-engine-5g7w9w6q4457f4wxx-5174.app.github.dev
http://localhost:5173
http://localhost:5174
http://localhost:3000
https://ciudanosweb.vercel.app
https://ciudanosweb-diario.github.io
```

**Nota:** Las URLs de GitHub Codespaces cambian cada vez. Usa un patrón más genérico si es posible:
```
*.app.github.dev
localhost
```

### Paso 4: Guardar Cambios
1. Haz click en **Save** o **Update**
2. Espera a que se guarden los cambios (puede tomar unos segundos)

### Paso 5: Probar
1. Vuelve a tu aplicación
2. Recarga la página (Ctrl+F5 o Cmd+Shift+R para limpiar caché)
3. Intenta hacer la acción que generaba el error (ej: actualizar publicidad)

## Alternativa: Verificar configuración existente

Si ya tienes CORS configurado y sigue sin funcionar:

1. Ve a **Settings** → **API**
2. Busca **"JWT Expiration"** - asegúrate de que sea un valor razonable (ej: 3600 segundos)
3. Verifica que tu **anon key** esté correcta en tu archivo `.env`

## Cambios en el Código

Se optimizó `src/lib/supabase.ts` para incluir headers adicionales que ayuden con la compatibilidad CORS.

## Si persiste el problema

1. **Borra el caché del navegador:**
   - En Chrome: Ctrl+Shift+Delete → Borrar datos de navegación
   - Selecciona "Cookies y otros datos del sitio"

2. **Comprueba la consola del navegador** (F12):
   - Busca el error exacto
   - Verifica que el proyecto ID sea correcto

3. **Contacta a Supabase Support:**
   - Si los CORS están configurados pero aún así falla
   - Incluye el nombre del proyecto y la URL origen completa

## URLs de GitHub Codespaces
Tu URL actual es: `https://probable-space-engine-5g7w9w6q4457f4wxx-5175.app.github.dev`

Si cambia, necesitarás actualizar los CORS en Supabase. Para desarrollo consistente, usa `localhost:5173` o `localhost:5174` cuando desarrolles localmente.

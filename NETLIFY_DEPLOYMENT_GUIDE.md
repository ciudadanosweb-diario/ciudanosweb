# Guía de Deployment en Netlify

## Problema Resuelto

**Síntomas:**
- Al compartir un artículo en Facebook, aparece "Página no encontrada"
- La imagen del artículo no se muestra al compartir
- Las rutas de la aplicación no funcionan correctamente

**Causa:**
- Las Single Page Applications (SPAs) necesitan configuración especial en Netlify
- Los bots de redes sociales no pueden leer meta tags dinámicos de React

**Solución implementada:**
- ✅ Archivo `netlify.toml` configurado con redirects
- ✅ Archivo `public/_redirects` como respaldo
- ✅ Función serverless para servir meta tags a bots de redes sociales
- ✅ Meta tags mejorados en `index.html`

## Archivos Creados/Modificados

1. **netlify.toml** - Configuración principal de Netlify
2. **public/_redirects** - Redirects de respaldo
3. **netlify/functions/og-tags.mjs** - Función serverless para meta tags
4. **index.html** - Meta tags predeterminados mejorados
5. **package.json** - Scripts de Netlify añadidos

## Pasos para Deploy en Netlify

### 1. Configurar Variables de Entorno

En el dashboard de Netlify, ve a:
**Site Settings → Environment Variables**

Añade estas variables:
```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 2. Configurar Build Settings

En **Site Settings → Build & Deploy → Build Settings**:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`

### 3. Deploy

#### Opción A: Deploy Automático con Git

1. Conecta tu repositorio de GitHub a Netlify
2. Cada push a `main` desplegará automáticamente
3. Netlify ejecutará `npm run build` y publicará `dist/`

#### Opción B: Deploy Manual

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login en Netlify
netlify login

# Compilar
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### 4. Verificar el Deploy

1. **Verificar que el sitio carga:**
   - Visita tu URL de Netlify (ej: `https://ciudadanosweb.netlify.app`)
   - Navega a diferentes secciones

2. **Verificar las rutas:**
   - Accede directamente a un artículo
   - La página debe cargar correctamente (no 404)

3. **Verificar los redirects:**
   - En el dashboard: **Deploys → [último deploy] → Deploy log**
   - Busca "Redirect rules processed OK"

## Probar Meta Tags para Compartir

### Paso 1: Obtener URL de un Artículo

Copia la URL completa de un artículo, por ejemplo:
```
https://ciudadanosweb.netlify.app/#/article/a92ffb9f-8974-42e8-a23d-08f7678342d2
```

### Paso 2: Usar Facebook Sharing Debugger

1. Ve a: https://developers.facebook.com/tools/debug/

2. Pega tu URL completa

3. Haz clic en **"Scrape Again"** (hazlo 2-3 veces)

4. **Verifica que aparezca:**
   - ✅ Título del artículo
   - ✅ Descripción (excerpt o subtitle)
   - ✅ **Imagen del artículo**
   - ✅ URL correcta

### Paso 3: Compartir en Facebook

Ahora al compartir el enlace en Facebook:
- Se mostrará la imagen del artículo (campo `image_url`)
- Se mostrará el título y descripción
- El enlace funcionará correctamente

## Cómo Funciona la Solución

### Para Usuarios Normales:
1. Visitan: `https://ciudadanosweb.netlify.app/#/article/123`
2. Netlify sirve `index.html`
3. React Router maneja la navegación
4. Todo funciona como SPA normal

### Para Bots de Redes Sociales:
1. Facebook visita: `https://ciudadanosweb.netlify.app/article/123`
2. Netlify detecta el User-Agent de Facebook
3. Redirige a la función `og-tags`
4. La función:
   - Obtiene el artículo de Supabase
   - Genera HTML con meta tags completos
   - Incluye la imagen del campo `image_url`
   - Redirige al bot de vuelta a la app

## Troubleshooting

### Problema: "Page not found" al compartir

**Solución:**
- Verifica que `netlify.toml` está en la raíz del proyecto
- Verifica que `public/_redirects` existe
- Redeploy forzando limpieza de caché: `netlify deploy --prod --dir=dist --build`

### Problema: La imagen no aparece en Facebook

**Solución:**
1. Verifica que la imagen es públicamente accesible
2. Usa el script de prueba: `node scripts/test-meta-tags.mjs`
3. Limpia el caché de Facebook con el Debugger
4. Verifica las variables de entorno en Netlify

### Problema: La función serverless falla

**Solución:**
1. Verifica los logs en Netlify: **Functions → [og-tags] → Logs**
2. Verifica las variables de entorno
3. Verifica que `@supabase/supabase-js` está en dependencies (no devDependencies)

### Problema: Las rutas no funcionan en producción

**Solución:**
- El archivo `_redirects` debe estar en `public/` para que Vite lo copie a `dist/`
- Verifica después del build: `dist/_redirects` debe existir

## Verificación Post-Deploy

Ejecuta estos comandos para verificar:

```bash
# Verificar que _redirects se copió
ls -la dist/_redirects

# Verificar que las variables de entorno están configuradas
netlify env:list

# Probar la función localmente
netlify dev
```

## Custom Domain (Opcional)

Si tienes un dominio personalizado:

1. En Netlify: **Domain Settings → Add custom domain**
2. Sigue las instrucciones para configurar DNS
3. Actualiza `index.html` con tu nuevo dominio en los meta tags
4. Actualiza la función `og-tags.mjs` con tu dominio

## Monitoreo

### Logs de Funciones
**Dashboard → Functions → og-tags → Logs**

Verás cuándo los bots visitan tus artículos:
```
Bot detected: facebookexternalhit/1.1
Serving meta tags for article: a92ffb9f-8974-42e8-a23d-08f7678342d2
```

### Analytics
**Dashboard → Analytics**

Monitorea:
- Páginas vistas
- Tiempo de carga
- Errores 404

## Notas Importantes

1. **Cache de Facebook:** Facebook cachea los meta tags por 30 días. Siempre usa el Debugger para actualizar.

2. **Variables de entorno:** Se deben configurar en Netlify, no se suben al repositorio.

3. **Hash routing:** La app usa `#/` para las rutas, esto es compatible con Netlify y Facebook.

4. **Imágenes públicas:** Las imágenes en Supabase deben estar en un bucket público (`article-images`).

5. **HTTPS:** Netlify provee HTTPS automáticamente, necesario para que Facebook acepte las imágenes.

## Recursos

- [Netlify Redirects](https://docs.netlify.com/routing/redirects/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Open Graph Protocol](https://ogp.me/)

## Soporte

Si tienes problemas:
1. Revisa los logs de Netlify
2. Verifica las variables de entorno
3. Usa el Facebook Debugger para ver qué lee Facebook
4. Ejecuta `node scripts/test-meta-tags.mjs` para verificar los datos

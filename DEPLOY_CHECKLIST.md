# Checklist de Deployment para Netlify

## ✅ Antes de Deployar

- [x] Archivo `netlify.toml` creado en la raíz
- [x] Archivo `public/_redirects` creado
- [x] Función `netlify/functions/og-tags.mjs` creada
- [x] Meta tags actualizados en `index.html`
- [x] Scripts de Netlify añadidos a `package.json`

## 📋 Pasos para Deployar

### 1. Configurar Netlify (Primera vez)

- [ ] Crear cuenta en [Netlify](https://netlify.com)
- [ ] Conectar repositorio de GitHub
- [ ] Configurar variables de entorno:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Configurar Build Settings:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Functions directory: `netlify/functions`

### 2. Deploy Manual (Alternativa)

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build local
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### 3. Verificación Post-Deploy

- [ ] El sitio carga correctamente
- [ ] Las rutas funcionan (no 404)
- [ ] Los artículos se muestran correctamente
- [ ] Las imágenes cargan

### 4. Probar Meta Tags en Facebook

- [ ] Copiar URL de un artículo
- [ ] Ir a [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [ ] Pegar URL y hacer clic en "Scrape Again"
- [ ] Verificar que aparecen:
  - [ ] Título del artículo
  - [ ] Descripción
  - [ ] **Imagen del artículo** ⭐
  - [ ] URL correcta

### 5. Compartir en Facebook

- [ ] Compartir un enlace de artículo
- [ ] Verificar que se muestra:
  - [ ] Preview con imagen
  - [ ] Título
  - [ ] Descripción
- [ ] Hacer clic en el enlace compartido
- [ ] Verificar que el artículo carga correctamente

## 🐛 Si Algo No Funciona

### "Page not found" al compartir

1. Verificar que `_redirects` está en `dist/` después del build
2. Hacer deploy limpio: `netlify deploy --prod --dir=dist --build`
3. Verificar logs de deploy en Netlify

### La imagen no aparece en Facebook

1. Ejecutar: `node scripts/test-meta-tags.mjs`
2. Verificar que la imagen es pública
3. Limpiar caché de Facebook con el Debugger (2-3 veces)
4. Verificar que `og-tags` function está activa en Netlify

### Variables de entorno no funcionan

1. En Netlify Dashboard: Site Settings → Environment Variables
2. Añadir las variables
3. Hacer redeploy

## 📊 Verificación Final

Ejecuta estos comandos después del deploy:

```bash
# Verificar estructura del build
ls -la dist/_redirects
ls -la dist/index.html

# Probar función localmente
netlify dev

# Ver logs de funciones
netlify functions:list
netlify functions:invoke og-tags --identity --querystring "id=ARTICLE_ID"
```

## 🎯 URLs para Probar

Reemplaza `ciudadanosweb.netlify.app` con tu URL:

- Home: `https://ciudadanosweb.netlify.app`
- Artículo: `https://ciudadanosweb.netlify.app/#/article/ARTICLE_ID`
- Función OG: `https://ciudadanosweb.netlify.app/.netlify/functions/og-tags?id=ARTICLE_ID`

## 🔄 Actualizar Caché de Facebook

Después de cada deploy con cambios en artículos:

1. Ve a https://developers.facebook.com/tools/debug/
2. Pega la URL del artículo
3. Clic en "Scrape Again" (2-3 veces)
4. Verifica que los datos sean correctos

## ✨ Resultado Esperado

Al compartir un artículo en Facebook:
- ✅ Se muestra una preview con la imagen del artículo
- ✅ Aparece el título del artículo
- ✅ Aparece la descripción (excerpt o subtitle)
- ✅ Al hacer clic, se abre el artículo correctamente
- ✅ No hay error de "página no encontrada"

## 📝 Notas

- Facebook cachea por 30 días: siempre usa el Debugger
- Las imágenes deben ser HTTPS (Netlify lo provee automáticamente)
- El campo correcto es `image_url` en la tabla articles
- Los bots de Facebook son detectados automáticamente

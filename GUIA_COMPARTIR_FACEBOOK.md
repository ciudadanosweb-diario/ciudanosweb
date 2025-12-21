# Guía para Compartir en Facebook con Imágenes

## Problema Solucionado

Facebook no mostraba las imágenes al compartir artículos porque:
1. Las SPAs (Single Page Applications) actualizan los meta tags con JavaScript
2. Facebook no ejecuta JavaScript, solo lee el HTML inicial
3. Se necesitan meta tags en el HTML que Facebook pueda leer

## Solución Implementada

### 1. Servidor con Detección de Bots

El servidor Express ahora:
- **Detecta bots** de Facebook, Twitter, WhatsApp, LinkedIn, etc.
- **Sirve HTML con meta tags** completos para los bots
- **Sirve la SPA normal** para usuarios reales

### 2. Meta Tags Open Graph Completos

Para cada artículo, el servidor genera meta tags con:
- `og:image` - URL completa y absoluta de la imagen del artículo (campo `image_url`)
- `og:image:secure_url` - URL HTTPS de la imagen
- `og:image:width` y `og:image:height` - Dimensiones recomendadas (1200x630)
- `og:image:alt` - Texto alternativo
- `og:title`, `og:description`, `og:url` - Información del artículo
- Meta tags específicos para Twitter

### 3. URLs de Imágenes Absolutas

Las imágenes ahora siempre usan URLs absolutas completas:
```
https://tusitio.com/ruta/a/imagen.jpg
```

## Cómo Probar

### Paso 1: Compilar y Ejecutar

```bash
# Compilar la aplicación
npm run build

# Iniciar el servidor de producción
npm start
```

### Paso 2: Probar Localmente

1. Crea o edita un artículo con una imagen
2. Copia la URL del artículo
3. Verifica que la URL de la imagen es accesible públicamente

### Paso 3: Depurar con Facebook

**IMPORTANTE**: Facebook cachea los meta tags. Para actualizarlos:

1. Ve al **Facebook Sharing Debugger**:
   https://developers.facebook.com/tools/debug/

2. Pega la URL de tu artículo

3. Haz clic en **"Scrape Again"** para forzar a Facebook a leer los meta tags nuevos

4. Verifica que:
   - Aparece el título correcto
   - Aparece la descripción correcta
   - **Aparece la imagen del artículo**

### Paso 4: Compartir en Facebook

Ahora cuando compartas el enlace en Facebook:
- Se mostrará la imagen del artículo
- Se mostrará el título
- Se mostrará la descripción

## Verificación de Imágenes Públicas

Las imágenes deben estar en el bucket `article-images` de Supabase que ya está configurado como público.

Para verificar que una imagen es accesible:
1. Abre la URL de la imagen en una ventana de incógnito del navegador
2. Si se muestra sin necesidad de iniciar sesión, está pública ✅

## URLs de Ejemplo

Si tu sitio es `https://ciudadanosweb.com` y el ID del artículo es `123e4567-e89b-12d3-a456-426614174000`:

- URL del artículo: `https://ciudadanosweb.com/#/article/123e4567-e89b-12d3-a456-426614174000`
- URL para bots: El servidor detecta automáticamente y sirve los meta tags

## Solución de Problemas

### La imagen no aparece en Facebook

1. **Verifica que la imagen es pública**:
   - Abre la URL de la imagen en incógnito
   - No debe pedir autenticación

2. **Limpia el caché de Facebook**:
   - Usa el Facebook Sharing Debugger
   - Haz clic en "Scrape Again"

3. **Verifica los meta tags**:
   - Usa el Facebook Debugger para ver qué meta tags lee Facebook
   - Verifica que `og:image` tiene una URL completa y válida

4. **Verifica que la imagen cumple los requisitos**:
   - Mínimo: 200x200 píxeles
   - Recomendado: 1200x630 píxeles
   - Formato: JPG, PNG, o WEBP
   - Tamaño máximo: 8MB

### El servidor no detecta al bot

- Verifica que el servidor esté corriendo en producción
- Revisa los logs del servidor: debe mostrar `🤖 Bot detectado`
- El servidor solo detecta bots en las rutas con `/article/` en la URL

## Código Relevante

### Detección de Bots (server/index.js)

```javascript
function isSocialBot(userAgent) {
  const botPatterns = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    // ... más bots
  ];
  return botPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
}
```

### Meta Tags Generados

```html
<meta property="og:image" content="https://sitio.com/imagen.jpg" />
<meta property="og:image:secure_url" content="https://sitio.com/imagen.jpg" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Título del artículo" />
```

## Notas Importantes

1. **El campo es `image_url`**, no `url_image`. El sistema está configurado correctamente.

2. **Facebook cachea por 30 días** los meta tags. Siempre usa el Debugger después de cambios.

3. **Las imágenes deben ser HTTPS** en producción para que Facebook las acepte.

4. **El servidor Express es necesario** para que esto funcione correctamente.

## Próximos Pasos (Opcional)

Para una solución más robusta en el futuro, considera:
- Implementar SSR (Server-Side Rendering) completo con Next.js o similar
- Usar un servicio de pre-renderizado como Prerender.io
- Cambiar de hash routing (#) a history routing (requiere configuración del servidor)

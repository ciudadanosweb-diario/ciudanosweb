# Social Sharing — Cambios y Pruebas

Resumen de cambios realizados:

- Se mejoró el componente `SocialShare` para incluir la descripción (excerpt/subtitle) en los enlaces de Twitter y WhatsApp.
- Se añadió un botón de **Compartir nativo** (Web Share API) que intenta adjuntar la imagen si el navegador lo soporta.
- Se cambió el router de `BrowserRouter` a `HashRouter` para evitar errores 404 al abrir rutas directas en hosts estáticos sin fallback (`/#/article/:id`).

Cómo probar localmente:

1. Ejecuta `npm run dev` y abre `http://localhost:5173/`.
2. Abre un artículo y: 
   - Prueba el botón **Compartir** → **Compartir...** (nativo) en móvil o navegadores que soporten Web Share API.
   - Prueba **Twitter** / **WhatsApp** → asegúrate que el texto incluya el título y la descripción.
   - Prueba **Copiar enlace** y pega el enlace en otra pestaña; con `HashRouter` el enlace debería abrir el artículo (URL con `/#/article/<id>`).

Notas importantes:

- Las redes sociales (Facebook/LinkedIn/Twitter) obtienen metadatos OG desde el HTML que el crawler solicita. El sitio actualmente inserta meta tags en el cliente (JS) cuando se carga un artículo, lo que no garantiza que los *crawlers* vean esos meta tags.
- Si necesitas que previews en redes muestren siempre correctamente imagen y descripción, hay dos opciones recomendadas:
  1. Implementar SSR o prerender (mejor para SEO y social preview consistente).
  2. Crear endpoints que devuelvan HTML con meta tags para que los crawlers obtengan la información al solicitar la URL.

Si quieres, puedo implementar prerender/SSR o crear una ruta que sirva páginas con OG tags para los bots. Dime cuál prefieres y procedo.

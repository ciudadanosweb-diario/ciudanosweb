# Ciudadanos Digital - Portal de Noticias 📰

Portal de noticias ciudadanas de La Banda y Santiago del Estero, desarrollado con React, TypeScript, Vite y Supabase.

## 🚀 Deploy en Netlify

Este proyecto está completamente configurado para Netlify con soporte para:
- ✅ Compartir en Facebook, WhatsApp, Twitter, LinkedIn
- ✅ Meta tags Open Graph dinámicos
- ✅ Detección automática de bots de redes sociales
- ✅ Funciones serverless para SEO
- ✅ Imágenes optimizadas

### Desplegar Ahora

```bash
# Verificar que todo está listo
bash scripts/pre-deploy-check.sh

# O usar el menú interactivo
bash deploy.sh
```

**📖 Documentación Completa:**
- **[README_SOLUCION.md](./README_SOLUCION.md)** ⭐ - Resumen ejecutivo y pasos rápidos
- **[NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md)** - Guía detallada paso a paso
- **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** - Checklist de verificación
- **[GUIA_COMPARTIR_FACEBOOK.md](./GUIA_COMPARTIR_FACEBOOK.md)** - Guía específica de Facebook

### Configuración Rápida en Netlify

1. **Conectar GitHub**: Importa tu repositorio en Netlify
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. **Variables de entorno** (Site Settings → Environment Variables):
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima
   ```
4. **Deploy!** 🎉

## ✨ Características

### Para Usuarios
- 📱 **Diseño responsive** - Funciona en móviles, tablets y desktop
- 🎨 **Interfaz moderna** - Diseñada con Tailwind CSS
- 📰 **Noticias por categorías** - Política, Deportes, Cultura, etc.
- 🔍 **Búsqueda y filtros** - Encuentra noticias fácilmente
- 🖼️ **Galerías de imágenes** - Visualización optimizada
- 📊 **Contador de vistas** - Artículos más leídos
- 🔗 **Compartir en redes** - Facebook, WhatsApp, Twitter, LinkedIn con preview

### Para Administradores
- 🔐 **Panel de administración** - Gestión completa de contenido
- ✍️ **Editor Markdown** - Escritura con preview en tiempo real
- 🖼️ **Gestión de imágenes** - Upload con compresión automática
- 📊 **Sistema de anuncios** - Gestión de publicidad
- 👥 **Control de usuarios** - Administración de permisos
- 📈 **Estadísticas** - Vistas, engagement, etc.

### Para Redes Sociales
- 🤖 **Detección de bots** - Sirve meta tags optimizados
- 🖼️ **Preview con imagen** - Facebook, WhatsApp, etc.
- 📝 **Meta tags dinámicos** - Título, descripción e imagen por artículo
- 🔗 **URLs amigables** - Compatible con hash routing
- ⚡ **Funciones serverless** - Meta tags generados al vuelo

## 🛠️ Tecnologías

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultra-rápido
- **React Router** - Navegación
- **Tailwind CSS** - Estilos utility-first
- **Lucide React** - Iconos

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL - Base de datos
  - Storage - Almacenamiento de imágenes
  - Auth - Autenticación
  - RLS - Row Level Security

### Deploy
- **Netlify** - Hosting y CI/CD
  - Functions - Serverless para meta tags
  - Edge - CDN global
  - Redirects - Manejo de rutas SPA

### Herramientas
- **MDEditor** - Editor Markdown
- **browser-image-compression** - Compresión de imágenes
- **ESLint** - Linting
- **PostCSS** - Procesamiento CSS

## 📦 Instalación Local

### Requisitos
- Node.js 20+
- npm o yarn
- Cuenta en Supabase

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/ciudadanosweb-diario/ciudanosweb.git
cd ciudanosweb
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🧪 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo

# Build
npm run build            # Compilar para producción
npm run preview          # Preview del build

# Testing
npm run typecheck        # Verificar tipos TypeScript
npm run lint             # Linter

# Deploy
bash deploy.sh           # Menú interactivo de deploy
bash scripts/pre-deploy-check.sh  # Verificar antes de deploy
node scripts/test-meta-tags.mjs   # Probar meta tags de artículos

# Servidor local
npm run serve            # Build + servidor Express local
```

## 📁 Estructura del Proyecto

```
ciudanosweb/
├── src/
│   ├── components/      # Componentes React
│   │   ├── Header.tsx
│   │   ├── ArticleCard.tsx
│   │   ├── ArticleEditor.tsx
│   │   ├── AdminPanel.tsx
│   │   ├── SocialShare.tsx
│   │   └── ...
│   ├── contexts/        # Context API
│   │   └── AuthContext.tsx
│   ├── lib/            # Utilidades y configuración
│   │   ├── supabase.ts
│   │   └── categories.ts
│   ├── pages/          # Páginas principales
│   │   ├── ArticleDetail.tsx
│   │   └── ArticleEditPage.tsx
│   ├── App.tsx
│   └── main.tsx
├── public/             # Archivos estáticos
│   ├── _redirects     # Redirects de Netlify
│   └── ...
├── netlify/
│   └── functions/     # Funciones serverless
│       └── og-tags.mjs
├── server/            # Servidor Express (opcional)
│   └── index.js
├── scripts/           # Scripts de utilidad
│   ├── pre-deploy-check.sh
│   └── test-meta-tags.mjs
├── supabase/          # Migraciones y queries SQL
│   └── migrations/
├── netlify.toml       # Configuración de Netlify
├── package.json
└── vite.config.ts
```

## 🔐 Autenticación

El sistema usa Supabase Auth con:
- Email y contraseña
- Row Level Security (RLS) para permisos
- Roles de administrador en la tabla `profiles`

## 🖼️ Gestión de Imágenes

- **Upload**: Compresión automática antes de subir
- **Storage**: Bucket público `article-images` en Supabase
- **Optimización**: Imágenes comprimidas a <1MB
- **Formatos**: JPG, PNG, WEBP

## 🎯 URLs para Probar

Tu dominio personalizado:

- Home: `https://ciudadanos-web.com`
- Artículo: `https://ciudadanos-web.com/#/article/ARTICLE_ID`
- Función OG: `https://ciudadanos-web.com/.netlify/functions/og-tags?id=ARTICLE_ID`

### Cómo Funciona

1. Usuario comparte enlace de artículo
2. Facebook/WhatsApp/Twitter visitan la URL
3. Netlify detecta el bot
4. Función serverless genera HTML con meta tags
5. Bot lee: título, descripción e **imagen**
6. Red social muestra preview con imagen

### Probar

1. Publica un artículo con imagen
2. Copia la URL
3. Ve a [Facebook Debugger](https://developers.facebook.com/tools/debug/)
4. Pega la URL y haz clic en "Scrape Again"
5. Verifica que aparezca la imagen

## 🐛 Troubleshooting

### "Page not found" en Netlify

**Solución**: Verifica que `dist/_redirects` existe después del build.

```bash
npm run build
ls -la dist/_redirects
```

### Imagen no aparece en Facebook

**Solución**: 
1. Verifica que la imagen es pública
2. Usa el Facebook Debugger y "Scrape Again" 2-3 veces
3. Ejecuta: `node scripts/test-meta-tags.mjs`

### Función serverless falla

**Solución**:
1. Verifica variables de entorno en Netlify
2. Revisa logs: Netlify Dashboard → Functions → og-tags → Logs

## 📊 Base de Datos

### Tablas Principales

- **articles** - Artículos/noticias
  - `id`, `title`, `subtitle`, `content`, `excerpt`
  - `image_url` ⭐ - URL de la imagen principal
  - `category`, `is_featured`, `view_count`

> **Nota:** se añadió una política RLS especial que permite a cualquier
> visitante incrementar `view_count` sin necesidad de ser administrador.  La
> actualización se realiza de forma atómica mediante una migración nueva.
  - `published_at`, `created_at`, `updated_at`

- **profiles** - Perfiles de usuario
  - `id`, `email`, `full_name`
  - `is_admin` - Control de permisos

- **ads** - Sistema de anuncios
  - `id`, `title`, `image_url`, `link_url`
  - `is_active`, `position`

## 🚦 Estado del Proyecto

- ✅ Frontend completo y funcional
- ✅ Backend con Supabase configurado
- ✅ Autenticación y autorización
- ✅ Sistema de artículos y categorías
- ✅ Gestión de imágenes
- ✅ Sistema de anuncios
- ✅ Compartir en redes sociales
- ✅ Deploy en Netlify optimizado
- ✅ Meta tags Open Graph dinámicos

## 📝 Licencia

Ver archivo [LICENSE](./LICENSE)

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas con el deploy o configuración:
1. Revisa [README_SOLUCION.md](./README_SOLUCION.md)
2. Consulta [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md)
3. Ejecuta `bash scripts/pre-deploy-check.sh`
4. Abre un issue en GitHub

---

**Hecho con ❤️ para la comunidad de La Banda y Santiago del Estero**

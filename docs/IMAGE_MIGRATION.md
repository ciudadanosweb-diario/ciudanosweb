# Migración de Imágenes a la Carpeta "imagenes"

## Problema
Las imágenes de los artículos no se muestran porque están almacenadas en carpetas de usuario (ej: `{user_id}/{filename}`) pero el código ahora busca en la carpeta `imagenes/`.

## Solución

### Paso 1: Mover imágenes en Supabase Storage

Debes mover manualmente las imágenes desde las carpetas de usuario a la carpeta `imagenes/` en el bucket `article-images`:

1. Ve al panel de Supabase: https://supabase.com/dashboard
2. Navega a **Storage** > **article-images**
3. Para cada imagen en carpetas de usuario:
   - Descarga la imagen localmente
   - Súbela a la carpeta `imagenes/` con el mismo nombre (conservando el timestamp)
   - Opcionalmente, elimina la imagen de la carpeta de usuario antigua

**Alternativa usando la API de Supabase:**

Si hay muchas imágenes, puedes crear un script Node.js para moverlas automáticamente:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Necesitas la clave de servicio
);

async function migrateImages() {
  // 1. Listar todas las carpetas de usuario
  const { data: folders } = await supabase.storage
    .from('article-images')
    .list('', { limit: 1000 });
  
  for (const folder of folders) {
    if (folder.id && !folder.name.includes('.')) {
      // Es una carpeta de usuario
      const { data: files } = await supabase.storage
        .from('article-images')
        .list(folder.name, { limit: 1000 });
      
      for (const file of files) {
        const oldPath = `${folder.name}/${file.name}`;
        const newPath = `imagenes/${file.name}`;
        
        // Copiar archivo
        const { data: fileData } = await supabase.storage
          .from('article-images')
          .download(oldPath);
        
        await supabase.storage
          .from('article-images')
          .upload(newPath, fileData, { upsert: true });
        
        console.log(`Movido: ${oldPath} -> ${newPath}`);
      }
    }
  }
}

migrateImages();
```

### Paso 2: Actualizar URLs en la base de datos

Una vez que las imágenes estén en la carpeta `imagenes/`, ejecuta la migración SQL:

```bash
# Desde el directorio del proyecto
psql "YOUR_DATABASE_URL" -f supabase/migrations/20251202_migrate_image_paths_to_imagenes.sql
```

O ejecuta directamente desde el panel de Supabase:
1. Ve a **SQL Editor**
2. Copia y pega el contenido de `supabase/migrations/20251202_migrate_image_paths_to_imagenes.sql`
3. Ejecuta la query

### Paso 3: Verificar

Después de la migración:
1. Verifica que las imágenes aparezcan en los artículos
2. Comprueba que las nuevas imágenes que subas se guarden correctamente en `imagenes/`

## Notas

- ✅ El código ya está actualizado para usar `imagenes/` en todos los componentes
- ⚠️ Las imágenes antiguas necesitan ser migradas manualmente o con script
- ✅ La migración SQL actualiza automáticamente las URLs en la base de datos
- 🔒 Asegúrate de hacer backup antes de ejecutar la migración

## Estado Actual

- **ArticleEditor.tsx**: ✅ Actualizado - usa `imagenes/{timestamp}-{filename}`
- **ImageGallery.tsx**: ✅ Actualizado - lista y sube a `imagenes/`
- **AdsManager.tsx**: ✅ Actualizado - usa `imagenes/{timestamp}-{filename}`
- **AdminPanel.tsx**: ✅ Actualizado - usa `imagenes/{timestamp}-{filename}`
- **Migración de imágenes existentes**: ⏳ Pendiente (manual o script)
- **Migración SQL de URLs**: ⏳ Pendiente (ejecutar migration)

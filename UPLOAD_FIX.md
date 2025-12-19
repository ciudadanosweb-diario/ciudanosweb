# Fix: Problema de Carga de Imágenes Infinita

## Problema Identificado
Cuando la carga de una imagen fallaba, el modal quedaba en estado infinito de "subiendo" sin forma de cancelar o cerrar, haciendo la aplicación inutilizable.

## Soluciones Implementadas

### 1. **Timeout de Carga (60 segundos)**
   - Se agregó un timeout de 60 segundos para detectar cargas que se cuelgan
   - Después de 60 segundos sin respuesta, se cancela la carga automáticamente
   - Se muestra un mensaje de error al usuario

### 2. **Botón de Cancelar**
   - Nuevo botón "Cancelar carga" visible durante el proceso de subida
   - Permite al usuario cancelar la operación en cualquier momento
   - Utiliza `AbortController` para interrumpir el fetch

### 3. **Mejor Manejo de Errores**
   - Los errores ahora se muestran en un mensaje visual en lugar de alerts
   - El mensaje desaparece automáticamente después de 5 segundos
   - El usuario puede cerrar manualmente el mensaje de error

### 4. **Estados Garantizados**
   - Los refs (`AbortController`, timeout) se limpian correctamente
   - Los estados se resetean en todos los casos de error
   - El componente no se queda en estado indefinido

## Cambios en Archivos

### `src/components/ImageGallery.tsx`
- Agregados imports: `AlertCircle`, `useRef`
- Nuevos estados: `uploadError`, referencias para `AbortController` y timeout
- Nueva función: `handleCancelUpload()`
- Actualizada función: `handleImageUpload()` con timeout y AbortController
- Actualizada UI: mostrar mensajes de error y botón de cancelar

### `src/components/ArticleEditor.tsx`
- Agregado import: `AlertCircle`
- Nuevos estados: `uploadError`, referencias para `AbortController` y timeout
- Nueva función: `handleCancelUpload()`
- Actualizada función: `handleImageUpload()` con timeout y AbortController
- Actualizada UI: mostrar mensajes de error y botón de cancelar

## Comportamiento del Usuario

### Flujo Normal (Exitoso)
1. Usuario selecciona imagen
2. Se comprime
3. Se sube correctamente
4. Se muestra preview
5. Modal se cierra automáticamente

### Flujo con Error
1. Usuario selecciona imagen
2. Se comprime
3. Error durante la carga (después de 60s o error del servidor)
4. Se muestra mensaje de error rojo
5. Usuario puede:
   - Seleccionar otra imagen e intentar de nuevo
   - Cerrar el modal
   - El estado está limpio para reintentar

### Flujo de Cancelación
1. Usuario selecciona imagen
2. Se comprime
3. Usuario hace clic en "Cancelar carga"
4. La carga se interrumpe inmediatamente
5. El modal vuelve a su estado normal para reintentar

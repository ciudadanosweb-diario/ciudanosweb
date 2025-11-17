## Compresión de Imágenes - Guía de Implementación

### Descripción General
Las imágenes subidas al bucket de Supabase se comprimen automáticamente al 80% de calidad antes de ser almacenadas, lo que reduce significativamente el tamaño del archivo (típicamente un 60-80% de reducción).

### Características

1. **Compresión Automática**:
   - Calidad: 80% (20% de reducción)
   - Formato: JPEG
   - Tamaño máximo después de comprimir: 1MB
   - Dimensión máxima: 1920px de ancho/alto

2. **Límites de Archivo**:
   - Tamaño máximo antes de comprimir: 10MB
   - Validaciones:
     - Solo archivos de imagen válidos
     - Validación de tipo MIME
     - Validación de tamaño

3. **Progreso de Carga**:
   - 0% → Inicio
   - 25% → Compresión iniciada
   - 50% → Compresión completada
   - 75% → Carga a Supabase iniciada
   - 100% → Completado

### Librería Utilizada
- **browser-image-compression**: Compresión de imágenes lado del cliente
- Ventajas:
  - Procesa en el navegador (no requiere servidor)
  - Web Workers para no bloquear la UI
  - Soporte para formatos múltiples
  - Cálculo inteligente de dimensiones

### Estadísticas Esperadas
Ejemplo: Una imagen de 5MB
- **Original**: 5,000 KB
- **Comprimida**: 800-1,000 KB (reducción del 80-84%)

### Uso en AdminPanel
```typescript
// El botón "Subir" en el modal de creación de artículos
1. Click en "Subir"
2. Selecciona una imagen
3. La imagen se comprime automáticamente
4. La barra de progreso muestra el estado
5. La URL se completa automáticamente
6. La imagen comprimida se sube a Supabase
```

### Logs en Consola
Al comprimir una imagen, verás en la consola del navegador:
```
Imagen original: 5242880 bytes
Imagen comprimida: 842000 bytes
Reducción: 84 %
```

### Consideraciones de Calidad
- Calidad 80% es imperceptible a la vista en mayoría de casos
- Ideal para imágenes de artículos en web
- No afecta la experiencia visual del usuario
- Ahorra almacenamiento y ancho de banda significativamente

### Manejo de Errores
- Valida tipo de archivo antes de comprimir
- Valida tamaño inicial
- Manejo de errores de compresión
- Manejo de errores de carga a Supabase
- Mensajes de error claros al usuario

### Futuras Mejoras
- Generar múltiples versiones (thumbnail, medium, full)
- Usar WebP si el navegador lo soporta
- Caché local antes de subir
- Edición de imagen antes de cargar

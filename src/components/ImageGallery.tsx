import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, X, Loader, CheckCircle, Image as ImageIcon, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ImageGalleryProps = {
  onSelectImage?: (url: string) => void;
  selectionMode?: boolean;
  onClose?: () => void;
};

type StorageImage = {
  name: string;
  url: string;
  created_at: string;
  size: number;
};

export default function ImageGallery({ onSelectImage, selectionMode = false, onClose }: ImageGalleryProps) {
  const { user } = useAuth();
  const [images, setImages] = useState<StorageImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadImages();
    
    // Cleanup al desmontar
    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      
      // Listar todos los archivos en la carpeta 'imagenes'
      const { data: files, error: filesError } = await supabase.storage
        .from('article-images')
        .list('imagenes', {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (filesError) throw filesError;

      console.log('📂 Archivos en imagenes:', files);

      const allImages: StorageImage[] = [];

      // Procesar todos los archivos encontrados
      files.forEach(file => {
        if (file.name !== '.emptyFolderPlaceholder') {
          const fullPath = `imagenes/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('article-images')
            .getPublicUrl(fullPath);

          allImages.push({
            name: file.name,
            url: publicUrl,
            created_at: file.created_at,
            size: file.metadata?.size || 0,
          });
        }
      });

      console.log('🖼️ Total de imágenes encontradas:', allImages.length);
      
      // Ordenar por fecha de creación (más recientes primero)
      allImages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setImages(allImages);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
      alert('Error al cargar la galería de imágenes');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      console.log('📁 No se seleccionó archivo o usuario no autenticado:', { file: !!file, user: !!user });
      return;
    }

    if (!file.type.startsWith('image/')) {
      console.log('❌ Tipo de archivo inválido:', file.type);
      setUploadError('Por favor selecciona una imagen válida');
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ Archivo demasiado grande:', file.size, 'bytes (máx 10MB)');
      setUploadError('La imagen no debe superar 10MB');
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    console.log('📤 Iniciando subida de imagen a galería:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    setUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    // Crear nuevo AbortController para esta carga
    abortControllerRef.current = new AbortController();

    // Establecer timeout de 60 segundos
    uploadTimeoutRef.current = setTimeout(() => {
      abortControllerRef.current?.abort();
      setUploading(false);
      setUploadProgress(0);
      setUploadError('Tiempo de carga agotado. Intenta de nuevo con una imagen más pequeña.');
      console.error('❌ Timeout en carga de imagen');
    }, 60000);

    try {
      // Comprimir imagen
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        quality: 0.8,
      };

      console.log('🗜️ Comenzando compresión...');
      setUploadProgress(30);
      const compressedFile = await imageCompression(file, options);
      console.log('✅ Imagen comprimida:', {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: Math.round((1 - compressedFile.size / file.size) * 100) + '%'
      });

      setUploadProgress(50);

      // Crear nombre único
      const timestamp = Date.now();
      const fileName = `imagenes/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      console.log('📝 Nombre de archivo generado:', fileName);

      // Obtener sesión
      console.log('🔐 Verificando sesión...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No hay sesión activa');
        throw new Error('No hay sesión activa');
      }
      console.log('✅ Sesión verificada');

      // Subir usando fetch directo
      const uploadUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/article-images/${fileName}`;
      console.log('☁️ Subiendo via fetch a:', uploadUrl);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'false',
        },
        body: compressedFile,
        signal: abortControllerRef.current.signal,
      });

      console.log('📡 Respuesta del servidor:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        ok: uploadResponse.ok
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('❌ Error en respuesta del servidor:', errorData);
        throw new Error(errorData.message || 'Error al subir imagen');
      }

      console.log('✅ Archivo subido exitosamente via fetch');
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
        setUploadError(null);
        loadImages(); // Recargar galería
      }, 1000);

      console.log('🎉 Subida completada exitosamente');
    } catch (error: any) {
      console.error('💥 Error completo en subida de imagen:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code,
        details: error.details
      });
      
      if (error.name === 'AbortError') {
        setUploadError('Carga cancelada o tiempo agotado');
      } else {
        setUploadError(`Error al subir: ${error.message}`);
      }
      
      setUploading(false);
      setUploadProgress(0);
    } finally {
      // Limpiar timeout
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    }

    e.target.value = '';
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
    }
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    console.log('🛑 Carga cancelada por usuario');
  };

  const handleDeleteImage = async (imageName: string) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase.storage
        .from('article-images')
        .remove([imageName]);

      if (error) throw error;

      alert('Imagen eliminada exitosamente');
      loadImages(); // Recargar galería
    } catch (error: any) {
      console.error('Error al eliminar imagen:', error);
      alert(`Error al eliminar la imagen: ${error.message}`);
    }
  };

  const handleSelectImage = (url: string) => {
    if (selectionMode && onSelectImage) {
      setSelectedImage(url);
      onSelectImage(url);
      if (onClose) {
        setTimeout(onClose, 300);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ImageIcon size={24} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Galería de Imágenes</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Upload Section */}
      <div className="p-4 border-b bg-gray-50">
        <input
          type="file"
          id="gallery-upload"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={uploading}
        />
        <label
          htmlFor="gallery-upload"
          className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            uploading
              ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
              : 'border-blue-400 hover:border-blue-600 hover:bg-blue-50'
          }`}
        >
          {uploading ? (
            <>
              <Loader size={20} className="animate-spin text-blue-600" />
              <span className="text-gray-700">Subiendo... {uploadProgress}%</span>
            </>
          ) : (
            <>
              <Upload size={20} className="text-blue-600" />
              <span className="text-gray-700 font-medium">Subir nueva imagen</span>
            </>
          )}
        </label>
        
        {/* Progress Bar */}
        {uploading && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <button
              onClick={handleCancelUpload}
              className="w-full px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
            >
              Cancelar carga
            </button>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{uploadError}</p>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size={32} className="animate-spin text-blue-600" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hay imágenes en la galería</p>
            <p className="text-sm mt-2">Sube tu primera imagen usando el botón de arriba</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <div
                key={image.name}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === image.url
                    ? 'border-blue-600 shadow-lg'
                    : 'border-gray-200 hover:border-blue-400'
                } ${selectionMode ? 'cursor-pointer' : ''}`}
                onClick={() => selectionMode && handleSelectImage(image.url)}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Selected Indicator */}
                {selectedImage === image.url && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full">
                    <CheckCircle size={20} />
                  </div>
                )}

                {/* Actions Overlay */}
                {!selectionMode && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleDeleteImage(image.name)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                      title="Eliminar imagen"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}

                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{image.name}</p>
                  <p className="text-gray-300 text-xs">
                    {(image.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      {images.length > 0 && (
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          <p>{images.length} imagen{images.length !== 1 ? 'es' : ''} en la galería</p>
        </div>
      )}
    </div>
  );
}

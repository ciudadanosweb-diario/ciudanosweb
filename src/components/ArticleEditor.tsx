import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Upload, Save, Loader, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { supabase, Article } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ImageGallery from './ImageGallery';
import { getAllCategories, LocalCategory } from '../lib/categories';

type ArticleEditorProps = {
  onClose: () => void;
  onSave: () => void;
  editingArticle?: Article | null;
};

type ArticleForm = {
  title: string;
  subtitle: string;
  content: string;
  excerpt: string;
  category: string; // Slug de la categoría
  image_url: string;
  is_featured: boolean;
  published_at: string | null;
};

export default function ArticleEditor({ onClose, onSave, editingArticle }: ArticleEditorProps) {
  const { user, ensureSessionReady } = useAuth();
  const [categories] = useState<LocalCategory[]>(getAllCategories());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showGallery, setShowGallery] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isSavingRef = useRef<boolean>(false);
  const uploadingRef = useRef<boolean>(false);

  const [formData, setFormData] = useState<ArticleForm>({
    title: '',
    subtitle: '',
    content: '',
    excerpt: '',
    category: '',
    image_url: '',
    is_featured: false,
    published_at: new Date().toISOString(),
  });

  // Generar clave única para localStorage
  const getStorageKey = () => {
    return editingArticle ? `article-draft-${editingArticle.id}` : 'article-draft-new';
  };

  // Guardar en localStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(formData));
      console.log('💾 Guardado en localStorage');
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }, [formData, editingArticle]);

  // Restaurar desde localStorage
  const restoreFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (saved && !editingArticle) {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.content) {
          const shouldRestore = window.confirm(
            '¿Deseas restaurar el borrador guardado automáticamente?'
          );
          if (shouldRestore) {
            setFormData(parsed);
            setImagePreview(parsed.image_url || '');
            console.log('🔄 Restaurado desde localStorage');
          } else {
            localStorage.removeItem(getStorageKey());
          }
        }
      }
    } catch (error) {
      console.error('Error al restaurar desde localStorage:', error);
    }
  }, [editingArticle]);

  // Limpiar localStorage después de guardar exitosamente
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey());
      console.log('🗑️ localStorage limpiado');
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  }, [editingArticle]);

  // Auto-guardado con debounce
  const autoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const currentData = JSON.stringify(formData);
      if (currentData !== lastSavedDataRef.current) {
        saveToLocalStorage();
        lastSavedDataRef.current = currentData;
        setAutoSaveStatus('Guardado automáticamente');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }
    }, 2000); // Espera 2 segundos después del último cambio
  }, [formData, saveToLocalStorage]);

  // Efecto para auto-guardar cuando cambia el formulario
  useEffect(() => {
    if (formData.title || formData.content) {
      autoSave();
    }
  }, [formData, autoSave]);

  // Guardar antes de cerrar/cambiar ventana y resetear estado al volver
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Cuando se oculta la pestaña
        saveToLocalStorage();
        console.log('👁️ Ventana oculta - guardado automático');
      } else {
        // Cuando vuelve a ser visible - RESETEAR estados de UI
        console.log('👁️ Ventana visible - reseteando estados UI');
        if (!isSavingRef.current) {
          setSaving(false);
        }
        if (!uploadingRef.current) {
          setUploading(false);
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formData.title || formData.content) {
        saveToLocalStorage();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, saveToLocalStorage]);

  // Categorías cargadas desde archivo local - no requiere consulta a Supabase
  console.log('📁 Usando categorías locales:', categories.length);

  useEffect(() => {
    // Intentar restaurar borrador
    restoreFromLocalStorage();
    
    if (editingArticle) {
      setFormData({
        title: editingArticle.title,
        subtitle: editingArticle.subtitle || '',
        content: editingArticle.content,
        excerpt: editingArticle.excerpt || '',
        category: editingArticle.category || '',
        image_url: editingArticle.image_url || '',
        is_featured: editingArticle.is_featured || false,
        published_at: editingArticle.published_at || null,
      });
      setImagePreview(editingArticle.image_url || '');
      lastSavedDataRef.current = JSON.stringify({
        title: editingArticle.title,
        subtitle: editingArticle.subtitle || '',
        content: editingArticle.content,
        excerpt: editingArticle.excerpt || '',
        category: editingArticle.category || '',
        image_url: editingArticle.image_url || '',
        is_featured: editingArticle.is_featured || false,
        published_at: editingArticle.published_at || null,
      });
    }
  }, [editingArticle, restoreFromLocalStorage]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('📁 No se seleccionó ningún archivo');
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Tamaño máximo: 10MB');
      return;
    }

    console.log('📤 Iniciando subida de imagen:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Resetear el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = '';

    try {
      setUploading(true);
      uploadingRef.current = true;

      // Comprimir imagen con timeout
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };

      console.log('🗜️ Comenzando compresión de imagen...');
      const compressedFile = await imageCompression(file, options);
      
      console.log('✅ Imagen comprimida:', {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: Math.round((1 - compressedFile.size / file.size) * 100) + '%'
      });

      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      console.log('📝 Nombre de archivo generado:', fileName);

      // VERIFICAR SESIÓN PRIMERO
      console.log('🔐 Verificando sesión...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Error de sesión:', sessionError);
        throw new Error('Error de autenticación. Vuelve a iniciar sesión.');
      }
      
      if (!session) {
        console.error('❌ No hay sesión activa');
        throw new Error('No estás autenticado. Inicia sesión nuevamente.');
      }
      
      console.log('✅ Sesión activa:', session.user.email);

      // Subir con timeout
      console.log('☁️ Subiendo a bucket article-images...');
      console.log('📊 Detalles de subida:', {
        bucket: 'article-images',
        fileName: fileName,
        fileSize: compressedFile.size,
        fileType: compressedFile.type
      });

      const uploadWithTimeout = async () => {
        const uploadPromise = supabase.storage
          .from('article-images')
          .upload(fileName, compressedFile, {
            contentType: compressedFile.type,
            upsert: false,
          });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('⏱️ Timeout: La subida tardó más de 30 segundos')), 30000);
        });

        return Promise.race([uploadPromise, timeoutPromise]);
      };

      console.log('⏳ Esperando respuesta de Supabase...');
      const result = await uploadWithTimeout();
      console.log('📦 Respuesta recibida:', result);

      const { data, error } = result as any;

      if (error) {
        console.error('❌ Error en subida:', error);
        throw new Error(error.message || 'Error al subir imagen');
      }

      if (!data) {
        throw new Error('No se recibió data de la subida');
      }

      console.log('✅ Archivo subido exitosamente:', data);

      // Obtener URL pública
      console.log('🔗 Generando URL pública...');
      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(data.path);

      console.log('✅ URL pública obtenida:', publicUrl);

      setFormData({ ...formData, image_url: publicUrl });
      setImagePreview(publicUrl);
      
      console.log('🎉 Subida completada exitosamente');
      
    } catch (error: any) {
      console.error('💥 Error completo en subida de imagen:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code,
        details: error.details
      });
      
      // Mostrar mensaje de error amigable
      const errorMessage = error.message || 'Error desconocido al subir imagen';
      alert(`Error al subir imagen: ${errorMessage}\n\nIntenta nuevamente o contacta al administrador si el problema persiste.`);
      
    } finally {
      // SIEMPRE desbloquear el botón, sin importar qué suceda
      setUploading(false);
      uploadingRef.current = false;
      console.log('🔓 Botón de subida desbloqueado');
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData({ ...formData, image_url: imageUrl });
    setImagePreview(imageUrl);
    setShowGallery(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Debes estar autenticado');
      return;
    }

    if (!formData.title || !formData.content || !formData.category) {
      alert('Por favor completa título, contenido y categoría');
      return;
    }

    // extraer la lógica de guardado a una función reutilizable
    const saveArticle = async () => {
      console.log('💾 Iniciando guardado de artículo (saveArticle)...');

      // PASO 1: Verificar y asegurar que la sesión esté lista
      console.log('🔐 Verificando sesión antes de guardar...');
      const sessionReady = await ensureSessionReady();
      
      if (!sessionReady) {
        throw new Error('Error de autenticación. Vuelve a iniciar sesión.');
      }

      console.log('✅ Sesión verificada y lista');

      const articleData = {
        title: formData.title,
        subtitle: formData.subtitle,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 150) + '...',
        category: formData.category,
        image_url: formData.image_url,
        is_featured: formData.is_featured,
        published_at: formData.published_at,
        author_id: user!.id,
      };

      console.log('📝 Preparando datos del artículo:', {
        title: articleData.title,
        category: articleData.category,
        hasImage: !!articleData.image_url,
        isFeatured: articleData.is_featured
      });

      // Intentar guardar con reintentos automáticos
      let resultado;
      let intentos = 0;
      const MAX_INTENTOS = 3;

      while (intentos < MAX_INTENTOS) {
        intentos++;
        console.log(`🚀 Intento ${intentos}/${MAX_INTENTOS} de guardado...`);

        try {
          if (editingArticle) {
            console.log('🔄 Actualizando artículo existente:', editingArticle.id);
            resultado = await supabase
              .from('articles')
              .update(articleData)
              .eq('id', editingArticle.id);
          } else {
            console.log('➕ Creando nuevo artículo');
            resultado = await supabase
              .from('articles')
              .insert([articleData]);
          }

          if (!resultado.error) {
            console.log('✅ Guardado exitoso');
            break;
          }

          const errorCode = resultado.error.code;
          const errorMsg = resultado.error.message || '';
          const esErrorPermiso = 
            errorCode === 'PGRST301' || 
            errorCode === '42501' ||
            errorMsg.includes('permission') || 
            errorMsg.includes('JWT') ||
            errorMsg.includes('RLS');

          if (esErrorPermiso && intentos < MAX_INTENTOS) {
            console.warn(`⚠️ Error de permisos, refrescando sesión...`);
            await supabase.auth.refreshSession();
            await new Promise(resolve => setTimeout(resolve, 500));
            continue; // Reintentar
          }

          throw new Error(resultado.error.message);

        } catch (error: any) {
          if (intentos >= MAX_INTENTOS) {
            throw error;
          }
          console.warn(`⚠️ Error en intento ${intentos}, reintentando...`, error);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (resultado?.error) {
        console.error('❌ Error después de todos los intentos:', resultado.error);
        throw new Error(resultado.error.message || 'Error al guardar artículo');
      }

      clearLocalStorage();

      console.log('✅ Artículo guardado exitosamente');
      alert(editingArticle ? 'Artículo actualizado exitosamente' : 'Artículo publicado exitosamente');
      onSave();
      onClose();
    };

    // Ejecutar saveArticle con manejo global de estados
    try {
      isSavingRef.current = true;
      setSaving(true);
      await saveArticle();
    } catch (error: any) {
      console.error('❌ Error completo en handleSubmit:', error);
      if (error?.message?.includes('JWT') || error?.message?.includes('auth') || error?.message?.includes('session')) {
        alert('🔐 Error de sesión. Forzar sesión o vuelve a iniciar sesión.');
      } else {
        alert(error?.message || 'Error al guardar el artículo');
      }
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10 rounded-t-lg">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              {editingArticle ? 'Editar Artículo' : 'Nuevo Artículo'}
            </h2>
            {autoSaveStatus && (
              <span className="text-sm text-green-600 animate-pulse">
                {autoSaveStatus}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Subtítulo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría * {categories.length > 0 && `(${categories.length} disponibles)`}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">
                {categories.length === 0 ? 'Cargando categorías...' : 'Seleccionar categoría'}
              </option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                ⚠️ No se encontraron categorías. Por favor, crea categorías primero.
              </p>
            )}
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen Principal
            </label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Subir Imagen</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <button
                type="button"
                onClick={() => setShowGallery(true)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                <span>Galería</span>
              </button>
            </div>
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido * (Markdown)
            </label>
            <div 
              data-color-mode="light"
              onPaste={() => {
                // Guardar inmediatamente después de pegar
                setTimeout(() => {
                  saveToLocalStorage();
                  console.log('📋 Contenido pegado - guardado automático');
                }, 100);
              }}
              onBlur={() => {
                // Guardar al perder el foco
                saveToLocalStorage();
                console.log('👁️ Editor perdió el foco - guardado automático');
              }}
            >
              <MDEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value || '' })}
                preview="edit"
                hideToolbar={false}
                visibleDragbar={false}
                height={400}
              />
            </div>
          </div>

          {/* Resumen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resumen (opcional)
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Si no se proporciona, se usará el inicio del contenido"
            />
          </div>

          {/* Destacado */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">
              Artículo destacado
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                // Forzar verificación de sesión y reintentar guardar si corresponde
                try {
                  setAutoSaveStatus('Verificando sesión...');
                  const ok = await ensureSessionReady();
                  setAutoSaveStatus('');
                  if (ok) {
                    alert('Sesión verificada. Si el botón estaba tildado, intenta publicar de nuevo.');
                  } else {
                    alert('No se pudo forzar la sesión. Vuelve a iniciar sesión.');
                  }
                } catch (err) {
                  setAutoSaveStatus('');
                  alert('Error al forzar la sesión');
                }
              }}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
            >
              Forzar sesión
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{editingArticle ? 'Actualizar' : 'Publicar'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showGallery && (
        <ImageGallery
          onSelectImage={handleImageSelect}
          selectionMode={true}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}

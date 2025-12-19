import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Save, Loader, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ImageGallery from '../components/ImageGallery';
import { getAllCategories, LocalCategory } from '../lib/categories';

type ArticleForm = {
  title: string;
  subtitle: string;
  content: string;
  excerpt: string;
  category_id: string;
  image_url: string;
  is_featured: boolean;
  published_at: string | null;
};

export default function ArticleEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [categories] = useState<LocalCategory[]>(getAllCategories());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showGallery, setShowGallery] = useState(false);

  const [formData, setFormData] = useState<ArticleForm>({
    title: '',
    subtitle: '',
    content: '',
    excerpt: '',
    category_id: '',
    image_url: '',
    is_featured: false,
    published_at: new Date().toISOString(),
  });

  // Categorías cargadas desde archivo local - no requiere consulta a Supabase
  console.log('📁 Usando categorías locales:', categories.length);

  // 🔄 Verificar sesión cuando la página recibe foco (después de cambiar de pestaña)
  useEffect(() => {
    const handleFocus = async () => {
      console.log('👁️ Ventana enfocada, verificando sesión...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error al verificar sesión:', error);
          return;
        }
        
        if (!session) {
          console.warn('⚠️ Sesión perdida, redirigiendo al login...');
          alert('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
          navigate('/admin');
          return;
        }
        
        // Verificar si el token necesita refrescarse
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeToExpire = expiresAt ? expiresAt - now : Infinity;
        
        if (timeToExpire < 600) { // Menos de 10 minutos
          console.log('🔄 Token próximo a expirar, refrescando preventivamente...');
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('❌ Error al refrescar sesión:', refreshError);
          } else {
            console.log('✅ Sesión refrescada preventivamente');
          }
        } else {
          console.log(`✅ Sesión válida (${Math.floor(timeToExpire / 60)} minutos restantes)`);
        }
      } catch (error) {
        console.error('❌ Error al verificar sesión:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [navigate]);

  const loadArticle = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title,
          subtitle: data.subtitle || '',
          content: data.content,
          excerpt: data.excerpt || '',
          category_id: data.category_id || '',
          image_url: data.image_url || '',
          is_featured: data.is_featured || false,
          published_at: data.published_at || null,
        });
        setImagePreview(data.image_url || '');
      }
    } catch (error: any) {
      console.error('Error cargando artículo:', error);
      alert('Error al cargar el artículo: ' + error.message);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/admin');
      return;
    }

    if (id && id !== 'new') {
      loadArticle();
    } else {
      setLoading(false);
    }
  }, [user, isAdmin, id, loadArticle, navigate]);

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

      // Subir con timeout de 30 segundos
      console.log('☁️ Subiendo a bucket article-images...');
      console.log('📊 Detalles de subida:', {
        bucket: 'article-images',
        fileName: fileName,
        fileSize: compressedFile.size,
        fileType: compressedFile.type
      });

      // Crear Promise con timeout
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

    if (!formData.title || !formData.content || !formData.category_id) {
      alert('Por favor completa título, contenido y categoría');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Iniciando guardado de artículo...');

      // 🔐 VERIFICAR Y REFRESCAR SESIÓN ANTES DE GUARDAR
      console.log('🔐 Verificando sesión antes de guardar...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Error al verificar sesión:', sessionError);
        throw new Error('Error de sesión. Por favor, vuelve a iniciar sesión.');
      }

      if (!session) {
        console.error('❌ No hay sesión activa');
        throw new Error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
      }

      console.log('✅ Sesión activa confirmada:', session.user.email);

      // Si el token está próximo a expirar (menos de 5 minutos), refrescarlo
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeToExpire = expiresAt ? expiresAt - now : Infinity;
      
      if (timeToExpire < 300) { // Menos de 5 minutos
        console.log('⚠️ Token próximo a expirar, refrescando...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Error al refrescar sesión:', refreshError);
          throw new Error('No se pudo refrescar la sesión. Por favor, vuelve a iniciar sesión.');
        }
        
        if (refreshData.session) {
          console.log('✅ Sesión refrescada exitosamente');
        }
      } else {
        console.log(`✅ Token válido por ${Math.floor(timeToExpire / 60)} minutos más`);
      }

      // Preparar datos del artículo
      const articleData = {
        title: formData.title,
        subtitle: formData.subtitle,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 150) + '...',
        category_id: formData.category_id,
        image_url: formData.image_url,
        is_featured: formData.is_featured,
        published_at: formData.published_at,
        author_id: user.id,
      };

      console.log('📝 Guardando artículo en base de datos...');

      let error;
      if (id && id !== 'new') {
        console.log('🔄 Actualizando artículo existente:', id);
        const result = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id);
        error = result.error;
      } else {
        console.log('➕ Creando nuevo artículo');
        const result = await supabase
          .from('articles')
          .insert([articleData]);
        error = result.error;
      }

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }

      console.log('✅ Artículo guardado exitosamente');
      alert('Artículo guardado correctamente');
      navigate('/admin');
    } catch (error: any) {
      console.error('❌ Error al guardar artículo:', error);
      
      // Mensaje de error más descriptivo
      let errorMessage = 'Error desconocido';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `Error código: ${error.code}`;
      }
      
      alert(`Error al guardar artículo: ${errorMessage}\n\nSi el problema persiste, intenta cerrar sesión y volver a entrar.`);
    } finally {
      setSaving(false);
      console.log('🔓 Guardado finalizado');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver al Panel</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {id === 'new' ? 'Nuevo Artículo' : 'Editar Artículo'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
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
              placeholder="Título del artículo"
              required
            />
          </div>

          {/* Subtítulo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo (opcional)
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Subtítulo del artículo"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del artículo
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
              </label>
              <button
                type="button"
                onClick={() => setShowGallery(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Galería</span>
              </button>
            </div>
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-md h-auto rounded-lg shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido * (Markdown)
            </label>
            <div data-color-mode="light">
              <MDEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value || '' })}
                preview="edit"
                hideToolbar={false}
                visibleDragbar={false}
                height={500}
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

          {/* Fecha de publicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de publicación
            </label>
            <input
              type="datetime-local"
              value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, published_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Galería de imágenes */}
      {showGallery && (
        <ImageGallery
          onClose={() => setShowGallery(false)}
          onSelectImage={handleImageSelect}
        />
      )}
    </div>
  );
}
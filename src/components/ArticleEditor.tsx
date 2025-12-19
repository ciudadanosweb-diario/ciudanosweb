import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Save, Loader, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase, Article, Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ImageGallery from './ImageGallery';

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
  category_id: string;
  image_url: string;
  is_featured: boolean;
  published_at: string | null;
};

// Configuración del editor de texto enriquecido
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'align',
  'link',
];

// Clave para localStorage
const DRAFT_STORAGE_KEY = 'article_draft';
const DRAFT_TIMESTAMP_KEY = 'article_draft_timestamp';

export default function ArticleEditor({ onClose, onSave, editingArticle }: ArticleEditorProps) {
  const { user } = useAuth();
  const quillRef = useRef<ReactQuill>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showGallery, setShowGallery] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftNotification, setShowDraftNotification] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Monitor de conexión
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexión restaurada en ArticleEditor');
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.warn('⚠️ Conexión perdida en ArticleEditor');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Guardar borrador en localStorage
  const saveDraft = (data: ArticleForm) => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(DRAFT_TIMESTAMP_KEY, new Date().toISOString());
      setLastSaved(new Date());
      console.log('💾 Borrador autoguardado en localStorage');
    } catch (error) {
      console.error('❌ Error al guardar borrador:', error);
    }
  };

  // Cargar borrador desde localStorage
  const loadDraft = () => {
    try {
      const draftData = localStorage.getItem(DRAFT_STORAGE_KEY);
      const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);
      
      if (draftData && timestamp) {
        const draft = JSON.parse(draftData) as ArticleForm;
        const savedTime = new Date(timestamp);
        console.log('📋 Borrador encontrado del:', savedTime.toLocaleString());
        return { draft, savedTime };
      }
    } catch (error) {
      console.error('❌ Error al cargar borrador:', error);
    }
    return null;
  };

  // Limpiar borrador de localStorage
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
      setHasDraft(false);
      setLastSaved(null);
      console.log('🗑️ Borrador eliminado de localStorage');
    } catch (error) {
      console.error('❌ Error al limpiar borrador:', error);
    }
  };

  // Restaurar borrador
  const restoreDraft = () => {
    const draftInfo = loadDraft();
    if (draftInfo) {
      setFormData(draftInfo.draft);
      setImagePreview(draftInfo.draft.image_url);
      setLastSaved(draftInfo.savedTime);
      setShowDraftNotification(false);
      console.log('✅ Borrador restaurado');
    }
  };

  // Descartar borrador
  const discardDraft = () => {
    clearDraft();
    setShowDraftNotification(false);
    console.log('✅ Borrador descartado');
  };

  useEffect(() => {
    console.log('🎬 ArticleEditor montado');
    console.log('👤 Usuario actual:', user?.id || 'No autenticado');
    console.log('✏️ Modo:', editingArticle ? `Editando artículo ${editingArticle.id}` : 'Nuevo artículo');
    
    loadCategories();
    
    if (editingArticle) {
      console.log('📝 Cargando datos del artículo para edición:', {
        id: editingArticle.id,
        title: editingArticle.title,
        category_id: editingArticle.category_id,
        image_url: editingArticle.image_url,
      });
      
      setFormData({
        title: editingArticle.title,
        subtitle: editingArticle.subtitle || '',
        content: editingArticle.content,
        excerpt: editingArticle.excerpt || '',
        category_id: editingArticle.category_id || '',
        image_url: editingArticle.image_url || '',
        is_featured: editingArticle.is_featured || false,
        published_at: editingArticle.published_at || null,
      });
      setImagePreview(editingArticle.image_url || '');
      console.log('✅ Formulario inicializado con datos del artículo');
    } else {
      // Solo para artículos nuevos, verificar si hay borrador
      const draftInfo = loadDraft();
      if (draftInfo) {
        setHasDraft(true);
        setShowDraftNotification(true);
        console.log('⚠️ Se encontró un borrador guardado');
      }
      console.log('✅ Formulario inicializado para nuevo artículo');
    }

    // Limpiar timer al desmontar
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [editingArticle]);

  // Autoguardado cuando cambia formData (solo para artículos nuevos)
  useEffect(() => {
    if (!editingArticle && formData.title) {
      // Cancelar timer anterior
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Guardar después de 2 segundos de inactividad
      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft(formData);
      }, 2000);
    }
  }, [formData, editingArticle]);

  const loadCategories = async () => {
    try {
      console.log('📂 Cargando categorías...');
      const { data, error } = await supabase.from('categories').select('*').order('name');
      
      if (error) {
        console.error('❌ Error al cargar categorías:', error);
        alert(`Error al cargar categorías: ${error.message}`);
        return;
      }
      
      if (data) {
        console.log('✅ Categorías cargadas:', data.length);
        setCategories(data);
      } else {
        console.warn('⚠️ No se encontraron categorías');
        setCategories([]);
      }
    } catch (error: any) {
      console.error('❌ Excepción al cargar categorías:', error);
      alert(`Error al cargar categorías: ${error.message}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida (JPEG, PNG, etc.)');
      return;
    }

    // Validar tamaño inicial (máximo 10MB antes de comprimir)
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen no debe superar 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      console.log('📤 Iniciando subida de imagen...');
      console.log('Archivo original:', file.name, 'Tamaño:', (file.size / 1024).toFixed(2), 'KB');

      // Comprimir imagen
      const options = {
        maxSizeMB: 1, // Máximo 1MB después de comprimir
        maxWidthOrHeight: 1920, // Resolución máxima
        useWebWorker: true,
        quality: 0.8, // 80% de calidad
      };

      setUploadProgress(30);
      const compressedFile = await imageCompression(file, options);
      
      console.log('✅ Imagen comprimida:', (compressedFile.size / 1024).toFixed(2), 'KB');
      console.log('Reducción:', Math.round((1 - compressedFile.size / file.size) * 100), '%');

      setUploadProgress(50);

      // Crear nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `imagenes/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      console.log('📁 Subiendo a Supabase:', fileName);

      // Obtener el token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Subir usando fetch directo para evitar problemas de Content-Type
      const uploadUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/article-images/${fileName}`;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'false',
        },
        body: compressedFile,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('❌ Error al subir a Supabase:', errorData);
        throw new Error(errorData.message || 'Error al subir imagen');
      }

      const uploadData = await uploadResponse.json();
      console.log('✅ Archivo subido exitosamente:', uploadData);

      setUploadProgress(80);

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      console.log('🔗 URL pública generada:', publicUrl);

      // Actualizar formulario y preview usando el patrón funcional
      setFormData(prevData => ({ ...prevData, image_url: publicUrl }));
      setImagePreview(publicUrl);
      setUploadProgress(100);

      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
      }, 1000);

      console.log('✅ Proceso completado exitosamente');
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      alert(`Error al subir la imagen: ${error.message || 'Error desconocido'}`);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Iniciando proceso de guardado...');

    // Validación de campos requeridos
    if (!formData.title.trim()) {
      console.warn('⚠️ Falta título');
      alert('Por favor ingresa un título');
      return;
    }

    if (!formData.category_id) {
      console.warn('⚠️ Falta categoría');
      alert('Por favor selecciona una categoría');
      return;
    }

    if (!formData.content.trim()) {
      console.warn('⚠️ Falta contenido');
      alert('Por favor ingresa el contenido del artículo');
      return;
    }

    // Verificar autenticación
    console.log('🔐 Verificando autenticación...');
    if (!user) {
      console.error('❌ Usuario no autenticado');
      alert('Error: No hay sesión activa. Por favor inicia sesión nuevamente.');
      return;
    }
    console.log('✅ Usuario autenticado:', user.id);

    setSaving(true);

    try {
      // Verificar sesión actual
      console.log('🔍 Verificando sesión actual...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Error al obtener sesión:', sessionError);
        throw new Error(`Error de sesión: ${sessionError.message}`);
      }
      
      if (!sessionData.session) {
        console.error('❌ No hay sesión activa');
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      console.log('✅ Sesión válida, token expira en:', new Date(sessionData.session.expires_at! * 1000));

      // Verificar que el usuario es admin
      console.log('👤 Verificando permisos de administrador...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Error al verificar perfil:', profileError);
        throw new Error(`Error al verificar permisos: ${profileError.message}`);
      }
      
      if (!profileData?.is_admin) {
        console.error('❌ Usuario no es administrador');
        throw new Error('No tienes permisos de administrador para crear/editar artículos.');
      }
      console.log('✅ Usuario es administrador');

      // Preparar datos del artículo
      const articleData = {
        title: formData.title,
        subtitle: formData.subtitle,
        content: formData.content,
        excerpt: formData.excerpt,
        category_id: formData.category_id,
        image_url: formData.image_url,
        is_featured: formData.is_featured,
        published_at: formData.published_at,
        author_id: user.id,
        updated_at: new Date().toISOString(),
      };

      console.log('💾 Guardando artículo con datos:', {
        ...articleData,
        content: `${articleData.content.substring(0, 50)}...`,
      });

      let result;
      let error;

      // Timeout para la operación de base de datos
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: La operación tardó demasiado (30s)')), 30000)
      );

      if (editingArticle) {
        // Actualizar artículo existente
        console.log('📝 Actualizando artículo existente ID:', editingArticle.id);
        const updatePromise = supabase
          .from('articles')
          .update(articleData)
          .eq('id', editingArticle.id)
          .select();
        
        result = await Promise.race([updatePromise, timeout]);
        error = result.error;
        
        if (!error) {
          console.log('✅ Artículo actualizado exitosamente:', result.data);
        }
      } else {
        // Crear nuevo artículo
        console.log('➕ Creando nuevo artículo...');
        const insertPromise = supabase
          .from('articles')
          .insert([{ ...articleData, created_at: new Date().toISOString() }])
          .select();
        
        result = await Promise.race([insertPromise, timeout]);
        error = result.error;
        
        if (!error) {
          console.log('✅ Artículo creado exitosamente:', result.data);
        }
      }

      if (error) {
        console.error('❌ Error de Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log('🎉 Artículo guardado exitosamente');
      
      // Limpiar borrador de localStorage al guardar exitosamente
      clearDraft();
      
      alert(editingArticle ? 'Artículo actualizado exitosamente' : 'Artículo creado exitosamente');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('❌ Error completo al guardar artículo:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      // Mensajes de error más específicos
      let errorMessage = 'Error desconocido';
      
      if (error.message.includes('Timeout')) {
        errorMessage = 'La operación tardó demasiado. Verifica tu conexión a internet.';
      } else if (error.message.includes('JWT expired') || error.message.includes('refresh_token')) {
        errorMessage = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
      } else if (error.message.includes('permission denied') || error.message.includes('policy')) {
        errorMessage = 'No tienes permisos para realizar esta acción.';
      } else if (error.code === 'PGRST116') {
        errorMessage = 'Error de permisos en la base de datos.';
      } else if (!navigator.onLine) {
        errorMessage = 'No hay conexión a internet. Por favor verifica tu conexión.';
      } else {
        errorMessage = error.message || 'Error al guardar el artículo';
      }
      
      alert(`Error al guardar: ${errorMessage}`);
    } finally {
      console.log('🏁 Finalizando proceso de guardado');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingArticle ? 'Editar Artículo' : 'Nuevo Artículo'}
            </h2>
            {/* Indicador de conexión */}
            {!isOnline && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                <span className="font-medium">Sin conexión a internet</span>
              </div>
            )}
            {!user && (
              <div className="mt-2 flex items-center gap-2 text-orange-600 text-sm">
                <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                <span className="font-medium">No hay sesión activa</span>
              </div>
            )}
            {/* Indicador de autoguardado */}
            {lastSaved && !editingArticle && (
              <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                <span className="font-medium">
                  Borrador guardado a las {lastSaved.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={saving || uploading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Notificación de borrador encontrado */}
        {showDraftNotification && (
          <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Save className="text-blue-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Borrador Encontrado
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Se encontró un borrador guardado automáticamente. ¿Deseas restaurarlo?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={restoreDraft}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Restaurar Borrador
                  </button>
                  <button
                    type="button"
                    onClick={discardDraft}
                    className="px-4 py-2 bg-white text-blue-600 text-sm border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Descartar y Continuar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Escribe el título del artículo"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Subtítulo opcional"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen Principal
            </label>
            <div className="space-y-4">
              {/* Preview de la imagen */}
              {imagePreview && (
                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setFormData(prevData => ({ ...prevData, image_url: '' }));
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    disabled={uploading}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Botón de subida */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors w-full ${
                      uploading
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <Loader size={20} className="animate-spin text-blue-500" />
                        <span className="text-gray-600">Subiendo... {uploadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-gray-500" />
                        <span className="text-gray-600">
                          {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                        </span>
                      </>
                    )}
                  </label>
                  {uploading && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Botón para abrir galería */}
                <button
                  type="button"
                  onClick={() => setShowGallery(true)}
                  className="px-4 py-3 border-2 border-purple-300 hover:border-purple-500 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-2"
                  disabled={uploading}
                >
                  <ImageIcon size={20} className="text-purple-600" />
                  <span className="text-purple-700 font-medium">Galería</span>
                </button>
              </div>
            </div>
          </div>

          {/* Extracto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extracto / Resumen
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Breve resumen del artículo (opcional)"
            />
          </div>

          {/* Editor de contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido *
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                modules={quillModules}
                formats={quillFormats}
                className="bg-white"
                style={{ minHeight: '300px' }}
              />
            </div>
          </div>

          {/* Opciones */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Artículo destacado (aparecerá en el carrusel)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.published_at}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  published_at: e.target.checked ? new Date().toISOString() : null 
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Publicar artículo
              </span>
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={saving || uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={saving || uploading}
            >
              {saving ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>{editingArticle ? 'Actualizar' : 'Crear'} Artículo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Galería de Imágenes */}
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <ImageGallery
              selectionMode={true}
              onSelectImage={(url) => {
                setFormData(prevData => ({ ...prevData, image_url: url }));
                setImagePreview(url);
                setShowGallery(false);
              }}
              onClose={() => setShowGallery(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

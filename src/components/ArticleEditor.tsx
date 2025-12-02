import React, { useState, useEffect } from 'react';
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

export default function ArticleEditor({ onClose, onSave, editingArticle }: ArticleEditorProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  useEffect(() => {
    loadCategories();
    if (editingArticle) {
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
    }
  }, [editingArticle]);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
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

    if (!formData.title.trim()) {
      alert('Por favor ingresa un título');
      return;
    }

    if (!formData.category_id) {
      alert('Por favor selecciona una categoría');
      return;
    }

    if (!formData.content.trim()) {
      alert('Por favor ingresa el contenido del artículo');
      return;
    }

    setSaving(true);

    try {
      const articleData = {
        title: formData.title,
        subtitle: formData.subtitle,
        content: formData.content,
        excerpt: formData.excerpt,
        category_id: formData.category_id,
        image_url: formData.image_url,
        is_featured: formData.is_featured,
        published_at: formData.published_at,
        author_id: user?.id,
        updated_at: new Date().toISOString(),
      };

      console.log('💾 Guardando artículo con datos:', articleData);

      let error;

      if (editingArticle) {
        // Actualizar artículo existente
        const result = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', editingArticle.id);
        error = result.error;
        console.log('✅ Artículo actualizado:', editingArticle.id, 'image_url:', articleData.image_url);
      } else {
        // Crear nuevo artículo
        const result = await supabase
          .from('articles')
          .insert([{ ...articleData, created_at: new Date().toISOString() }]);
        error = result.error;
        console.log('✅ Artículo creado con image_url:', articleData.image_url);
      }

      if (error) throw error;

      alert(editingArticle ? 'Artículo actualizado exitosamente' : 'Artículo creado exitosamente');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('❌ Error al guardar artículo:', error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingArticle ? 'Editar Artículo' : 'Nuevo Artículo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={saving || uploading}
          >
            <X size={24} />
          </button>
        </div>

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

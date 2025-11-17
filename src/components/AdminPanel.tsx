import { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit, Trash2, Save, Upload, Settings, ArrowLeft } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase, Article, Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdsManager from './AdsManager';

type AdminPanelProps = {
  onClose: () => void;
};

type ArticleForm = {
  title: string;
  subtitle: string;
  content: string;
  excerpt: string;
  category_id: string;
  image_url: string;
  is_featured: boolean;
  published: boolean;
};

type CategoryForm = {
  name: string;
  slug: string;
  color: string;
};

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAdsManager, setShowAdsManager] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<CategoryForm>({ name: '', slug: '', color: '#3B82F6' });
  const [formData, setFormData] = useState<ArticleForm>({
    title: '',
    subtitle: '',
    content: '',
    excerpt: '',
    category_id: '',
    image_url: '',
    is_featured: false,
    published: true,
  });

  useEffect(() => {
    loadArticles();
    loadCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño inicial (máximo 10MB antes de comprimir)
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen no debe superar 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Comprimir imagen al 80% (20% de reducción de calidad)
      const options = {
        maxSizeMB: 1, // Máximo 1MB después de comprimir
        maxWidthOrHeight: 1920, // Máximo ancho o alto
        useWebWorker: true,
        quality: 0.8, // 80% de calidad (reducción del 20%)
        fileType: 'image/jpeg',
      };

      setUploadProgress(25);

      const compressedFile = await imageCompression(file, options);

      console.log('Imagen original:', file.size, 'bytes');
      console.log('Imagen comprimida:', compressedFile.size, 'bytes');
      console.log('Reducción:', Math.round((1 - compressedFile.size / file.size) * 100), '%');

      setUploadProgress(50);

      // Crear nombre único para el archivo
      const timestamp = new Date().getTime();
      const fileName = `${user.id}/${timestamp}-${file.name}`;

      // Subir archivo comprimido a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      setUploadProgress(75);

      // Obtener URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      // Actualizar formulario con la URL de la imagen
      setFormData({ ...formData, image_url: publicUrl });
      setUploadProgress(100);

      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
      }, 1000);
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen. Intenta de nuevo.');
      setUploading(false);
      setUploadProgress(0);
    }

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });
    if (data) setArticles(data);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Por favor ingresa un nombre para la categoría');
      return;
    }

    try {
      const slug = newCategory.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');

      const { error } = await supabase.from('categories').insert([
        {
          name: newCategory.name,
          slug: slug,
          color: newCategory.color,
        },
      ]);

      if (error) throw error;
      setNewCategory({ name: '', slug: '', color: '#3B82F6' });
      loadCategories();
      alert('Categoría agregada exitosamente');
    } catch (error) {
      console.error('Error al agregar categoría:', error);
      alert('Error al agregar la categoría');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      loadCategories();
      alert('Categoría eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      alert('Error al eliminar la categoría');
    }
  };

  const handleUpdateCategory = async (id: string, updatedData: Partial<Category>) => {
    try {
      const { error } = await supabase.from('categories').update(updatedData).eq('id', id);
      if (error) throw error;
      loadCategories();
      alert('Categoría actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      alert('Error al actualizar la categoría');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const articleData = {
      title: formData.title,
      subtitle: formData.subtitle,
      content: formData.content,
      excerpt: formData.excerpt,
      category_id: formData.category_id || null,
      image_url: formData.image_url || null,
      is_featured: formData.is_featured,
      author_id: user?.id,
      published_at: formData.published ? new Date().toISOString() : null,
    };

    try {
      if (editingArticle) {
        const { error } = await supabase.from('articles').update(articleData).eq('id', editingArticle);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('articles').insert([articleData]);
        if (error) throw error;
      }
      resetForm();
      loadArticles();
    } catch (error) {
      console.error('Error al guardar artículo:', error);
      alert('Error al guardar el artículo. Verifica la consola para más detalles.');
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article.id);
    setFormData({
      title: article.title,
      subtitle: article.subtitle || '',
      content: article.content,
      excerpt: article.excerpt || '',
      category_id: article.category_id || '',
      image_url: article.image_url || '',
      is_featured: article.is_featured,
      published: !!article.published_at,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este artículo?')) {
      await supabase.from('articles').delete().eq('id', id);
      loadArticles();
    }
  };

  const resetForm = () => {
    setEditingArticle(null);
    setShowForm(false);
    setFormData({
      title: '',
      subtitle: '',
      content: '',
      excerpt: '',
      category_id: '',
      image_url: '',
      is_featured: false,
      published: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Panel de Administración</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!showForm && !showCategoryManager && !showAdsManager ? (
            <>
              <div className="flex gap-4 mb-6 flex-wrap">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nuevo Artículo</span>
                </button>
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Gestionar Categorías</span>
                </button>
                <button
                  onClick={() => setShowAdsManager(true)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Gestionar Publicidades</span>
                </button>
              </div>

              <div className="space-y-4">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{article.title}</h3>
                      <div className="flex items-center space-x-3 mt-2 text-sm text-gray-600">
                        {article.category && (
                          <span
                            className="px-2 py-1 rounded text-white text-xs"
                            style={{ backgroundColor: article.category.color }}
                          >
                            {article.category.name}
                          </span>
                        )}
                        {article.is_featured && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                            Destacado
                          </span>
                        )}
                        <span>{article.published_at ? 'Publicado' : 'Borrador'}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(article)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : showAdsManager ? (
            <div>
              <button
                onClick={() => setShowAdsManager(false)}
                className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
              <AdsManager />
            </div>
          ) : showCategoryManager ? (
            <div>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>

              <h3 className="text-xl font-bold mb-4">Gestionar Categorías</h3>

              <div className="mb-8 bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold mb-4">Agregar Nueva Categoría</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Ej: Política"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        className="w-20 h-10 rounded-lg cursor-pointer"
                      />
                      <div
                        className="w-20 h-10 rounded-lg border-2 border-gray-300"
                        style={{ backgroundColor: newCategory.color }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddCategory}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Agregar Categoría
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Categorías Existentes</h4>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-50 p-4 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-gray-300"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <p className="font-semibold">{category.name}</p>
                          <p className="text-sm text-gray-600">{category.slug}</p>
                        </div>
                      </div>
                      {editingCategory === category.id ? (
                        <div className="flex gap-2">
                          <input
                            type="color"
                            defaultValue={category.color}
                            onChange={(e) => {
                              handleUpdateCategory(category.id, { color: e.target.value });
                            }}
                            className="w-12 h-10 rounded-lg cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingCategory(category.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : showAdsManager ? (
            <div>
              <button
                onClick={() => setShowAdsManager(false)}
                className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
              <AdsManager />
            </div>
          ) : showCategoryManager ? (
            <div>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>

              <h3 className="text-xl font-bold mb-4">Gestionar Categorías</h3>

              <div className="mb-8 bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold mb-4">Agregar Nueva Categoría</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Ej: Política"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        className="w-20 h-10 rounded-lg cursor-pointer"
                      />
                      <div
                        className="w-20 h-10 rounded-lg border-2 border-gray-300"
                        style={{ backgroundColor: newCategory.color }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddCategory}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Agregar Categoría
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Categorías Existentes</h4>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-50 p-4 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-gray-300"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <p className="font-semibold">{category.name}</p>
                          <p className="text-sm text-gray-600">{category.slug}</p>
                        </div>
                      </div>
                      {editingCategory === category.id ? (
                        <div className="flex gap-2">
                          <input
                            type="color"
                            defaultValue={category.color}
                            onChange={(e) => {
                              handleUpdateCategory(category.id, { color: e.target.value });
                            }}
                            className="w-12 h-10 rounded-lg cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingCategory(category.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 mb-4"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Subiendo...' : 'Subir'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                {formData.image_url && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">Vista previa:</p>
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extracto</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido (Editor Enriquecido)</label>
                <ReactQuill
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  modules={modules}
                  theme="snow"
                  style={{ height: '300px', marginBottom: '50px' }}
                />
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Destacar en carrusel</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Publicar</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>Guardar</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

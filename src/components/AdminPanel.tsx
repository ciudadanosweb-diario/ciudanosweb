import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, RefreshCw, AlertCircle, Settings, FolderTree } from 'lucide-react';
import { supabase, Article, Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdsManager from './AdsManager';
import CategoryManager from './CategoryManager';
import { getCategoryById } from '../lib/categories';

export default function AdminPanel({ onClose: _onClose }: { onClose?: () => void }) {
  const { user: _user } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdsManager, setShowAdsManager] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadArticles();
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (err: any) {
      console.error('Error cargando artículos:', err);
      throw err;
    }
  };

  const handleNewArticle = () => {
    navigate('/admin/articles/new');
  };

  const handleEditArticle = (article: Article) => {
    navigate(`/admin/articles/edit/${article.id}`);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Artículo eliminado exitosamente');
      loadData();
    } catch (err: any) {
      console.error('Error eliminando artículo:', err);
      alert('Error al eliminar artículo: ' + err.message);
    }
  };

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return 'Sin categoría';
    const category = getCategoryById(categoryId);
    return category?.name || 'Sin categoría';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
              <button
                onClick={() => setShowCategoryManager(true)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <FolderTree className="w-4 h-4" />
                Categorías
              </button>
              <button
                onClick={() => setShowAdsManager(!showAdsManager)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {showAdsManager ? 'Ver Artículos' : 'Publicidad'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-2 text-sm text-red-700 underline"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Gestión de Publicidad */}
        {showAdsManager && (
          <div className="mb-6">
            <AdsManager />
          </div>
        )}

        {/* Gestión de Artículos */}
        {!showAdsManager && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Artículos</h2>
              <button
                onClick={handleNewArticle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nuevo Artículo
              </button>
            </div>

            {/* Lista de artículos */}
            <div className="space-y-4">
              {articles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No hay artículos publicados</p>
                  <button
                    onClick={handleNewArticle}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    Crear el primer artículo
                  </button>
                </div>
              ) : (
                articles.map((article) => (
                  <div
                    key={article.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{article.title}</h3>
                          {article.is_featured && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              Destacado
                            </span>
                          )}
                        </div>
                        {article.subtitle && (
                          <p className="text-gray-600 text-sm mb-2">{article.subtitle}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📁 {getCategoryName(article.category_id)}</span>
                          <span>📅 {new Date(article.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {article.image_url && (
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-24 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEditArticle(article)}
                          className="px-3 py-1 border rounded hover:bg-gray-100 flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="px-3 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Gestor de categorías */}
      {showCategoryManager && (
        <CategoryManager
          onClose={() => setShowCategoryManager(false)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}

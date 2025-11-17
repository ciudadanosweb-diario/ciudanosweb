import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Clock, User } from 'lucide-react';
import { supabase, Article } from '../lib/supabase';

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    if (!id) {
      setError('ID de artículo no válido');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select('*, category:categories(*)')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        setError('Artículo no encontrado');
        setLoading(false);
        return;
      }

      setArticle(data);

      // Incrementar contador de vistas
      await supabase
        .from('articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);

      setLoading(false);
    } catch (err) {
      console.error('Error al cargar artículo:', err);
      setError('Error al cargar el artículo');
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando artículo...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex-1 bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver a Inicio</span>
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-red-600 text-lg">{error || 'Artículo no encontrado'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-100 pb-8">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl">
          {article.image_url && (
            <div className="relative h-96 overflow-hidden">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {article.category && (
                <span
                  className="absolute bottom-6 left-6 px-4 py-2 rounded-full text-white font-semibold text-sm"
                  style={{ backgroundColor: article.category.color }}
                >
                  {article.category.name}
                </span>
              )}
            </div>
          )}

          <div className="p-8 lg:p-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="text-xl text-gray-600 mb-6 italic">{article.subtitle}</p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b-2 border-gray-200">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>{formatDate(article.published_at || article.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>{article.view_count} vista{article.view_count !== 1 ? 's' : ''}</span>
              </div>
              {article.category && !article.image_url && (
                <span
                  className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                  style={{ backgroundColor: article.category.color }}
                >
                  {article.category.name}
                </span>
              )}
            </div>

            {article.excerpt && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
                <p className="text-lg text-blue-900 font-semibold">{article.excerpt}</p>
              </div>
            )}

            <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
              {article.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-6 whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t-2 border-gray-200">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-teal-600" />
                  <div>
                    <p className="text-sm text-gray-600">Artículo publicado por</p>
                    <p className="text-lg font-semibold text-gray-900">Ciudadanos Digital</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

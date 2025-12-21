import { Clock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Article } from '../lib/supabase';
import { getCategoryBySlug } from '../lib/categories';

type ArticleCardProps = {
  article: Article;
  onClick?: () => void;
};

export default function ArticleCard({ article, onClick }: ArticleCardProps) {
  const navigate = useNavigate();
  const category = article.category ? getCategoryBySlug(article.category) : null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleClick = () => {
    onClick?.();
    navigate(`/article/${article.id}`);
  };

  return (
    <article
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
    >
      {article.image_url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {category && (
            <span
              className="absolute top-3 left-3 px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-semibold"
            >
              {category.name}
            </span>
          )}
        </div>
      )}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.subtitle && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.subtitle}</p>
        )}
        {article.excerpt && (
          <p className="text-gray-700 mb-4 line-clamp-3">{article.excerpt}</p>
        )}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(article.published_at || article.created_at)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{article.view_count}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

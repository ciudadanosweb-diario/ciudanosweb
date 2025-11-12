import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, Article } from '../lib/supabase';

export default function FeaturedCarousel() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadFeaturedArticles();
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(articles.length, 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [articles.length]);

  const loadFeaturedArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*, category:categories(*)')
      .eq('is_featured', true)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(5);
    if (data) setArticles(data);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  };

  if (articles.length === 0) return null;

  const currentArticle = articles[currentIndex];

  return (
    <div className="relative bg-gray-900 h-[500px] overflow-hidden group">
      {currentArticle.image_url && (
        <img
          src={currentArticle.image_url}
          alt={currentArticle.title}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      <div className="absolute inset-0 flex items-end">
        <div className="container mx-auto px-4 pb-12">
          <div className="max-w-3xl">
            {currentArticle.category && (
              <span
                className="inline-block px-3 py-1 rounded-full text-white text-sm font-semibold mb-3"
                style={{ backgroundColor: currentArticle.category.color }}
              >
                {currentArticle.category.name}
              </span>
            )}
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
              {currentArticle.title}
            </h2>
            {currentArticle.subtitle && (
              <p className="text-xl text-gray-200 mb-4">{currentArticle.subtitle}</p>
            )}
            {currentArticle.excerpt && (
              <p className="text-gray-300 text-lg line-clamp-2">{currentArticle.excerpt}</p>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {articles.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

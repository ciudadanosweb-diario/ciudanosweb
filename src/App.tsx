import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { supabase, Article } from './lib/supabase';
import Header from './components/Header';
import CategoryNav from './components/CategoryNav';
import FeaturedCarousel from './components/FeaturedCarousel';
import ArticleCard from './components/ArticleCard';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';
import LoginForm from './components/LoginForm';

function App() {
  const { user, loading } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  const loadArticles = async () => {
    let query = supabase
      .from('articles')
      .select('*, category:categories(*)')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    const { data } = await query;
    if (data) setArticles(data);
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

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onAdminClick={() => setShowAdminPanel(true)} />
      <CategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      <div className="mb-6">
        <FeaturedCarousel />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {selectedCategory ? 'Artículos por Categoría' : 'Últimas Noticias'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            {articles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No hay artículos disponibles</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </div>

      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-bold mb-2">Ciudadanos - Diario Digital</p>
          <p className="text-gray-400 text-sm">Tu fuente confiable de noticias</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

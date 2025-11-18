import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { supabase, Article } from './lib/supabase';
import Header from './components/Header';
import CategoryNav from './components/CategoryNav';
import FeaturedCarousel from './components/FeaturedCarousel';
import ArticleCard from './components/ArticleCard';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';
import LoginAdmin from './components/LoginAdmin';
import ArticleDetail from './pages/ArticleDetail';

function App() {
  const { user, isAdmin } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

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

  // Mostrar login de admin si no está autenticado y quiere acceder a admin
  if (showAdminLogin && !user) {
    return <LoginAdmin onCancel={() => setShowAdminLogin(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header 
        onAdminClick={() => {
          if (user && isAdmin) {
            setShowAdminPanel(true);
          } else {
            setShowAdminLogin(true);
          }
        }} 
      />
      <CategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      
      <div className="flex-1 flex">
        <div className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <div className="mb-6">
                    <FeaturedCarousel />
                  </div>

                  <div className="container mx-auto px-4 py-8">
                    <div className="lg:col-span-2">
                      <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        {selectedCategory ? 'Artículos por Categoría' : 'Últimas Noticias'}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {articles.map((article) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            onClick={() => {
                              // No hacer nada, la navegación se maneja en ArticleCard
                            }}
                          />
                        ))}
                      </div>
                      {articles.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-gray-500 text-lg">No hay artículos disponibles</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              }
            />
            <Route path="/article/:id" element={<ArticleDetail />} />
          </Routes>
        </div>

        <div className="hidden lg:block w-80 px-4 py-8">
          <Sidebar />
        </div>
      </div>

      {showAdminPanel && user && isAdmin && <AdminPanel onClose={() => setShowAdminPanel(false)} />}

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-bold mb-2">Ciudadanos - Diario Digital</p>
          <p className="text-gray-400 text-sm">Tu fuente confiable de noticias</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

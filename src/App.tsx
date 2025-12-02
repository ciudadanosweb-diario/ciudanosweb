import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLoginAdmin, setShowLoginAdmin] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <div className="h-1 bg-orange-500"></div>
      <CategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      
      <div className="flex-1 flex flex-col lg:flex-row">
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
            <Route path="/admin" element={user ? <AdminPanel /> : <div className="container mx-auto px-4 py-12 text-center"><p className="text-xl text-gray-600">Debes iniciar sesión para acceder al panel de administración</p></div>} />
          </Routes>
        </div>

        <div className="w-full lg:w-80 px-4 py-8">
          <Sidebar />
        </div>
      </div>

      {showLoginAdmin && <LoginAdmin onClose={() => setShowLoginAdmin(false)} onLoginSuccess={() => { setShowLoginAdmin(false); navigate('/admin'); }} />}

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-lg font-bold mb-2">Ciudadanos - Diario Digital</p>
              <p className="text-gray-400 text-sm">Tu fuente confiable de noticias</p>
            </div>
            <button
              onClick={() => user ? navigate('/admin') : setShowLoginAdmin(true)}
              className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors text-white text-sm whitespace-nowrap"
            >
              <span>Panel Admin</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

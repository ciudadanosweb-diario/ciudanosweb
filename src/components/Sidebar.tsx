import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Calendar as CalendarIcon, Cloud } from 'lucide-react';
import { supabase, Article, Ad } from '../lib/supabase';

export default function Sidebar() {
  const navigate = useNavigate();
  const [mostRead, setMostRead] = useState<Article[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [weather] = useState({ temp: 24, condition: 'Soleado' });
  const [currentDate] = useState(new Date());

  useEffect(() => {
    loadMostRead();
    loadAds();
  }, []);

  const loadMostRead = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .not('published_at', 'is', null)
      .order('view_count', { ascending: false })
      .limit(5);
    if (data) setMostRead(data);
  };

  const loadAds = async () => {
    const { data } = await supabase
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });
    if (data) setAds(data);
  };

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <aside className="space-y-6">
      {ads.length > 0 ? (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {ad.image_url ? (
                <a
                  href={ad.link_url || '#'}
                  target={ad.link_url ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="block w-full bg-gray-100 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer group"
                >
                  <div className="relative w-full bg-gray-200 flex items-center justify-center" style={{ height: ad.height || 192 }}>
                    <img
                      src={ad.image_url}
                      alt={ad.title || 'Publicidad'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        console.error('Error cargando publicidad:', ad.image_url);
                        e.currentTarget.style.display = 'none';
                        const container = e.currentTarget.parentElement;
                        if (container) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 p-4 text-center';
                          errorDiv.innerHTML = `
                            <p class="text-gray-600 text-sm font-semibold">${ad.title || 'Publicidad'}</p>
                            <p class="text-gray-500 text-xs mt-2">Imagen no disponible</p>
                            <p class="text-gray-600 text-xs mt-1">Verificar configuración del storage</p>
                          `;
                          container.appendChild(errorDiv);
                        }
                      }}
                      onLoad={() => {
                        console.log('Publicidad cargada:', ad.image_url);
                      }}
                    />
                  </div>
                </a>
              ) : (
                <div className="w-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-center p-4" style={{ height: ad.height || 192 }}>
                  <p className="font-semibold">{ad.title || 'Publicidad'}</p>
                </div>
              )}
              {ad.title && (
                <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100">
                  <p className="text-xs font-semibold text-gray-700 line-clamp-2">{ad.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4">Publicidad</h3>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8 text-center">
            <p className="text-2xl font-bold">Tu Anuncio Aquí</p>
            <p className="text-sm mt-2">Espacio publicitario disponible</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h3 className="text-xl font-bold text-gray-900">Más Leídas</h3>
        </div>
        <div className="space-y-4">
          {mostRead.map((article, index) => (
            <div
              key={article.id}
              onClick={() => navigate(`/article/${article.id}`)}
              className="flex space-x-3 group cursor-pointer"
            >
              <span className="text-3xl font-bold text-gray-300 group-hover:text-teal-600 transition-colors">
                {index + 1}
              </span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 text-sm">
                  {article.title}
                </h4>
                {article.category && (
                  <span
                    className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: article.category.color }}
                  >
                    {article.category.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Cloud className="w-5 h-5" />
          <h3 className="text-xl font-bold">Clima</h3>
        </div>
        <div className="text-center">
          <div className="text-6xl font-bold mb-2">{weather.temp}°</div>
          <p className="text-lg">{weather.condition}</p>
          <p className="text-sm text-teal-100 mt-2">Santiago del Estero</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-teal-600" />
          <h3 className="text-xl font-bold text-gray-900 capitalize">{monthName}</h3>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
            <div key={`day-${index}`} className="text-center text-xs font-bold text-gray-600 p-2">
              {day}
            </div>
          ))}
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const isToday = day === currentDate.getDate();
            return (
              <div
                key={day}
                className={`text-center p-2 text-sm rounded ${
                  isToday
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

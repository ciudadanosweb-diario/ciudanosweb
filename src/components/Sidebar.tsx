import { useEffect, useState } from 'react';
import { TrendingUp, Calendar as CalendarIcon, Cloud } from 'lucide-react';
import { supabase, Article } from '../lib/supabase';

export default function Sidebar() {
  const [mostRead, setMostRead] = useState<Article[]>([]);
  const [weather, setWeather] = useState({ temp: 24, condition: 'Soleado' });
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadMostRead();
  }, []);

  const loadMostRead = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*, category:categories(*)')
      .not('published_at', 'is', null)
      .order('view_count', { ascending: false })
      .limit(5);
    if (data) setMostRead(data);
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
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">Publicidad</h3>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8 text-center">
          <p className="text-2xl font-bold">Tu Anuncio Aquí</p>
          <p className="text-sm mt-2">Espacio publicitario disponible</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h3 className="text-xl font-bold text-gray-900">Más Leídas</h3>
        </div>
        <div className="space-y-4">
          {mostRead.map((article, index) => (
            <div key={article.id} className="flex space-x-3 group cursor-pointer">
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
          <p className="text-sm text-teal-100 mt-2">Ciudad Autónoma de Buenos Aires</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-teal-600" />
          <h3 className="text-xl font-bold text-gray-900 capitalize">{monthName}</h3>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day) => (
            <div key={day} className="text-center text-xs font-bold text-gray-600 p-2">
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

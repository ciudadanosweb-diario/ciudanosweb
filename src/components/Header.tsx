import { Newspaper, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-gradient-to-b from-green-100 to-white text-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-3 md:py-6">
        <div className="flex items-center justify-between gap-2 md:gap-0">
          <div className="flex items-center space-x-2 md:space-x-6 relative">
            <div className="absolute -left-8 md:-left-14 opacity-50 hidden md:block">
              <img 
                src="https://res.cloudinary.com/dgxb5aeqx/image/upload/v1763435103/catedral-Photoroom_ha5rnt.png"
                alt="Catedral"
                className="h-32 w-32 object-cover"
              />
            </div>
            <Newspaper className="w-8 h-8 md:w-10 md:h-10 text-green-600 relative z-10 flex-shrink-0" />
            <div className="relative z-10 md:pl-4">
              <h1 className="text-3xl md:text-6xl lg:text-8xl font-bold tracking-tight font-typewriter text-green-800 whitespace-nowrap">Ciudadanos</h1>
              <p className="text-green-600 text-xs md:text-sm capitalize hidden md:block">{currentDate}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            {user && (
              <button
                onClick={signOut}
                className="flex items-center space-x-1 md:space-x-2 bg-green-600 hover:bg-green-700 px-2 md:px-4 py-1 md:py-2 rounded-lg transition-colors text-white text-xs md:text-sm whitespace-nowrap"
              >
                <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

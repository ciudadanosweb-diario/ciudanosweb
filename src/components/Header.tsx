import { LogOut } from 'lucide-react';
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
    <header className="bg-[linear-gradient(to_bottom,_#4ade80_0%,_#ffffff_30%,_#ffffff_80%,_#16a34a_100%)] text-gray-800 shadow-lg relative">
      <div className="container mx-auto px-4 py-3 md:py-6">
        <div className="flex items-center justify-between gap-2 md:gap-0">
          <div className="flex items-center space-x-2 md:space-x-6 relative">
            <div className="block opacity-50">
              <img 
                src="https://res.cloudinary.com/dgxb5aeqx/image/upload/v1763435103/catedral-Photoroom_ha5rnt.png"
                alt="Catedral"
                className="h-16 w-16 md:h-32 md:w-32 object-cover"
              />
            </div>
            
            <div className="relative z-10">
              <h1 className="text-3xl md:text-6xl lg:text-8xl font-bold tracking-tight font-typewriter text-green-800 whitespace-nowrap">Ciudadanos</h1>
              <p className="text-green-600 text-xs md:text-sm capitalize hidden md:block">{currentDate}</p>
            </div>
            
            <div className="block opacity-50">
              <img 
                src="https://res.cloudinary.com/dgxb5aeqx/image/upload/v1763435103/catedral-Photoroom_ha5rnt.png"
                alt="Catedral"
                className="h-16 w-16 md:h-32 md:w-32 object-cover"
              />
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

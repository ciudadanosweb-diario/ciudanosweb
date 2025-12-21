import { LogOut, Home } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';
  const [isSigningOut, setIsSigningOut] = useState(false);

  console.log('Header render - user:', user?.id, 'isSigningOut:', isSigningOut);
  
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
            {isAdminPage && (
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-1 md:space-x-2 bg-blue-600 hover:bg-blue-700 px-2 md:px-4 py-1 md:py-2 rounded-lg transition-colors text-white text-xs md:text-sm whitespace-nowrap"
              >
                <Home className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Inicio</span>
              </button>
            )}
            {user && !isSigningOut && (
              <button
                onClick={async () => {
                  console.log('Botón Salir clickeado, usuario:', user);
                  setIsSigningOut(true);
                  try {
                    await signOut();
                    console.log('signOut completado, navegando a /');
                    // Redirigir a la página principal después de cerrar sesión
                    navigate('/');
                    console.log('navigate completado');
                    // Forzar recarga para evitar rehidratación accidental del estado
                    setTimeout(() => {
                      try { window.location.reload(); } catch {}
                    }, 0);
                    alert('Sesión cerrada exitosamente');
                  } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    alert('Error al cerrar sesión');
                  } finally {
                    setIsSigningOut(false);
                  }
                }}
                disabled={isSigningOut}
                className="flex items-center space-x-1 md:space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 px-2 md:px-4 py-1 md:py-2 rounded-lg transition-colors text-white text-xs md:text-sm whitespace-nowrap"
              >
                <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{isSigningOut ? 'Saliendo...' : 'Salir'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

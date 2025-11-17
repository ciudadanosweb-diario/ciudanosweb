import { Newspaper, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type HeaderProps = {
  onAdminClick?: () => void;
};

export default function Header({ onAdminClick }: HeaderProps) {
  const { user, isAdmin, signOut } = useAuth();
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-gradient-to-b from-green-100 to-white text-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Newspaper className="w-10 h-10 text-green-600" />
            <div>
              <h1 className="text-6xl font-bold tracking-tight font-mono text-green-800">Ciudadanos</h1>
              <p className="text-green-600 text-sm capitalize">{currentDate}</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={onAdminClick}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors text-white"
                >
                  <User className="w-4 h-4" />
                  <span>Panel Admin</span>
                </button>
              )}
              <button
                onClick={signOut}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors text-white"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

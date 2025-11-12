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
    <header className="bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Newspaper className="w-10 h-10" />
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Ciudadanos</h1>
              <p className="text-teal-100 text-sm capitalize">{currentDate}</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={onAdminClick}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Panel Admin</span>
                </button>
              )}
              <button
                onClick={signOut}
                className="flex items-center space-x-2 bg-teal-800 hover:bg-teal-900 px-4 py-2 rounded-lg transition-colors"
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

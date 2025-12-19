import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión inicial
    const initializeAuth = async () => {
      try {
        console.log('🔐 Iniciando autenticación...');
        console.log('🌐 Estado de conexión:', navigator.onLine ? 'Online' : 'Offline');
        
        if (!navigator.onLine) {
          console.warn('⚠️ No hay conexión a internet');
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error al obtener sesión:', error);
          setUser(null);
          setProfile(null);
        } else if (session?.user) {
          console.log('✅ Sesión encontrada para usuario:', session.user.id);
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          console.log('ℹ️ No hay sesión activa');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('❌ Error al inicializar autenticación:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
        console.log('✅ Autenticación inicializada');
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Cambio de estado de autenticación:', event, session?.user?.id || 'sin usuario');
      try {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('❌ Error en cambio de estado de autenticación:', error);
        // Limpiar estado en caso de error
        setUser(null);
        setProfile(null);
      }
    });

    // Listeners de conexión a internet
    const handleOnline = () => {
      console.log('🌐 Conexión restaurada');
      // Intentar refrescar la sesión cuando se recupere la conexión
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          console.log('✅ Sesión restaurada después de reconexión');
          setUser(session.user);
          loadProfile(session.user.id);
        }
      });
    };

    const handleOffline = () => {
      console.warn('⚠️ Conexión perdida');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearSession = () => {
    setUser(null);
    setProfile(null);
    // Limpiar cualquier dato de sesión almacenado localmente
    localStorage.clear();
  };

  const handleAuthError = (error: any) => {
    if (error?.message?.includes('Invalid Refresh Token') ||
        error?.message?.includes('Refresh Token Not Found') ||
        error?.message?.includes('JWT expired')) {
      console.warn('Refresh token expired, clearing session');
      clearSession();
      return true; // Error manejado
    }
    return false; // Error no manejado
  };

  const loadProfile = async (userId: string) => {
    try {
      console.log('👤 Cargando perfil del usuario:', userId);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (error) {
        console.error('❌ Error al cargar perfil:', error);
        // Si el error está relacionado con tokens, manejarlo y salir
        if (handleAuthError(error)) {
          console.warn('⚠️ Error de autenticación manejado, limpiando sesión');
          return;
        }
        throw error;
      }
      
      if (data) {
        console.log('✅ Perfil cargado:', { id: data.id, is_admin: data.is_admin });
        setProfile(data);
      } else {
        console.warn('⚠️ No se encontró perfil para el usuario');
        setProfile(null);
      }
    } catch (err) {
      console.error('❌ Excepción al cargar perfil:', err);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error);
      }
      return { error };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) {
        console.error('Sign up error:', error);
      }
      return { error };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Iniciando cierre de sesión...');
      
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error en supabase.auth.signOut():', error);
        // No lanzamos error, continuamos limpiando estado local
      } else {
        console.log('Supabase signOut exitoso');
      }
      
      // Limpiar estado local inmediatamente
      clearSession();
      
      console.log('Estado local limpiado, sesión cerrada exitosamente');
    } catch (error) {
      console.error('Excepción en signOut:', error);
      // Limpiar estado local incluso si hay error
      clearSession();
      console.log('Estado local limpiado a pesar del error');
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.is_admin ?? false,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

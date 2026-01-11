import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  ensureSessionReady: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'supabase_session_backup';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Limpiar tokens inválidos al iniciar
  useEffect(() => {
    const cleanInvalidTokens = () => {
      try {
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          // Si el refresh token parece inválido (muy corto o vacío), limpiarlo
          if (!parsedSession.refresh_token || parsedSession.refresh_token.length < 10) {
            console.log('🧹 Limpiando token inválido del localStorage');
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.log('🧹 Limpiando localStorage corrupto');
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    };

    cleanInvalidTokens();
  }, []);

  const updateUserPresence = async (online: boolean = true) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('update_user_presence', {
        user_id: user.id,
        online_status: online
      });

      if (error) {
        // Silenciar errores de RPC que no existen
        console.log('ℹ️ Función RPC update_user_presence no disponible');
      } else {
        console.log(`✅ Presencia actualizada: ${online ? 'online' : 'offline'}`);
      }
    } catch (error) {
      // Silenciar errores
      console.log('ℹ️ Función RPC update_user_presence no disponible');
    }
  };

  const markUserOnline = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('update_user_online', {
        user_id: user.id
      });

      if (error) {
        console.log('ℹ️ Función RPC update_user_online no disponible');
      } else {
        console.log('✅ Usuario marcado como online');
      }
    } catch (error) {
      console.log('ℹ️ Función RPC update_user_online no disponible');
    }
  };

  const markUserOffline = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_user_offline', {
        user_id: user.id
      });

      if (error) {
        console.log('ℹ️ Función RPC mark_user_offline no disponible');
      } else {
        console.log('✅ Usuario marcado como offline');
      }
    } catch (error) {
      console.log('ℹ️ Función RPC mark_user_offline no disponible');
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      console.log('👤 Cargando perfil del usuario:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error al cargar perfil:', error);
        // Si hay error, crear un perfil básico
        setProfile({
          id: userId,
          email: '',
          full_name: '',
          is_admin: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Profile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      // Fallback: crear perfil básico
      setProfile({
        id: userId,
        email: '',
        full_name: '',
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Profile);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Inicializar autenticación con rehidratación de sesión
    const initializeAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticación...');

        // 1. Intentar rehidratar sesión desde localStorage backup
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        
        if (storedSession) {
          console.log('💾 Sesión encontrada en backup, rehidratando...');
          try {
            const parsedSession = JSON.parse(storedSession);
            
            // Intentar establecer la sesión con Supabase
            const { data, error } = await supabase.auth.setSession({
              access_token: parsedSession.access_token,
              refresh_token: parsedSession.refresh_token
            });

            if (error) {
              console.error('❌ Error al rehidratar sesión:', error);
              localStorage.removeItem(SESSION_STORAGE_KEY);
            } else if (data.session) {
              console.log('✅ Sesión rehidratada exitosamente');
              if (mounted) {
                setSession(data.session);
                setUser(data.session.user);
                await loadProfile(data.session.user.id);
                await markUserOnline();
              }
            }
          } catch (error) {
            console.error('❌ Error al parsear sesión almacenada:', error);
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } else {
          // 2. Si no hay backup, intentar obtener sesión existente de Supabase
          console.log('🔍 Verificando sesión existente...');
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          
          if (existingSession?.user && mounted) {
            console.log('✅ Sesión existente encontrada');
            setSession(existingSession);
            setUser(existingSession.user);
            await loadProfile(existingSession.user.id);
            await markUserOnline();
            
            // Guardar en backup
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(existingSession));
          }
        }
      } catch (error) {
        console.error('❌ Error al inicializar autenticación:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }

      // Timeout de seguridad: forzar loading=false después de 10 segundos
      setTimeout(() => {
        if (mounted) {
          console.log('⏰ Timeout de seguridad: forzando loading=false');
          setLoading(false);
        }
      }, 10000);
    };

    initializeAuth();

    /**
     * Listener centralizado para cambios de estado de autenticación
     * Guarda la sesión en localStorage para persistencia
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`🔐 Evento de autenticación: ${event}`);

        if (!mounted) return;

        // Actualizar sesión y usuario basado en la sesión
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Guardar o eliminar sesión en localStorage según el evento
        if (newSession) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
          console.log('💾 Sesión guardada en backup');
          
          // Actualizar perfil si hay usuario
          await loadProfile(newSession.user.id);

          // Actualizar presencia según el evento
          if (event === 'SIGNED_IN') {
            console.log('🟢 Usuario conectado');
            await markUserOnline();
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 Token refrescado automáticamente');
            await updateUserPresence(true);
          } else if (event === 'USER_UPDATED') {
            console.log('👤 Usuario actualizado');
          }
        } else {
          // Sin sesión, limpiar backup
          localStorage.removeItem(SESSION_STORAGE_KEY);
          setProfile(null);
          
          if (event === 'SIGNED_OUT') {
            console.log('🔴 Usuario desconectado');
          }
        }

        // Log de eventos para debugging
        if (import.meta.env.DEV) {
          const expiresAt = newSession?.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const timeToExpire = expiresAt ? expiresAt - now : undefined;
          console.log('📊 Estado de sesión:', {
            evento: event,
            usuarioLogueado: !!newSession?.user,
            tiempoExpiracion: timeToExpire
              ? `${Math.floor(timeToExpire / 60)} minutos`
              : 'N/A',
          });
        }

        // Finalizar carga después del primer evento si aún está cargando
        if (loading) {
          setLoading(false);
        }
      }
    );

    // Listener para cuando la pestaña vuelve a ser visible
    // Refresca la sesión y actualiza presencia
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Pestaña visible nuevamente');
        
        // Pequeño delay para dar tiempo a que Supabase termine operaciones pendientes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Solo verificar sesión, no refrescar automáticamente para evitar conflictos
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession && mounted) {
          console.log('✅ Sesión activa detectada');
          
          // Actualizar presencia si hay usuario
          if (user) {
            await updateUserPresence(true);
          }
          
          // Solo actualizar estado si la sesión cambió significativamente
          if (currentSession.access_token !== session?.access_token) {
            console.log('🔄 Sesión actualizada');
            setSession(currentSession);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession));
          }
        } else if (!currentSession && session) {
          // Sesión perdida, intentar recuperar desde backup
          console.warn('⚠️ Sesión perdida, intentando recuperar...');
          const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
          
          if (storedSession) {
            try {
              const parsedSession = JSON.parse(storedSession);
              const { data, error } = await supabase.auth.setSession({
                access_token: parsedSession.access_token,
                refresh_token: parsedSession.refresh_token
              });
              
              if (data.session && mounted) {
                console.log('✅ Sesión recuperada exitosamente');
                setSession(data.session);
                setUser(data.session.user);
              } else if (error) {
                console.error('❌ No se pudo recuperar la sesión:', error);
                localStorage.removeItem(SESSION_STORAGE_KEY);
              }
            } catch (error) {
              console.error('❌ Error al recuperar sesión:', error);
            }
          }
        }
      }
      // Removido el else para 'hidden' para evitar logs innecesarios
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Heartbeat para mantener presencia online cada 5 minutos
    const heartbeatInterval = setInterval(async () => {
      if (user && mounted) {
        console.log('💓 Heartbeat: actualizando presencia');
        await updateUserPresence(true);
      }
    }, 5 * 60 * 1000); // Cada 5 minutos

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeatInterval);
    };
  }, []); // Solo ejecutar una vez al montar

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        await loadProfile(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
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

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // Marcar usuario como offline antes de cerrar sesión
      if (user) {
        await markUserOffline();
      }
      
      await supabase.auth.signOut();
      
      // Limpiar estado y backup
      setUser(null);
      setProfile(null);
      setSession(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      
      console.log('👋 Sesión cerrada y datos limpiados');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  // Hook personalizado para verificar sesión antes de operaciones críticas
  const ensureSessionReady = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error verificando sesión:', error);
        return false;
      }
      
      if (!session) {
        console.error('❌ No hay sesión activa');
        return false;
      }
      
      // Verificar que el token no esté próximo a expirar (menos de 5 minutos)
      const now = Math.floor(Date.now() / 1000);
      const timeToExpire = (session.expires_at || 0) - now;
      
      if (timeToExpire < 300) { // 5 minutos
        console.warn('⚠️ Token próximo a expirar, intentando refrescar...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('❌ Error refrescando sesión:', refreshError);
          return false;
        }
        
        console.log('✅ Sesión refrescada exitosamente');
        setSession(refreshData.session);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(refreshData.session));
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error en ensureSessionReady:', error);
      return false;
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isAdmin: profile?.is_admin || false,
    signIn,
    signUp,
    signOut,
    ensureSessionReady,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

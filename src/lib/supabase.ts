import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. ' +
    'Please create a .env file with your Supabase project URL. ' +
    'You can use .env.example as a template.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY environment variable. ' +
    'Please create a .env file with your Supabase anon key. ' +
    'You can use .env.example as a template.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Usar localStorage del navegador para persistir sesión
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-ciudanosweb-auth',
    // Usar PKCE flow para mayor seguridad
    flowType: 'pkce',
    // Debug en desarrollo
    debug: import.meta.env.DEV,
  },
  global: {
    headers: {
      'X-Client-Info': 'ciudanosweb-client',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Sincronizar sesión entre tabs/ventanas del mismo navegador
if (typeof window !== 'undefined') {
  console.log('🧪 [SupabaseClient] Configuración:');
  console.log('   - persistSession: true');
  console.log('   - autoRefreshToken: true');
  console.log('   - storage: localStorage');
  console.log('   - storageKey: sb-ciudanosweb-auth');
  
  // Sincronizar sesión entre pestañas usando el evento storage
  window.addEventListener('storage', async (event) => {
    if (event.key === 'sb-ciudanosweb-auth') {
      if (event.newValue) {
        console.log('🔄 Sesión actualizada desde otra pestaña');
        // Supabase detectará automáticamente el cambio
      } else if (event.oldValue && !event.newValue) {
        console.log('🔴 Sesión eliminada desde otra pestaña');
        // El listener onAuthStateChange manejará esto
      }
    }
  });

  // Listener global para eventos de autenticación
  supabase.auth.onAuthStateChange((event, session) => {
    const timestamp = new Date().toLocaleTimeString();
    
    switch (event) {
      case 'SIGNED_IN':
        console.log(`✅ [${timestamp}] Usuario conectado`);
        break;
      case 'SIGNED_OUT':
        console.log(`🔴 [${timestamp}] Usuario desconectado`);
        break;
      case 'TOKEN_REFRESHED':
        console.log(`🔄 [${timestamp}] Token refrescado automáticamente`);
        break;
      case 'USER_UPDATED':
        console.log(`👤 [${timestamp}] Usuario actualizado`);
        break;
      case 'PASSWORD_RECOVERY':
        console.log(`🔑 [${timestamp}] Recuperación de contraseña`);
        break;
      default:
        console.log(`🔐 [${timestamp}] Evento: ${event}`);
    }

    if (import.meta.env.DEV && session) {
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeToExpire = expiresAt ? expiresAt - now : 0;
      console.log(`   - Expira en: ${Math.floor(timeToExpire / 60)} minutos`);
    }
  });

  // Verificar sesión periódicamente (cada 5 minutos)
  setInterval(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [Session Check] Error al verificar sesión:', error.message);
      } else if (!session) {
        console.warn('⚠️ [Session Check] No hay sesión activa');
      } else {
        const expiresAt = session.expires_at || 0;
        const now = Math.floor(Date.now() / 1000);
        const timeToExpire = expiresAt - now;
        
        if (timeToExpire < 300) { // Menos de 5 minutos
          console.warn(`⏰ [Session Check] Sesión expira pronto (${Math.floor(timeToExpire / 60)} min)`);
        } else {
          console.log(`✅ [Session Check] Sesión activa (expira en ${Math.floor(timeToExpire / 60)} min)`);
        }
      }
    } catch (error) {
      console.error('❌ [Session Check] Error inesperado:', error);
    }
  }, 5 * 60 * 1000); // Cada 5 minutos
}

export type Article = {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  excerpt?: string;
  category?: string; // Slug de la categoría (ej: 'politica', 'deportes')
  author_id?: string;
  image_url?: string;
  is_featured: boolean;
  view_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  created_at: string;
  is_online?: boolean;
  last_seen?: string;
  last_login?: string;
  online_at?: string;
};

export type Ad = {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  position: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  height?: number;
};

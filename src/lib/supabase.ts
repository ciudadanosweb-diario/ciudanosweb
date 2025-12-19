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
    // Asegurar uso de localStorage del navegador para persistir sesión
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-ciudanosweb-auth',
    // Configurar tiempo de espera más largo
    flowType: 'pkce',
    // Debug: mantener sesión más tiempo
    debug: import.meta.env.DEV,
  },
  global: {
    headers: {
      'X-Client-Info': 'ciudanosweb-client',
    },
  },
  // Configurar reintentos en caso de errores de red
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Diagnóstico básico del cliente
if (typeof window !== 'undefined') {
  console.log('🧪 [SupabaseClient] persistSession=true autoRefreshToken=true storage=localStorage storageKey=sb-ciudanosweb-auth');
  
  // Listener global para detectar cuando se pierde la sesión
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 [Auth State Change]:', event, session ? 'Usuario conectado' : 'Sin sesión');
    
    if (event === 'SIGNED_OUT') {
      console.warn('⚠️ [Session Lost] Usuario desconectado');
    }
    
    if (event === 'TOKEN_REFRESHED') {
      console.log('✅ [Token Refreshed] Sesión renovada exitosamente');
    }
    
    if (event === 'USER_UPDATED') {
      console.log('👤 [User Updated] Datos de usuario actualizados');
    }
  });

  // Verificar sesión cada 5 minutos y refrescar si es necesario
  setInterval(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ [Session Check] Error al verificar sesión:', error);
    } else if (!session) {
      console.warn('⚠️ [Session Check] No hay sesión activa');
    } else {
      console.log('✅ [Session Check] Sesión activa');
    }
  }, 5 * 60 * 1000); // Cada 5 minutos
}

export type Category = {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
};

export type Article = {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  excerpt?: string;
  category_id?: string;
  author_id?: string;
  image_url?: string;
  is_featured: boolean;
  view_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
};

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  created_at: string;
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
};

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
  },
  global: {
    headers: {
      'X-Client-Info': 'ciudanosweb-client',
    },
  },
});

// Diagnóstico básico del cliente
if (typeof window !== 'undefined') {
  console.log('🧪 [SupabaseClient] persistSession=true autoRefreshToken=true storage=localStorage storageKey=sb-ciudanosweb-auth');
  
  // Agregar listener para errores de red en storage
  supabase.storage.onError = (error: any) => {
    console.error('🚨 [Supabase Storage Error]:', {
      message: error.message,
      name: error.name,
      status: error.status,
      details: error.details,
      hint: error.hint
    });
  };
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

import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con privilegios de administrador (service_role)
 * 
 * ⚠️ IMPORTANTE: Este cliente SOLO debe usarse en el backend/servidor
 * Nunca lo uses en código del cliente (navegador) ya que bypasea RLS
 * 
 * Capacidades:
 * - Bypasea Row Level Security (RLS)
 * - Acceso completo a todas las tablas
 * - Puede crear/modificar/eliminar cualquier dato
 * - Puede gestionar usuarios y autenticación
 */

// Estas variables NO tienen prefijo VITE_, por lo que no se exponen al cliente
const supabaseUrl = process.env.SUPABASE_URL || 'https://wmuunmfwdqifpbbucnmz.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
    'This should only be used in server-side code.'
  );
}

// Cliente con privilegios administrativos
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Ejemplo de uso:
 * 
 * // Obtener todos los usuarios (bypasea RLS)
 * const { data: users } = await supabaseAdmin
 *   .from('profiles')
 *   .select('*');
 * 
 * // Crear artículo como cualquier usuario (bypasea RLS)
 * const { data } = await supabaseAdmin
 *   .from('articles')
 *   .insert({
 *     title: 'Artículo',
 *     content: 'Contenido',
 *     author_id: 'cualquier-uuid'
 *   });
 * 
 * // Gestión de usuarios
 * const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
 *   email: 'nuevo@ejemplo.com',
 *   password: 'password123',
 *   email_confirm: true
 * });
 */

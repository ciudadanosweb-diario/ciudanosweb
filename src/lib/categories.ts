// Categorías locales - Sincronizadas con la base de datos de Supabase
// Los IDs son los mismos UUIDs que están en la base de datos para mantener compatibilidad
// Última sincronización: 2025-12-19

export interface LocalCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

// IMPORTANTE: Estos IDs están sincronizados con la tabla categories de Supabase
// Los artículos existentes mantendrán su categoría correctamente
export const LOCAL_CATEGORIES: LocalCategory[] = [
  { id: '09d945d5-e58c-43b3-ab84-a980354ffde4', name: 'Adultos Mayores', slug: 'adultos-mayores', description: 'Noticias sobre adultos mayores' },
  { id: '259650f0-8425-48b8-9499-2914cfeea2cc', name: 'Cultura', slug: 'cultura', description: 'Arte, cultura y entretenimiento' },
  { id: 'bb7508e7-53ec-438a-8ad7-e4cb0ca479e4', name: 'Deportes', slug: 'deportes', description: 'Deportes y competiciones' },
  { id: '98b9f292-8909-4ef5-a1a1-ccceace36d1e', name: 'Economía', slug: 'economia', description: 'Economía, finanzas y negocios' },
  { id: 'c67a076d-35b0-4781-a261-b47c897284e1', name: 'Educación', slug: 'educacion-', description: 'Educación y formación' },
  { id: '0e557acc-5c4f-4fc4-be6d-5024954cd234', name: 'Efemérides', slug: 'efemerides', description: 'Efemérides y fechas importantes' },
  { id: '0699eb6e-191b-4c5b-aa0f-4d6cdfbbbc83', name: 'Espectáculos', slug: 'espectaculos-', description: 'Espectáculos y entretenimiento' },
  { id: '64b85745-73be-4377-b10f-02937d2c457f', name: 'La Banda', slug: 'la-banda-', description: 'Noticias de La Banda' },
  { id: 'fbe71183-a71e-4490-84af-f2163e26395f', name: 'Locales', slug: 'locales', description: 'Noticias locales' },
  { id: '4fa1154b-b5c3-4dbb-9378-49bf4c366ea3', name: 'Mujer', slug: 'mujer-', description: 'Noticias sobre la mujer' },
  { id: '36343d6c-430e-4ad7-8df9-b5d649edf5da', name: 'Niñez', slug: 'ninez', description: 'Noticias sobre la niñez' },
  { id: 'e9bbbe37-37f9-4e01-9e18-68f2dc3fd120', name: 'Niñez', slug: 'ninez-', description: 'Noticias sobre la niñez' },
  { id: '97ab8834-2654-4d0d-b67e-6bfe06ad3de5', name: 'Obras', slug: 'obras', description: 'Obras públicas e infraestructura' },
  { id: 'c387e63d-1865-4263-b817-0e2405c3b23b', name: 'Política', slug: 'politica', description: 'Noticias políticas locales e internacionales' },
  { id: '0e32923e-6443-4eb5-a073-b6800ea1d0ae', name: 'Religión', slug: 'religion', description: 'Religión y espiritualidad' },
  { id: '3c85bbf5-676d-4e46-b2c9-2ff6648a5199', name: 'Salud', slug: 'salud', description: 'Salud y bienestar' },
  { id: 'e9b7c492-06b0-410a-b608-47b94f4a556e', name: 'Sociedad', slug: 'sociedad', description: 'Temas sociales y comunidad' },
  { id: 'dd1d31f3-a5bb-4558-8a42-99dd8017706d', name: 'Tecnología', slug: 'tecnologia', description: 'Tecnología e innovación' },
  { id: '08535314-0bbc-483d-adde-819ac717385e', name: 'Transporte', slug: 'transporte-', description: 'Transporte público y movilidad' },
];

// Función helper para obtener categoría por ID
export const getCategoryById = (id: string): LocalCategory | undefined => {
  return LOCAL_CATEGORIES.find(cat => cat.id === id);
};

// Función helper para obtener categoría por slug
export const getCategoryBySlug = (slug: string): LocalCategory | undefined => {
  return LOCAL_CATEGORIES.find(cat => cat.slug === slug);
};

// Función helper para obtener todas las categorías ordenadas
export const getAllCategories = (): LocalCategory[] => {
  return [...LOCAL_CATEGORIES].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * IMPORTANTE: Sincronización de Categorías
 * 
 * Este archivo contiene categorías locales con los mismos UUIDs que la base de datos de Supabase.
 * Esto garantiza que los artículos existentes mantengan su categoría correctamente.
 * 
 * Para re-sincronizar si se agregan/modifican categorías en Supabase:
 * 1. Ejecuta: node scripts/sync-categories.mjs
 * 2. Copia el output generado en scripts/categories-sync.txt
 * 3. Reemplaza el array LOCAL_CATEGORIES arriba con el nuevo contenido
 * 
 * VENTAJAS de este sistema:
 * ✅ Sin consultas a Supabase = carga instantánea
 * ✅ Los artículos mantienen sus categorías (mismo UUID)
 * ✅ Rendimiento mejorado (sin latencia de red)
 * ✅ Menor uso de cuota de Supabase
 */

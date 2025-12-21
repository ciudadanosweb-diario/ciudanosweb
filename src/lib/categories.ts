// Categorías locales - Ahora como datos estáticos sin necesidad de Supabase
// Última actualización: 2025-12-21

export interface LocalCategory {
  name: string;
  slug: string;
  description?: string;
}

// IMPORTANTE: Estos slugs coinciden con los valores del ENUM article_category en PostgreSQL
export const LOCAL_CATEGORIES: LocalCategory[] = [
  { name: 'Adultos Mayores', slug: 'adultos-mayores', description: 'Noticias sobre adultos mayores' },
  { name: 'Cultura', slug: 'cultura', description: 'Arte, cultura y entretenimiento' },
  { name: 'Deportes', slug: 'deportes', description: 'Deportes y competiciones' },
  { name: 'Economía', slug: 'economia', description: 'Economía, finanzas y negocios' },
  { name: 'Educación', slug: 'educacion', description: 'Educación y formación' },
  { name: 'Efemérides', slug: 'efemerides', description: 'Efemérides y fechas importantes' },
  { name: 'Espectáculos', slug: 'espectaculos', description: 'Espectáculos y entretenimiento' },
  { name: 'La Banda', slug: 'la-banda', description: 'Noticias de La Banda' },
  { name: 'Locales', slug: 'locales', description: 'Noticias locales' },
  { name: 'Mujer', slug: 'mujer', description: 'Noticias sobre la mujer' },
  { name: 'Niñez', slug: 'ninez', description: 'Noticias sobre la niñez' },
  { name: 'Obras', slug: 'obras', description: 'Obras públicas e infraestructura' },
  { name: 'Política', slug: 'politica', description: 'Noticias políticas locales e internacionales' },
  { name: 'Religión', slug: 'religion', description: 'Religión y espiritualidad' },
  { name: 'Salud', slug: 'salud', description: 'Salud y bienestar' },
  { name: 'Sociedad', slug: 'sociedad', description: 'Temas sociales y comunidad' },
  { name: 'Tecnología', slug: 'tecnologia', description: 'Tecnología e innovación' },
  { name: 'Transporte', slug: 'transporte', description: 'Transporte público y movilidad' },
];

// Función helper para obtener categoría por slug
export const getCategoryBySlug = (slug: string): LocalCategory | undefined => {
  return LOCAL_CATEGORIES.find(cat => cat.slug === slug);
};

// Función helper para obtener todas las categorías ordenadas
export const getAllCategories = (): LocalCategory[] => {
  return [...LOCAL_CATEGORIES].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * SISTEMA SIMPLIFICADO DE CATEGORÍAS
 * 
 * Las categorías ahora son:
 * - Datos estáticos locales (sin consultas a BD)
 * - Almacenadas como ENUM en PostgreSQL en la columna articles.category
 * - Sin tabla separada categories
 * - Sin UUIDs, solo slugs simples
 * 
 * VENTAJAS:
 * ✅ Mucho más simple
 * ✅ Sin JOINs innecesarios
 * ✅ Sin problemas de tipos UUID/TEXT
 * ✅ Sin funciones RPC complejas
 * ✅ Carga instantánea
 * ✅ Menor uso de recursos
 */

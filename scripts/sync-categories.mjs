#!/usr/bin/env node

/**
 * Script para sincronizar categorías de Supabase con el archivo local
 * 
 * USO:
 * 1. Asegúrate de que tu .env tenga VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
 * 2. Ejecuta: node scripts/sync-categories.js
 * 3. Copia el output y actualiza src/lib/categories.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: No se encontraron las credenciales de Supabase en .env');
  console.error('Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncCategories() {
  console.log('🔍 Consultando categorías de Supabase...\n');

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  if (error) {
    console.error('❌ Error al consultar categorías:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.warn('⚠️  No se encontraron categorías en Supabase');
    process.exit(0);
  }

  console.log(`✅ Se encontraron ${data.length} categorías\n`);
  console.log('📋 Categorías en Supabase:');
  console.log('─'.repeat(80));
  data.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.name.padEnd(20)} (${cat.slug})`);
  });
  console.log('─'.repeat(80));
  console.log('\n📝 Código TypeScript para src/lib/categories.ts:\n');
  console.log('export const LOCAL_CATEGORIES: LocalCategory[] = [');
  
  data.forEach(cat => {
    const description = getDescriptionForCategory(cat.slug);
    console.log(`  { id: '${cat.id}', name: '${cat.name}', slug: '${cat.slug}', description: '${description}' },`);
  });
  
  console.log('];\n');

  // Guardar en archivo
  const outputPath = path.join(__dirname, 'categories-sync.txt');
  const output = data.map(cat => {
    const description = getDescriptionForCategory(cat.slug);
    return `  { id: '${cat.id}', name: '${cat.name}', slug: '${cat.slug}', description: '${description}' },`;
  }).join('\n');

  fs.writeFileSync(outputPath, `export const LOCAL_CATEGORIES: LocalCategory[] = [\n${output}\n];\n`);
  console.log(`💾 Categorías guardadas en: ${outputPath}\n`);
  console.log('✨ ¡Sincronización completada! Ahora copia las categorías a src/lib/categories.ts');
}

function getDescriptionForCategory(slug) {
  const descriptions = {
    'politica': 'Noticias políticas locales e internacionales',
    'economia': 'Economía, finanzas y negocios',
    'sociedad': 'Temas sociales y comunidad',
    'deportes': 'Deportes y competiciones',
    'cultura': 'Arte, cultura y entretenimiento',
    'tecnologia': 'Tecnología e innovación',
    'salud': 'Salud y bienestar',
    'educacion': 'Educación y formación',
    'internacional': 'Noticias internacionales',
    'nacional': 'Noticias nacionales',
    'local': 'Noticias locales',
    'medio-ambiente': 'Ecología y medio ambiente',
    'ciencia': 'Ciencia e investigación',
    'opinion': 'Artículos de opinión',
    'editorial': 'Editoriales del periódico',
    'seguridad': 'Seguridad y justicia',
    'turismo': 'Turismo y viajes',
    'clima': 'Clima y meteorología',
    'espectaculos': 'Espectáculos y entretenimiento',
  };
  return descriptions[slug] || `Categoría ${slug}`;
}

syncCategories().catch(error => {
  console.error('💥 Error inesperado:', error);
  process.exit(1);
});

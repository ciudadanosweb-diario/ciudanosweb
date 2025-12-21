#!/usr/bin/env node

/**
 * Script para probar los meta tags Open Graph de los artículos
 * Simula cómo Facebook lee los meta tags
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno SUPABASE no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testArticleMetaTags() {
  console.log('🔍 Probando meta tags de artículos...\n');

  // Obtener algunos artículos de prueba
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, excerpt, subtitle, image_url, published_at')
    .limit(5);

  if (error) {
    console.error('❌ Error al obtener artículos:', error.message);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log('⚠️  No hay artículos en la base de datos');
    return;
  }

  console.log(`✅ Encontrados ${articles.length} artículos\n`);

  for (const article of articles) {
    console.log('━'.repeat(80));
    console.log(`📄 Artículo: ${article.title}`);
    console.log(`   ID: ${article.id}`);
    console.log(`   URL: https://tusitio.com/#/article/${article.id}`);
    
    // Verificar imagen
    if (article.image_url) {
      const isAbsolute = article.image_url.startsWith('http');
      console.log(`   Imagen: ${article.image_url}`);
      console.log(`   URL absoluta: ${isAbsolute ? '✅ Sí' : '⚠️  No (se convertirá en el servidor)'}`);
      
      if (isAbsolute) {
        // Verificar si es accesible
        try {
          const response = await fetch(article.image_url, { method: 'HEAD' });
          if (response.ok) {
            console.log(`   Accesible: ✅ Sí (${response.status})`);
            console.log(`   Content-Type: ${response.headers.get('content-type') || 'desconocido'}`);
          } else {
            console.log(`   Accesible: ❌ No (${response.status})`);
          }
        } catch (err) {
          console.log(`   Accesible: ❌ Error - ${err.message}`);
        }
      }
    } else {
      console.log(`   Imagen: ⚠️  No tiene imagen`);
    }

    // Verificar descripción
    const description = article.excerpt || article.subtitle;
    if (description) {
      console.log(`   Descripción: ✅ "${description.substring(0, 50)}${description.length > 50 ? '...' : ''}"`);
    } else {
      console.log(`   Descripción: ⚠️  No tiene descripción`);
    }

    console.log('');
  }

  console.log('━'.repeat(80));
  console.log('\n📋 Resumen:');
  
  const withImages = articles.filter(a => a.image_url).length;
  const withDescriptions = articles.filter(a => a.excerpt || a.subtitle).length;
  
  console.log(`   Artículos con imagen: ${withImages}/${articles.length}`);
  console.log(`   Artículos con descripción: ${withDescriptions}/${articles.length}`);
  
  console.log('\n🔧 Para probar en Facebook:');
  console.log('   1. Compila la app: npm run build');
  console.log('   2. Inicia el servidor: npm start');
  console.log('   3. Ve a: https://developers.facebook.com/tools/debug/');
  console.log('   4. Pega la URL de un artículo y haz clic en "Scrape Again"');
  console.log('   5. Verifica que aparezcan el título, descripción e imagen\n');
}

testArticleMetaTags().catch(console.error);

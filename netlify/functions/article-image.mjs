import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function handler(event, context) {
  try {
    // Obtener el ID del artículo del path
    const pathParts = event.path.split('/');
    const articleId = pathParts[4]; // /.netlify/functions/article-image/:id

    if (!articleId) {
      return {
        statusCode: 400,
        body: 'Article ID required'
      };
    }

    if (!supabase) {
      return {
        statusCode: 500,
        body: 'Supabase not configured'
      };
    }

    // Obtener datos del artículo
    const { data: article, error } = await supabase
      .from('articles')
      .select('image_url, category, title')
      .eq('id', articleId)
      .single();

    if (error || !article) {
      return {
        statusCode: 404,
        body: 'Article not found'
      };
    }

    if (!article.image_url) {
      return {
        statusCode: 404,
        body: 'Article has no image'
      };
    }

    // Descargar imagen base
    let imageUrl = article.image_url;
    if (!imageUrl.startsWith('http')) {
      imageUrl = `https://ciudadanos-web.com${imageUrl}`;
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return {
        statusCode: 500,
        body: 'Failed to fetch image'
      };
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Crear SVG con overlays (logo + categoría)
    const category = (article.category || 'NOTICIA').toUpperCase();
    const overlaySvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <!-- Fondo semitransparente para el header -->
        <rect x="0" y="0" width="1200" height="80" fill="rgba(0,0,0,0.7)" />
        
        <!-- Logo (Ciudadanos Digital) -->
        <circle cx="50" cy="40" r="25" fill="#ff6b35" />
        <text x="50" y="47" text-anchor="middle" fill="white" font-size="14" font-weight="bold">CD</text>
        
        <!-- Nombre del sitio -->
        <text x="90" y="35" fill="white" font-size="16" font-weight="bold">CIUDADANOS DIGITAL</text>
        <text x="90" y="55" fill="white" font-size="12" opacity="0.9">DIARIO CIUDADANO</text>
        
        <!-- Etiqueta de categoría -->
        <rect x="0" y="550" width="250" height="80" fill="rgba(255,107,53,0.9)" />
        <text x="20" y="590" fill="white" font-size="18" font-weight="bold">${category}</text>
      </svg>
    `;

    // Procesar imagen con Sharp
    const processedImage = await sharp(Buffer.from(imageBuffer))
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .composite([{
        input: Buffer.from(overlaySvg),
        top: 0,
        left: 0
      }])
      .jpeg({ quality: 90 })
      .toBuffer();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
      },
      body: processedImage.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Error generating image:', error);
    return {
      statusCode: 500,
      body: 'Internal server error'
    };
  }
}
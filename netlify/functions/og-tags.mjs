import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function handler(event, context) {
  // Obtener el ID del artículo de los parámetros
  const articleId = event.queryStringParameters?.id;

  if (!articleId) {
    return {
      statusCode: 400,
      body: 'Missing article ID'
    };
  }

  if (!supabase) {
    return {
      statusCode: 500,
      body: 'Supabase not configured'
    };
  }

  try {
    // Obtener el artículo de Supabase
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, title, excerpt, subtitle, image_url, published_at, created_at')
      .eq('id', articleId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        body: 'Error fetching article'
      };
    }

    if (!article) {
      return {
        statusCode: 404,
        body: 'Article not found'
      };
    }

    // Obtener la URL base del sitio
    const siteUrl = process.env.URL || 'https://ciudadanos-web.com';
    const articleUrl = `${siteUrl}/#/article/${article.id}`;
    
    // Asegurar URL absoluta para la imagen
    let imageUrl = article.image_url || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${siteUrl}${imageUrl}`;
    }

    const title = article.title || 'Ciudadanos Digital';
    const description = article.excerpt || article.subtitle || article.title || '';
    const publishedTime = article.published_at || article.created_at || new Date().toISOString();

    // Generar HTML con meta tags Open Graph
    const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)} - Ciudadanos Digital</title>
    <meta name="description" content="${escapeHtml(description)}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Ciudadanos Digital" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(title)}" />
    <meta property="og:url" content="${escapeHtml(articleUrl)}" />
    <meta property="article:published_time" content="${escapeHtml(publishedTime)}" />
    <meta property="article:author" content="Ciudadanos Digital" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@CiudadanosDigital" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(title)}" />
    
    <link rel="canonical" href="${escapeHtml(articleUrl)}" />
    
    <!-- Redireccionar a la aplicación después de que el bot lea los meta tags -->
    <meta http-equiv="refresh" content="0;url=${escapeHtml(articleUrl)}" />
  </head>
  <body>
    <noscript>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" style="max-width: 100%;" />` : ''}
      <p><a href="${escapeHtml(articleUrl)}">Ver artículo completo</a></p>
    </noscript>
    <script>
      // Redireccionar inmediatamente para usuarios humanos
      window.location.href = '${articleUrl}';
    </script>
  </body>
</html>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
      body: html
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      statusCode: 500,
      body: 'Internal server error'
    };
  }
}

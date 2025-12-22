import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

function truncateText(text, maxLength = 160) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

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
  // Obtener el ID del artículo del path (para rewrites desde _redirects)
  const pathParts = event.path.split('/');
  const articleId = pathParts[2]; // /article/:id -> ['', 'article', ':id']

  if (!articleId || articleId === 'og-tags') {
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

  // Detectar si es un bot
  const userAgent = event.headers['user-agent'] || '';
  const isBot = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|SkypeUriPreview|vkShare|Pinterest|Discordbot|Google-Structured-Data-Testing-Tool/i.test(userAgent);

  // Obtener la URL base del sitio
  const siteUrl = process.env.URL || 'https://ciudadanos-web.com';
  const articleUrl = `${siteUrl}/#/article/${articleId}`;
  
  // Si no es un bot, redirigir directamente a la URL con hash
  if (!isBot) {
    return {
      statusCode: 302,
      headers: {
        'Location': articleUrl,
        'Cache-Control': 'no-cache'
      },
      body: ''
    };
  }

  // Si es un bot, generar HTML con meta tags
  console.log(`[OG-Tags] Bot detectado: ${userAgent}`);
  console.log(`[OG-Tags] Sirviendo meta tags para artículo: ${articleId}`);

  try {
    // Obtener el artículo de Supabase
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, title, excerpt, subtitle, content, image_url, published_at, created_at')
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

    const shareUrl = `${siteUrl}/article/${article.id}`; // URL para compartir (sin hash)
    
    // Asegurar URL absoluta para la imagen
    let imageUrl = article.image_url || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${siteUrl}${imageUrl}`;
    }

    const title = article.title || 'Ciudadanos Digital';
    const description = article.excerpt || article.subtitle || truncateText(stripHtml(article.content)) || article.title || '';
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
    <meta property="og:url" content="${escapeHtml(shareUrl)}" />
    <meta property="article:published_time" content="${escapeHtml(publishedTime)}" />
    <meta property="article:author" content="Ciudadanos Digital" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@CiudadanosDigital" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(title)}" />
    
    <link rel="canonical" href="${escapeHtml(shareUrl)}" />
  </head>
  <body>
    <noscript>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" style="max-width: 100%;" />` : ''}
      <p><a href="${escapeHtml(articleUrl)}">Ver artículo completo</a></p>
    </noscript>
    <script>
      // Redireccionar para usuarios humanos que lleguen aquí
      setTimeout(function() {
        window.location.href = '${articleUrl}';
      }, 100);
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

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: SUPABASE URL/KEY not set. /og/article/:id endpoint will return 404.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

app.use(express.static(path.join(__dirname, '..', 'dist')));

// Detectar bots de redes sociales
function isSocialBot(userAgent) {
  if (!userAgent) return false;
  const botPatterns = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'Slackbot',
    'SkypeUriPreview',
    'vkShare',
    'Pinterest',
    'Discordbot',
    'Google-Structured-Data-Testing-Tool'
  ];
  return botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern.toLowerCase()));
}

// Generar HTML con meta tags para un artículo
async function generateArticleHTML(req, res, articleId) {
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).send('Server not configured with Supabase keys');
  }

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, excerpt, subtitle, image_url, published_at, created_at')
      .eq('id', articleId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error fetching article:', error);
      return res.status(500).send('Error fetching article');
    }

    if (!data) {
      return res.status(404).send('Article not found');
    }

    const title = data.title || 'Ciudadanos Digital';
    const description = data.excerpt || data.subtitle || data.title || '';
    // Asegurar URL absoluta para la imagen
    let imageUrl = data.image_url || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${req.protocol}://${req.get('host')}${imageUrl}`;
    }
    const articleUrl = `${req.protocol}://${req.get('host')}/#/article/${data.id}`;
    const publishedTime = data.published_at || data.created_at || new Date().toISOString();

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
    
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${escapeHtml(articleUrl)}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <noscript>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />` : ''}
    </noscript>
  </body>
</html>`;

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Unexpected error generating article HTML:', err);
    res.status(500).send('Internal server error');
  }
}

// Endpoint específico para OG tags (legacy)
app.get('/og/article/:id', async (req, res) => {
  await generateArticleHTML(req, res, req.params.id);
});

// Interceptar rutas de artículos para bots de redes sociales
app.get('*', async (req, res, next) => {
  const userAgent = req.get('user-agent') || '';
  const isBot = isSocialBot(userAgent);
  
  // Si es un bot y la ruta parece ser un artículo
  const articleMatch = req.path.match(/^\/.*article\/([a-f0-9-]+)/i);
  
  if (isBot && articleMatch) {
    const articleId = articleMatch[1];
    console.log(`🤖 Bot detectado: ${userAgent}`);
    console.log(`📄 Sirviendo meta tags para artículo: ${articleId}`);
    return generateArticleHTML(req, res, articleId);
  }
  
  // Para usuarios normales o rutas que no son artículos, servir la SPA
  next();
});

// Fallback: servir index.html para cualquier otra ruta (CSR)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

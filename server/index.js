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

// Endpoint para que los crawlers obtengan OG tags estáticos
app.get('/og/article/:id', async (req, res) => {
  const { id } = req.params;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).send('Server not configured with Supabase keys');
  }

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, excerpt, subtitle, image_url')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase error fetching article:', error);
      return res.status(500).send('Error fetching article');
    }

    if (!data) {
      return res.status(404).send('Article not found');
    }

    const title = data.title || 'Ciudadanos Digital';
    const description = data.excerpt || data.subtitle || '';
    const image = data.image_url || '';
    const url = `${req.protocol}://${req.get('host')}/#/article/${data.id}`;

    const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${escapeHtml(url)}" />
  </head>
  <body>
    <!-- Redirigir a la app (cliente) para usuarios normales -->
    <script>window.location = '${url}';</script>
    <noscript>Si no eres un bot, serás redirigido automáticamente en breve: <a href="${url}">${url}</a></noscript>
  </body>
</html>`;

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Unexpected error in /og/article/:id', err);
    res.status(500).send('Internal server error');
  }
});

// Fallback: servir index.html para cualquier otra ruta (CSR)
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

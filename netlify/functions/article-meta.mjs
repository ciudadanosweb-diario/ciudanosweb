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

export async function handler(event, context) {
  try {
    // Obtener el ID del artículo del query param
    const articleId = event.queryStringParameters?.id;

    if (!articleId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Article ID required' })
      };
    }

    if (!supabase) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Supabase not configured' })
      };
    }

    // Obtener el artículo de Supabase
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, title, excerpt, subtitle, content, image_url, published_at, created_at')
      .eq('id', articleId)
      .single();

    if (error || !article) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Article not found' })
      };
    }

    const siteUrl = process.env.URL || 'https://ciudadanos-web.com';
    const shareUrl = `${siteUrl}/#/article/${article.id}`;
    const imageUrl = `${siteUrl}/.netlify/functions/article-image/${article.id}`;

    const title = article.title || 'Ciudadanos Digital';
    const description = article.excerpt || article.subtitle || truncateText(stripHtml(article.content)) || article.title || '';
    const publishedTime = article.published_at || article.created_at || new Date().toISOString();

    const meta = {
      title: `${title} - Ciudadanos Digital`,
      description,
      og: {
        type: 'article',
        site_name: 'Ciudadanos Digital',
        title,
        description,
        image: imageUrl,
        url: shareUrl
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        image: imageUrl
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
      body: JSON.stringify(meta)
    };

  } catch (error) {
    console.error('Error generating meta:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
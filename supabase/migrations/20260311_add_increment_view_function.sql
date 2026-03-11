-- Provide a simple RPC for safely incrementing an article's view count.
--
-- Calling the function guarantees the update is atomic and removes the
-- need for client-side `literal()` hacks (which caused a runtime error
-- when the JS client didn't expose that helper).
--
-- The RLS policy added in an earlier migration already allows anonymous
-- users to perform this very same increment directly, but having the RPC
-- keeps the frontend code clean and removes the risk of sending an
-- incorrect payload from a buggy client.

CREATE OR REPLACE FUNCTION public.increment_view_count(article_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE articles
  SET view_count = view_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

-- allow anyone (including anon) to execute the RPC
GRANT EXECUTE ON FUNCTION public.increment_view_count(uuid) TO anon, authenticated;

-- document intent for future maintainers
COMMENT ON FUNCTION public.increment_view_count(uuid) IS
  'Atomically increment articles.view_count; used by frontend when article is viewed';

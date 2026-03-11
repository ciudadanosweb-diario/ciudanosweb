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
--
-- The function returns the new `view_count` so PostgREST can expose it in
-- the schema cache and make the RPC endpoint available.  Void-returning
-- functions don’t show up, which is why the previous 404 occurred.

CREATE OR REPLACE FUNCTION public.increment_view_count(article_id uuid)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE articles
  SET view_count = view_count + 1
  WHERE id = article_id
  RETURNING view_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- allow anyone (including anon) to execute the RPC
GRANT EXECUTE ON FUNCTION public.increment_view_count(uuid) TO anon, authenticated;

-- document intent for future maintainers
COMMENT ON FUNCTION public.increment_view_count(uuid) IS
  'Atomically increment articles.view_count; returns the updated count for use by clients';

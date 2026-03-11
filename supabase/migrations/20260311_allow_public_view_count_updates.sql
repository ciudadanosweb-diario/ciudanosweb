-- Allow non-admin users (including anon) to increment article view counts
-- without giving them broader update privileges.
--
-- The regular `articles_update_admin` policy restricts updates to admins,
-- which means visitors were never able to bump `view_count` and the
-- dashboard always showed zero. The front-end attempted to increment the
-- field, but RLS silently rejected the change. The requirement is that
-- "cualquiera que entre a una noticia sea contado como una vista cuantas
-- veces entren", so we need a dedicated policy just for this column.
--
-- This policy only permits the specific transformation of
-- `view_count = old.view_count + 1` and forbids changes to any other
-- column. It also prevents arbitrary large jumps (only +1 per request).
--
-- Run this migration by applying it with supabase migrations when
-- deploying; existing databases will automatically get the new policy.

-- drop an older policy if it exists (guard against re-runs)
DROP POLICY IF EXISTS "public_increment_view_count" ON articles;

CREATE POLICY "public_increment_view_count"
  ON articles FOR UPDATE
  TO anon, authenticated   -- allow even unauthenticated users
  USING (true)
  WITH CHECK (
    -- view_count must increment by exactly 1 comparing against the
    -- *current* value stored in the table.  We can't use `old` inside
    -- policies, so we perform a subquery to read the existing row.
    view_count = (SELECT view_count FROM articles WHERE id = articles.id) + 1
    /* ensure no other column was changed by comparing the JSONB
       representations of the new/old rows minus `view_count` */
    AND (to_jsonb(articles) - 'view_count') =
        ((SELECT to_jsonb(a) FROM articles a WHERE a.id = articles.id) - 'view_count')
  );

-- add a comment so future maintainers understand the intent
COMMENT ON POLICY "public_increment_view_count" ON articles IS
  'Allow any visitor to increment view_count by one without permitting general updates';

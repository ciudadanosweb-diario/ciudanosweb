# Fix: Article Saving After Tab Switch Using RPC Functions

## Problem
After switching browser tabs, users cannot save articles. The session appears valid (token is not expired), but database operations fail with permission errors. This is caused by PostgreSQL's RLS policies not correctly recognizing the admin status after the auth context changes between tabs.

## Root Cause
- When the tab context switches, the client refreshes its auth token
- However, PostgreSQL's session context doesn't immediately reflect this change
- RLS policies using `is_admin_user()` function fail because the subquery execution happens in an old context
- Direct table operations are blocked even though the user is actually an admin

## Solution: RPC Functions

Instead of relying on RLS policies to check admin status at the time of table operation, we'll:

1. **Create RPC stored procedures** that execute as `SECURITY DEFINER` (with database owner permissions)
2. **Move admin verification inside the function** (in a trusted database context)
3. **Block direct table operations** with RLS deny policies (forcing use of RPC functions)
4. **Update frontend code** to call RPC functions instead of direct Supabase `.from().update()` calls

## Implementation Steps

### Step 1: Apply SQL Migration (Run in Supabase Dashboard)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **ciudanosweb**
3. Go to **SQL Editor**
4. Create a new query
5. Copy all content from this file: `supabase/migrations/20251220_fix_with_rpc_functions.sql`
6. **Run** the query

**What this does:**
- Creates `rpc_insert_article()` - RPC function to insert articles
- Creates `rpc_update_article()` - RPC function to update articles
- Creates blocking RLS policies on articles table to prevent direct operations
- Users MUST use the RPC functions instead

### Step 2: Frontend Code Update (Already Done ✅)

The file `src/pages/ArticleEditPage.tsx` has been updated to:
- Call `supabase.rpc('rpc_insert_article', {...})` for new articles
- Call `supabase.rpc('rpc_update_article', {...})` for existing articles
- Handle RPC response format: `{ data: { success: boolean, error?: string, code?: string }, error?: any }`
- Implement retry logic with session refresh on permission errors

### Step 3: Verify the Fix

Test the complete flow:

1. **Login** to the admin panel
2. **Start editing** an article
3. **Switch to another tab** (this triggers auth context change)
4. **Return to the article editor tab**
5. **Try to save** the article

**Expected behavior:**
- Logs should show:
  - `💾 Iniciando guardado de artículo...`
  - `🔐 Verificando sesión antes de guardar...`
  - `📤 Intento 1 de 3...`
  - `🔄 Actualizando artículo existente usando RPC: [article-id]`
  - `📦 Respuesta RPC intento 1: {data: {success: true}, error: null}`
  - `✅ Artículo guardado en intento 1`
- Article should be saved successfully
- No permission errors

## RPC Function Details

### rpc_insert_article()
**Purpose:** Insert a new article with admin verification

**Parameters:**
- `p_title` (text) - Article title
- `p_subtitle` (text) - Article subtitle
- `p_content` (text) - Article content
- `p_excerpt` (text) - Article excerpt
- `p_category_id` (uuid) - Category ID
- `p_image_url` (text) - Image URL
- `p_is_featured` (boolean) - Featured flag
- `p_published_at` (timestamp) - Publication date
- `p_author_id` (uuid) - Author ID

**Returns:** `{success: boolean, error?: string, code?: string}`

**How it works:**
1. Executes with database owner permissions (SECURITY DEFINER)
2. Verifies the user is in the `admin` role
3. Inserts the article
4. Returns success/error status

### rpc_update_article()
**Purpose:** Update an existing article with admin verification

**Parameters:**
- `p_article_id` (uuid) - Article ID to update
- `p_title`, `p_subtitle`, `p_content`, etc. - Fields to update

**Returns:** `{success: boolean, error?: string, code?: string}`

## Why This Works

```
OLD APPROACH (Broken):
User Tab A → Auth Token Updated → RPC call to Supabase → Direct table INSERT/UPDATE
                                                               ↓
                                                    PostgreSQL RLS Policy checks auth context
                                                    ❌ Session context is stale = PERMISSION_DENIED

NEW APPROACH (Fixed):
User Tab A → Auth Token Updated → RPC call to Supabase → RPC Function (SECURITY DEFINER)
                                                               ↓
                                                    Function executes as database owner
                                                    Function checks admin role in trusted context
                                                    Function performs direct table INSERT/UPDATE
                                                    ✅ No RLS evaluation = Success
```

## Troubleshooting

### If you get "relation 'rpc_insert_article' does not exist"
- The SQL migration hasn't been applied yet
- Go to Supabase Dashboard → SQL Editor → Apply the migration from step 1

### If you get "permission denied for schema public"
- The RPC functions have the wrong permissions
- Go to Supabase Dashboard → SQL Editor and run:
  ```sql
  GRANT EXECUTE ON FUNCTION rpc_insert_article TO authenticated;
  GRANT EXECUTE ON FUNCTION rpc_update_article TO authenticated;
  ```

### If articles still don't save
- Check the browser console (F12) for detailed error logs
- Look for `📦 Respuesta RPC` logs to see the actual error from the RPC function
- Make sure you're logged in as an admin user (check the role in `profiles` table)

## What if I need to rollback?

If you want to go back to direct table operations:

1. In Supabase Dashboard → SQL Editor, remove the blocking RLS policies:
   ```sql
   DROP POLICY "Block direct insert" ON articles;
   DROP POLICY "Block direct update" ON articles;
   DROP POLICY "Block direct delete" ON articles;
   ```

2. Revert `src/pages/ArticleEditPage.tsx` to use direct table operations

3. Adjust RLS policies to work correctly (this is the original problem though)

## Files Modified

- ✅ `supabase/migrations/20251220_fix_with_rpc_functions.sql` - NEW (SQL RPC functions)
- ✅ `src/pages/ArticleEditPage.tsx` - UPDATED (Frontend to use RPC calls)

## Testing Checklist

- [ ] SQL migration applied in Supabase Dashboard
- [ ] No errors after applying migration
- [ ] Login to admin panel works
- [ ] Create new article works
- [ ] Edit existing article works
- [ ] Switch tabs while editing → return tab → save works
- [ ] Multiple save attempts work
- [ ] Non-admin user correctly gets permission denied error

---

**Created:** 2024-12-20  
**Status:** Ready for testing

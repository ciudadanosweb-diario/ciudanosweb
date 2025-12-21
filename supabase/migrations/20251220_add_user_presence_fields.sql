-- Add user presence tracking fields to profiles table
-- This migration adds fields to track user online/offline status and activity

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_login timestamptz,
ADD COLUMN IF NOT EXISTS online_at timestamptz;

-- Create index for efficient queries on online users
CREATE INDEX IF NOT EXISTS idx_profiles_online ON profiles(is_online, last_seen) WHERE is_online = true;

-- Update RLS policies to allow users to update their own presence fields
-- Note: The RPC functions control which fields are actually updated,
-- so this policy provides basic access control while functions handle field validation
DROP POLICY IF EXISTS "profiles_update_own_presence" ON profiles;
CREATE POLICY "profiles_update_own_presence"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to update user presence when they come online
CREATE OR REPLACE FUNCTION update_user_online(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    is_online = true,
    online_at = now(),
    last_seen = now(),
    last_login = CASE WHEN last_login IS NULL THEN now() ELSE last_login END
  WHERE id = user_id;
END;
$$;

-- Function to update user presence when they go offline or update activity
CREATE OR REPLACE FUNCTION update_user_presence(user_id uuid, online_status boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    is_online = online_status,
    last_seen = now(),
    last_login = CASE WHEN online_status AND last_login IS NULL THEN now() ELSE last_login END,
    online_at = CASE WHEN online_status THEN now() ELSE online_at END
  WHERE id = user_id;
END;
$$;

-- Function to mark user as offline (call on logout or session end)
CREATE OR REPLACE FUNCTION mark_user_offline(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    is_online = false,
    last_seen = now()
  WHERE id = user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_user_online(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_presence(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_user_offline(uuid) TO authenticated;
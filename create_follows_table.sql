-- ─── Follows Table ────────────────────────────────────────────────────────────
-- Enables the Following feed tab to filter by accounts the user actually follows.
-- follower_id → auth.users.id (the signed-in user)
-- following_type → 'person' | 'business' | 'organization'
-- following_id → profiles.id / businesses.id / organizations.id depending on type

CREATE TABLE IF NOT EXISTS follows (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_type  text        NOT NULL CHECK (following_type IN ('person', 'business', 'organization')),
  following_id    uuid        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_type, following_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower   ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following  ON follows(following_type, following_id);

-- RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_all"  ON follows;
DROP POLICY IF EXISTS "follows_insert_own"  ON follows;
DROP POLICY IF EXISTS "follows_delete_own"  ON follows;

CREATE POLICY "follows_select_all"
  ON follows FOR SELECT USING (true);

CREATE POLICY "follows_insert_own"
  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_own"
  ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ─── RPC: toggle_follow ────────────────────────────────────────────────────────
-- Returns the new follow state: true = now following, false = unfollowed
CREATE OR REPLACE FUNCTION toggle_follow(
  p_following_type text,
  p_following_id   uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id    = auth.uid()
      AND following_type = p_following_type
      AND following_id   = p_following_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM follows
    WHERE follower_id    = auth.uid()
      AND following_type = p_following_type
      AND following_id   = p_following_id;
    RETURN false;
  ELSE
    INSERT INTO follows (follower_id, following_type, following_id)
    VALUES (auth.uid(), p_following_type, p_following_id);
    RETURN true;
  END IF;
END;
$$;

-- ─── RPC: get_following_ids ────────────────────────────────────────────────────
-- Returns an array of entity IDs that the current user follows.
-- Used by the Following feed tab to filter source_id.
CREATE OR REPLACE FUNCTION get_following_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(following_id), '{}')
  FROM follows
  WHERE follower_id = auth.uid();
$$;

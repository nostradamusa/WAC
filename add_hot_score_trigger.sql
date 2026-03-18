-- ─── hot_score Scoring Function & Triggers ────────────────────────────────────
-- Formula: (likes + comments × 2) / (hours_since_post + 2)^1.5
-- Inspired by Hacker News ranking. Newer posts with engagement surface first.
-- Triggers fire on INSERT/DELETE to feed_likes and feed_comments.

-- ─── Add column if it doesn't exist ──────────────────────────────────────────
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS hot_score numeric DEFAULT 0;

-- ─── Scoring function ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION compute_post_hot_score(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_likes     int;
  v_comments  int;
  v_hours     numeric;
  v_score     numeric;
BEGIN
  SELECT
    COALESCE(likes_count, 0),
    COALESCE(comments_count, 0),
    GREATEST(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0, 0)
  INTO v_likes, v_comments, v_hours
  FROM feed_posts
  WHERE id = p_post_id;

  IF NOT FOUND THEN RETURN; END IF;

  v_score := (v_likes + v_comments * 2.0) / POWER(v_hours + 2.0, 1.5);

  UPDATE feed_posts
  SET hot_score = v_score
  WHERE id = p_post_id;
END;
$$;

-- ─── Trigger function for feed_likes ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_update_hot_score_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM compute_post_hot_score(COALESCE(NEW.post_id, OLD.post_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_hot_score_like_insert ON feed_likes;
DROP TRIGGER IF EXISTS trg_hot_score_like_delete ON feed_likes;

CREATE TRIGGER trg_hot_score_like_insert
  AFTER INSERT ON feed_likes
  FOR EACH ROW EXECUTE FUNCTION trg_update_hot_score_on_like();

CREATE TRIGGER trg_hot_score_like_delete
  AFTER DELETE ON feed_likes
  FOR EACH ROW EXECUTE FUNCTION trg_update_hot_score_on_like();

-- ─── Trigger function for feed_comments ──────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_update_hot_score_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM compute_post_hot_score(COALESCE(NEW.post_id, OLD.post_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_hot_score_comment_insert ON feed_comments;
DROP TRIGGER IF EXISTS trg_hot_score_comment_delete ON feed_comments;

CREATE TRIGGER trg_hot_score_comment_insert
  AFTER INSERT ON feed_comments
  FOR EACH ROW EXECUTE FUNCTION trg_update_hot_score_on_comment();

CREATE TRIGGER trg_hot_score_comment_delete
  AFTER DELETE ON feed_comments
  FOR EACH ROW EXECUTE FUNCTION trg_update_hot_score_on_comment();

-- ─── Backfill: recalculate hot_score for all existing published posts ─────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM feed_posts WHERE status = 'published' LOOP
    PERFORM compute_post_hot_score(r.id);
  END LOOP;
END;
$$;

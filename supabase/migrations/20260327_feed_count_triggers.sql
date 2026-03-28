-- ─────────────────────────────────────────────────────────────────────────────
-- Feed count triggers
-- Maintains denormalized likes_count, comments_count, repost_count on feed_posts
-- so Top-sort and count displays are always accurate.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── likes_count ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_increment_post_likes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_decrement_post_likes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE feed_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_feed_likes_insert ON feed_likes;
CREATE TRIGGER trg_feed_likes_insert
  AFTER INSERT ON feed_likes
  FOR EACH ROW EXECUTE FUNCTION fn_increment_post_likes();

DROP TRIGGER IF EXISTS trg_feed_likes_delete ON feed_likes;
CREATE TRIGGER trg_feed_likes_delete
  AFTER DELETE ON feed_likes
  FOR EACH ROW EXECUTE FUNCTION fn_decrement_post_likes();

-- ── comments_count ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_increment_post_comments()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE feed_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_decrement_post_comments()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE feed_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_feed_comments_insert ON feed_comments;
CREATE TRIGGER trg_feed_comments_insert
  AFTER INSERT ON feed_comments
  FOR EACH ROW EXECUTE FUNCTION fn_increment_post_comments();

DROP TRIGGER IF EXISTS trg_feed_comments_delete ON feed_comments;
CREATE TRIGGER trg_feed_comments_delete
  AFTER DELETE ON feed_comments
  FOR EACH ROW EXECUTE FUNCTION fn_decrement_post_comments();

-- ── repost_count ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_increment_post_reposts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.original_post_id IS NOT NULL AND NEW.status = 'published' THEN
    UPDATE feed_posts SET repost_count = repost_count + 1 WHERE id = NEW.original_post_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_decrement_post_reposts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.original_post_id IS NOT NULL THEN
    UPDATE feed_posts SET repost_count = GREATEST(0, repost_count - 1) WHERE id = OLD.original_post_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_feed_posts_repost_insert ON feed_posts;
CREATE TRIGGER trg_feed_posts_repost_insert
  AFTER INSERT ON feed_posts
  FOR EACH ROW EXECUTE FUNCTION fn_increment_post_reposts();

DROP TRIGGER IF EXISTS trg_feed_posts_repost_delete ON feed_posts;
CREATE TRIGGER trg_feed_posts_repost_delete
  AFTER DELETE ON feed_posts
  FOR EACH ROW EXECUTE FUNCTION fn_decrement_post_reposts();

-- ── Backfill existing counts (idempotent) ─────────────────────────────────────
-- Corrects any drift from before triggers were deployed.

UPDATE feed_posts fp
SET likes_count = (SELECT COUNT(*) FROM feed_likes fl WHERE fl.post_id = fp.id);

UPDATE feed_posts fp
SET comments_count = (SELECT COUNT(*) FROM feed_comments fc WHERE fc.post_id = fp.id);

UPDATE feed_posts fp
SET repost_count = (
  SELECT COUNT(*) FROM feed_posts rp
  WHERE rp.original_post_id = fp.id AND rp.status = 'published'
);

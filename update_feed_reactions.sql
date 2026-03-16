-- Database Migration: Add reaction_type to feed_likes

-- 1. Add reaction_type column to feed_likes table
ALTER TABLE public.feed_likes 
ADD COLUMN IF NOT EXISTS reaction_type VARCHAR(20) DEFAULT 'like';

-- 2. Drop the old trigger and function
DROP TRIGGER IF EXISTS trigger_feed_likes_count ON public.feed_likes;
DROP FUNCTION IF EXISTS update_feed_likes_count();

-- 3. Create a new function that handles the reaction counts
-- Note: We are still using the `likes_count` column name for simplicity, but it now represents total reactions.
CREATE OR REPLACE FUNCTION update_feed_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If they just changed the reaction type, count doesn't change
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-attach the trigger
CREATE TRIGGER trigger_feed_likes_count
AFTER INSERT OR DELETE OR UPDATE ON public.feed_likes
FOR EACH ROW EXECUTE FUNCTION update_feed_likes_count();

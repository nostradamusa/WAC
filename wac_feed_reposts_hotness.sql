-- 1. Add fields for reposts
ALTER TABLE public.feed_posts
ADD COLUMN IF NOT EXISTS original_post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS repost_count INTEGER DEFAULT 0;

-- 2. Create the "Hot" Score Algorithm
-- This function is treated as a computed column in Supabase (PostgREST)
-- because it takes the table row as its only argument.
-- It can be used directly in the .order() clause!
CREATE OR REPLACE FUNCTION public.hot_score(post_row public.feed_posts)
RETURNS NUMERIC AS $$
DECLARE
    hours_age NUMERIC;
    score NUMERIC;
BEGIN
    -- Calculate age in hours
    hours_age := EXTRACT(EPOCH FROM (now() - post_row.created_at)) / 3600.0;
    
    -- Safety: ensure age is never negative
    IF hours_age < 0 THEN
        hours_age := 0;
    END IF;

    -- HackerNews Algorithm: (P) / (T + 2)^G
    -- P = Likes + (Reposts * 3)
    -- T = Age in hours
    -- G = 1.8 (Gravity)
    
    -- Important: Need an explicit cast to double precision for POWER
    score := (post_row.likes_count + (post_row.repost_count * 3.0)) / POWER((hours_age::double precision + 2.0), 1.8);
    
    RETURN score;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Trigger Function: Update Repost Counts automatically
CREATE OR REPLACE FUNCTION public.handle_repost_count()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new repost is created
    IF TG_OP = 'INSERT' AND NEW.original_post_id IS NOT NULL THEN
        UPDATE public.feed_posts
        SET repost_count = repost_count + 1
        WHERE id = NEW.original_post_id;
    -- When a repost is deleted
    ELSIF TG_OP = 'DELETE' AND OLD.original_post_id IS NOT NULL THEN
        UPDATE public.feed_posts
        SET repost_count = repost_count - 1
        WHERE id = OLD.original_post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the Trigger
DROP TRIGGER IF EXISTS trigger_update_repost_count ON public.feed_posts;

CREATE TRIGGER trigger_update_repost_count
AFTER INSERT OR DELETE ON public.feed_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_repost_count();

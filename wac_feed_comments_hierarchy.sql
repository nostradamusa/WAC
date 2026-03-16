-- wac_feed_comments_hierarchy.sql
ALTER TABLE public.feed_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.feed_comments(id) ON DELETE CASCADE;

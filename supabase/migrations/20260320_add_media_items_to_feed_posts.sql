-- Add multi-media support to feed_posts
-- Run once in Supabase SQL editor or via Supabase CLI: supabase db push

ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS media_items JSONB DEFAULT '[]'::jsonb;

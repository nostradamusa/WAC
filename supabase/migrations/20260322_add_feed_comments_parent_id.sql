-- Add parent_id to support nested replies in the feed
ALTER TABLE feed_comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES feed_comments(id) ON DELETE CASCADE;

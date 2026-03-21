-- Add avatar and banner image support to groups
-- Run once in Supabase SQL editor

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS banner_url text;

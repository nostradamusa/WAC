-- ============================================================
-- WAC V1 Publishing System Migration
-- Run this in the Supabase SQL Editor
-- Safe to run: all CREATE/ALTER use IF NOT EXISTS
-- ============================================================


-- ============================================================
-- 1. EXTEND feed_posts WITH V1 PUBLISHING COLUMNS
-- ============================================================

ALTER TABLE feed_posts
  -- 3 primary formats: post | event | discussion
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'post'
    CHECK (content_type IN ('post', 'event', 'discussion')),

  -- Secondary intent tag — applies only to content_type = 'post'
  -- null means plain update (no badge shown)
  ADD COLUMN IF NOT EXISTS post_intent TEXT
    CHECK (post_intent IN ('update', 'announcement', 'opportunity', 'job', 'volunteer')),

  -- Who is publishing: user | organization | business | group
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'user'
    CHECK (source_type IN ('user', 'organization', 'business', 'group')),

  ADD COLUMN IF NOT EXISTS source_id UUID,

  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'followers', 'members')),

  -- Distribution flags (smart defaults applied per format in the composer)
  ADD COLUMN IF NOT EXISTS distribute_to_pulse      BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS distribute_to_following  BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS display_on_source_wall   BOOLEAN NOT NULL DEFAULT TRUE,

  -- Group association — required when source_type = 'group'
  ADD COLUMN IF NOT EXISTS linked_group_id UUID,

  -- CTA link — used on event + structured post intents
  ADD COLUMN IF NOT EXISTS cta_url   TEXT,
  ADD COLUMN IF NOT EXISTS cta_label TEXT,

  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'draft', 'archived', 'deleted'));


-- ============================================================
-- 2. BACKFILL source_type AND source_id FROM EXISTING AUTHOR COLUMNS
-- ============================================================

UPDATE feed_posts
SET
  source_type = CASE
    WHEN author_organization_id IS NOT NULL THEN 'organization'
    WHEN author_business_id     IS NOT NULL THEN 'business'
    ELSE 'user'
  END,
  source_id = COALESCE(
    author_organization_id,
    author_business_id,
    author_profile_id
  )
WHERE source_id IS NULL;


-- ============================================================
-- 3. BACKFILL content_type + post_intent FROM LEGACY post_type
--    (only affects existing rows that have the legacy field set)
-- ============================================================

-- Legacy 'opportunity' → post format with opportunity intent
UPDATE feed_posts
SET content_type = 'post', post_intent = 'opportunity'
WHERE post_type = 'opportunity';

-- Legacy 'ask' → discussion format
UPDATE feed_posts
SET content_type = 'discussion', post_intent = NULL
WHERE post_type = 'ask';

-- All remaining 'general' posts stay as content_type = 'post' (default)
-- post_intent stays NULL → rendered as plain update, no badge


-- ============================================================
-- 4. BACKFILL DISTRIBUTION FLAGS FOR ALL EXISTING PUBLISHED POSTS
-- They were already showing everywhere — preserve that behavior
-- ============================================================

UPDATE feed_posts
SET
  distribute_to_pulse     = TRUE,
  distribute_to_following = TRUE,
  display_on_source_wall  = TRUE
WHERE status = 'published';


-- ============================================================
-- 5. comment_reactions — EMOJI REACTIONS ON COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS comment_reactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id    UUID NOT NULL REFERENCES feed_comments(id) ON DELETE CASCADE,
  profile_id    UUID NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (comment_id, profile_id)
);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own comment reactions" ON comment_reactions;
CREATE POLICY "Users manage own comment reactions"
  ON comment_reactions FOR ALL
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can read comment reactions" ON comment_reactions;
CREATE POLICY "Anyone can read comment reactions"
  ON comment_reactions FOR SELECT USING (true);


-- ============================================================
-- 6. group_memberships — JOIN VS FOLLOW DISTINCTION
-- ============================================================

CREATE TABLE IF NOT EXISTS group_memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'moderator', 'admin')),
  status     TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'banned')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id, user_id)
);

ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read their own memberships"
  ON group_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can join groups"
  ON group_memberships FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON group_memberships FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================
-- 7. INDEXES FOR FEED QUERY PERFORMANCE
-- ============================================================

-- The Pulse feed: published posts distributed to pulse, newest first
CREATE INDEX IF NOT EXISTS idx_feed_posts_pulse
  ON feed_posts (distribute_to_pulse, status, created_at DESC)
  WHERE status = 'published' AND distribute_to_pulse = TRUE;

-- Source wall: profile / org / business / group pages
CREATE INDEX IF NOT EXISTS idx_feed_posts_source_wall
  ON feed_posts (source_type, source_id, display_on_source_wall, created_at DESC)
  WHERE display_on_source_wall = TRUE;

-- Following feed
CREATE INDEX IF NOT EXISTS idx_feed_posts_following
  ON feed_posts (source_id, distribute_to_following, status, created_at DESC)
  WHERE status = 'published' AND distribute_to_following = TRUE;

-- Format + status lookups
CREATE INDEX IF NOT EXISTS idx_feed_posts_content_type
  ON feed_posts (content_type, status, created_at DESC);

-- Group discussions
CREATE INDEX IF NOT EXISTS idx_feed_posts_group
  ON feed_posts (linked_group_id, content_type, created_at DESC)
  WHERE linked_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_group_memberships_user
  ON group_memberships (user_id, status);

CREATE INDEX IF NOT EXISTS idx_group_memberships_group
  ON group_memberships (group_id, status);


-- ============================================================
-- 8. RLS ON feed_posts — SOURCE-AWARE
-- ============================================================

-- Public posts visible to everyone
DROP POLICY IF EXISTS "Public feed posts are visible" ON feed_posts;
CREATE POLICY "Public feed posts are visible"
  ON feed_posts FOR SELECT
  USING (visibility = 'public' AND status = 'published');

-- Authenticated users can insert posts
DROP POLICY IF EXISTS "Authenticated users can post" ON feed_posts;
CREATE POLICY "Authenticated users can post"
  ON feed_posts FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

-- Authors can edit their own posts
DROP POLICY IF EXISTS "Authors can edit their posts" ON feed_posts;
CREATE POLICY "Authors can edit their posts"
  ON feed_posts FOR UPDATE
  USING (submitted_by = auth.uid());

-- Authors can delete their own posts
DROP POLICY IF EXISTS "Authors can delete their posts" ON feed_posts;
CREATE POLICY "Authors can delete their posts"
  ON feed_posts FOR DELETE
  USING (submitted_by = auth.uid());


-- ============================================================
-- DONE
-- ============================================================
-- Data model after this migration:
--
--   content_type  = 'post' | 'event' | 'discussion'
--   post_intent   = 'update' | 'announcement' | 'opportunity' | 'job' | 'volunteer' | null
--   source_type   = 'user' | 'organization' | 'business' | 'group'
--
-- Distribution defaults (applied in the composer, overridable):
--   post        → pulse ✓  following ✓  wall ✓
--   event       → pulse ✓  following ✓  wall ✓
--   discussion  → pulse ✓  following ✓  wall ✗  (group: pulse ✗  following ✗  wall ✓)
--
-- Tables added:
--   comment_reactions  — emoji reactions on comments
--   group_memberships  — join vs follow distinction for groups
-- ============================================================

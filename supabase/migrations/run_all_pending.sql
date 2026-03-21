-- ============================================================
-- Run this entire file once in your Supabase SQL Editor
-- to apply all pending migrations.
-- ============================================================

-- ── feed_posts ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feed_posts (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_profile_id       uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  author_business_id      uuid        REFERENCES businesses(id) ON DELETE SET NULL,
  author_organization_id  uuid        REFERENCES organizations(id) ON DELETE SET NULL,
  original_post_id        uuid        REFERENCES feed_posts(id) ON DELETE SET NULL,
  content                 text        NOT NULL DEFAULT '',
  post_type               text        NOT NULL DEFAULT 'general'
                                      CHECK (post_type IN ('general', 'story', 'event', 'media', 'repost')),
  content_type            text        NOT NULL DEFAULT 'post'
                                      CHECK (content_type IN ('post', 'update')),
  status                  text        NOT NULL DEFAULT 'published'
                                      CHECK (status IN ('published', 'draft', 'removed')),
  image_url               text,
  media_items             jsonb       NOT NULL DEFAULT '[]'::jsonb,
  likes_count             integer     NOT NULL DEFAULT 0,
  comments_count          integer     NOT NULL DEFAULT 0,
  repost_count            integer     NOT NULL DEFAULT 0,
  distribute_to_pulse     boolean     NOT NULL DEFAULT true,
  distribute_to_following boolean     NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- If feed_posts already exists, just ensure the media_items column is present:
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS media_items jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'general';
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'post';
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS distribute_to_pulse boolean NOT NULL DEFAULT true;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS distribute_to_following boolean NOT NULL DEFAULT true;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS comments_count integer NOT NULL DEFAULT 0;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS repost_count integer NOT NULL DEFAULT 0;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS original_post_id uuid REFERENCES feed_posts(id) ON DELETE SET NULL;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS author_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS author_business_id uuid REFERENCES businesses(id) ON DELETE SET NULL;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS author_organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

-- RLS for feed_posts
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feed_posts_select" ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_insert" ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_update" ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_delete" ON feed_posts;
CREATE POLICY "feed_posts_select" ON feed_posts FOR SELECT USING (status = 'published');
CREATE POLICY "feed_posts_insert" ON feed_posts FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "feed_posts_update" ON feed_posts FOR UPDATE TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "feed_posts_delete" ON feed_posts FOR DELETE TO authenticated USING (submitted_by = auth.uid());

-- ── feed_likes ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feed_likes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid        NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  profile_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text        NOT NULL DEFAULT 'like',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, profile_id)
);

ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feed_likes_select" ON feed_likes;
DROP POLICY IF EXISTS "feed_likes_insert" ON feed_likes;
DROP POLICY IF EXISTS "feed_likes_update" ON feed_likes;
DROP POLICY IF EXISTS "feed_likes_delete" ON feed_likes;
CREATE POLICY "feed_likes_select" ON feed_likes FOR SELECT USING (true);
CREATE POLICY "feed_likes_insert" ON feed_likes FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "feed_likes_update" ON feed_likes FOR UPDATE TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "feed_likes_delete" ON feed_likes FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- ── feed_comments ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feed_comments (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id                 uuid        NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  parent_id               uuid        REFERENCES feed_comments(id) ON DELETE CASCADE,
  submitted_by            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_profile_id       uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  author_business_id      uuid        REFERENCES businesses(id) ON DELETE SET NULL,
  author_organization_id  uuid        REFERENCES organizations(id) ON DELETE SET NULL,
  content                 text        NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feed_comments_select" ON feed_comments;
DROP POLICY IF EXISTS "feed_comments_insert" ON feed_comments;
DROP POLICY IF EXISTS "feed_comments_update" ON feed_comments;
DROP POLICY IF EXISTS "feed_comments_delete" ON feed_comments;
CREATE POLICY "feed_comments_select" ON feed_comments FOR SELECT USING (true);
CREATE POLICY "feed_comments_insert" ON feed_comments FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "feed_comments_update" ON feed_comments FOR UPDATE TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "feed_comments_delete" ON feed_comments FOR DELETE TO authenticated USING (submitted_by = auth.uid());

-- ── comment_reactions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comment_reactions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id    uuid        NOT NULL REFERENCES feed_comments(id) ON DELETE CASCADE,
  profile_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text        NOT NULL DEFAULT 'like',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, profile_id)
);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comment_reactions_select" ON comment_reactions;
DROP POLICY IF EXISTS "comment_reactions_insert" ON comment_reactions;
DROP POLICY IF EXISTS "comment_reactions_update" ON comment_reactions;
DROP POLICY IF EXISTS "comment_reactions_delete" ON comment_reactions;
CREATE POLICY "comment_reactions_select" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "comment_reactions_insert" ON comment_reactions FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "comment_reactions_update" ON comment_reactions FOR UPDATE TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "comment_reactions_delete" ON comment_reactions FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS feed_posts_status_pulse_idx   ON feed_posts(status, distribute_to_pulse);
CREATE INDEX IF NOT EXISTS feed_posts_created_at_idx     ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS feed_likes_post_id_idx        ON feed_likes(post_id);
CREATE INDEX IF NOT EXISTS feed_likes_profile_id_idx     ON feed_likes(profile_id);
CREATE INDEX IF NOT EXISTS feed_comments_post_id_idx     ON feed_comments(post_id);
CREATE INDEX IF NOT EXISTS comment_reactions_comment_idx ON comment_reactions(comment_id);

-- ── Storage bucket (run separately if feed_media bucket doesn't exist) ────────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('feed_media', 'feed_media', true) ON CONFLICT (id) DO NOTHING;
-- CREATE POLICY "feed_media_select" ON storage.objects FOR SELECT USING (bucket_id = 'feed_media');
-- CREATE POLICY "feed_media_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'feed_media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── Legacy: migration 1 already applied via ALTER above ──────────────────────

-- 2. Groups table
CREATE TABLE IF NOT EXISTS groups (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text        UNIQUE NOT NULL,
  name                text        NOT NULL,
  tagline             text,
  description         text,
  category            text        NOT NULL,
  tags                text[]      NOT NULL DEFAULT '{}',
  location_relevance  text,
  privacy             text        NOT NULL DEFAULT 'private'
                                  CHECK (privacy IN ('public', 'private', 'secret')),
  join_policy         text        NOT NULL DEFAULT 'request'
                                  CHECK (join_policy IN ('open', 'request', 'invite_only')),
  linked_org_id       uuid        REFERENCES organizations(id) ON DELETE SET NULL,
  created_by          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count        integer     NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- 3. Group media columns
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS banner_url text;

-- 4. Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  profile_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'member'
                          CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  status      text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'pending', 'banned')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, profile_id)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS groups_category_idx       ON groups(category);
CREATE INDEX IF NOT EXISTS groups_created_at_idx     ON groups(created_at DESC);
CREATE INDEX IF NOT EXISTS group_members_group_idx   ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_profile_idx ON group_members(profile_id);

-- 6. RLS
ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups_select"         ON groups;
DROP POLICY IF EXISTS "groups_insert"         ON groups;
DROP POLICY IF EXISTS "groups_update"         ON groups;
DROP POLICY IF EXISTS "group_members_select"  ON group_members;
DROP POLICY IF EXISTS "group_members_insert"  ON group_members;

CREATE POLICY "groups_select" ON groups
  FOR SELECT USING (
    privacy IN ('public', 'private')
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id  = groups.id
        AND group_members.profile_id = auth.uid()
        AND group_members.status     = 'active'
    )
  );

CREATE POLICY "groups_insert" ON groups
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "groups_update" ON groups
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id  = groups.id
        AND group_members.profile_id = auth.uid()
        AND group_members.role        IN ('owner', 'admin')
        AND group_members.status      = 'active'
    )
  );

CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (true);

CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

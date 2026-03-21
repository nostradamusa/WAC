-- ============================================================
-- Feed tables migration
-- Run once in Supabase SQL Editor
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

-- ── feed_likes ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feed_likes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid        NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  profile_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text        NOT NULL DEFAULT 'like',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, profile_id)
);

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

-- ── comment_reactions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comment_reactions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id    uuid        NOT NULL REFERENCES feed_comments(id) ON DELETE CASCADE,
  profile_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text        NOT NULL DEFAULT 'like',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, profile_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS feed_posts_status_pulse_idx     ON feed_posts(status, distribute_to_pulse);
CREATE INDEX IF NOT EXISTS feed_posts_created_at_idx       ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS feed_posts_author_profile_idx   ON feed_posts(author_profile_id);
CREATE INDEX IF NOT EXISTS feed_likes_post_id_idx          ON feed_likes(post_id);
CREATE INDEX IF NOT EXISTS feed_likes_profile_id_idx       ON feed_likes(profile_id);
CREATE INDEX IF NOT EXISTS feed_comments_post_id_idx       ON feed_comments(post_id);
CREATE INDEX IF NOT EXISTS comment_reactions_comment_idx   ON comment_reactions(comment_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE feed_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_likes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- feed_posts
DROP POLICY IF EXISTS "feed_posts_select"  ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_insert"  ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_update"  ON feed_posts;
DROP POLICY IF EXISTS "feed_posts_delete"  ON feed_posts;

CREATE POLICY "feed_posts_select" ON feed_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "feed_posts_insert" ON feed_posts
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "feed_posts_update" ON feed_posts
  FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid());

CREATE POLICY "feed_posts_delete" ON feed_posts
  FOR DELETE TO authenticated
  USING (submitted_by = auth.uid());

-- feed_likes
DROP POLICY IF EXISTS "feed_likes_select" ON feed_likes;
DROP POLICY IF EXISTS "feed_likes_insert" ON feed_likes;
DROP POLICY IF EXISTS "feed_likes_delete" ON feed_likes;
DROP POLICY IF EXISTS "feed_likes_update" ON feed_likes;

CREATE POLICY "feed_likes_select" ON feed_likes
  FOR SELECT USING (true);

CREATE POLICY "feed_likes_insert" ON feed_likes
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "feed_likes_update" ON feed_likes
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "feed_likes_delete" ON feed_likes
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- feed_comments
DROP POLICY IF EXISTS "feed_comments_select" ON feed_comments;
DROP POLICY IF EXISTS "feed_comments_insert" ON feed_comments;
DROP POLICY IF EXISTS "feed_comments_update" ON feed_comments;
DROP POLICY IF EXISTS "feed_comments_delete" ON feed_comments;

CREATE POLICY "feed_comments_select" ON feed_comments
  FOR SELECT USING (true);

CREATE POLICY "feed_comments_insert" ON feed_comments
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "feed_comments_update" ON feed_comments
  FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid());

CREATE POLICY "feed_comments_delete" ON feed_comments
  FOR DELETE TO authenticated
  USING (submitted_by = auth.uid());

-- comment_reactions
DROP POLICY IF EXISTS "comment_reactions_select" ON comment_reactions;
DROP POLICY IF EXISTS "comment_reactions_insert" ON comment_reactions;
DROP POLICY IF EXISTS "comment_reactions_update" ON comment_reactions;
DROP POLICY IF EXISTS "comment_reactions_delete" ON comment_reactions;

CREATE POLICY "comment_reactions_select" ON comment_reactions
  FOR SELECT USING (true);

CREATE POLICY "comment_reactions_insert" ON comment_reactions
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "comment_reactions_update" ON comment_reactions
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "comment_reactions_delete" ON comment_reactions
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- ── Storage bucket ────────────────────────────────────────────────────────────
-- Run separately if the bucket doesn't exist yet:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('feed_media', 'feed_media', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "feed_media_select" ON storage.objects
--   FOR SELECT USING (bucket_id = 'feed_media');
--
-- CREATE POLICY "feed_media_insert" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'feed_media' AND auth.uid()::text = (storage.foldername(name))[1]);

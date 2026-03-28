-- ============================================================
-- Ask the Network — add ask fields to feed_posts
-- Idempotent: safe to run multiple times
-- ============================================================

-- post_intent: semantic tag for a post's purpose (ask, announcement, etc.)
ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS post_intent text;

-- ask_title: short scan-friendly headline for the ask
ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS ask_title text;

-- ask_category: required category slug (e.g. 'hiring', 'mentorship')
ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS ask_category text;

-- ask_location: optional city/region or 'Remote'
ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS ask_location text;

-- ask_status: lifecycle placeholder — open by default
ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS ask_status text NOT NULL DEFAULT 'open';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'feed_posts_ask_status_check'
  ) THEN
    ALTER TABLE feed_posts
      ADD CONSTRAINT feed_posts_ask_status_check
      CHECK (ask_status IN ('open', 'answered', 'solved'));
  END IF;
END;
$$;

-- ask_urgency: lightweight urgency marker
ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS ask_urgency text NOT NULL DEFAULT 'normal';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'feed_posts_ask_urgency_check'
  ) THEN
    ALTER TABLE feed_posts
      ADD CONSTRAINT feed_posts_ask_urgency_check
      CHECK (ask_urgency IN ('normal', 'soon', 'urgent'));
  END IF;
END;
$$;

-- ask_best_response_id: future-facing, no v1 UI required
ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS ask_best_response_id uuid
    REFERENCES feed_comments(id) ON DELETE SET NULL;

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS feed_posts_post_intent_idx
  ON feed_posts(post_intent);

CREATE INDEX IF NOT EXISTS feed_posts_ask_status_idx
  ON feed_posts(ask_status)
  WHERE post_intent = 'ask';

CREATE INDEX IF NOT EXISTS feed_posts_ask_category_idx
  ON feed_posts(ask_category)
  WHERE post_intent = 'ask';

CREATE INDEX IF NOT EXISTS feed_posts_ask_urgency_idx
  ON feed_posts(ask_urgency)
  WHERE post_intent = 'ask';

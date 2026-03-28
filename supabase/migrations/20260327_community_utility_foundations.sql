-- ============================================================
-- Community Utility — schema foundations
-- Idempotent: safe to run multiple times
--
-- Purpose: Lay groundwork for a future helpfulness-based
-- reputation system. No scoring logic is implemented yet.
-- This migration creates:
--   1. community_utility_scores — per-entity utility summary
--   2. community_utility_events — individual contribution log
-- ============================================================

-- ── 1. Utility scores table ──────────────────────────────────────────────────
-- One row per entity (person, business, or organization).
-- Future scoring logic will aggregate events into these scores.

CREATE TABLE IF NOT EXISTS community_utility_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL,  -- 'person' | 'business' | 'organization'
  entity_id       UUID NOT NULL,
  utility_score   INTEGER NOT NULL DEFAULT 0,
  tier            TEXT NOT NULL DEFAULT 'rising',
  -- Breakdown counters for transparency
  asks_answered   INTEGER NOT NULL DEFAULT 0,
  helpful_responses INTEGER NOT NULL DEFAULT 0,
  mentorship_given INTEGER NOT NULL DEFAULT 0,
  referrals_made  INTEGER NOT NULL DEFAULT 0,
  events_hosted   INTEGER NOT NULL DEFAULT 0,
  contributions   INTEGER NOT NULL DEFAULT 0,
  -- Timestamps
  last_calculated_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);

-- Tier constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'community_utility_scores_tier_check'
  ) THEN
    ALTER TABLE community_utility_scores
      ADD CONSTRAINT community_utility_scores_tier_check
      CHECK (tier IN ('rising', 'reliable', 'trusted', 'cornerstone', 'pillar'));
  END IF;
END;
$$;

-- Entity type constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'community_utility_scores_entity_type_check'
  ) THEN
    ALTER TABLE community_utility_scores
      ADD CONSTRAINT community_utility_scores_entity_type_check
      CHECK (entity_type IN ('person', 'business', 'organization'));
  END IF;
END;
$$;

-- ── 2. Utility events table ─────────────────────────────────────────────────
-- Append-only log of actions that contribute to utility.
-- Future scoring logic reads from here.

CREATE TABLE IF NOT EXISTS community_utility_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  event_type    TEXT NOT NULL,
  -- Optional context references
  post_id       UUID REFERENCES feed_posts(id) ON DELETE SET NULL,
  comment_id    UUID REFERENCES feed_comments(id) ON DELETE SET NULL,
  target_entity_type TEXT,
  target_entity_id   UUID,
  -- Metadata
  points        INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Event type constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'community_utility_events_event_type_check'
  ) THEN
    ALTER TABLE community_utility_events
      ADD CONSTRAINT community_utility_events_event_type_check
      CHECK (event_type IN (
        'ask_answered',
        'helpful_response',
        'mentorship_given',
        'referral_made',
        'event_hosted',
        'volunteer_posted',
        'fundraiser_posted',
        'group_contribution',
        'community_post'
      ));
  END IF;
END;
$$;

-- ── 3. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS community_utility_scores_entity_idx
  ON community_utility_scores(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS community_utility_scores_tier_idx
  ON community_utility_scores(tier);

CREATE INDEX IF NOT EXISTS community_utility_scores_score_idx
  ON community_utility_scores(utility_score DESC);

CREATE INDEX IF NOT EXISTS community_utility_events_entity_idx
  ON community_utility_events(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS community_utility_events_type_idx
  ON community_utility_events(event_type);

CREATE INDEX IF NOT EXISTS community_utility_events_created_idx
  ON community_utility_events(created_at DESC);

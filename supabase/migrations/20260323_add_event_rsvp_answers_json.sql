-- Stores RSVP form answers directly on each RSVP row.
-- Safe to re-run.

ALTER TABLE event_rsvps
  ADD COLUMN IF NOT EXISTS rsvp_answers jsonb NOT NULL DEFAULT '{}'::jsonb;

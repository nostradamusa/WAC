-- Rich event support: structured event metadata, RSVP records, and event questions.
-- Safe to re-run.

ALTER TABLE events ADD COLUMN IF NOT EXISTS location_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS virtual_link text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rsvp_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS access_mode text NOT NULL DEFAULT 'open';
ALTER TABLE events ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity integer;
ALTER TABLE events ADD COLUMN IF NOT EXISTS waitlist_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_plus_ones boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS require_guest_names boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_access_mode_check'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_access_mode_check
      CHECK (access_mode IN ('open', 'invite', 'approval', 'members'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS event_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'text',
  is_required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (question_type IN ('text', 'yesno', 'choice'))
);

CREATE INDEX IF NOT EXISTS event_questions_event_id_idx
  ON event_questions(event_id, sort_order);

CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going',
  approval_status text NOT NULL DEFAULT 'approved',
  guest_count integer NOT NULL DEFAULT 1,
  guest_names text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id),
  CHECK (status IN ('going', 'interested', 'not_going')),
  CHECK (approval_status IN ('approved', 'pending', 'declined')),
  CHECK (guest_count >= 1)
);

CREATE INDEX IF NOT EXISTS event_rsvps_event_status_idx
  ON event_rsvps(event_id, status);

ALTER TABLE event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_questions_select" ON event_questions;
DROP POLICY IF EXISTS "event_questions_insert" ON event_questions;
DROP POLICY IF EXISTS "event_questions_update" ON event_questions;
DROP POLICY IF EXISTS "event_questions_delete" ON event_questions;
DROP POLICY IF EXISTS "event_rsvps_select" ON event_rsvps;
DROP POLICY IF EXISTS "event_rsvps_insert" ON event_rsvps;
DROP POLICY IF EXISTS "event_rsvps_update" ON event_rsvps;
DROP POLICY IF EXISTS "event_rsvps_delete" ON event_rsvps;

CREATE POLICY "event_questions_select" ON event_questions
  FOR SELECT USING (true);

CREATE POLICY "event_questions_insert" ON event_questions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM events
      WHERE events.id = event_questions.event_id
        AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "event_questions_update" ON event_questions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM events
      WHERE events.id = event_questions.event_id
        AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "event_questions_delete" ON event_questions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM events
      WHERE events.id = event_questions.event_id
        AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "event_rsvps_select" ON event_rsvps
  FOR SELECT USING (true);

CREATE POLICY "event_rsvps_insert" ON event_rsvps
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "event_rsvps_update" ON event_rsvps
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "event_rsvps_delete" ON event_rsvps
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

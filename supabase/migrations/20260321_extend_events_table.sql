-- Extend the existing events table with columns needed by the calendar composer.
-- All statements use IF NOT EXISTS so they are safe to re-run.

-- Core fields that may already exist from an earlier manual migration
ALTER TABLE events ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time  timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS city        text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS state       text;

-- New fields added by the calendar composer
ALTER TABLE events ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time    timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location    text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility  text NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public', 'members', 'private'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for efficient calendar queries
CREATE INDEX IF NOT EXISTS events_start_time_idx  ON events(start_time);
CREATE INDEX IF NOT EXISTS events_created_by_idx  ON events(created_by);

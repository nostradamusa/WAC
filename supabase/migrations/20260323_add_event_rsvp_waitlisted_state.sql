-- Extend RSVP approval state to support waitlisting.
-- Safe to re-run.

ALTER TABLE event_rsvps
  ADD COLUMN IF NOT EXISTS approval_status text;

UPDATE event_rsvps
SET approval_status = 'approved'
WHERE approval_status IS NULL;

ALTER TABLE event_rsvps
  ALTER COLUMN approval_status SET DEFAULT 'approved';

ALTER TABLE event_rsvps
  ALTER COLUMN approval_status SET NOT NULL;

ALTER TABLE event_rsvps
  DROP CONSTRAINT IF EXISTS event_rsvps_approval_status_check;

ALTER TABLE event_rsvps
  ADD CONSTRAINT event_rsvps_approval_status_check
  CHECK (approval_status IN ('approved', 'pending', 'declined', 'waitlisted'));

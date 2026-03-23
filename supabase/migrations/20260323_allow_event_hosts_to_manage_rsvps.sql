-- Allow event creators to manage approval state for RSVPs on their own events.
-- Safe to re-run.

DROP POLICY IF EXISTS "event_rsvps_host_update" ON event_rsvps;
DROP POLICY IF EXISTS "event_rsvps_host_delete" ON event_rsvps;

CREATE POLICY "event_rsvps_host_update" ON event_rsvps
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM events
      WHERE events.id = event_rsvps.event_id
        AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "event_rsvps_host_delete" ON event_rsvps
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM events
      WHERE events.id = event_rsvps.event_id
        AND events.created_by = auth.uid()
    )
  );

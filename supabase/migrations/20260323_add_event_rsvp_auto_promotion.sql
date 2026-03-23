-- Auto-promote the next waitlisted attendee when a counted RSVP seat opens.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.set_event_rsvp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_event_rsvp_updated_at ON public.event_rsvps;

CREATE TRIGGER set_event_rsvp_updated_at
BEFORE UPDATE ON public.event_rsvps
FOR EACH ROW
EXECUTE FUNCTION public.set_event_rsvp_updated_at();

CREATE OR REPLACE FUNCTION public.promote_next_waitlisted_event_rsvp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_event_id uuid;
  counted_before boolean := false;
  counted_after boolean := false;
  event_capacity integer;
  approved_going_count integer;
  next_waitlisted_id uuid;
BEGIN
  target_event_id := COALESCE(NEW.event_id, OLD.event_id);

  IF TG_OP <> 'DELETE' THEN
    counted_after := NEW.status = 'going' AND NEW.approval_status = 'approved';
  END IF;

  IF TG_OP <> 'INSERT' THEN
    counted_before := OLD.status = 'going' AND OLD.approval_status = 'approved';
  END IF;

  IF NOT counted_before OR counted_after THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT capacity
  INTO event_capacity
  FROM public.events
  WHERE id = target_event_id
    AND waitlist_enabled = true;

  IF event_capacity IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*)
  INTO approved_going_count
  FROM public.event_rsvps
  WHERE event_id = target_event_id
    AND status = 'going'
    AND approval_status = 'approved';

  IF approved_going_count >= event_capacity THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT id
  INTO next_waitlisted_id
  FROM public.event_rsvps
  WHERE event_id = target_event_id
    AND status = 'going'
    AND approval_status = 'waitlisted'
  ORDER BY created_at ASC
  LIMIT 1;

  IF next_waitlisted_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.event_rsvps
  SET approval_status = 'approved'
  WHERE id = next_waitlisted_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS promote_next_waitlisted_event_rsvp ON public.event_rsvps;

CREATE TRIGGER promote_next_waitlisted_event_rsvp
AFTER UPDATE OR DELETE ON public.event_rsvps
FOR EACH ROW
EXECUTE FUNCTION public.promote_next_waitlisted_event_rsvp();

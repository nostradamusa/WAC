-- Structured event host metadata for person-first hosting and entity-backed publishing.
-- Safe to re-run.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS host_entity_type text,
  ADD COLUMN IF NOT EXISTS host_entity_id uuid,
  ADD COLUMN IF NOT EXISTS linked_entity_type text,
  ADD COLUMN IF NOT EXISTS linked_entity_id uuid,
  ADD COLUMN IF NOT EXISTS hosting_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_host_entity_type_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_host_entity_type_check
      CHECK (host_entity_type IS NULL OR host_entity_type IN ('organization', 'business', 'group'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_linked_entity_type_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_linked_entity_type_check
      CHECK (linked_entity_type IS NULL OR linked_entity_type IN ('organization', 'business', 'group'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS events_host_entity_idx
  ON public.events(host_entity_type, host_entity_id);

CREATE INDEX IF NOT EXISTS events_linked_entity_idx
  ON public.events(linked_entity_type, linked_entity_id);

UPDATE public.events
SET
  host_entity_type = COALESCE(host_entity_type, CASE WHEN organization_id IS NOT NULL THEN 'organization' END),
  host_entity_id = COALESCE(host_entity_id, organization_id),
  linked_entity_type = COALESCE(linked_entity_type, CASE WHEN organization_id IS NOT NULL THEN 'organization' END),
  linked_entity_id = COALESCE(linked_entity_id, organization_id)
WHERE organization_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_event_hosting_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_has_access boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.host_entity_type IS NULL AND NEW.host_entity_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.host_entity_type IS NULL OR NEW.host_entity_id IS NULL THEN
    RAISE EXCEPTION 'Host entity type and id must both be provided.';
  END IF;

  CASE NEW.host_entity_type
    WHEN 'group' THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.group_members
        WHERE group_id = NEW.host_entity_id
          AND profile_id = v_user_id
          AND status = 'active'
          AND role IN ('owner', 'admin')
      )
      INTO v_has_access;
    WHEN 'business' THEN
      IF to_regclass('public.entity_roles') IS NOT NULL THEN
        SELECT EXISTS (
          SELECT 1
          FROM public.entity_roles
          WHERE user_id = v_user_id
            AND entity_type = 'business'
            AND entity_id = NEW.host_entity_id
            AND role <> 'member'
        )
        INTO v_has_access;
      ELSE
        SELECT EXISTS (
          SELECT 1
          FROM public.businesses
          WHERE id = NEW.host_entity_id
            AND owner_id = v_user_id
        )
        INTO v_has_access;
      END IF;
    WHEN 'organization' THEN
      IF to_regclass('public.entity_roles') IS NOT NULL THEN
        SELECT EXISTS (
          SELECT 1
          FROM public.entity_roles
          WHERE user_id = v_user_id
            AND entity_type = 'organization'
            AND entity_id = NEW.host_entity_id
            AND role <> 'member'
        )
        INTO v_has_access;
      ELSE
        SELECT EXISTS (
          SELECT 1
          FROM public.organizations
          WHERE id = NEW.host_entity_id
            AND owner_id = v_user_id
        )
        INTO v_has_access;
      END IF;
    ELSE
      RAISE EXCEPTION 'Unsupported host entity type: %', NEW.host_entity_type;
  END CASE;

  IF NOT v_has_access THEN
    RAISE EXCEPTION 'You do not have permission to host on behalf of this entity.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_event_hosting_permissions ON public.events;

CREATE TRIGGER validate_event_hosting_permissions
BEFORE INSERT OR UPDATE OF host_entity_type, host_entity_id
ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.validate_event_hosting_permissions();

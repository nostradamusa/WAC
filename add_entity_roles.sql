-- ============================================================================
-- Entity Access Layer — Role-based org/business administration
-- ============================================================================
--
-- Design principles:
--   1. Auth (Google OAuth / Magic Link) identifies the human. Always.
--   2. Entity access is governed by this table alone, not by email or owner_id.
--   3. Creating an entity makes you provisional owner via entity_roles.
--   4. Revoking a role row removes access; the entity is unaffected.
--   5. The last owner of an entity cannot be removed (trigger-enforced).
--   6. Verification (is_verified) is a separate administrative action.
--   7. Domain/email match is a trust signal only, never automatic ownership.
--
-- Run order: this file is self-contained and idempotent.
-- ============================================================================


-- ─── 1. entity_roles ─────────────────────────────────────────────────────────
--
-- Source of truth for who can act as which entity.

CREATE TABLE IF NOT EXISTS public.entity_roles (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type  TEXT        NOT NULL CHECK (entity_type IN ('business', 'organization')),
  entity_id    uuid        NOT NULL,
  role         TEXT        NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'member')),
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS entity_roles_user_idx   ON public.entity_roles (user_id);
CREATE INDEX IF NOT EXISTS entity_roles_entity_idx ON public.entity_roles (entity_type, entity_id);


-- ─── 2. entity_invites ───────────────────────────────────────────────────────
--
-- Invite tokens are email-bound. They are a trust signal, not ownership proof.
-- Accepting an invite requires being authenticated; the role is then assigned
-- to that authenticated user's account, regardless of which email they used.

CREATE TABLE IF NOT EXISTS public.entity_invites (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT        NOT NULL CHECK (entity_type IN ('business', 'organization')),
  entity_id    uuid        NOT NULL,
  email        TEXT        NOT NULL,
  role         TEXT        NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'member')),
  token        TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at  TIMESTAMPTZ,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'))
);

CREATE INDEX IF NOT EXISTS entity_invites_token_idx  ON public.entity_invites (token);
CREATE INDEX IF NOT EXISTS entity_invites_entity_idx ON public.entity_invites (entity_type, entity_id);

-- Only one pending invite per email per entity at a time
CREATE UNIQUE INDEX IF NOT EXISTS entity_invites_pending_unique
  ON public.entity_invites (entity_type, entity_id, email)
  WHERE status = 'pending';


-- ─── 3. Seed existing owner_id relationships ─────────────────────────────────
--
-- Converts existing owner_id values into proper role rows.
-- This is a one-time backfill; ON CONFLICT is a no-op on subsequent runs.

INSERT INTO public.entity_roles (user_id, entity_type, entity_id, role, granted_by)
SELECT owner_id, 'business', id, 'owner', owner_id
FROM   public.businesses
WHERE  owner_id IS NOT NULL
ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING;

INSERT INTO public.entity_roles (user_id, entity_type, entity_id, role, granted_by)
SELECT owner_id, 'organization', id, 'owner', owner_id
FROM   public.organizations
WHERE  owner_id IS NOT NULL
ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING;


-- ─── 4. Safety trigger: last-owner guard ─────────────────────────────────────
--
-- Prevents removing the final owner of any entity.
-- A user can remove themselves only after assigning another owner.

CREATE OR REPLACE FUNCTION public.guard_last_entity_owner()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  -- Only relevant when the affected row IS an owner
  IF OLD.role != 'owner' THEN
    RETURN OLD;
  END IF;

  -- Block DELETE or demotion away from owner if no other owner remains
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.role != 'owner') THEN
    IF (
      SELECT COUNT(*)
      FROM   public.entity_roles
      WHERE  entity_id   = OLD.entity_id
        AND  entity_type = OLD.entity_type
        AND  role        = 'owner'
        AND  id          != OLD.id
    ) = 0 THEN
      RAISE EXCEPTION
        'Cannot remove the last owner of this entity. Assign another owner first.';
    END IF;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_last_entity_owner ON public.entity_roles;
CREATE TRIGGER trg_guard_last_entity_owner
  BEFORE DELETE OR UPDATE ON public.entity_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_last_entity_owner();


-- ─── 5. RPC: create_entity_with_owner ────────────────────────────────────────
--
-- Atomically creates an entity and assigns the caller as owner.
-- Runs as SECURITY DEFINER so it can insert into entity_roles regardless of RLS.
-- is_verified defaults to FALSE — verification is a separate admin action.

CREATE OR REPLACE FUNCTION public.create_entity_with_owner(
  p_name        TEXT,
  p_slug        TEXT,
  p_description TEXT,
  p_entity_type TEXT
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid := auth.uid();
  v_entity_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_entity_type NOT IN ('business', 'organization') THEN
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;

  IF p_entity_type = 'business' THEN
    INSERT INTO public.businesses (name, slug, description, owner_id, is_verified)
    VALUES (p_name, p_slug, p_description, v_user_id, false)
    RETURNING id INTO v_entity_id;
  ELSE
    INSERT INTO public.organizations (name, slug, description, owner_id, is_verified)
    VALUES (p_name, p_slug, p_description, v_user_id, false)
    RETURNING id INTO v_entity_id;
  END IF;

  -- Assign provisional owner role — this is what grants access, not owner_id alone
  INSERT INTO public.entity_roles (user_id, entity_type, entity_id, role, granted_by)
  VALUES (v_user_id, p_entity_type, v_entity_id, 'owner', v_user_id);

  RETURN v_entity_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_entity_with_owner(TEXT, TEXT, TEXT, TEXT)
  TO authenticated;


-- ─── 6. RPC: invite_to_entity ────────────────────────────────────────────────
--
-- Creates an invite token for an email address. Only owners and admins can invite.
-- Returns the invite id; the caller is responsible for sending the invite email
-- with the token (via an Edge Function or server action).

CREATE OR REPLACE FUNCTION public.invite_to_entity(
  p_email       TEXT,
  p_entity_type TEXT,
  p_entity_id   uuid,
  p_role        TEXT DEFAULT 'member'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id   uuid := auth.uid();
  v_caller_role TEXT;
  v_invite_id   uuid;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_caller_role
  FROM   public.entity_roles
  WHERE  user_id = v_caller_id
    AND  entity_type = p_entity_type
    AND  entity_id   = p_entity_id;

  IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only owners and admins can invite members';
  END IF;

  -- Admins cannot invite owners
  IF v_caller_role = 'admin' AND p_role = 'owner' THEN
    RAISE EXCEPTION 'Admins cannot invite owners';
  END IF;

  -- Revoke any existing pending invite for this email + entity before re-inviting
  UPDATE public.entity_invites
  SET    status = 'revoked'
  WHERE  entity_type = p_entity_type
    AND  entity_id   = p_entity_id
    AND  email       = lower(p_email)
    AND  status      = 'pending';

  INSERT INTO public.entity_invites
    (entity_type, entity_id, email, role, invited_by)
  VALUES
    (p_entity_type, p_entity_id, lower(p_email), p_role, v_caller_id)
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_to_entity(TEXT, TEXT, uuid, TEXT)
  TO authenticated;


-- ─── 7. RPC: accept_entity_invite ────────────────────────────────────────────
--
-- Called by the invited user after they authenticate (via any method).
-- The invite is email-bound as a trust signal only; the role is assigned
-- to the authenticated user's account.

CREATE OR REPLACE FUNCTION public.accept_entity_invite(p_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_invite  public.entity_invites%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invite
  FROM   public.entity_invites
  WHERE  token      = p_token
    AND  status     = 'pending'
    AND  expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite is invalid, already used, or expired';
  END IF;

  -- Upsert role — if user already has a lower role, upgrade it
  INSERT INTO public.entity_roles
    (user_id, entity_type, entity_id, role, granted_by)
  VALUES
    (v_user_id, v_invite.entity_type, v_invite.entity_id, v_invite.role, v_invite.invited_by)
  ON CONFLICT (user_id, entity_type, entity_id)
  DO UPDATE SET
    role       = EXCLUDED.role,
    granted_by = EXCLUDED.granted_by,
    granted_at = now();

  UPDATE public.entity_invites
  SET    status = 'accepted', accepted_at = now()
  WHERE  id = v_invite.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_entity_invite(TEXT) TO authenticated;


-- ─── 8. RPC: revoke_entity_role ──────────────────────────────────────────────
--
-- Removes a user's access to an entity.
-- Owners can remove anyone (last-owner trigger blocks self-removal if sole owner).
-- Admins can only remove members and editors.

CREATE OR REPLACE FUNCTION public.revoke_entity_role(
  p_target_user_id uuid,
  p_entity_type    TEXT,
  p_entity_id      uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id   uuid := auth.uid();
  v_caller_role TEXT;
  v_target_role TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_caller_role
  FROM   public.entity_roles
  WHERE  user_id = v_caller_id
    AND  entity_type = p_entity_type
    AND  entity_id   = p_entity_id;

  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to remove members';
  END IF;

  SELECT role INTO v_target_role
  FROM   public.entity_roles
  WHERE  user_id = p_target_user_id
    AND  entity_type = p_entity_type
    AND  entity_id   = p_entity_id;

  -- Admins cannot remove owners or other admins
  IF v_caller_role = 'admin' AND v_target_role IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Admins cannot remove owners or other admins';
  END IF;

  -- DELETE fires the last-owner guard trigger if target is an owner
  DELETE FROM public.entity_roles
  WHERE  user_id = p_target_user_id
    AND  entity_type = p_entity_type
    AND  entity_id   = p_entity_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_entity_role(uuid, TEXT, uuid) TO authenticated;


-- ─── 9. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE public.entity_roles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_invites ENABLE ROW LEVEL SECURITY;

-- entity_roles: users see their own rows (drives ActorProvider identity list)
DROP POLICY IF EXISTS "Users see own entity roles"              ON public.entity_roles;
CREATE POLICY "Users see own entity roles"
  ON public.entity_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- entity_roles: owners and admins see all roles for entities they manage
DROP POLICY IF EXISTS "Owners and admins see entity member list" ON public.entity_roles;
CREATE POLICY "Owners and admins see entity member list"
  ON public.entity_roles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.entity_roles er
      WHERE  er.user_id    = auth.uid()
        AND  er.entity_id   = entity_roles.entity_id
        AND  er.entity_type = entity_roles.entity_type
        AND  er.role        IN ('owner', 'admin')
    )
  );

-- entity_invites: owners and admins see invites for their entities
DROP POLICY IF EXISTS "Owners and admins see entity invites" ON public.entity_invites;
CREATE POLICY "Owners and admins see entity invites"
  ON public.entity_invites FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.entity_roles er
      WHERE  er.user_id    = auth.uid()
        AND  er.entity_id   = entity_invites.entity_id
        AND  er.entity_type = entity_invites.entity_type
        AND  er.role        IN ('owner', 'admin')
    )
  );

-- All mutations to entity_roles and entity_invites go through SECURITY DEFINER
-- functions above — no direct INSERT/UPDATE/DELETE from clients.


-- ─── 10. messages: human actor audit column ──────────────────────────────────
--
-- Every message records both who sent it (human) and who they acted as (entity).
-- sent_by_user_id = the authenticated human
-- sender_id/sender_type = the entity they were acting as (already exists)

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sent_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill: for messages sent as 'user' type, sender_id IS the user
UPDATE public.messages
SET    sent_by_user_id = sender_id
WHERE  sent_by_user_id IS NULL
  AND  sender_type = 'user';


-- ─── 11. feed_posts: ensure dual-identity columns exist ──────────────────────
--
-- submitted_by = human who created the post (already exists)
-- source_type + source_id = entity they posted as

ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('user', 'organization', 'business', 'group')),
  ADD COLUMN IF NOT EXISTS source_id   uuid;

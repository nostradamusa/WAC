-- Groups and group membership tables
-- Run once in Supabase SQL editor

-- ── groups ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS groups (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text        UNIQUE NOT NULL,
  name                text        NOT NULL,
  tagline             text,
  description         text,
  category            text        NOT NULL,
  tags                text[]      NOT NULL DEFAULT '{}',
  location_relevance  text,
  privacy             text        NOT NULL DEFAULT 'private'
                                  CHECK (privacy IN ('public', 'private', 'secret')),
  join_policy         text        NOT NULL DEFAULT 'request'
                                  CHECK (join_policy IN ('open', 'request', 'invite_only')),
  linked_org_id       uuid        REFERENCES organizations(id) ON DELETE SET NULL,
  created_by          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count        integer     NOT NULL DEFAULT 1,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── group_members ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  profile_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'member'
                          CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  status      text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'pending', 'banned')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, profile_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS groups_category_idx       ON groups(category);
CREATE INDEX IF NOT EXISTS groups_created_at_idx     ON groups(created_at DESC);
CREATE INDEX IF NOT EXISTS group_members_group_idx   ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_profile_idx ON group_members(profile_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Public and private groups are visible to everyone; secret groups only to members
CREATE POLICY "groups_select" ON groups
  FOR SELECT USING (
    privacy IN ('public', 'private')
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id  = groups.id
        AND group_members.profile_id = auth.uid()
        AND group_members.status     = 'active'
    )
  );

-- Only the authenticated user who owns the row may insert
CREATE POLICY "groups_insert" ON groups
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Only the owner or an admin member may update
CREATE POLICY "groups_update" ON groups
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id  = groups.id
        AND group_members.profile_id = auth.uid()
        AND group_members.role        IN ('owner', 'admin')
        AND group_members.status      = 'active'
    )
  );

-- Members are readable by anyone
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (true);

-- Authenticated users may insert their own membership row
CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

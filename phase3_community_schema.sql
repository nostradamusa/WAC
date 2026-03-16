-- Phase 3: Community Hub & Shared Calendars Model

-- 1. User Organization Subscriptions
-- Allows users to subscribe to specific organizations to see their events in the Shared Calendar.
CREATE TABLE IF NOT EXISTS user_org_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, organization_id)
);

-- Index for fast lookup of a user's subscriptions
CREATE INDEX IF NOT EXISTS idx_user_org_subs_profile ON user_org_subscriptions(profile_id);

-- 2. Event Co-Hosts
-- Allows an event to be collaboratively hosted by multiple organizations.
-- This makes the event appear on multiple orgs' calendars simultaneously.
CREATE TABLE IF NOT EXISTS event_cohosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, organization_id)
);

-- Index to quickly find events co-hosted by a specific org
CREATE INDEX IF NOT EXISTS idx_event_cohosts_org ON event_cohosts(organization_id);

-- 3. Life Stage Tagging for Events
-- Adding a column to events so we can filter them by community hub tab
-- Options: 'teens', 'parents', 'careers', 'travelers', 'all'
ALTER TABLE events ADD COLUMN IF NOT EXISTS life_stage_tag VARCHAR(50) DEFAULT 'all';

CREATE INDEX IF NOT EXISTS idx_events_life_stage ON events(life_stage_tag);

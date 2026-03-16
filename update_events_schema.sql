-- Phase 2: Events Data Model (MVP)

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  location_name VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_type VARCHAR(100),
  visibility VARCHAR(50) DEFAULT 'public',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for temporal and spatial queries
CREATE INDEX IF NOT EXISTS idx_events_location ON events(country, state, city);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_time, end_time);

CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- going, interested, maybe
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, profile_id)
);

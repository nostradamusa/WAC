-- Phase 4: Activity Feed Data Model (Preliminary)

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_type VARCHAR(50) DEFAULT 'text',
  content TEXT NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- person, business, organization
  entity_id UUID NOT NULL,          -- Flexible association
  visibility VARCHAR(50) DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_entity ON posts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(post_id, profile_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

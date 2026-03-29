-- Add last_active_at to profiles for persistent presence display
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at) WHERE last_active_at IS NOT NULL;

-- Add message status columns for read receipts
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent'
  CHECK (status IN ('sending', 'sent', 'delivered', 'seen'));

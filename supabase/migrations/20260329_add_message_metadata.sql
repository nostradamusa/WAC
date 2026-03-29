-- Add metadata JSONB column to messages for rich content (entity cards, etc.)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN messages.metadata IS 'Optional structured data for rich messages: entity cards, scheduling, etc.';

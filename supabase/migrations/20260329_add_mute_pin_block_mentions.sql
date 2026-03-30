-- Sprint 4: Mute, pin, block, mentions support

-- 1. Muted conversations: add muted_at to conversation_participants
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS muted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Pinned conversations: add pinned_at to conversation_participants
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Pinned messages: add pinned_message_id to conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS pinned_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL DEFAULT NULL;

-- 4. Blocked users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocker_type VARCHAR(50) NOT NULL CHECK (blocker_type IN ('user', 'business', 'organization')),
  blocked_id UUID NOT NULL,
  blocked_type VARCHAR(50) NOT NULL CHECK (blocked_type IN ('user', 'business', 'organization')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(blocker_id, blocker_type, blocked_id, blocked_type)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id, blocker_type);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id, blocked_type);

-- 5. Mentions array on messages (stores actor IDs mentioned)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS mentions TEXT[] DEFAULT '{}'::text[];

-- 6. Index for pinned conversations lookup
CREATE INDEX IF NOT EXISTS idx_participants_pinned ON public.conversation_participants(actor_id)
  WHERE pinned_at IS NOT NULL;

-- 7. Index for muted conversations lookup
CREATE INDEX IF NOT EXISTS idx_participants_muted ON public.conversation_participants(actor_id)
  WHERE muted_at IS NOT NULL;

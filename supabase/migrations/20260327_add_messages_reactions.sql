-- Migration: Add reactions array to public.messages
-- Required for toggleMessageReactionDB and sendMessage routines

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reactions TEXT[] DEFAULT '{}'::text[];

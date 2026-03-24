-- Migration: Fix Missing Foreign Key for Moderation Queue JOIN

-- The /admin/reports dashboard attempts a Supabase PostgREST join mapping reporter_id directly to the profiles table.
-- Previously, reporter_id only referenced auth.users(id), causing an obscure 400 Bad Request schema crash.

-- 1. Ensure reported_content.reporter_id can join to profiles natively.
ALTER TABLE reported_content 
ADD CONSTRAINT reported_content_reporter_profile_fk 
FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE;

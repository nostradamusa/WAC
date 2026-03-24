-- Migration: Fix Infinite Recursion on Admin RLS Policies

-- 1. Create a SECURITY DEFINER function to securely read the admin status without triggering RLS cycles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()), 
    false
  );
$$;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "Admins can update profile verifications" ON profiles;
DROP POLICY IF EXISTS "Admins can update business verifications" ON businesses;
DROP POLICY IF EXISTS "Admins can update organization verifications" ON organizations;
DROP POLICY IF EXISTS "Admins can delete any feed post" ON feed_posts;
DROP POLICY IF EXISTS "Admins can view reports" ON reported_content;
DROP POLICY IF EXISTS "Admins can delete reports" ON reported_content;
DROP POLICY IF EXISTS "Admins can view all feedback" ON beta_feedback;
DROP POLICY IF EXISTS "Admins can update feedback status" ON beta_feedback;
DROP POLICY IF EXISTS "Admins can delete feedback" ON beta_feedback;
DROP POLICY IF EXISTS "Admins can view feedback_media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete feedback_media" ON storage.objects;

-- 3. Replace all Admin RLS barriers with the non-recursive function

-- Profiles
CREATE POLICY "Admins can update profile verifications" ON profiles
FOR UPDATE USING (public.is_admin());

-- Businesses
CREATE POLICY "Admins can update business verifications" ON businesses
FOR UPDATE USING (public.is_admin());

-- Organizations
CREATE POLICY "Admins can update organization verifications" ON organizations
FOR UPDATE USING (public.is_admin());

-- Feed Posts
CREATE POLICY "Admins can delete any feed post" ON feed_posts
FOR DELETE USING (public.is_admin());

-- Reported Content
CREATE POLICY "Admins can view reports" ON reported_content
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can delete reports" ON reported_content
FOR DELETE USING (public.is_admin());

-- Beta Feedback
CREATE POLICY "Admins can view all feedback" ON beta_feedback
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update feedback status" ON beta_feedback
FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete feedback" ON beta_feedback
FOR DELETE USING (public.is_admin());

-- Storage Objects (feedback_media)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view feedback_media' AND tablename = 'objects') THEN
        CREATE POLICY "Admins can view feedback_media" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'feedback_media' AND public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete feedback_media' AND tablename = 'objects') THEN
        CREATE POLICY "Admins can delete feedback_media" 
        ON storage.objects FOR DELETE 
        USING (bucket_id = 'feedback_media' AND public.is_admin());
    END IF;
END $$;

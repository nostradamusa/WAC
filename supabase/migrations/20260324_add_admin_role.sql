-- Migration: Add Admin Role & Operations Access

-- 1. Add `is_admin` to profiles (default false)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Grant Admins capability to verify Entities
DO $$
BEGIN
    -- PROFILES VERIFICATION UPDATE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update profile verifications' AND tablename = 'profiles') THEN
        CREATE POLICY "Admins can update profile verifications" ON profiles
            FOR UPDATE USING (
                (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
            );
    END IF;

    -- BUSINESSES VERIFICATION UPDATE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update business verifications' AND tablename = 'businesses') THEN
        CREATE POLICY "Admins can update business verifications" ON businesses
            FOR UPDATE USING (
                (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
            );
    END IF;

    -- ORGANIZATIONS VERIFICATION UPDATE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update organization verifications' AND tablename = 'organizations') THEN
        CREATE POLICY "Admins can update organization verifications" ON organizations
            FOR UPDATE USING (
                (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
            );
    END IF;

    -- 3. Grant Admins capability to Moderated Content

    -- FEED POSTS DELETION
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete any feed post' AND tablename = 'feed_posts') THEN
        CREATE POLICY "Admins can delete any feed post" ON feed_posts
            FOR DELETE USING (
                (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
            );
    END IF;

    -- REPORTED CONTENT MANAGEMENT
    -- Drop the restrictive dummy policy first
    DROP POLICY IF EXISTS "No client reads on reported_content" ON reported_content;

    -- Admins can SELECT reports
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view reports' AND tablename = 'reported_content') THEN
        CREATE POLICY "Admins can view reports" ON reported_content
            FOR SELECT USING (
                (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
            );
    END IF;

    -- Admins can DELETE/Dismiss reports
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete reports' AND tablename = 'reported_content') THEN
        CREATE POLICY "Admins can delete reports" ON reported_content
            FOR DELETE USING (
                (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
            );
    END IF;
END $$;

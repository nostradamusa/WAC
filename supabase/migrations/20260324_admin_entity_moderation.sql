-- Migration: Add Admin Moderation Controls across Entities

-- 1. Add `is_suspended` to track entity hibernation state
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- 2. Extend UPDATE policies for groups (Businesses, profiles, and Orgs already have admin UPDATE overrides from the verification patch)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update groups' AND tablename = 'groups') THEN
        CREATE POLICY "Admins can update groups" ON groups
            FOR UPDATE USING (public.is_admin());
    END IF;
END $$;

-- 3. Expose Hard DELETE commands explicitly and ONLY to verified administrators
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete groups' AND tablename = 'groups') THEN
        CREATE POLICY "Admins can delete groups" ON groups
            FOR DELETE USING (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete businesses' AND tablename = 'businesses') THEN
        CREATE POLICY "Admins can delete businesses" ON businesses
            FOR DELETE USING (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete organizations' AND tablename = 'organizations') THEN
        CREATE POLICY "Admins can delete organizations" ON organizations
            FOR DELETE USING (public.is_admin());
    END IF;
END $$;

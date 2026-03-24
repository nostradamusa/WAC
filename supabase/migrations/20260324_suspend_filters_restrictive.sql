-- Migration: Enforce Suspension Filtering via Restrictive RLS

-- Because the original permissive SELECT policies are unknown or potentially modified manually via the Supabase Dashboard,
-- we use Postgres 'AS RESTRICTIVE' policies. These act as a global AND condition across all entity reads.
-- Result: No matter what permissive read policy exists, the entity MUST also pass the restrictive check to be visible.

DO $$ 
BEGIN
    -- PROFILES
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Restrictive filter for suspended profiles' AND tablename = 'profiles') THEN
        CREATE POLICY "Restrictive filter for suspended profiles" ON profiles
            AS RESTRICTIVE FOR SELECT
            USING (is_suspended = false OR public.is_admin());
    END IF;

    -- BUSINESSES
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Restrictive filter for suspended businesses' AND tablename = 'businesses') THEN
        CREATE POLICY "Restrictive filter for suspended businesses" ON businesses
            AS RESTRICTIVE FOR SELECT
            USING (is_suspended = false OR public.is_admin());
    END IF;

    -- ORGANIZATIONS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Restrictive filter for suspended organizations' AND tablename = 'organizations') THEN
        CREATE POLICY "Restrictive filter for suspended organizations" ON organizations
            AS RESTRICTIVE FOR SELECT
            USING (is_suspended = false OR public.is_admin());
    END IF;

    -- GROUPS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Restrictive filter for suspended groups' AND tablename = 'groups') THEN
        CREATE POLICY "Restrictive filter for suspended groups" ON groups
            AS RESTRICTIVE FOR SELECT
            USING (is_suspended = false OR public.is_admin());
    END IF;
END $$;

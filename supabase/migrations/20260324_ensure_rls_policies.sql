-- Defensive RLS policies to guarantee events and other core entities cannot be tampered with by non-owners
-- Wrapped in DO blocks to ensure idempotency.

ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Events RLS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'events_delete_own' AND tablename = 'events') THEN
        CREATE POLICY "events_delete_own" ON events FOR DELETE TO authenticated USING (created_by = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'events_update_own' AND tablename = 'events') THEN
        CREATE POLICY "events_update_own" ON events FOR UPDATE TO authenticated USING (created_by = auth.uid());
    END IF;
    
    -- Businesses RLS (Assuming 'owner_id' tracks the original owner)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'businesses_delete_own' AND tablename = 'businesses') THEN
        CREATE POLICY "businesses_delete_own" ON businesses FOR DELETE TO authenticated USING (owner_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'businesses_update_own' AND tablename = 'businesses') THEN
        CREATE POLICY "businesses_update_own" ON businesses FOR UPDATE TO authenticated USING (owner_id = auth.uid());
    END IF;

    -- Organizations RLS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'organizations_delete_own' AND tablename = 'organizations') THEN
        CREATE POLICY "organizations_delete_own" ON organizations FOR DELETE TO authenticated USING (owner_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'organizations_update_own' AND tablename = 'organizations') THEN
        CREATE POLICY "organizations_update_own" ON organizations FOR UPDATE TO authenticated USING (owner_id = auth.uid());
    END IF;
END $$;

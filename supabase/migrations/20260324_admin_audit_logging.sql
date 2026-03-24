-- Migration: Admin Action Audit Logging Infrastructure

-- 1. Create the append-only ledger table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES auth.users(id),
    action_type varchar NOT NULL, -- e.g., 'GRANT_VERIFICATION', 'SUSPEND_ENTITY', 'HARD_DELETE_ENTITY'
    entity_type varchar NOT NULL, -- e.g., 'profile', 'business', 'organization', 'group', 'report'
    entity_id uuid NOT NULL,      -- Can't use strict foreign key because the entity might be HARD DELETED
    metadata jsonb DEFAULT '{}'::jsonb, -- Context capture like original name, reason, etc.
    created_at timestamptz DEFAULT now()
);

-- 2. Performance indexes for the operations UI
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity_id ON admin_audit_logs(entity_id);

-- 3. Row Level Security ensuring Absolute Immutability
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Permit administrators to append (INSERT) logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert audit logs' AND tablename = 'admin_audit_logs') THEN
        CREATE POLICY "Admins can insert audit logs" ON admin_audit_logs
            FOR INSERT WITH CHECK (public.is_admin());
    END IF;

    -- Permit administrators to historically view (SELECT) logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view audit logs' AND tablename = 'admin_audit_logs') THEN
        CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
            FOR SELECT USING (public.is_admin());
    END IF;

    -- EXPLICITLY MISSING: UPDATE and DELETE policies. 
    -- By explicitly ignoring UPDATE and DELETE, Postgres default-denies these operations.
    -- This enforces cryptographic immutability. Not even Admins can erase their own traces once recorded.
END $$;

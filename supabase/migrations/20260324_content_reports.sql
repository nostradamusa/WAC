-- Basic Trust & Safety table for reporting inappropriate content

CREATE TABLE IF NOT EXISTS reported_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type text NOT NULL, -- 'post', 'comment', 'event', 'user'
    content_id uuid NOT NULL, -- the ID of the reported item
    reason text,
    status text DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE reported_content ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Anyone authenticated can insert a report
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can submit reports' AND tablename = 'reported_content') THEN
        CREATE POLICY "Authenticated users can submit reports" ON reported_content
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Admins (or nobody on the client side) can view reports
    -- For now, we restrict SELECT to nobody on the client side since only you (founder) need to view this in the Supabase Dashboard
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'No client reads on reported_content' AND tablename = 'reported_content') THEN
        CREATE POLICY "No client reads on reported_content" ON reported_content
            FOR SELECT USING (false);
    END IF;
END $$;

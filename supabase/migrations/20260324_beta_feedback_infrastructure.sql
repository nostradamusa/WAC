-- Migration: Beta Feedback Infrastructure

-- 1. Create the feedback database table
CREATE TABLE IF NOT EXISTS beta_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    issue_text text NOT NULL,
    image_url text,
    route_path text,
    user_agent text,
    window_width integer,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- 2. Configure Table RLS Policies
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can submit feedback' AND tablename = 'beta_feedback') THEN
        CREATE POLICY "Authenticated users can submit feedback" 
        ON beta_feedback FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all feedback' AND tablename = 'beta_feedback') THEN
        CREATE POLICY "Admins can view all feedback" 
        ON beta_feedback FOR SELECT 
        USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update feedback status' AND tablename = 'beta_feedback') THEN
        CREATE POLICY "Admins can update feedback status" 
        ON beta_feedback FOR UPDATE 
        USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete feedback' AND tablename = 'beta_feedback') THEN
        CREATE POLICY "Admins can delete feedback" 
        ON beta_feedback FOR DELETE 
        USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);
    END IF;
END $$;

-- 3. Create storage bucket for feedback_media (Max 4MB, standard screenshot formats)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'feedback_media',
    'feedback_media',
    true,
    4194304, -- 4MB
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Configure Storage RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public feedback_media is accessible' AND tablename = 'objects') THEN
        CREATE POLICY "Public feedback_media is accessible" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'feedback_media');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload feedback_media' AND tablename = 'objects') THEN
        CREATE POLICY "Users can upload feedback_media" 
        ON storage.objects FOR INSERT 
        WITH CHECK (
            bucket_id = 'feedback_media'
            AND auth.role() = 'authenticated'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete feedback_media' AND tablename = 'objects') THEN
        CREATE POLICY "Admins can delete feedback_media" 
        ON storage.objects FOR DELETE 
        USING (
            bucket_id = 'feedback_media' 
            AND (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
        );
    END IF;
END $$;

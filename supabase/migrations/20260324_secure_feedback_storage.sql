-- Migration: Secure Private Beta Feedback Storage

-- 1. Flip the bucket to strict private visibility.
UPDATE storage.buckets 
SET public = false 
WHERE id = 'feedback_media';

-- 2. Annihilate the permissive public read policy if it exists.
DROP POLICY IF EXISTS "Public feedback_media is accessible" ON storage.objects;

-- 3. Replace it with an explicitly restricted policy bound to the is_admin flag.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view feedback_media' AND tablename = 'objects') THEN
        CREATE POLICY "Admins can view feedback_media" 
        ON storage.objects FOR SELECT 
        USING (
            bucket_id = 'feedback_media'
            AND (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
        );
    END IF;
END $$;

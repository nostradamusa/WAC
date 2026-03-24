-- Fix storage configurations and RLS policies for the feed_media bucket

-- Ensure the feed_media bucket is configured with limits
-- Maximum file size: 50MB (posters/small clips) for beta
-- Allowed MIME types: images and standard video
UPDATE storage.buckets
SET 
    public = true,
    file_size_limit = 52428800, -- 50 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
WHERE id = 'feed_media';

-- If it doesn't exist yet, insert it with proper configs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'feed_media', 'feed_media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'feed_media'
);

-- Policies for feed_media
DO $$
BEGIN
    -- Allow public read access to media
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view feed media' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public can view feed media" ON storage.objects
            FOR SELECT USING (bucket_id = 'feed_media');
    END IF;

    -- Allow authenticated users to insert media
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can upload feed media' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Authenticated can upload feed media" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'feed_media' AND auth.role() = 'authenticated');
    END IF;

    -- Allow owners to delete their own media (via owner column)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own feed media' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Users can delete own feed media" ON storage.objects
            FOR DELETE USING (bucket_id = 'feed_media' AND auth.uid() = owner);
    END IF;
END $$;

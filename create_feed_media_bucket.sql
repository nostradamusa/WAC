-- Create a new storage bucket for feed media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'feed_media',
    'feed_media',
    true,
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Policies for feed_media bucket
DO $$ 
BEGIN
  -- Allow public read access to anyone
  BEGIN
    CREATE POLICY "Public Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'feed_media');
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Allow authenticated users to upload media
  BEGIN
    CREATE POLICY "Authenticated users can upload media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'feed_media' AND auth.role() = 'authenticated');
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Allow users to update their own media
  BEGIN
    CREATE POLICY "Users can update their own media"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'feed_media' AND auth.uid() = owner);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Allow users to delete their own media
  BEGIN
    CREATE POLICY "Users can delete their own media"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'feed_media' AND auth.uid() = owner);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

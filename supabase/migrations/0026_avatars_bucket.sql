-- Create avatars storage bucket for user profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload to their own folder
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can update their own avatars
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own avatars
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

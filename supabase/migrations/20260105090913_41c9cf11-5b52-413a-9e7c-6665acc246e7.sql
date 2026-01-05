-- Drop existing permissive storage policies for content-images bucket
DROP POLICY IF EXISTS "Authenticated users can upload content images" ON storage.objects;
DROP POLICY IF EXISTS "Editors and admins can update content images" ON storage.objects;
DROP POLICY IF EXISTS "Editors and admins can delete content images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view content images" ON storage.objects;

-- Create restrictive policies for content-images bucket

-- SELECT: Anyone can view content images (public read)
CREATE POLICY "Anyone can view content images"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

-- INSERT: Only editors and admins can upload
CREATE POLICY "Editors and admins can upload content images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-images' AND
  (has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- UPDATE: Only editors and admins can update/replace
CREATE POLICY "Editors and admins can update content images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'content-images' AND
  (has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- DELETE: Only editors and admins can delete
CREATE POLICY "Editors and admins can delete content images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-images' AND
  (has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);
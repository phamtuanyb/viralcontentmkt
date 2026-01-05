-- Create storage bucket for content images
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for content images bucket
CREATE POLICY "Anyone can view content images"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

CREATE POLICY "Authenticated users can upload content images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-images');

CREATE POLICY "Editors and admins can update content images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'content-images');

CREATE POLICY "Editors and admins can delete content images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'content-images');
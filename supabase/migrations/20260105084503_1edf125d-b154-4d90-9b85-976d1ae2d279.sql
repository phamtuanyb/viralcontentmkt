-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.contents
  SET view_count = view_count + 1
  WHERE id = content_id;
END;
$$;
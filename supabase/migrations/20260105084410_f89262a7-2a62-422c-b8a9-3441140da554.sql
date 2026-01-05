-- Add view_count column to contents table
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_contents_view_count ON public.contents(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_contents_published_at ON public.contents(published_at DESC NULLS LAST);
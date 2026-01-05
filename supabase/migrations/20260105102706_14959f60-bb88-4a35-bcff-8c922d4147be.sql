-- Add a deterministic short id for SEO-friendly URLs: /content/title-shortid
ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS short_id text
  GENERATED ALWAYS AS (right(id::text, 8)) STORED;

-- Speed up lookups by short_id
CREATE INDEX IF NOT EXISTS idx_contents_short_id ON public.contents (short_id);

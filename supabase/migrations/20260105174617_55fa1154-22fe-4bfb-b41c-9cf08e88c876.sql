-- Add gemini_api_key column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.gemini_api_key IS 'Encrypted Gemini API key for AI content rewrite feature';
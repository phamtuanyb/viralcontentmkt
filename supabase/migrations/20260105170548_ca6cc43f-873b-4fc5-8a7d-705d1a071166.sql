-- Create ad_banners table for advertising banners
CREATE TABLE public.ad_banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    target_url TEXT,
    placement_type TEXT NOT NULL CHECK (placement_type IN ('library', 'content_detail')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view active ad banners" 
ON public.ad_banners 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Admins can manage ad banners" 
ON public.ad_banners 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ad_banners_updated_at
BEFORE UPDATE ON public.ad_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
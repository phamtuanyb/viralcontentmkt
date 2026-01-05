-- Thêm avatar_url vào user_profiles (nếu chưa có)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Bảng liên kết mạng xã hội
CREATE TABLE public.user_social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'facebook', 'zalo', 'tiktok', 'instagram', 'youtube', 'twitter'
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.user_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all social links"
ON public.user_social_links FOR SELECT
USING (true);

CREATE POLICY "Users can manage own social links"
ON public.user_social_links FOR ALL
USING (user_id = auth.uid());

-- Bảng bình luận
CREATE TABLE public.content_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments on published content"
ON public.content_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.contents WHERE id = content_id AND is_published = true
));

CREATE POLICY "Active users can create comments"
ON public.content_comments FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_user_active(auth.uid()));

CREATE POLICY "Users can update own comments"
ON public.content_comments FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON public.content_comments FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all comments"
ON public.content_comments FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Bảng đánh giá sao
CREATE TABLE public.content_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_id, user_id)
);

ALTER TABLE public.content_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
ON public.content_ratings FOR SELECT
USING (true);

CREATE POLICY "Active users can rate content"
ON public.content_ratings FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_user_active(auth.uid()));

CREATE POLICY "Users can update own rating"
ON public.content_ratings FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own rating"
ON public.content_ratings FOR DELETE
USING (user_id = auth.uid());

-- Triggers cho updated_at
CREATE TRIGGER update_user_social_links_updated_at
  BEFORE UPDATE ON public.user_social_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_comments_updated_at
  BEFORE UPDATE ON public.content_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_ratings_updated_at
  BEFORE UPDATE ON public.content_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function để tính điểm thành viên tích cực
CREATE OR REPLACE FUNCTION public.get_member_activity_score(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT COUNT(*) FROM public.content_comments WHERE user_id = _user_id) * 2 +
    (SELECT COUNT(*) FROM public.content_ratings WHERE user_id = _user_id),
    0
  )::INTEGER
$$;

-- Function để lấy top active members
CREATE OR REPLACE FUNCTION public.get_top_active_members(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(user_id UUID, full_name TEXT, avatar_url TEXT, activity_score BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id as user_id,
    u.full_name,
    up.avatar_url,
    (
      COALESCE((SELECT COUNT(*) FROM public.content_comments cc WHERE cc.user_id = u.id), 0) * 2 +
      COALESCE((SELECT COUNT(*) FROM public.content_ratings cr WHERE cr.user_id = u.id), 0)
    ) as activity_score
  FROM public.users u
  LEFT JOIN public.user_profiles up ON up.user_id = u.id
  WHERE u.status = 'active'
  GROUP BY u.id, u.full_name, up.avatar_url
  HAVING (
    COALESCE((SELECT COUNT(*) FROM public.content_comments cc WHERE cc.user_id = u.id), 0) * 2 +
    COALESCE((SELECT COUNT(*) FROM public.content_ratings cr WHERE cr.user_id = u.id), 0)
  ) > 0
  ORDER BY activity_score DESC
  LIMIT limit_count
$$;

-- Function để lấy top editors
CREATE OR REPLACE FUNCTION public.get_top_editors(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(user_id UUID, full_name TEXT, avatar_url TEXT, content_count BIGINT, avg_rating NUMERIC, total_views BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id as user_id,
    u.full_name,
    up.avatar_url,
    COUNT(DISTINCT c.id) as content_count,
    COALESCE(AVG(cr.rating), 0) as avg_rating,
    COALESCE(SUM(c.view_count), 0) as total_views
  FROM public.users u
  LEFT JOIN public.user_profiles up ON up.user_id = u.id
  JOIN public.contents c ON c.created_by = u.id AND c.is_published = true
  LEFT JOIN public.content_ratings cr ON cr.content_id = c.id
  WHERE u.status = 'active'
  GROUP BY u.id, u.full_name, up.avatar_url
  ORDER BY content_count DESC, avg_rating DESC, total_views DESC
  LIMIT limit_count
$$;
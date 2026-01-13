-- Create table for month-end popup notifications
CREATE TABLE public.month_popup_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  popup_type TEXT NOT NULL CHECK (popup_type IN ('countdown', 'new_month')),
  days_before_end INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

-- Enable RLS
ALTER TABLE public.month_popup_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read active popup settings
CREATE POLICY "Anyone can view active popup settings"
ON public.month_popup_settings
FOR SELECT
USING (is_active = true);

-- Only admins can manage popup settings
CREATE POLICY "Admins can manage popup settings"
ON public.month_popup_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create table to track which users have seen which popups
CREATE TABLE public.user_popup_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  popup_id UUID NOT NULL REFERENCES public.month_popup_settings(id) ON DELETE CASCADE,
  dismissed_for_month TEXT NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, popup_id, dismissed_for_month)
);

-- Enable RLS
ALTER TABLE public.user_popup_dismissals ENABLE ROW LEVEL SECURITY;

-- Users can manage their own dismissals
CREATE POLICY "Users can view their own dismissals"
ON public.user_popup_dismissals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dismissals"
ON public.user_popup_dismissals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_month_popup_settings_updated_at
BEFORE UPDATE ON public.month_popup_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default popup settings
INSERT INTO public.month_popup_settings (title, message, popup_type, days_before_end, is_active)
VALUES 
  ('Sắp hết tháng rồi!', 'Chào {name}! 🎯 Chỉ còn {days} ngày nữa là kết thúc tháng {month}. Hãy tận dụng thời gian còn lại để hoàn thành mục tiêu của bạn nhé! 💪', 'countdown', 5, true),
  ('Chào mừng tháng mới!', 'Xin chào {name}! 🎉 Chúc mừng bạn bước sang tháng {month} mới! Chúc bạn một tháng tràn đầy năng lượng và thành công! ✨', 'new_month', 0, true);
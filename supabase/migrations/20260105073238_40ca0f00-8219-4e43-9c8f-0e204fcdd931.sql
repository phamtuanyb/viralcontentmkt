
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'sales');

-- Create user status enum
CREATE TYPE public.user_status AS ENUM ('pending', 'active', 'suspended');

-- Create topic status enum
CREATE TYPE public.topic_status AS ENUM ('active', 'hidden');

-- Create users table (public profile data)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  status user_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create user_profiles table (editable by user)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone_number TEXT,
  signature_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create topics table
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status topic_status DEFAULT 'active' NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create contents table
CREATE TABLE public.contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false NOT NULL,
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create content_images table
CREATE TABLE public.content_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create homepage_banners table
CREATE TABLE public.homepage_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  sort_order INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create program_banners table
CREATE TABLE public.program_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  sort_order INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create content_copy_logs table
CREATE TABLE public.content_copy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create software_categories table
CREATE TABLE public.software_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create content_software_map table
CREATE TABLE public.content_software_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE NOT NULL,
  software_id UUID REFERENCES public.software_categories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(content_id, software_id)
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_copy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_software_map ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _user_id AND status = 'active'
  )
$$;

-- Function to get user status
CREATE OR REPLACE FUNCTION public.get_user_status(_user_id UUID)
RETURNS user_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.users WHERE id = _user_id
$$;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any user" ON public.users FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert users" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.user_profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for topics
CREATE POLICY "Public can view active topics" ON public.topics FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can view all topics" ON public.topics FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage topics" ON public.topics FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for contents
CREATE POLICY "Public can view published content" ON public.contents FOR SELECT USING (is_published = true);
CREATE POLICY "Editors can view own content" ON public.contents FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Admins can view all content" ON public.contents FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can create content" ON public.contents FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Editors can update own content" ON public.contents FOR UPDATE USING (created_by = auth.uid() AND public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Admins can manage all content" ON public.contents FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for content_images
CREATE POLICY "Public can view content images" ON public.content_images FOR SELECT USING (true);
CREATE POLICY "Editors and admins can manage images" ON public.content_images FOR ALL USING (
  public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for banners
CREATE POLICY "Public can view active homepage banners" ON public.homepage_banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage homepage banners" ON public.homepage_banners FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active program banners" ON public.program_banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage program banners" ON public.program_banners FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for content_copy_logs
CREATE POLICY "Users can insert own logs" ON public.content_copy_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all logs" ON public.content_copy_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for software_categories
CREATE POLICY "Public can view categories" ON public.software_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.software_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for content_software_map
CREATE POLICY "Public can view mappings" ON public.content_software_map FOR SELECT USING (true);
CREATE POLICY "Admins can manage mappings" ON public.content_software_map FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending'
  );
  
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON public.contents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_homepage_banners_updated_at BEFORE UPDATE ON public.homepage_banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_program_banners_updated_at BEFORE UPDATE ON public.program_banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drop the overly permissive policy that exposes all user emails
DROP POLICY IF EXISTS "Users can view all users" ON public.users;

-- Create policy: Users can only view their own data
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Create policy: Admins can view all users
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
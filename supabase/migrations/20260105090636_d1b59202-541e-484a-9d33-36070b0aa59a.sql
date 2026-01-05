-- Create a table to log blocked admin escalation attempts
CREATE TABLE IF NOT EXISTS public.admin_escalation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  attempted_by uuid,
  action_type text NOT NULL,
  details text,
  blocked_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the logs table
ALTER TABLE public.admin_escalation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view the audit logs
CREATE POLICY "Admins can view escalation logs"
ON public.admin_escalation_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to block admin role insertion
CREATE OR REPLACE FUNCTION public.block_admin_role_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block any attempt to insert admin role
  IF NEW.role = 'admin' THEN
    -- Log the blocked attempt
    INSERT INTO public.admin_escalation_logs (user_id, attempted_by, action_type, details)
    VALUES (
      NEW.user_id,
      auth.uid(),
      'admin_role_insert_blocked',
      'Attempted to insert admin role via application. Admin roles can only be created at database level.'
    );
    
    RAISE EXCEPTION 'Admin role cannot be assigned through the application. This attempt has been logged.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to block admin role insertion
DROP TRIGGER IF EXISTS block_admin_role_insert_trigger ON public.user_roles;
CREATE TRIGGER block_admin_role_insert_trigger
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.block_admin_role_insert();

-- Create function to block admin role updates (preventing role change to admin)
CREATE OR REPLACE FUNCTION public.block_admin_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block any attempt to update a role to admin
  IF NEW.role = 'admin' AND OLD.role != 'admin' THEN
    -- Log the blocked attempt
    INSERT INTO public.admin_escalation_logs (user_id, attempted_by, action_type, details)
    VALUES (
      NEW.user_id,
      auth.uid(),
      'admin_role_update_blocked',
      format('Attempted to update role from %s to admin via application.', OLD.role)
    );
    
    RAISE EXCEPTION 'Cannot escalate to admin role through the application. This attempt has been logged.';
  END IF;
  
  -- Also prevent removing admin role through the app (immutable)
  IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
    INSERT INTO public.admin_escalation_logs (user_id, attempted_by, action_type, details)
    VALUES (
      OLD.user_id,
      auth.uid(),
      'admin_role_removal_blocked',
      format('Attempted to change admin role to %s via application.', NEW.role)
    );
    
    RAISE EXCEPTION 'Admin role cannot be modified through the application. This attempt has been logged.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to block admin role updates
DROP TRIGGER IF EXISTS block_admin_role_update_trigger ON public.user_roles;
CREATE TRIGGER block_admin_role_update_trigger
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.block_admin_role_update();

-- Create function to block admin role deletion
CREATE OR REPLACE FUNCTION public.block_admin_role_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block any attempt to delete admin role
  IF OLD.role = 'admin' THEN
    -- Log the blocked attempt
    INSERT INTO public.admin_escalation_logs (user_id, attempted_by, action_type, details)
    VALUES (
      OLD.user_id,
      auth.uid(),
      'admin_role_delete_blocked',
      'Attempted to delete admin role via application.'
    );
    
    RAISE EXCEPTION 'Admin role cannot be removed through the application. This attempt has been logged.';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger to block admin role deletion
DROP TRIGGER IF EXISTS block_admin_role_delete_trigger ON public.user_roles;
CREATE TRIGGER block_admin_role_delete_trigger
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.block_admin_role_delete();
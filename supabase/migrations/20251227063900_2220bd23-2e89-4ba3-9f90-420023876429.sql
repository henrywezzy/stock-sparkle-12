-- Add approved column to user_roles table for user approval system
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;

-- Update existing users to be approved
UPDATE public.user_roles SET approved = true WHERE approved IS NULL OR approved = false;

-- Update the handle_new_user function to set approved = false for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  -- First user gets admin role and is auto-approved, others need approval
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role, approved)
    VALUES (NEW.id, 'admin', true);
  ELSE
    INSERT INTO public.user_roles (user_id, role, approved)
    VALUES (NEW.id, 'visualizador', false);
  END IF;
  
  -- Create default notification settings
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;
-- Add per-user UI theme preference (stored on profile)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ui_theme text;

-- Allow admins to delete user profiles (needed for 'remover usuário' to actually disappear)
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;
CREATE POLICY "Admin can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::public.app_role));

-- Allow admins to delete notification settings (cleanup when removing a user)
DROP POLICY IF EXISTS "Admin can delete notification settings" ON public.notification_settings;
CREATE POLICY "Admin can delete notification settings"
ON public.notification_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::public.app_role));
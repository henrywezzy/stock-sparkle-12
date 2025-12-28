-- Add new fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS selected_icon text DEFAULT 'User';

-- Create index for username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
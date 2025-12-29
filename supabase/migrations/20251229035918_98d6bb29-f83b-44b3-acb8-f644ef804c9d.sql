-- Fix: Update has_role function to enforce approved status server-side
-- This prevents users with approved=false from accessing data even if they bypass client-side checks

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND approved = true  -- Enforce approved status server-side
  )
$$;
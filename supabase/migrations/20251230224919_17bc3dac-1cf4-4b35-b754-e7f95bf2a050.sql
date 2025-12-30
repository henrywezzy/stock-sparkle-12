-- 1. Fix company_settings RLS - restrict to authenticated users with roles only
DROP POLICY IF EXISTS "Authenticated users can view company settings" ON public.company_settings;

CREATE POLICY "Admin and almoxarife can view company settings" 
ON public.company_settings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 2. Fix audit_log INSERT policy - only allow service role / trigger inserts
DROP POLICY IF EXISTS "System can insert audit log" ON public.audit_log;

-- Create a security definer function to insert audit logs
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_table_name text,
  p_record_id uuid,
  p_action text,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_changed_fields text[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.audit_log (
    table_name, 
    record_id, 
    action, 
    old_data, 
    new_data, 
    changed_fields, 
    user_id,
    user_email
  )
  VALUES (
    p_table_name, 
    p_record_id, 
    p_action, 
    p_old_data, 
    p_new_data, 
    p_changed_fields, 
    auth.uid(),
    (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- No INSERT policy needed - only the security definer function can insert
-- The audit_trigger_function already uses SECURITY DEFINER so it works

-- 3. Add rate limiting table for edge function request tracking
CREATE TABLE IF NOT EXISTS public.edge_function_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status text DEFAULT 'pending',
  completed_at timestamp with time zone
);

-- Enable RLS on edge function requests
ALTER TABLE public.edge_function_requests ENABLE ROW LEVEL SECURITY;

-- Only the service role can insert/view edge function requests
CREATE POLICY "Service role can manage edge_function_requests"
ON public.edge_function_requests
FOR ALL
USING (false)
WITH CHECK (false);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_edge_function_requests_user_id ON public.edge_function_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_edge_function_requests_created_at ON public.edge_function_requests(created_at);

-- 4. Create helper function to validate and log edge function requests
CREATE OR REPLACE FUNCTION public.validate_edge_request(
  p_function_name text,
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
  v_recent_count int;
BEGIN
  -- Check rate limiting (max 100 requests per minute per user)
  SELECT COUNT(*) INTO v_recent_count
  FROM public.edge_function_requests
  WHERE user_id = p_user_id
    AND function_name = p_function_name
    AND created_at > (now() - interval '1 minute');
  
  IF v_recent_count >= 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded for function %', p_function_name;
  END IF;
  
  -- Log the request
  INSERT INTO public.edge_function_requests (function_name, user_id, request_id)
  VALUES (p_function_name, p_user_id, gen_random_uuid())
  RETURNING request_id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$;
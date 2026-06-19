
-- 1) Fix RLS always-true on requisitions INSERT
DROP POLICY IF EXISTS "Authenticated users can insert requisitions" ON public.requisitions;
CREATE POLICY "Admin and almoxarife can insert requisitions"
ON public.requisitions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'almoxarife'::app_role)
);

-- 2) Add missing UPDATE policy for nfe-files bucket
DROP POLICY IF EXISTS "Admin and almoxarife can update nfe files" ON storage.objects;
CREATE POLICY "Admin and almoxarife can update nfe files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'nfe-files'
  AND (public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'almoxarife'::app_role))
)
WITH CHECK (
  bucket_id = 'nfe-files'
  AND (public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'almoxarife'::app_role))
);

-- 3) Remove broad listing policy on public company-logos bucket.
-- Public bucket files remain accessible by direct URL; only directory listing is blocked.
DROP POLICY IF EXISTS "Public access to company logos" ON storage.objects;

-- 4) Explicitly block self-insert of user_roles by non-admins (defense in depth)
CREATE POLICY "Block non-admin role inserts"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5) Revoke EXECUTE on SECURITY DEFINER trigger/internal functions from anon/authenticated.
-- These are invoked by triggers or service role only and must not be callable from the Data API.
REVOKE EXECUTE ON FUNCTION public.audit_trigger_function() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_organization() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_on_entry() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_on_exit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_purchase_order_total() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_purchase_order_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.insert_audit_log(text, uuid, text, jsonb, jsonb, text[]) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_edge_request(text, uuid) FROM anon, authenticated;

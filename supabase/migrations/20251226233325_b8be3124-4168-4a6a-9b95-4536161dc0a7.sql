
-- Phase 1: Critical Corrections

-- 1. Fix employees table - restrict to admin and almoxarife only
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;

CREATE POLICY "Admin and almoxarife can view employees"
ON public.employees
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 2. Fix suppliers table - restrict to admin and almoxarife only
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;

CREATE POLICY "Admin and almoxarife can view suppliers"
ON public.suppliers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 3. Fix profiles table - users see own profile, admins see all
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or admin can view all"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Phase 2: Warning Corrections

-- 4. Fix entries table - restrict financial info to admin and almoxarife
DROP POLICY IF EXISTS "Authenticated users can view entries" ON public.entries;

CREATE POLICY "Admin and almoxarife can view entries"
ON public.entries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 5. Fix stock_history table - restrict audit trail to admin and almoxarife
DROP POLICY IF EXISTS "Authenticated users can view stock_history" ON public.stock_history;

CREATE POLICY "Admin and almoxarife can view stock_history"
ON public.stock_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 6. Fix exits table - restrict to admin and almoxarife (same logic as entries)
DROP POLICY IF EXISTS "Authenticated users can view exits" ON public.exits;

CREATE POLICY "Admin and almoxarife can view exits"
ON public.exits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

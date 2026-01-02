-- Ajustar políticas RLS para tabelas com SELECT público
-- Restringir acesso apenas para usuários com roles admin ou almoxarife

-- 1. Atualizar política de purchase_orders - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view purchase_orders" ON public.purchase_orders;
CREATE POLICY "Admin and almoxarife can view purchase_orders" 
ON public.purchase_orders 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 2. Atualizar política de purchase_order_items - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view purchase_order_items" ON public.purchase_order_items;
CREATE POLICY "Admin and almoxarife can view purchase_order_items" 
ON public.purchase_order_items 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 3. Atualizar política de product_kits - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view product_kits" ON public.product_kits;
CREATE POLICY "Admin and almoxarife can view product_kits" 
ON public.product_kits 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 4. Atualizar política de kit_items - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view kit_items" ON public.kit_items;
CREATE POLICY "Admin and almoxarife can view kit_items" 
ON public.kit_items 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 5. Atualizar política de stock_transfers - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view stock_transfers" ON public.stock_transfers;
CREATE POLICY "Admin and almoxarife can view stock_transfers" 
ON public.stock_transfers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 6. Atualizar política de supplier_categories - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view supplier_categories" ON public.supplier_categories;
CREATE POLICY "Admin and almoxarife can view supplier_categories" 
ON public.supplier_categories 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 7. Atualizar política de requisitions - restringir SELECT para roles específicas
-- Mantemos a possibilidade de qualquer autenticado CRIAR requisições, mas restringir visualização
DROP POLICY IF EXISTS "Authenticated users can view requisitions" ON public.requisitions;
CREATE POLICY "Admin and almoxarife can view requisitions" 
ON public.requisitions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 8. Atualizar política de products - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
CREATE POLICY "Admin and almoxarife can view products" 
ON public.products 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 9. Atualizar política de categories - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
CREATE POLICY "Admin and almoxarife can view categories" 
ON public.categories 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 10. Atualizar política de locations - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view locations" ON public.locations;
CREATE POLICY "Admin and almoxarife can view locations" 
ON public.locations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 11. Atualizar política de location_stock - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view location_stock" ON public.location_stock;
CREATE POLICY "Admin and almoxarife can view location_stock" 
ON public.location_stock 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 12. Atualizar política de assets - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view assets" ON public.assets;
CREATE POLICY "Admin and almoxarife can view assets" 
ON public.assets 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 13. Atualizar política de epis - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view epis" ON public.epis;
CREATE POLICY "Admin and almoxarife can view epis" 
ON public.epis 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 14. Atualizar política de epi_deliveries - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view epi_deliveries" ON public.epi_deliveries;
CREATE POLICY "Admin and almoxarife can view epi_deliveries" 
ON public.epi_deliveries 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- 15. Atualizar política de epi_requirements - restringir SELECT para roles específicas
DROP POLICY IF EXISTS "Authenticated users can view epi_requirements" ON public.epi_requirements;
CREATE POLICY "Admin and almoxarife can view epi_requirements" 
ON public.epi_requirements 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));
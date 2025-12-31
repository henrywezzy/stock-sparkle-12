-- =============================================
-- MÓDULO 2: Multi-Armazém / Multi-Filial
-- =============================================

-- Tabela de Localizações/Armazéns
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  is_default BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for locations
CREATE POLICY "Authenticated users can view locations"
  ON public.locations FOR SELECT
  USING (true);

CREATE POLICY "Admin and almoxarife can insert locations"
  ON public.locations FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin and almoxarife can update locations"
  ON public.locations FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin can delete locations"
  ON public.locations FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Estoque por Localização
CREATE TABLE public.location_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 10,
  bin_location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(location_id, product_id)
);

-- Trigger para updated_at
CREATE TRIGGER update_location_stock_updated_at
  BEFORE UPDATE ON public.location_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.location_stock ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_stock
CREATE POLICY "Authenticated users can view location_stock"
  ON public.location_stock FOR SELECT
  USING (true);

CREATE POLICY "Admin and almoxarife can insert location_stock"
  ON public.location_stock FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin and almoxarife can update location_stock"
  ON public.location_stock FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin can delete location_stock"
  ON public.location_stock FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Transferências entre Localizações
CREATE TABLE public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_location_id UUID REFERENCES public.locations(id) NOT NULL,
  to_location_id UUID REFERENCES public.locations(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  requested_by TEXT,
  approved_by TEXT,
  transfer_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_stock_transfers_updated_at
  BEFORE UPDATE ON public.stock_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_transfers
CREATE POLICY "Authenticated users can view stock_transfers"
  ON public.stock_transfers FOR SELECT
  USING (true);

CREATE POLICY "Admin and almoxarife can insert stock_transfers"
  ON public.stock_transfers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin and almoxarife can update stock_transfers"
  ON public.stock_transfers FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin can delete stock_transfers"
  ON public.stock_transfers FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- MÓDULO 3: Kits de Produtos
-- =============================================

-- Tabela de Kits
CREATE TABLE public.product_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  category_id UUID REFERENCES public.categories(id),
  is_virtual BOOLEAN DEFAULT true,
  quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Trigger para updated_at
CREATE TRIGGER update_product_kits_updated_at
  BEFORE UPDATE ON public.product_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.product_kits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_kits
CREATE POLICY "Authenticated users can view product_kits"
  ON public.product_kits FOR SELECT
  USING (true);

CREATE POLICY "Admin and almoxarife can insert product_kits"
  ON public.product_kits FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin and almoxarife can update product_kits"
  ON public.product_kits FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin can delete product_kits"
  ON public.product_kits FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Itens do Kit
CREATE TABLE public.kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES public.product_kits(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kit_id, product_id)
);

-- Enable RLS
ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kit_items
CREATE POLICY "Authenticated users can view kit_items"
  ON public.kit_items FOR SELECT
  USING (true);

CREATE POLICY "Admin and almoxarife can insert kit_items"
  ON public.kit_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin and almoxarife can update kit_items"
  ON public.kit_items FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin and almoxarife can delete kit_items"
  ON public.kit_items FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

-- =============================================
-- MÓDULO 4: Gestão de Ativos
-- =============================================

-- Tabela de Ativos/Equipamentos
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_tag TEXT UNIQUE,
  serial_number TEXT,
  model TEXT,
  manufacturer TEXT,
  location_id UUID REFERENCES public.locations(id),
  department TEXT,
  status TEXT DEFAULT 'active',
  purchase_date DATE,
  warranty_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Trigger para updated_at
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assets
CREATE POLICY "Authenticated users can view assets"
  ON public.assets FOR SELECT
  USING (true);

CREATE POLICY "Admin and almoxarife can insert assets"
  ON public.assets FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin and almoxarife can update assets"
  ON public.assets FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'almoxarife'));

CREATE POLICY "Admin can delete assets"
  ON public.assets FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Adicionar coluna asset_id na tabela exits
ALTER TABLE public.exits ADD COLUMN asset_id UUID REFERENCES public.assets(id);

-- Adicionar coluna location_id nas tabelas existentes
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE public.entries ADD COLUMN location_id UUID REFERENCES public.locations(id);
ALTER TABLE public.exits ADD COLUMN location_id UUID REFERENCES public.locations(id);

-- =============================================
-- Criar localização padrão "Matriz"
-- =============================================
INSERT INTO public.locations (name, code, is_default, status)
VALUES ('Matriz', 'MTZ', true, 'active')
ON CONFLICT (code) DO NOTHING;
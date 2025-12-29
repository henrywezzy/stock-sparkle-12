-- Tabela de Ordens de Compra
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_entrega DATE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  condicoes_pagamento TEXT DEFAULT '30 dias',
  frete TEXT DEFAULT 'CIF',
  observacoes TEXT,
  total DECIMAL(12,2) DEFAULT 0,
  solicitante TEXT,
  aprovado_por TEXT,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Tabela de Itens da Ordem de Compra
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  epi_id UUID REFERENCES epis(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'product',
  codigo TEXT,
  descricao TEXT NOT NULL,
  unidade TEXT DEFAULT 'UN',
  quantidade DECIMAL(12,2) NOT NULL,
  valor_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Performance
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_numero ON purchase_orders(numero);
CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(order_id);

-- Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para purchase_orders
CREATE POLICY "Authenticated users can view purchase_orders"
  ON purchase_orders FOR SELECT
  USING (true);

CREATE POLICY "Admin and almoxarife can insert purchase_orders"
  ON purchase_orders FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can update purchase_orders"
  ON purchase_orders FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin can delete purchase_orders"
  ON purchase_orders FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para purchase_order_items
CREATE POLICY "Authenticated users can view purchase_order_items"
  ON purchase_order_items FOR SELECT
  USING (true);

CREATE POLICY "Admin and almoxarife can insert purchase_order_items"
  ON purchase_order_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can update purchase_order_items"
  ON purchase_order_items FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can delete purchase_order_items"
  ON purchase_order_items FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

-- Trigger para atualizar total da ordem
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET total = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM purchase_order_items
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_purchase_order_total
AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_purchase_order_total();

-- Função para gerar número automático da OC
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SPLIT_PART(numero, '-', 3) AS INTEGER)), 0) + 1
    INTO next_num
    FROM purchase_orders
    WHERE numero LIKE 'OC-' || year_str || '-%';
    
    NEW.numero := 'OC-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_generate_purchase_order_number
BEFORE INSERT ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION generate_purchase_order_number();
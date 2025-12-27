-- Table for delivery terms (header)
CREATE TABLE public.termos_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  responsavel_nome TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for EPIs in the delivery term
CREATE TABLE public.termo_epis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  termo_id UUID REFERENCES public.termos_entrega(id) ON DELETE CASCADE NOT NULL,
  epi_id UUID REFERENCES public.epis(id) ON DELETE CASCADE NOT NULL,
  ca_number TEXT,
  tamanho TEXT,
  quantidade INTEGER DEFAULT 1,
  data_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
  data_validade DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.termos_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termo_epis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for termos_entrega
CREATE POLICY "Admin and almoxarife can view termos_entrega"
ON public.termos_entrega FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can insert termos_entrega"
ON public.termos_entrega FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can update termos_entrega"
ON public.termos_entrega FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin can delete termos_entrega"
ON public.termos_entrega FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for termo_epis
CREATE POLICY "Admin and almoxarife can view termo_epis"
ON public.termo_epis FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can insert termo_epis"
ON public.termo_epis FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can update termo_epis"
ON public.termo_epis FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin can delete termo_epis"
ON public.termo_epis FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
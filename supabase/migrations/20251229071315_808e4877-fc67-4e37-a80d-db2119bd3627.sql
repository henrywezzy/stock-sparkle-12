-- Criar função update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela de histórico de NF-es
CREATE TABLE public.nfe_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave_acesso TEXT NOT NULL UNIQUE,
  numero TEXT,
  serie TEXT,
  data_emissao TIMESTAMP WITH TIME ZONE,
  nome_emitente TEXT,
  cnpj_emitente TEXT,
  nome_destinatario TEXT,
  cnpj_destinatario TEXT,
  valor_total NUMERIC,
  status_manifestacao TEXT DEFAULT 'pendente',
  xml_path TEXT,
  pdf_path TEXT,
  itens JSONB,
  source TEXT DEFAULT 'xml',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.nfe_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin and almoxarife can view nfe_history"
  ON public.nfe_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can insert nfe_history"
  ON public.nfe_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can update nfe_history"
  ON public.nfe_history FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin can delete nfe_history"
  ON public.nfe_history FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_nfe_history_updated_at
  BEFORE UPDATE ON public.nfe_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para armazenar XMLs
INSERT INTO storage.buckets (id, name, public)
VALUES ('nfe-files', 'nfe-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket
CREATE POLICY "Admin and almoxarife can upload nfe files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'nfe-files' 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role))
  );

CREATE POLICY "Admin and almoxarife can view nfe files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'nfe-files' 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role))
  );

CREATE POLICY "Admin can delete nfe files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'nfe-files' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );
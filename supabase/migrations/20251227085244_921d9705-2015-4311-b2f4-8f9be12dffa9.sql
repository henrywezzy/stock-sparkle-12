-- Fase 3 & 4: Auditoria, Soft-delete e Validade do CA

-- 1. Adicionar campo de validade do CA na tabela de EPIs
ALTER TABLE public.epis 
ADD COLUMN IF NOT EXISTS ca_expiry_date date;

-- 2. Adicionar soft-delete nas tabelas principais
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.epis 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- 3. Criar tabela de auditoria completa
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  user_id uuid,
  user_email text,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON public.audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);

-- Habilitar RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver o audit log
CREATE POLICY "Admins can view audit log" ON public.audit_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Sistema pode inserir (via triggers)
CREATE POLICY "System can insert audit log" ON public.audit_log
FOR INSERT WITH CHECK (true);

-- 4. Adicionar coluna requisition_id na tabela exits para vincular saída à requisição
ALTER TABLE public.exits 
ADD COLUMN IF NOT EXISTS requisition_id uuid REFERENCES public.requisitions(id);

-- Criar índice para busca
CREATE INDEX IF NOT EXISTS idx_exits_requisition_id ON public.exits(requisition_id);

-- 5. Função para registrar auditoria automaticamente
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  changed text[];
  key text;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
    
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, old_data, new_data, auth.uid());
    
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Calcular campos alterados
    FOR key IN SELECT jsonb_object_keys(new_data)
    LOOP
      IF old_data->key IS DISTINCT FROM new_data->key THEN
        changed := array_append(changed, key);
      END IF;
    END LOOP;
    
    -- Só registrar se houve alteração real
    IF array_length(changed, 1) > 0 THEN
      INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_fields, user_id)
      VALUES (TG_TABLE_NAME, NEW.id, TG_OP, old_data, new_data, changed, auth.uid());
    END IF;
    
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
    
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, old_data, new_data, auth.uid());
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Aplicar triggers de auditoria nas tabelas principais
DROP TRIGGER IF EXISTS audit_products ON public.products;
CREATE TRIGGER audit_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_epis ON public.epis;
CREATE TRIGGER audit_epis
AFTER INSERT OR UPDATE OR DELETE ON public.epis
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_employees ON public.employees;
CREATE TRIGGER audit_employees
AFTER INSERT OR UPDATE OR DELETE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_entries ON public.entries;
CREATE TRIGGER audit_entries
AFTER INSERT OR UPDATE OR DELETE ON public.entries
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_exits ON public.exits;
CREATE TRIGGER audit_exits
AFTER INSERT OR UPDATE OR DELETE ON public.exits
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_requisitions ON public.requisitions;
CREATE TRIGGER audit_requisitions
AFTER INSERT OR UPDATE OR DELETE ON public.requisitions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
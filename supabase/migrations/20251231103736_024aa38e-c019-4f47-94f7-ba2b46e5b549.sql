-- Tabela de organizações (empresas/tenants)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  slug TEXT UNIQUE,
  logo_url TEXT,
  plan_type TEXT NOT NULL DEFAULT 'trial' CHECK (plan_type IN ('trial', 'basic', 'professional', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'trialing' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'expired')),
  subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  max_products INTEGER DEFAULT 500,
  max_users INTEGER DEFAULT 3,
  max_employees INTEGER DEFAULT 50,
  features JSONB DEFAULT '{"nfe_integration": false, "api_access": false, "multi_location": false, "custom_reports": false, "whatsapp_alerts": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Tabela para vincular usuários às organizações
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Tabela de histórico de pagamentos
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  external_id TEXT,
  invoice_url TEXT,
  description TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Tabela para controle de uso (limites)
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('products', 'users', 'employees', 'epis', 'api_calls')),
  current_count INTEGER DEFAULT 0,
  limit_value INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, metric_type)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Tabela para configurações de onboarding
CREATE TABLE public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  current_step INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  skipped_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Função para obter organization_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid() 
  AND status = 'active'
  LIMIT 1
$$;

-- Função para verificar se usuário é owner/admin da organização
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
$$;

-- Políticas RLS para organizations
CREATE POLICY "Users can view their organization" 
ON public.organizations FOR SELECT 
USING (id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "Org admins can update organization" 
ON public.organizations FOR UPDATE 
USING (is_org_admin(id));

-- Políticas RLS para organization_members
CREATE POLICY "Users can view members of their organization" 
ON public.organization_members FOR SELECT 
USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "Org admins can manage members" 
ON public.organization_members FOR ALL 
USING (is_org_admin(organization_id));

CREATE POLICY "Users can view their own membership" 
ON public.organization_members FOR SELECT 
USING (user_id = auth.uid());

-- Políticas RLS para payments
CREATE POLICY "Org admins can view payments" 
ON public.payments FOR SELECT 
USING (is_org_admin(organization_id));

-- Políticas RLS para usage_tracking
CREATE POLICY "Users can view their org usage" 
ON public.usage_tracking FOR SELECT 
USING (organization_id = get_user_organization_id());

-- Políticas RLS para user_onboarding
CREATE POLICY "Users can manage own onboarding" 
ON public.user_onboarding FOR ALL 
USING (user_id = auth.uid());

-- Trigger para criar organização quando primeiro usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Criar nova organização para o usuário
  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company_name', 'org-' || SUBSTRING(NEW.id::text, 1, 8)), ' ', '-'))
  )
  RETURNING id INTO new_org_id;
  
  -- Vincular usuário como owner da organização
  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (new_org_id, NEW.id, 'owner', 'active');
  
  -- Criar registro de onboarding
  INSERT INTO public.user_onboarding (user_id)
  VALUES (NEW.id);
  
  -- Inicializar tracking de uso
  INSERT INTO public.usage_tracking (organization_id, metric_type, current_count, limit_value)
  VALUES 
    (new_org_id, 'products', 0, 500),
    (new_org_id, 'users', 1, 3),
    (new_org_id, 'employees', 0, 50),
    (new_org_id, 'epis', 0, 100),
    (new_org_id, 'api_calls', 0, 1000);
  
  RETURN NEW;
END;
$$;

-- Trigger para novos usuários
CREATE TRIGGER on_auth_user_created_organization
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_organization();

-- Adicionar organization_id às tabelas existentes (para multi-tenancy futuro)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.epis ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_org ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_org ON public.suppliers(organization_id);
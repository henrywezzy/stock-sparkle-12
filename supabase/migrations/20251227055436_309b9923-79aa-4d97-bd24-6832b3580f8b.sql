-- Create company_settings table
CREATE TABLE public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Empresa',
  cnpj text,
  address text,
  city text,
  state text,
  zip_code text,
  phone text,
  email text,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Only allow one row (singleton pattern)
CREATE UNIQUE INDEX company_settings_singleton ON public.company_settings ((true));

-- Policies - authenticated users can view, admin can update
CREATE POLICY "Authenticated users can view company settings"
ON public.company_settings FOR SELECT
USING (true);

CREATE POLICY "Admin can insert company settings"
ON public.company_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update company settings"
ON public.company_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default row
INSERT INTO public.company_settings (name) VALUES ('Minha Empresa');
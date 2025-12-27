-- Add return date column to termo_epis
ALTER TABLE public.termo_epis ADD COLUMN IF NOT EXISTS data_devolucao date;

-- Add return date column to epi_deliveries as well
ALTER TABLE public.epi_deliveries ADD COLUMN IF NOT EXISTS return_date date;
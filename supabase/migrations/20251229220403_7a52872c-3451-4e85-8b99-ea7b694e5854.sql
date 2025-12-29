-- Create table for EPI requirements by position/department
CREATE TABLE public.epi_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  epi_category TEXT NOT NULL,
  department TEXT,
  position TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT department_or_position_required CHECK (department IS NOT NULL OR position IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.epi_requirements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view epi_requirements"
ON public.epi_requirements FOR SELECT
USING (true);

CREATE POLICY "Admin and almoxarife can insert epi_requirements"
ON public.epi_requirements FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can update epi_requirements"
ON public.epi_requirements FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin can delete epi_requirements"
ON public.epi_requirements FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table for supplier performance tracking
CREATE TABLE public.supplier_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  promised_date DATE,
  delivered_date DATE,
  price_quoted NUMERIC,
  price_final NUMERIC,
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_performance ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin and almoxarife can view supplier_performance"
ON public.supplier_performance FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can insert supplier_performance"
ON public.supplier_performance FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can update supplier_performance"
ON public.supplier_performance FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin can delete supplier_performance"
ON public.supplier_performance FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on epi_requirements
CREATE TRIGGER update_epi_requirements_updated_at
BEFORE UPDATE ON public.epi_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
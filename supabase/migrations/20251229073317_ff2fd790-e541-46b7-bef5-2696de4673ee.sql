-- Create junction table for supplier-category relationship (many-to-many)
CREATE TABLE public.supplier_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, category_id)
);

-- Enable RLS
ALTER TABLE public.supplier_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view supplier_categories"
ON public.supplier_categories
FOR SELECT
USING (true);

CREATE POLICY "Admin and almoxarife can insert supplier_categories"
ON public.supplier_categories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can update supplier_categories"
ON public.supplier_categories
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));

CREATE POLICY "Admin and almoxarife can delete supplier_categories"
ON public.supplier_categories
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'almoxarife'::app_role));
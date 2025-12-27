-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to view company logos
CREATE POLICY "Public access to company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow admins to upload company logos
CREATE POLICY "Admins can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update company logos
CREATE POLICY "Admins can update company logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete company logos
CREATE POLICY "Admins can delete company logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));
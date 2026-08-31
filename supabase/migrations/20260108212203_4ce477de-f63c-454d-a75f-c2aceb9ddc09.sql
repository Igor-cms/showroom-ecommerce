-- Create vault_applications table for storing vault access form submissions
CREATE TABLE public.vault_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cell TEXT NOT NULL,
  email TEXT NOT NULL,
  shop TEXT NOT NULL,
  instagram TEXT,
  price_range_min NUMERIC NOT NULL,
  price_range_max NUMERIC NOT NULL,
  lot_size TEXT NOT NULL,
  sensory_profile TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vault_applications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert applications (public form)
CREATE POLICY "Anyone can submit vault applications"
ON public.vault_applications
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can view applications
CREATE POLICY "Authenticated users can view vault applications"
ON public.vault_applications
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only authenticated users can update applications
CREATE POLICY "Authenticated users can update vault applications"
ON public.vault_applications
FOR UPDATE
USING (auth.uid() IS NOT NULL);
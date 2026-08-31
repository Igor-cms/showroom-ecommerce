CREATE TABLE public.wholesale_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'request',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT NOT NULL,
  state TEXT,
  city TEXT NOT NULL,
  business_tax_number TEXT,
  other_business_number TEXT,
  shipping_address TEXT NOT NULL,
  message TEXT,
  shopify_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.wholesale_requests TO anon;
GRANT INSERT ON public.wholesale_requests TO authenticated;
GRANT ALL ON public.wholesale_requests TO service_role;

ALTER TABLE public.wholesale_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a wholesale request"
ON public.wholesale_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE TRIGGER update_wholesale_requests_updated_at
BEFORE UPDATE ON public.wholesale_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
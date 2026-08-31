CREATE TABLE public.wholesale_signups (
  email TEXT PRIMARY KEY,
  company TEXT,
  phone TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.wholesale_signups TO service_role;

ALTER TABLE public.wholesale_signups ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_wholesale_signups_updated_at
BEFORE UPDATE ON public.wholesale_signups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
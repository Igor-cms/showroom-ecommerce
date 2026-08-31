
-- Customer Account API OAuth session tables
CREATE TABLE public.auth_sessions (
  state TEXT PRIMARY KEY,
  code_verifier TEXT NOT NULL,
  nonce TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes')
);
CREATE INDEX idx_auth_sessions_expires ON public.auth_sessions (expires_at);

GRANT ALL ON public.auth_sessions TO service_role;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (edge functions) can access.

CREATE TABLE public.customer_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT,
  email TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  id_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_sessions_expires ON public.customer_sessions (expires_at);

GRANT ALL ON public.customer_sessions TO service_role;
ALTER TABLE public.customer_sessions ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (edge functions) can access.

-- Hourly cleanup of expired rows
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-expired-customer-auth',
  '0 * * * *',
  $$
    DELETE FROM public.auth_sessions WHERE expires_at < now();
    DELETE FROM public.customer_sessions WHERE expires_at < (now() - interval '30 days');
  $$
);

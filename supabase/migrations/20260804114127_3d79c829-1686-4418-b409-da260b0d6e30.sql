-- Back-in-stock notification signups.
CREATE TABLE public.stock_notify_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_handle TEXT NOT NULL,
  shopify_product_id TEXT,
  product_title TEXT,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  source TEXT NOT NULL CHECK (source IN ('logged_in', 'anonymous')),
  shopify_customer_id TEXT,
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_ip TEXT,
  consent_user_agent TEXT,
  consent_text_version TEXT,
  mailchimp_tag TEXT,
  mailchimp_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (mailchimp_status IN ('pending', 'synced', 'failed', 'skipped')),
  mailchimp_error TEXT,
  mailchimp_synced_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stock_notify_signups_handle_email UNIQUE (product_handle, email)
);

CREATE INDEX stock_notify_signups_active_by_handle
  ON public.stock_notify_signups (product_handle)
  WHERE unsubscribed_at IS NULL;

CREATE INDEX stock_notify_signups_mailchimp_status
  ON public.stock_notify_signups (mailchimp_status)
  WHERE mailchimp_status IN ('pending', 'failed');

CREATE TRIGGER set_stock_notify_signups_updated_at
BEFORE UPDATE ON public.stock_notify_signups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT ALL ON public.stock_notify_signups TO service_role;
ALTER TABLE public.stock_notify_signups ENABLE ROW LEVEL SECURITY;
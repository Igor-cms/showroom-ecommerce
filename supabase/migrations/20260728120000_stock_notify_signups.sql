-- Back-in-stock notification signups.
--
-- Phase 1: capture only. Nothing emails anyone yet and no Mailchimp account is
-- needed. The mailchimp_* columns exist from day one so switching sending on
-- later is a backfill ("sync every row still at 'pending'") rather than a
-- migration rewrite.

CREATE TABLE public.stock_notify_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product.id is the Shopify handle (see useShopifyStorefrontProducts.ts).
  -- shopify_product_id is nullable for now; it's what makes a later
  -- handle-rename remap exact instead of best-effort.
  product_handle TEXT NOT NULL,
  shopify_product_id TEXT,
  product_title TEXT,

  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,

  source TEXT NOT NULL CHECK (source IN ('logged_in', 'anonymous')),
  shopify_customer_id TEXT,

  -- Consent evidence. Cheap to record now and impossible to backfill later —
  -- without it this list can't lawfully be mailed once sending is built.
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_ip TEXT,
  consent_user_agent TEXT,
  consent_text_version TEXT,

  -- The exact tag we will write to Mailchimp, derived from the HANDLE, not the
  -- title, so it stays stable when the product is renamed.
  mailchimp_tag TEXT,
  mailchimp_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (mailchimp_status IN ('pending', 'synced', 'failed', 'skipped')),
  mailchimp_error TEXT,
  mailchimp_synced_at TIMESTAMPTZ,

  notified_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Makes the button idempotent: a second click is a no-op, not a duplicate
  -- row. A plain column constraint (not an expression index on lower(email))
  -- so the edge function can rely on it directly — email is always lowercased
  -- server-side before it is written.
  CONSTRAINT stock_notify_signups_handle_email UNIQUE (product_handle, email)
);

CREATE INDEX stock_notify_signups_active_by_handle
  ON public.stock_notify_signups (product_handle)
  WHERE unsubscribed_at IS NULL;

-- Drives the "sync everything still pending" backfill when Mailchimp is wired.
CREATE INDEX stock_notify_signups_mailchimp_status
  ON public.stock_notify_signups (mailchimp_status)
  WHERE mailchimp_status IN ('pending', 'failed');

CREATE TRIGGER set_stock_notify_signups_updated_at
BEFORE UPDATE ON public.stock_notify_signups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT ALL ON public.stock_notify_signups TO service_role;
ALTER TABLE public.stock_notify_signups ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (edge functions) can access.
--
-- Deliberately NOT granting anon INSERT the way wholesale_requests does.
-- A public insert path would let anyone spray arbitrary addresses into what
-- becomes a Mailchimp audience, which costs sending reputation, not just data
-- quality. All writes go through stock-notify-subscribe.

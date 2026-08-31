# Deploy `get-customer-credit` Edge Function

## Goal
Deploy the already-committed `supabase/functions/get-customer-credit/index.ts` to the connected Supabase project. No code changes, no config changes.

## Constraints (confirmed from the file in context)
- The function ignores the request body and resolves identity from the session — do not change this.
- It uses `buildCorsHeaders` (origin-scoped + credentials), not `*` — do not change.
- `verify_jwt = false` in `supabase/config.toml` — do not change.
- No new secrets needed: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SHOPIFY_SHOP_ID, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN are all already configured.

## Steps
1. Deploy `get-customer-credit` via `supabase--deploy_edge_functions` (deploys the committed code as-is).
2. Verify the deployed function returns 401 when called with no session — the intended behavior — via `supabase--curl_edge_functions` with an empty body.

No other files are touched.

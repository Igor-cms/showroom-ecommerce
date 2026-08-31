// Customer Account API client helper.
// Uses fetch with credentials:'include' so the httpOnly session cookie set by
// the edge function is sent on subsequent requests.

const SUPABASE_URL = "https://emziqfhzysyovohelvht.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtemlxZmh6eXN5b3ZvaGVsdmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODE0NTAsImV4cCI6MjA2NTI1NzQ1MH0.CsHMB3-aEKS2jx5X4ZEp5u_1hbZCZU0IcMwYYEjHpFk";

// Session token persisted in localStorage and sent as the x-session-id header.
// This is the first-party fallback for browsers that block the cross-site
// session cookie (Safari/ITP, incognito windows): the cookie alone leaves the
// user looking logged-out after the Shopify redirect, restarting the flow.
const SESSION_KEY = "wholesale_session_id";

function getStoredSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function setStoredSession(id: string) {
  try {
    localStorage.setItem(SESSION_KEY, id);
  } catch {
    // ignore storage errors
  }
}

function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

// Synchronous "probably logged in" hint. Lets UI that only needs to pick a
// label (menu: Login vs My Account) render the right one immediately instead of
// flashing the logged-out state while getCustomer() is in flight. Never use it
// to gate access — only the server-verified session decides that.
export function hasStoredSession(): boolean {
  return !!getStoredSession();
}

async function call<T = unknown>(
  fn: string,
  body?: unknown,
  method: "POST" | "GET" = "POST",
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    };
    // Authenticate via the stored session token when present (first-party path,
    // works everywhere). credentials:"include" keeps the cookie path alive too.
    const sid = getStoredSession();
    if (sid) headers["x-session-id"] = sid;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method,
      credentials: "include",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return {
      ok: res.ok,
      status: res.status,
      data: data as T | null,
      error: !res.ok ? (data as any)?.error : undefined,
    };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: (e as Error).message };
  }
}

export interface CustomerOrder {
  id: string;
  name: string;
  processedAt: string;
  totalPrice: { amount: string; currencyCode: string };
  fulfillmentStatus: string | null;
}

/** One product line of a past order, as returned by customer-orders-get. */
export interface OrderLineItem {
  title: string;
  variantTitle: string | null;
  quantity: number;
  /** Bare numeric ids (the server strips Shopify's gid:// prefix), so they can
   *  be matched straight against the get-shopify-products catalogue. */
  variantId: string | null;
  productId: string | null;
  /** Price PAID at the time. Never reuse it for a new cart — reorder resolves
   *  the current price from the catalogue instead. */
  price: { amount: string; currencyCode: string } | null;
}

export interface CustomerOrderDetail extends CustomerOrder {
  lineItems: OrderLineItem[];
}

export interface CustomerAddress {
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  zip: string | null;
  company: string | null;
  phoneNumber: string | null;
}

export interface Customer {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  emailAddress: { emailAddress: string } | null;
  phoneNumber: { phoneNumber: string } | null;
  defaultAddress: CustomerAddress | null;
  orders: { edges: Array<{ node: CustomerOrder }> };
  // Wholesale approval status, resolved server-side from Shopify customer tags.
  // null = no wholesale tag. A null status does NOT grant portal access: the
  // gate requires an explicit `approved` tag (or a valid wholesale password),
  // so an untagged Shopify session is sent to the password gate.
  wholesaleStatus?: "pending" | "approved" | "rejected" | null;
}

/* ── Customer type ───────────────────────────────────────────────────────────
 * Two kinds of customer share one Shopify identity:
 *   retail    — buys from the public storefront at retail prices.
 *   wholesale — approved to buy through the wholesale portal.
 * There is no separate retail flag: retail is simply the absence of wholesale
 * approval, so every Shopify customer is retail until an admin approves them.
 * `pending` deliberately still counts as retail — the application is filed but
 * unapproved, and they keep shopping the storefront meanwhile.
 * ------------------------------------------------------------------------- */
export type CustomerType = "retail" | "wholesale";

export function getCustomerType(customer: Customer | null): CustomerType {
  return customer?.wholesaleStatus === "approved" ? "wholesale" : "retail";
}

/* ── Retail sign-up hand-off ─────────────────────────────────────────────────
 * A retail sign-up collects the PERSON's details, then sends the browser to
 * Shopify to create/confirm the login. The details are parked here across that
 * redirect and written to the customer once the session proves who they are —
 * the same "stash then apply after login" pattern the wholesale setup uses,
 * minus every company field, so nothing about the record reads as wholesale.
 * ------------------------------------------------------------------------- */
const RETAIL_SIGNUP_KEY = "retail_signup_payload";

export interface RetailSignup {
  first_name: string;
  last_name: string;
  email: string;
}

export function stashRetailSignup(payload: RetailSignup) {
  try {
    sessionStorage.setItem(RETAIL_SIGNUP_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors — worst case the name is just not written
  }
}

/** Reads and clears the parked sign-up, so a reload can't re-apply it. */
export function takeRetailSignup(): RetailSignup | null {
  try {
    const raw = sessionStorage.getItem(RETAIL_SIGNUP_KEY);
    sessionStorage.removeItem(RETAIL_SIGNUP_KEY);
    return raw ? (JSON.parse(raw) as RetailSignup) : null;
  } catch {
    return null;
  }
}

export async function startAuth(email: string) {
  return call<{ authorize_url: string }>("customer-auth-start", { email });
}

// Redirect the browser straight into the Shopify login (authorize) URL.
export function beginAuthRedirect(
  data: { authorize_url?: string } | null | undefined,
): boolean {
  const authorizeUrl = data?.authorize_url;
  if (!authorizeUrl) return false;
  window.location.href = authorizeUrl;
  return true;
}

export async function completeAuth(code: string, state: string) {
  const res = await call<{ ok: boolean; error?: string; session_id?: string }>(
    "customer-auth-callback",
    { code, state },
  );
  // Persist the session token so later requests authenticate via the header,
  // even where the cross-site cookie is blocked.
  if (res.ok && res.data?.session_id) setStoredSession(res.data.session_id);
  return res;
}

export async function getCustomer() {
  return call<{ customer: Customer }>("customer-account-get", undefined, "POST");
}

// Order history with line items. Kept off customer-account-get on purpose: that
// endpoint backs the session on every page, so the heavier orders query lives
// on its own and can fail without logging anyone out.
export async function getCustomerOrders() {
  return call<{ orders: CustomerOrderDetail[] }>("customer-orders-get");
}

/**
 * The signed-in customer's Shopify store credit, for display in the cart.
 *
 * It goes through `call` rather than supabase.functions.invoke because only
 * `call` attaches the session (x-session-id plus the cookie), and the session
 * is now the ONLY thing that decides whose balance comes back. The old caller
 * passed an { email } straight to the function, which is exactly what let
 * anyone read anyone else's balance.
 */
export async function getCustomerCredit() {
  return call<{ found: boolean; creditAmount: number; currencyCode: string }>(
    "get-customer-credit",
  );
}

export async function logout() {
  // Send the token (still in storage) so the server revokes the right session,
  // then clear it locally.
  const res = await call<{ ok: boolean }>("customer-auth-logout");
  clearStoredSession();
  return res;
}

// Write the reviewed wholesale details back to Shopify (Admin API, server-side).
// The session cookie authorizes which customer is updated — the payload's
// identity is ignored by the edge function.
export async function updateCustomer(payload: Record<string, unknown>) {
  return call<{ ok: boolean; error?: string }>("update-shopify-customer", payload);
}

// Register a wholesale applicant. Goes through the session-aware `call()` so the
// x-session-id header is sent when a customer is logged in. The server refuses
// to mutate an EXISTING customer without a matching session, returning
// { requiresAuth: true } — the caller then confirms the Shopify login and
// re-submits. A brand-new email is created without a session.
export async function registerWholesale(payload: Record<string, unknown>) {
  return call<{
    ok?: boolean;
    requiresAuth?: boolean;
    created?: boolean;
    status?: string;
    error?: string;
  }>("wholesale-register", payload);
}

// Record a "notify me when back in stock" signup. Goes through the session-aware
// `call()` so x-session-id is sent when the customer is logged in — the server
// then takes the email from the session and ignores anything in the payload.
// When there is no usable session and no email yet, the server replies
// { needsEmail: true } and the caller opens the name/email dialog. That means
// the card never has to check the session itself just to render the button.
export async function subscribeBackInStock(payload: {
  productHandle: string;
  productTitle?: string;
  email?: string;
  firstName?: string;
  consent?: boolean;
}) {
  return call<{
    ok?: boolean;
    needsEmail?: boolean;
    alreadySubscribed?: boolean;
    error?: string;
  }>("stock-notify-subscribe", payload);
}

// A wholesale profile is "complete" when the fields we require for the portal
// are already present on the authenticated Shopify customer. Mirrors the prefill
// extraction in WholesaleRequest so the gate and the form agree.
export function isProfileComplete(customer: Customer | null): boolean {
  if (!customer) return false;
  const nameParts = (customer.displayName ?? "").split(" ").filter(Boolean);
  const firstName = (customer.firstName ?? nameParts[0] ?? "").trim();
  const lastName = (customer.lastName ?? nameParts.slice(1).join(" ") ?? "").trim();
  const shopName = (customer.defaultAddress?.company ?? "").trim();
  const country = (customer.defaultAddress?.country ?? "").trim();
  return Boolean(firstName && lastName && shopName && country);
}

/* ── Identified cart ─────────────────────────────────────────────────────────
 * Builds the Shopify cart server-side so the logged-in customer's Shopify
 * identity (buyerIdentity.customerAccessToken) is attached to it. That token
 * never touches the browser, and it is what makes Shopify evaluate discount
 * codes that are restricted to specific customers or segments.
 *
 * Returns null when there is no session — the caller then falls back to the
 * ordinary anonymous cart created straight from the browser.
 * ------------------------------------------------------------------------- */
export interface IdentifiedCart {
  id: string;
  checkoutUrl: string;
  discountCodes: Array<{ code: string; applicable: boolean }>;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
  /** true when Shopify accepted the customer token for this cart. */
  identified: boolean;
}

export async function createIdentifiedCart(payload: {
  lines: Array<{ merchandiseId: string; quantity: number }>;
  discountCodes?: string[];
  countryCode?: string;
  attributes?: Array<{ key: string; value: string }>;
}): Promise<IdentifiedCart | null> {
  if (!hasStoredSession()) return null;
  const res = await call<{
    cart?: Omit<IdentifiedCart, "identified">;
    identified?: boolean;
    error?: string;
  }>("shopify-cart", payload);
  if (!res.ok || !res.data?.cart) return null;
  return { ...res.data.cart, identified: !!res.data.identified };
}

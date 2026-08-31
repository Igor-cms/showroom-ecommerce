/**
 * Shopify Storefront API client — talks directly to Shopify from the browser.
 * No Supabase, no caching layer. Used by the public /shop page.
 */
import { createIdentifiedCart } from "./customerAuth";


// Hardcoded to match the store used elsewhere in the codebase
// (WholesaleCart, ShopifyBuyButton). VITE_SHOPIFY_STORE_DOMAIN in .env
// points at a different/legacy store and is ignored on purpose.
const DOMAIN = "40c504-61.myshopify.com";
const TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN as string;
const API_VERSION = "2025-01";

const ENDPOINT = `https://${DOMAIN}/api/${API_VERSION}/graphql.json`;

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function storefrontFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!DOMAIN || !TOKEN) {
    throw new Error("Missing Shopify Storefront credentials (VITE_SHOPIFY_STORE_DOMAIN / VITE_SHOPIFY_STOREFRONT_TOKEN)");
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Shopify Storefront HTTP ${res.status}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) throw new Error("Shopify Storefront returned no data");
  return json.data;
}

/* ─── Products ───────────────────────────────────────────────────────────── */

export interface StorefrontVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: { amount: string; currencyCode: string };
}

export interface StorefrontMetafield {
  key: string;
  namespace: string;
  value: string;
}

export interface StorefrontProduct {
  id: string;
  handle: string;
  title: string;
  tags: string[];
  descriptionHtml: string;
  totalInventory: number | null;
  availableForSale: boolean;
  featuredImage: { url: string; altText: string | null } | null;
  /** Aligned with the requested identifiers; null for metafields the product doesn't have. */
  metafields: Array<StorefrontMetafield | null>;
  variants: { edges: Array<{ node: StorefrontVariant }> };
}

/**
 * Coffee detail metafields we try to read. Storefront requires explicit
 * namespace+key pairs; missing ones come back as null (harmless). The
 * `custom` namespace is Shopify's default for merchant-defined fields.
 */
const PRODUCT_METAFIELD_IDS = [
  { namespace: "custom", key: "process" },
  { namespace: "custom", key: "sensory" },
  { namespace: "custom", key: "tasting_notes" },
  { namespace: "custom", key: "notes" },
  { namespace: "custom", key: "flavor_profile" },
] as const;

const METAFIELD_IDENTIFIERS = PRODUCT_METAFIELD_IDS
  .map((m) => `{namespace: "${m.namespace}", key: "${m.key}"}`)
  .join(", ");

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          tags
          descriptionHtml
          totalInventory
          availableForSale
          metafields(identifiers: [${METAFIELD_IDENTIFIERS}]) {
            namespace
            key
            value
          }
          featuredImage {
            url
            altText
          }
          variants(first: 25) {
            edges {
              node {
                id
                title
                availableForSale
                quantityAvailable
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchStorefrontProducts(first = 100): Promise<StorefrontProduct[]> {
  const data = await storefrontFetch<{
    products: { edges: Array<{ node: StorefrontProduct }> };
  }>(PRODUCTS_QUERY, { first });
  return data.products.edges.map((e) => e.node);
}

/* ─── Cart / Checkout ───────────────────────────────────────────────────── */

export interface CartLineInput {
  merchandiseId: string; // variant GID, e.g. "gid://shopify/ProductVariant/123"
  quantity: number;
}

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        discountCodes {
          code
          applicable
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export interface ShopifyCheckout {
  /** Shopify cart id — kept so we can later ask whether it turned into an order. */
  id: string;
  checkoutUrl: string;
}

type RawCart = {
  id: string;
  checkoutUrl: string;
  discountCodes: Array<{ code: string; applicable: boolean }>;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
};

async function createRawCart(
  lines: CartLineInput[],
  discountCodes?: string[],
  extra?: Record<string, unknown>,
): Promise<RawCart> {
  // Logged-in customer: let the server build the cart, so it can attach the
  // Shopify buyer identity. Without it Shopify prices the cart as a guest and
  // any discount restricted to specific customers comes back inapplicable.
  // Anonymous visitors (and any server hiccup) fall through to the direct
  // browser call below, which behaves exactly as before.
  try {
    const identified = await createIdentifiedCart({
      lines,
      discountCodes,
      countryCode: typeof extra?.countryCode === "string" ? extra.countryCode : undefined,
      attributes: Array.isArray(extra?.attributes)
        ? (extra.attributes as Array<{ key: string; value: string }>)
        : undefined,
    });
    if (identified) return identified;
  } catch {
    // fall through to the anonymous cart
  }

  const { countryCode, attributes, ...rest } = (extra ?? {}) as Record<string, unknown>;
  const input: Record<string, unknown> = { lines, ...rest };
  if (discountCodes?.length) input.discountCodes = discountCodes;
  if (countryCode) input.buyerIdentity = { countryCode };
  if (attributes) input.attributes = attributes;

  const data = await storefrontFetch<{
    cartCreate: {
      cart: RawCart | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(CART_CREATE, { input });

  if (data.cartCreate.userErrors.length) {
    throw new Error(data.cartCreate.userErrors.map((e) => e.message).join("; "));
  }
  if (!data.cartCreate.cart) throw new Error("Shopify did not return a cart");
  return data.cartCreate.cart;
}


export async function createShopifyCheckout(
  lines: CartLineInput[],
  discountCodes?: string[],
  extra?: { countryCode?: string; attributes?: Array<{ key: string; value: string }> },
): Promise<ShopifyCheckout> {
  const cart = await createRawCart(lines, discountCodes, extra as Record<string, unknown>);
  return { id: cart.id, checkoutUrl: cart.checkoutUrl };

}

/* ─── Discount codes ─────────────────────────────────────────────────────── */

export interface DiscountPreview {
  /** Shopify accepted the code AND it applies to the current cart. */
  applicable: boolean;
  /** The code exactly as Shopify echoed it back. */
  code: string;
  /** Cart subtotal after the discount, straight from Shopify. */
  subtotal: number;
  /** Cart total after the discount (before shipping/taxes are known). */
  total: number;
  currencyCode: string;
}

/**
 * Asks Shopify to price the current lines with a discount code applied.
 * A throwaway cart is created for the quote; the real one is built at checkout
 * with the same code, so what the customer sees here is what they pay.
 */
export async function previewDiscountedCart(
  lines: CartLineInput[],
  code: string,
  extra?: Record<string, unknown>,
): Promise<DiscountPreview> {
  const cart = await createRawCart(lines, [code], extra);
  const entry = cart.discountCodes.find(
    (d) => d.code.toLowerCase() === code.trim().toLowerCase(),
  ) ?? cart.discountCodes[0];

  return {
    applicable: !!entry?.applicable,
    code: entry?.code ?? code.trim(),
    subtotal: Number(cart.cost.subtotalAmount.amount),
    total: Number(cart.cost.totalAmount.amount),
    currencyCode: cart.cost.totalAmount.currencyCode,
  };
}

const CART_STATUS = /* GraphQL */ `
  query CartStatus($id: ID!) {
    cart(id: $id) {
      id
      totalQuantity
    }
  }
`;

/**
 * "open"      — the cart still holds lines, so the customer came back WITHOUT
 *               buying (they abandoned or returned to edit). Keep their cart.
 * "completed" — Shopify no longer has the cart (it became an order) or it has
 *               no lines left. Safe to empty the local cart.
 * "unknown"   — the lookup failed (offline / API error). Callers MUST keep the
 *               cart: emptying it on a failed request would lose real items.
 */
export type ShopifyCartStatus = "open" | "completed" | "unknown";

export async function getShopifyCartStatus(cartId: string): Promise<ShopifyCartStatus> {
  try {
    const data = await storefrontFetch<{
      cart: { id: string; totalQuantity: number } | null;
    }>(CART_STATUS, { id: cartId });

    if (!data.cart) return "completed";
    return data.cart.totalQuantity > 0 ? "open" : "completed";
  } catch {
    return "unknown";
  }
}

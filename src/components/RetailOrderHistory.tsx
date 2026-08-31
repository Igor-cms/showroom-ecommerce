import { useMemo, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { useShopifyStorefrontProducts } from "@/hooks/useShopifyStorefrontProducts";
import type { Product } from "@/data/products";
import type { CustomerOrderDetail } from "@/lib/customerAuth";

/* =========================================================================
 *  RetailOrderHistory — past orders, with one-click reorder, shown on
 *  /account for logged-in retail customers.
 *
 *  Retail's counterpart to WholesaleOrderHistory (src/components), same
 *  reasoning applies: reorder re-resolves every line against the CURRENT
 *  catalogue by variant id rather than replaying the order as it was, because
 *  an old order carries stale prices and may reference a coffee that's since
 *  sold out or been delisted. What lands in the cart is today's price and
 *  today's variant, with the quantity carried over from the order and capped
 *  at what's actually available. Anything that can't be resolved is reported
 *  instead of silently dropped.
 *
 *  Differs from the wholesale version in catalogue source: retail reads the
 *  public Storefront API (useShopifyStorefrontProducts) rather than the
 *  Admin-API-backed wholesale catalogue, so variant ids arrive as full GIDs
 *  ("gid://shopify/ProductVariant/123") instead of bare numbers. Order line
 *  items come back bare (customer-orders-get strips the prefix), so the
 *  catalogue map below is keyed on the bare id — see bareId().
 * ========================================================================= */

interface CatalogHit {
  product: Product;
  /** The variant's label key ("250g", "1KG"…) — the cart's `size`. */
  sizeLabel: string;
  /** Full Shopify GID — what the cart/checkout actually needs. */
  variantId: string;
  price: number;
  available: boolean;
  /** Live stock count, when Shopify reports one. Can be negative ("continue
   *  selling when out of stock") — only ever used as a cap when positive. */
  stock: number | null;
}

/** "gid://shopify/ProductVariant/123" -> "123". Passes anything else through
 *  unchanged, so an already-bare id still matches. */
const bareId = (id: string): string => id.split("/").pop() ?? id;

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const formatMoney = (amount: string, currency: string) => {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
};

const RetailOrderHistory = () => {
  const { data: orders, isLoading: ordersLoading, isError } = useCustomerOrders();
  const { data: products, isLoading: catalogLoading } = useShopifyStorefrontProducts();
  const { addToCart, updateQuantity, setIsCartOpen } = useCart();

  /** Result of the last reorder, keyed by order id, so the feedback shows on
   *  the button that was actually pressed. */
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  // Every purchasable variant in the live catalogue, indexed by BARE variant
  // id — the one shape an order line (already stripped server-side) and a
  // GID-shaped Storefront catalogue can reliably share.
  const catalogByVariantId = useMemo(() => {
    const map = new Map<string, CatalogHit>();
    if (!products) return map;
    for (const product of products) {
      const weights = product.variantIdByWeight ?? {};
      for (const [sizeLabel, gid] of Object.entries(weights)) {
        const price = product.priceByWeight?.[sizeLabel] ?? product.price;
        map.set(bareId(gid), {
          product,
          sizeLabel,
          variantId: gid,
          price,
          available: product.variantAvailableByWeight?.[sizeLabel] ?? true,
          stock: product.variantStockByWeight?.[sizeLabel] ?? null,
        });
      }
    }
    return map;
  }, [products]);

  const handleReorder = (order: CustomerOrderDetail) => {
    let added = 0;
    const unavailable: string[] = [];

    order.lineItems.forEach((line) => {
      const hit = line.variantId ? catalogByVariantId.get(line.variantId) : undefined;
      if (!hit || !hit.available) {
        unavailable.push(line.title);
        return;
      }
      // Only trust the stock count as a cap when it's a believable positive
      // number — Shopify reports negative counts for "continue selling when
      // out of stock" variants, which is not a real ceiling on quantity.
      const quantity =
        hit.stock !== null && hit.stock > 0 ? Math.min(line.quantity, hit.stock) : line.quantity;
      if (quantity <= 0) {
        unavailable.push(line.title);
        return;
      }

      addToCart({
        productId: hit.product.id,
        variantId: hit.variantId,
        name: hit.product.title,
        size: hit.sizeLabel,
        price: hit.price,
        quantity,
        countryCode: "US",
        displaySize: hit.sizeLabel,
      });
      // addToCart ADDS to whatever is already in the cart. Follow up with the
      // absolute quantity so pressing REORDER twice doesn't silently double it.
      updateQuantity(hit.product.id, hit.sizeLabel, quantity);
      added += 1;
    });

    if (added > 0) setIsCartOpen(true);

    const message =
      added === 0
        ? "Nothing from this order is available right now"
        : unavailable.length > 0
        ? `${added} added · ${unavailable.length} unavailable`
        : "Added to cart ✓";
    setFeedback((f) => ({ ...f, [order.id]: message }));
    window.setTimeout(() => setFeedback((f) => ({ ...f, [order.id]: "" })), 4000);
  };

  // Still loading, or the query failed (not signed in / function not deployed
  // yet): stay silent rather than showing an error on an account page — those
  // are transient or technical states, not "you have no orders".
  if (ordersLoading || isError || !orders) return null;

  const busy = catalogLoading || catalogByVariantId.size === 0;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">Order history</h2>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">You don't have any orders yet.</p>
      ) : (
      <ul className="divide-y divide-border border border-border rounded-md">
        {orders.map((order) => (
          <li key={order.id} className="px-4 py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{order.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.processedAt)}
                  {order.fulfillmentStatus
                    ? ` · ${order.fulfillmentStatus.toLowerCase().replace(/_/g, " ")}`
                    : ""}
                </p>
              </div>
              <p className="text-sm text-foreground whitespace-nowrap">
                {formatMoney(order.totalPrice.amount, order.totalPrice.currencyCode)}
              </p>
            </div>

            {order.lineItems.length > 0 && (
              <ul className="space-y-0.5">
                {order.lineItems.map((line, i) => (
                  <li key={`${order.id}-${i}`} className="text-xs text-muted-foreground">
                    {line.quantity}× {line.title}
                    {line.variantTitle ? ` — ${line.variantTitle}` : ""}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              {feedback[order.id] ? (
                <span className="text-xs text-muted-foreground" aria-live="polite">
                  {feedback[order.id]}
                </span>
              ) : (
                <span />
              )}
              <button
                onClick={() => handleReorder(order)}
                disabled={busy}
                className="rounded-full border border-foreground text-xs font-medium px-4 py-1.5 text-foreground whitespace-nowrap transition-colors hover:bg-foreground hover:text-background disabled:opacity-40 disabled:pointer-events-none"
              >
                Reorder
              </button>
            </div>
          </li>
        ))}
      </ul>
      )}
    </section>
  );
};

export default RetailOrderHistory;

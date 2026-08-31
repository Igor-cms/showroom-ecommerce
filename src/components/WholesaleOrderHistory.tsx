import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import {
  useShopifyProducts,
  type ShopifyProduct,
  type ShopifyVariant,
} from "@/hooks/useShopifyProducts";
import type { CustomerOrderDetail } from "@/lib/customerAuth";

/* =========================================================================
 *  WholesaleOrderHistory — past orders, with one-click reorder, shown above
 *  the offer list on /wholesale-row.
 *
 *  Reorder deliberately does NOT replay the order as it was. It re-resolves
 *  every line against the CURRENT catalogue by variant id, because an old
 *  order carries stale prices and may contain coffees that are now delisted
 *  or out of stock. What lands in the cart is therefore today's price and
 *  today's variant label, with the quantity carried over from the order and
 *  capped at what is actually in stock. Anything that can't be resolved is
 *  reported instead of silently dropped.
 * ========================================================================= */

interface Props {
  /** Same country used by the product table, so cart lines agree. */
  countryCode: string;
}

interface CatalogHit {
  product: ShopifyProduct;
  /** The variant's label key ("250g", "1KG", "Unit"…) — the cart's `size`. */
  sizeLabel: string;
  variant: ShopifyVariant;
  price: number;
}

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

const WholesaleOrderHistory = ({ countryCode }: Props) => {
  const { data: orders, isLoading: ordersLoading, isError } = useCustomerOrders();
  const { data: productsByCategory, isLoading: catalogLoading } = useShopifyProducts();
  const { addToCart, updateQuantity, setIsCartOpen } = useCart();

  /** Result of the last reorder, keyed by order id, so the feedback shows on
   *  the button that was actually pressed. */
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  /** The item list starts hidden: this sits above the offer list, and a
   *  customer arriving to buy should reach the coffees without scrolling past
   *  their own history first. */
  const [expanded, setExpanded] = useState(false);
  const ITEMS_ID = "your-orders-items";

  /* Only the most recent order is shown here. The full history is a separate
     concern; this section exists so the commonest action — buy the same thing
     again — is one click away from the top of the page.

     Sorted rather than trusted: customer-orders-get asks Shopify for
     PROCESSED_AT reversed, but "the latest order" is the whole premise of this
     section, so it is worth deriving instead of assuming a sort order that
     lives in another file. */
  const latest = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    return [...orders].sort(
      (a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime(),
    )[0];
  }, [orders]);

  // Every purchasable variant in the live catalogue, indexed by variant id —
  // the one field an order line and the catalogue reliably share.
  const catalogByVariantId = useMemo(() => {
    const map = new Map<string, CatalogHit>();
    if (!productsByCategory) return map;
    Object.values(productsByCategory)
      .flat()
      .forEach((product) => {
        const variants: Record<string, ShopifyVariant> = product.variants ?? {};
        Object.entries(variants).forEach(([sizeLabel, variant]) => {
          const price = product.prices?.[sizeLabel];
          if (!variant?.id || !price) return;
          map.set(String(variant.id), { product, sizeLabel, variant, price });
        });
      });
    return map;
  }, [productsByCategory]);

  const handleReorder = (order: CustomerOrderDetail) => {
    let added = 0;
    const unavailable: string[] = [];

    order.lineItems.forEach((line) => {
      const hit = line.variantId ? catalogByVariantId.get(line.variantId) : undefined;
      if (!hit) {
        unavailable.push(line.title);
        return;
      }
      const stock = hit.variant.inventoryQuantity ?? 0;
      const quantity = Math.min(line.quantity, stock);
      if (quantity <= 0) {
        unavailable.push(line.title);
        return;
      }

      addToCart({
        productId: hit.product.id,
        variantId: hit.variant.id,
        name: hit.product.name,
        size: hit.sizeLabel,
        price: hit.price,
        quantity,
        countryCode: countryCode || "ROW",
        displaySize: hit.variant.option1 ?? undefined,
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
        : "ADDED ✓";
    setFeedback((f) => ({ ...f, [order.id]: message }));
    window.setTimeout(
      () => setFeedback((f) => ({ ...f, [order.id]: "" })),
      4000,
    );
  };

  // Not signed in, function not deployed, or simply no orders yet: this is an
  // enhancement on a shopping page, so it stays out of the way entirely.
  if (ordersLoading || isError || !orders || orders.length === 0 || !latest) return null;

  const busy = catalogLoading || catalogByVariantId.size === 0;

  return (
    <section className="mx-auto w-full max-w-[1536px] px-4 sm:px-6 lg:px-10 pt-6">
      <div className="flex items-end gap-2">
        <h2
          className="font-bold text-wholesale-primary"
          style={{ fontSize: "40px", letterSpacing: "-3px" }}
        >
          YOUR ORDERS
        </h2>
        <span
          className="text-wholesale-secondary mb-1"
          style={{ fontSize: "14px", letterSpacing: "-0.1px" }}
        >
          REORDER IN ONE CLICK
        </span>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block mt-6">
        <div
          className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-x-2 py-4 border-b border-black/70 text-xs font-bold text-wholesale-primary"
          style={{ letterSpacing: "-0.1px" }}
        >
          <div className="col-span-4 flex items-center min-w-0">ORDER</div>
          <div className="col-span-11 flex items-center min-w-0">ITEMS</div>
          <div className="col-span-3 flex items-center min-w-0">STATUS</div>
          <div className="col-span-2 flex items-center min-w-0">TOTAL</div>
          <div className="col-span-4 flex items-center justify-end">REORDER</div>
        </div>

        {[latest].map((order) => (
          <div
            key={order.id}
            className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-x-2 py-4 border-b border-black/70 transition-colors hover:bg-wholesale-bg/50"
          >
            <div className="col-span-4 min-w-0">
              <p
                className="text-[13px] font-bold text-wholesale-primary"
                style={{ letterSpacing: "-0.1px" }}
              >
                {order.name}
              </p>
              <p className="text-[10px] text-wholesale-secondary uppercase mt-0.5">
                {formatDate(order.processedAt)}
              </p>
            </div>

            <div className="col-span-11 min-w-0">
              {order.lineItems.length === 0 ? (
                <p className="text-[10px] text-wholesale-secondary uppercase">—</p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => !e)}
                    aria-expanded={expanded}
                    aria-controls={ITEMS_ID}
                    className="flex items-center gap-1 text-[10px] font-bold text-wholesale-primary uppercase hover:opacity-60 transition-opacity"
                    style={{ letterSpacing: "-0.1px" }}
                  >
                    {order.lineItems.length}{" "}
                    {order.lineItems.length === 1 ? "ITEM" : "ITEMS"}
                    <ChevronDown
                      size={12}
                      strokeWidth={2.5}
                      aria-hidden
                      className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expanded && (
                    <ul id={ITEMS_ID} className="mt-1.5 space-y-0.5">
                      {order.lineItems.map((line, i) => (
                        <li
                          key={`${order.id}-${i}`}
                          className="text-[10px] text-black uppercase leading-tight"
                          style={{ letterSpacing: "-0.1px" }}
                        >
                          {line.quantity}× {line.title}
                          {line.variantTitle ? ` — ${line.variantTitle}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div className="col-span-3 flex items-start min-w-0">
              <span className="text-[10px] text-wholesale-secondary uppercase">
                {order.fulfillmentStatus
                  ? order.fulfillmentStatus.toLowerCase().replace(/_/g, " ")
                  : "—"}
              </span>
            </div>

            <div className="col-span-2 flex items-start min-w-0">
              <span
                className="text-[11px] font-bold text-wholesale-primary whitespace-nowrap"
                style={{ letterSpacing: "-0.1px" }}
              >
                {formatMoney(order.totalPrice.amount, order.totalPrice.currencyCode)}
              </span>
            </div>

            <div className="col-span-4 flex flex-col items-end gap-1">
              <button
                onClick={() => handleReorder(order)}
                disabled={busy}
                className="rounded-full border border-black text-[10px] font-bold px-3 py-[3px] leading-none text-black whitespace-nowrap tracking-wide transition-all bg-[#c9c2b2] hover:bg-[#b8b0a0] active:scale-95 disabled:opacity-40"
              >
                REORDER
              </button>
              {feedback[order.id] && (
                <span
                  className="text-[9px] text-wholesale-secondary uppercase text-right leading-tight"
                  aria-live="polite"
                >
                  {feedback[order.id]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="lg:hidden mt-5 space-y-4">
        {[latest].map((order) => (
          <div key={order.id} className="border border-black/45 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="text-[13px] font-bold text-wholesale-primary"
                  style={{ letterSpacing: "-0.1px" }}
                >
                  {order.name}
                </p>
                <p className="text-[10px] text-wholesale-secondary uppercase mt-0.5">
                  {formatDate(order.processedAt)}
                </p>
              </div>
              <span
                className="text-[11px] font-bold text-wholesale-primary whitespace-nowrap"
                style={{ letterSpacing: "-0.1px" }}
              >
                {formatMoney(order.totalPrice.amount, order.totalPrice.currencyCode)}
              </span>
            </div>

            {order.lineItems.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  aria-expanded={expanded}
                  aria-controls={`${ITEMS_ID}-m`}
                  className="mt-3 flex items-center gap-1 text-[10px] font-bold text-wholesale-primary uppercase hover:opacity-60 transition-opacity"
                  style={{ letterSpacing: "-0.1px" }}
                >
                  {order.lineItems.length}{" "}
                  {order.lineItems.length === 1 ? "ITEM" : "ITEMS"}
                  <ChevronDown
                    size={12}
                    strokeWidth={2.5}
                    aria-hidden
                    className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded && (
                  <ul id={`${ITEMS_ID}-m`} className="mt-2 space-y-0.5">
                    {order.lineItems.map((line, i) => (
                      <li
                        key={`${order.id}-m-${i}`}
                        className="text-[10px] text-black uppercase leading-tight"
                        style={{ letterSpacing: "-0.1px" }}
                      >
                        {line.quantity}× {line.title}
                        {line.variantTitle ? ` — ${line.variantTitle}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              {feedback[order.id] ? (
                <span
                  className="text-[9px] text-wholesale-secondary uppercase leading-tight"
                  aria-live="polite"
                >
                  {feedback[order.id]}
                </span>
              ) : (
                <span />
              )}
              <button
                onClick={() => handleReorder(order)}
                disabled={busy}
                className="rounded-full border border-black text-[10px] font-bold px-3 py-[3px] leading-none text-black whitespace-nowrap tracking-wide transition-all bg-[#c9c2b2] hover:bg-[#b8b0a0] active:scale-95 disabled:opacity-40"
              >
                REORDER
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WholesaleOrderHistory;

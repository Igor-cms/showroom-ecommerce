import { useCallback, useState } from "react";
import { X, ShoppingBag, Plus, Minus } from "lucide-react";
import { useCart, type CartItem } from "../contexts/CartContext";
import { createShopifyCheckout } from "../lib/shopifyStorefront";
import CartQtyField from "./CartQtyField";
import { useCartDiscount } from "@/hooks/useCartDiscount";
import { useCustomer } from "@/contexts/CustomerContext";

const isShopifyVariantGid = (id: string) => id.startsWith("gid://shopify/ProductVariant/");

const CartDrawer = () => {
  const { items, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, markCheckoutStarted } = useCart();
  const { email: customerEmail } = useCustomer();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const toLines = useCallback(
    (cartItems: CartItem[]) =>
      cartItems.map((i) => ({ merchandiseId: i.variantId, quantity: i.quantity })),
    [],
  );
  const {
    code,
    setCode,
    isApplying,
    error: discountError,
    discount,
    discountAmount,
    subtotal,
    total,
    applyDiscount,
    removeDiscount,
  } = useCartDiscount(toLines);

  const canCheckout = items.length > 0 && items.every((i) => isShopifyVariantGid(i.variantId));

  const handleCheckout = async () => {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const checkout = await createShopifyCheckout(
        toLines(items),
        discount ? [discount.code] : undefined,
      );
      // Remember which Shopify cart we sent them to. The cart itself is NOT
      // cleared here: if they come back to add or edit items it must still be
      // there. It is emptied on return only once Shopify confirms this cart
      // turned into an order (see CartProvider).
      markCheckoutStarted(checkout.id);
      window.location.href = checkout.checkoutUrl;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed");
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      <div
        /* text-foreground pins the drawer's ink color so it never inherits a
           page's text color (e.g. /producers sets text-white on its root, which
           was turning the cart text white). */
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-background text-foreground border-l border-border z-50 transform transition-transform duration-smooth ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-headline font-semibold flex items-center gap-2">
              <ShoppingBag size={20} />
              Cart ({items.length})
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag size={48} className="text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-2">Add some coffee to get started</p>
              </div>
            ) : (
              <div className="space-y-5">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm leading-tight truncate">{item.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.displaySize ?? item.size}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId, item.size)}
                          className="text-muted-foreground hover:text-ink transition-colors shrink-0"
                          aria-label="Remove item"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-line">
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-ink transition-colors"
                          >
                            <Minus size={11} />
                          </button>
                          <CartQtyField
                            quantity={item.quantity}
                            onChange={(q) => updateQuantity(item.productId, item.size, q)}
                            className="w-7 text-xs font-mono tabular-nums"
                          />
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-ink transition-colors"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                        <p className="text-sm font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border p-6">
              {/* Who this cart belongs to. Customer-restricted discount codes
                  only resolve for a signed-in buyer, so say plainly which
                  account is being priced. */}
              {customerEmail && (
                <p className="mb-3 text-xs text-muted-foreground truncate">
                  Signed in as <span className="text-ink">{customerEmail}</span>
                </p>
              )}

              {/* Discount code */}
              <div className="mb-4">
                {discount ? (
                  <div className="flex items-center justify-between gap-2 border border-line px-3 py-2">
                    <span className="text-xs font-mono uppercase tracking-wide truncate">
                      {discount.code} applied
                    </span>
                    <button
                      onClick={removeDiscount}
                      className="text-xs text-muted-foreground hover:text-ink transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      applyDiscount(code);
                    }}
                  >
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Discount code"
                      aria-label="Discount code"
                      maxLength={64}
                      className="flex-1 min-w-0 border border-line bg-transparent px-3 py-2 text-xs uppercase tracking-wide placeholder:normal-case placeholder:text-muted-foreground focus:outline-none focus:border-ink"
                    />
                    <button
                      type="submit"
                      disabled={isApplying}
                      className="border border-ink px-3 py-2 text-xs uppercase tracking-wide disabled:opacity-50"
                    >
                      {isApplying ? "…" : "Apply"}
                    </button>
                  </form>
                )}
                {discountError && (
                  <p className="text-xs text-destructive mt-2">{discountError}</p>
                )}
              </div>

              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Discount</span>
                  <span className="text-sm">−${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-sm">Total</span>
                <span className="font-semibold">${total.toFixed(2)}</span>
              </div>
              <button
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCheckout}
                disabled={!canCheckout || checkoutLoading}
              >
                {checkoutLoading ? "Redirecting…" : "Checkout"}
              </button>
              {!canCheckout && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Some items in your cart are not linked to Shopify yet.
                </p>
              )}
              {checkoutError && (
                <p className="text-xs text-destructive mt-2 text-center">{checkoutError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;

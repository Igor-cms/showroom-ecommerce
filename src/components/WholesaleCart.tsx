import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import CartQtyField from "./CartQtyField";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { getCustomerCredit } from "@/lib/customerAuth";
import { useCartDiscount } from "@/hooks/useCartDiscount";
import { createShopifyCheckout } from "@/lib/shopifyStorefront";

import type { CartItem } from "@/contexts/CartContext";
import {
  FREE_SHIPPING_COUNTRIES,
  MAX_FREE_SHIPPING_THRESHOLD,
  getFreeShippingStatus,
  getFreeShippingThreshold,
} from "@/lib/freeShipping";

/* Where the customer's shipping destination is remembered when their Shopify
   account has no address yet. Used only to show the free-shipping estimate — it
   is never sent to Shopify, which resolves the real shipping at checkout. */
const SHIPPING_COUNTRY_KEY = "native-shipping-country";

// Cookie helper functions
const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const WholesaleCart = () => {
  const { items, removeFromCart, updateQuantity, getTotalPrice, isCartOpen, setIsCartOpen, markCheckoutStarted } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isTaxIdDialogOpen, setIsTaxIdDialogOpen] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [taxId, setTaxId] = useState("");
  const [noTaxId, setNoTaxId] = useState(false);

  // Logged-in customer's Shopify store credit — fetched automatically and shown
  // in the cart. Display only: the balance is redeemed when the customer logs
  // into their account at the Shopify checkout.
  const { customer } = useCustomerSession();
  const customerEmail = customer?.emailAddress?.emailAddress ?? null;
  const [storeCredit, setStoreCredit] = useState<
    { amount: number; currencyCode: string } | null
  >(null);

  /* Free-shipping progress — shown to EVERYONE, signed in or not. The
     destination comes from the customer's Shopify address; failing that, from a
     country they pick here (remembered locally). When we still don't know where
     they are, we quote the worst case, which is the only figure guaranteed to
     hold for any destination. */
  const [pickedCountry, setPickedCountry] = useState<string>(() => {
    try {
      return window.localStorage.getItem(SHIPPING_COUNTRY_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const accountCountry = customer?.defaultAddress?.country ?? null;
  // The account address wins; the manual pick only fills the gap. Either is
  // ignored unless we actually have a rule for it.
  const hasAccountCountry = getFreeShippingThreshold(accountCountry) != null;
  const shippingCountry = hasAccountCountry
    ? accountCountry
    : getFreeShippingThreshold(pickedCountry) != null
      ? pickedCountry
      : null;
  const subtotal = getTotalPrice();

  /* Discount code — priced by Shopify against these exact lines. */
  const toLines = useCallback(
    (cartItems: CartItem[]) =>
      cartItems.map((item) => ({
        merchandiseId: `gid://shopify/ProductVariant/${item.variantId}`,
        quantity: item.quantity,
      })),
    [],
  );
  const {
    code: discountInput,
    setCode: setDiscountInput,
    isApplying: isApplyingDiscount,
    error: discountError,
    discount,
    discountAmount,
    total: cartTotal,
    applyDiscount,
    removeDiscount,
  } = useCartDiscount(toLines);

  const knownDestination = getFreeShippingStatus(subtotal, shippingCountry);
  // Worst-case fallback so the bar is never missing, only less precise.
  const freeShipping = knownDestination ?? {
    threshold: MAX_FREE_SHIPPING_THRESHOLD,
    remaining: Math.max(0, MAX_FREE_SHIPPING_THRESHOLD - subtotal),
    qualified: subtotal >= MAX_FREE_SHIPPING_THRESHOLD,
  };

  const chooseCountry = (name: string) => {
    setPickedCountry(name);
    try {
      window.localStorage.setItem(SHIPPING_COUNTRY_KEY, name);
    } catch {
      // Storage unavailable: the estimate still works for this session.
    }
  };

  // Look up the balance whenever the cart is open for a logged-in customer.
  useEffect(() => {
    if (!isCartOpen || !customerEmail) {
      setStoreCredit(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        /* No email is sent: the function reads whose balance to fetch from the
           session alone. Passing one in was what let any caller ask for any
           customer's credit. */
        const { ok, data } = await getCustomerCredit();
        if (cancelled) return;
        if (ok && data?.found && data.creditAmount > 0) {
          setStoreCredit({ amount: data.creditAmount, currencyCode: data.currencyCode });
        } else {
          setStoreCredit(null);
        }
      } catch {
        if (!cancelled) setStoreCredit(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCartOpen, customerEmail]);

  // Load saved Tax ID from cookie on component mount
  useEffect(() => {
    const savedTaxId = getCookie('wholesale_tax_id');
    if (savedTaxId) {
      setTaxId(savedTaxId);
    }
  }, []);

  const handleProceedToCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setIsTaxIdDialogOpen(true);
  };

  const handleCheckoutWithTaxId = async () => {
    // If checkbox is checked (no tax ID), show confirmation dialog
    if (noTaxId) {
      setIsTaxIdDialogOpen(false);
      setIsConfirmationDialogOpen(true);
      return;
    }

    // If no tax ID entered and checkbox not checked, require tax ID
    if (!taxId.trim()) {
      toast.error("Please enter your Tax ID or check the box if you don't have one");
      return;
    }

    // Proceed with checkout
    proceedToShopifyCheckout(taxId);
  };

  const handleConfirmNoTaxId = () => {
    setIsConfirmationDialogOpen(false);
    proceedToShopifyCheckout("");
  };

  const handleGoBackToTaxId = () => {
    setIsConfirmationDialogOpen(false);
    setNoTaxId(false);
    setIsTaxIdDialogOpen(true);
  };

  const proceedToShopifyCheckout = async (finalTaxId: string) => {
    setIsCheckingOut(true);
    try {
      // Convert numeric variant IDs to Shopify global ID format
      const lines = items.map((item) => ({
        merchandiseId: `gid://shopify/ProductVariant/${item.variantId}`,
        quantity: item.quantity,
      }));

      // Get country code from first item (all items should have same country)
      const countryCode = items[0]?.countryCode || "US";

      // Shared cart builder: when the buyer is logged in it goes through the
      // server so the Shopify customer identity rides along with the cart
      // (required for customer-restricted discount codes). Otherwise it falls
      // back to the same anonymous Storefront call as before.
      const checkout = await createShopifyCheckout(
        lines,
        discount ? [discount.code] : undefined,
        {
          countryCode,
          attributes: finalTaxId ? [{ key: "tax_id", value: finalTaxId }] : undefined,
        },
      );

      // Save Tax ID to cookie for future use (only if provided)
      if (finalTaxId) {
        setCookie('wholesale_tax_id', finalTaxId, 365);
      }

      // Remember which Shopify cart we sent them to. The cart is NOT cleared
      // here: coming back to add or edit items must keep it intact. It is
      // emptied on return only once Shopify confirms this cart became an
      // order (see CartProvider) — same behaviour as the retail cart.
      markCheckoutStarted(checkout.id);

      // Redirect to Shopify checkout
      window.location.href = checkout.checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to proceed to checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };


  return (
    <>
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 md:h-14 md:w-14 rounded-full shadow-lg bg-wholesale-primary text-white hover:bg-wholesale-primary/90 z-50 active:scale-95 transition-transform"
          >
            <ShoppingCart className="h-6 w-6" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-wholesale-primary">Your Cart</SheetTitle>
          </SheetHeader>

          <div className="mt-8 flex flex-col h-[calc(100%-2rem)]">
            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-wholesale-secondary">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.size}`}
                      className="border border-wholesale-primary/20 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-wholesale-primary text-sm">{item.name}</h3>
                          <p className="text-xs text-wholesale-secondary mt-1">Size: {item.displaySize || item.size}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId, item.size)}
                          className="text-wholesale-secondary hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-2 border border-wholesale-primary/30 rounded-full px-3 py-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                            className="text-wholesale-primary hover:text-wholesale-primary/70 p-1"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <CartQtyField
                            quantity={item.quantity}
                            onChange={(q) => updateQuantity(item.productId, item.size, q)}
                            className="text-sm font-bold text-wholesale-primary w-10"
                          />
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                            className="text-wholesale-primary hover:text-wholesale-primary/70 p-1"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="font-bold text-wholesale-primary text-base">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-wholesale-primary/20 pt-4 pb-6 space-y-4 flex-shrink-0">
                  {storeCredit && (
                    <div className="rounded-lg border border-wholesale-primary/20 p-3">
                      <p className="text-sm text-wholesale-primary">
                        You have{" "}
                        <span className="font-bold">
                          {storeCredit.amount.toFixed(2)} {storeCredit.currencyCode}
                        </span>{" "}
                        in store credit.
                      </p>
                      <p className="text-xs text-wholesale-secondary mt-1">
                        Log in to your account at checkout to apply it.
                      </p>
                    </div>
                  )}
                  {/* Free shipping — shown to every shopper, signed in or not.
                      With a known destination it is that country's threshold;
                      otherwise it falls back to the worst case, which holds for
                      any destination. */}
                  {freeShipping && (
                    <div className="rounded-lg border border-wholesale-primary/20 p-3">
                      {freeShipping.qualified ? (
                        <p className="text-sm font-bold text-wholesale-primary">
                          Your order ships free.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-wholesale-primary">
                            Add{" "}
                            <span className="font-bold">
                              $
                              {freeShipping.remaining.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>{" "}
                            more to get free shipping.
                          </p>
                          <div
                            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-wholesale-primary/15"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={freeShipping.threshold}
                            aria-valuenow={Math.min(getTotalPrice(), freeShipping.threshold)}
                          >
                            <div
                              className="h-full rounded-full bg-wholesale-primary transition-all"
                              style={{
                                width: `${Math.min(100, (getTotalPrice() / freeShipping.threshold) * 100)}%`,
                              }}
                            />
                          </div>
                        </>
                      )}
                      <p className="text-xs text-wholesale-secondary mt-1">
                        {shippingCountry ? (
                          <>
                            Free shipping over $
                            {freeShipping.threshold.toLocaleString("en-US")} to {shippingCountry}.
                          </>
                        ) : (
                          <>
                            Free shipping over $
                            {freeShipping.threshold.toLocaleString("en-US")} to any destination.
                            Tell us where you are — your threshold may be lower.
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Shown whenever the destination did NOT come from the
                      customer's address — so a visitor can set it, and anyone
                      who picked the wrong country can still change it. Hidden
                      only when the account already tells us where they are. */}
                  {!hasAccountCountry && (
                    <div className="rounded-lg border border-wholesale-primary/20 p-3">
                      <Label
                        htmlFor="shipping-country"
                        className="text-sm text-wholesale-primary"
                      >
                        Where are we shipping to?
                      </Label>
                      <p className="text-xs text-wholesale-secondary mt-1 mb-2">
                        {shippingCountry
                          ? "Change it any time — the amount above follows your choice."
                          : "Pick your country for the exact amount left."}
                      </p>
                      <select
                        id="shipping-country"
                        value={pickedCountry}
                        onChange={(e) => chooseCountry(e.target.value)}
                        className="w-full rounded-md border border-wholesale-primary/30 bg-transparent px-2 py-2 text-sm text-wholesale-primary"
                      >
                        <option value="">Select a country…</option>
                        {FREE_SHIPPING_COUNTRIES.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Discount code */}
                  <div className="rounded-lg border border-wholesale-primary/20 p-3">
                    {discount ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-wholesale-primary truncate">
                          Code <span className="font-bold uppercase">{discount.code}</span> applied
                        </p>
                        <button
                          onClick={removeDiscount}
                          className="text-xs text-wholesale-secondary underline shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          applyDiscount(discountInput);
                        }}
                      >
                        <Input
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value)}
                          placeholder="Discount code"
                          aria-label="Discount code"
                          maxLength={64}
                          className="h-10 text-sm uppercase"
                        />
                        <Button
                          type="submit"
                          disabled={isApplyingDiscount}
                          variant="outline"
                          className="h-10 rounded-full border-wholesale-primary/40 text-wholesale-primary"
                        >
                          {isApplyingDiscount ? "..." : "Apply"}
                        </Button>
                      </form>
                    )}
                    {discountError && (
                      <p className="text-xs text-red-600 mt-2">{discountError}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-wholesale-secondary">Subtotal</span>
                      <span className="text-wholesale-primary">${subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-wholesale-secondary">Discount</span>
                        <span className="text-wholesale-primary">
                          &minus;${discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-wholesale-primary">Total:</span>
                      <span className="text-wholesale-primary">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleProceedToCheckout}
                    disabled={isCheckingOut}
                    className="w-full bg-wholesale-primary hover:bg-wholesale-primary/90 text-white rounded-full py-6 text-base font-bold active:scale-95 transition-transform min-h-[48px]"
                  >
                    {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isTaxIdDialogOpen} onOpenChange={setIsTaxIdDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-wholesale-primary text-xl">Tax Information Required</DialogTitle>
            <DialogDescription>Please enter your Tax ID to proceed with the checkout.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tax-id" className="text-wholesale-primary font-medium">
                Tax ID
              </Label>
              <Input
                id="tax-id"
                placeholder="Enter your Tax ID"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                disabled={noTaxId}
                className={cn(
                  "border-wholesale-primary/30 focus:border-wholesale-primary",
                  noTaxId && "bg-gray-100 cursor-not-allowed opacity-60"
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCheckoutWithTaxId();
                  }
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="no-tax-id"
                checked={noTaxId}
                onCheckedChange={(checked) => {
                  setNoTaxId(checked === true);
                  if (checked) setTaxId("");
                }}
                className="border-wholesale-primary/50 data-[state=checked]:bg-wholesale-primary"
              />
              <Label 
                htmlFor="no-tax-id" 
                className="text-sm text-wholesale-secondary cursor-pointer"
              >
                I don't have a Tax ID
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTaxIdDialogOpen(false)}
              className="border-wholesale-primary/30 text-wholesale-primary hover:bg-wholesale-primary/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCheckoutWithTaxId}
              disabled={isCheckingOut}
              className="bg-wholesale-primary hover:bg-wholesale-primary/90 text-white"
            >
              {isCheckingOut ? "Processing..." : "Continue to Checkout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmationDialogOpen} onOpenChange={setIsConfirmationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-wholesale-primary text-xl">
              Are you sure?
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              If you have a Tax ID, we strongly recommend entering it to ensure smooth 
              processing of your wholesale order. Orders without tax documentation may 
              experience delays in delivery.
              <br /><br />
              If you genuinely don't have a Tax ID, you can still proceed with your order.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoBackToTaxId}
              className="border-wholesale-primary/30 text-wholesale-primary hover:bg-wholesale-primary/10"
            >
              Go Back & Add Tax ID
            </Button>
            <Button
              type="button"
              onClick={handleConfirmNoTaxId}
              disabled={isCheckingOut}
              className="bg-wholesale-primary hover:bg-wholesale-primary/90 text-white"
            >
              {isCheckingOut ? "Processing..." : "Continue Without Tax ID"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

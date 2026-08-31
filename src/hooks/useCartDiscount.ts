import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { previewDiscountedCart, type CartLineInput } from "@/lib/shopifyStorefront";

/**
 * Coupon handling shared by the retail and wholesale carts.
 *
 * Shopify is the only source of truth: applying a code prices the current lines
 * on Shopify and we display exactly what it returns. The accepted code is kept
 * in the cart context so the checkout can be created with it, and it is
 * re-validated whenever the lines change (adding an ineligible product, or
 * dropping the eligible one, silently drops a coupon that no longer holds).
 */
export function useCartDiscount(toLines: (items: ReturnType<typeof useCart>["items"]) => CartLineInput[]) {
  const { items, getTotalPrice, discount, setDiscount } = useCart();
  const [code, setCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getTotalPrice();
  const discountAmount = discount ? Math.min(discount.amount, subtotal) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const linesRef = useRef(toLines);
  linesRef.current = toLines;

  const quote = useCallback(
    async (rawCode: string) => {
      const lines = linesRef.current(items);
      if (!lines.length) throw new Error("Your cart is empty.");
      const preview = await previewDiscountedCart(lines, rawCode);
      // Shopify's subtotal already reflects the discount; fall back to the
      // total when a code only shows up there.
      const amount = Math.max(0, Math.max(subtotal - preview.subtotal, subtotal - preview.total));
      return { preview, amount };
    },
    [items, subtotal],
  );

  const applyDiscount = useCallback(
    async (rawCode: string) => {
      const trimmed = rawCode.trim();
      if (!trimmed) {
        setError("Enter a discount code.");
        return;
      }
      setIsApplying(true);
      setError(null);
      try {
        const { preview, amount } = await quote(trimmed);
        if (!preview.applicable) {
          setDiscount(null);
          setError("This code is invalid, expired, or doesn't apply to the items in your cart.");
          return;
        }
        if (amount <= 0) {
          setDiscount(null);
          setError("This code doesn't apply to the items in your cart.");
          return;
        }
        setDiscount({ code: preview.code, amount });
        setCode("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "We couldn't check that code. Try again.");
      } finally {
        setIsApplying(false);
      }
    },
    [quote, setDiscount],
  );

  const removeDiscount = useCallback(() => {
    setDiscount(null);
    setError(null);
  }, [setDiscount]);

  // Keep the applied coupon honest as the cart changes.
  const appliedCode = discount?.code ?? null;
  useEffect(() => {
    if (!appliedCode) return;
    let cancelled = false;
    (async () => {
      try {
        const { preview, amount } = await quote(appliedCode);
        if (cancelled) return;
        if (!preview.applicable || amount <= 0) {
          setDiscount(null);
          setError("Your discount code no longer applies to this cart.");
        } else {
          setDiscount({ code: preview.code, amount });
        }
      } catch {
        // Network hiccup: keep what we have rather than dropping a valid coupon.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCode, items]);

  return {
    code,
    setCode,
    isApplying,
    error,
    discount,
    discountAmount,
    subtotal,
    total,
    applyDiscount,
    removeDiscount,
  };
}

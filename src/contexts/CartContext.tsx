import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getShopifyCartStatus } from '@/lib/shopifyStorefront';

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  countryCode: string;
  displaySize?: string;
}

/* The cart lives in localStorage, not just React state: sending the customer to
   the Shopify checkout is a full page navigation off the SPA, so in-memory state
   is destroyed. Persisting it means they come back to the store with the same
   products, variants and quantities and can keep editing. */
const CART_STORAGE_KEY = 'native-cart';
/* Shopify cart id of the checkout the customer was last sent to. Its presence
   means "a checkout is in flight": on return we ask Shopify whether it became an
   order, and only then empty the local cart. */
const PENDING_CHECKOUT_KEY = 'native-cart-pending-checkout';

const readStoredCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Drop anything that isn't a usable line, so a corrupted/outdated entry
    // can't break the drawer or the checkout payload.
    return parsed.filter(
      (i): i is CartItem =>
        !!i && typeof i.productId === 'string' && typeof i.size === 'string' &&
        typeof i.variantId === 'string' && typeof i.quantity === 'number' && i.quantity > 0,
    );
  } catch {
    return [];
  }
};

const writeStoredCart = (items: CartItem[]) => {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode / quota): the cart still works in memory.
  }
};

const readPendingCheckout = (): string | null => {
  try {
    return window.localStorage.getItem(PENDING_CHECKOUT_KEY);
  } catch {
    return null;
  }
};

const clearPendingCheckout = () => {
  try {
    window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
  } catch {
    /* nothing to clean up */
  }
};

/** A discount code Shopify has confirmed applies to the current cart. */
export interface AppliedDiscount {
  code: string;
  /** How much the code takes off the cart, in the cart's currency. */
  amount: number;
}

/* The applied coupon is persisted alongside the cart so it survives a reload
   and the round trip through the Shopify checkout. */
const DISCOUNT_STORAGE_KEY = 'native-cart-discount';

const readStoredDiscount = (): AppliedDiscount | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DISCOUNT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed.code === 'string' && typeof parsed.amount === 'number') {
      return parsed as AppliedDiscount;
    }
    return null;
  } catch {
    return null;
  }
};

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  /** Called just before redirecting to Shopify, with the cart id being checked out. */
  markCheckoutStarted: (shopifyCartId: string) => void;
  /** Coupon confirmed by Shopify for these exact lines, or null. */
  discount: AppliedDiscount | null;
  setDiscount: (discount: AppliedDiscount | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(readStoredDiscount);

  // Mirror every change to storage so a reload — or the round trip through the
  // Shopify checkout — restores the exact same cart.
  useEffect(() => {
    writeStoredCart(items);
  }, [items]);

  useEffect(() => {
    try {
      if (discount) {
        window.localStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(discount));
      } else {
        window.localStorage.removeItem(DISCOUNT_STORAGE_KEY);
      }
    } catch {
      // Storage unavailable: the coupon still holds for this session.
    }
  }, [discount]);

  const markCheckoutStarted = (shopifyCartId: string) => {
    try {
      window.localStorage.setItem(PENDING_CHECKOUT_KEY, shopifyCartId);
    } catch {
      /* without storage we simply can't auto-clear after the purchase */
    }
  };

  /* Coming back from Shopify: empty the cart ONLY if that checkout actually
     became an order. If the customer merely returned to add or edit items, the
     cart is left untouched. Runs on mount and again on pageshow/visibility,
     because returning via the back button can restore the page from the bfcache
     without ever re-mounting this provider. */
  useEffect(() => {
    let cancelled = false;

    const reconcile = async () => {
      const pendingCartId = readPendingCheckout();
      if (!pendingCartId) return;

      const status = await getShopifyCartStatus(pendingCartId);
      if (cancelled) return;

      if (status === 'completed') {
        setItems([]);
        setDiscount(null);
        writeStoredCart([]);
        clearPendingCheckout();
      }
      // "open": they came back without buying — keep the cart AND the pending
      // marker, so a purchase finished later (e.g. in another tab) still clears.
      // "unknown": the lookup failed; never empty a cart on a failed request.
    };

    reconcile();
    const onPageShow = () => reconcile();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') reconcile();
    };
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (i) => i.productId === item.productId && i.size === item.size
      );

      if (existingItem) {
        return prevItems.map((i) =>
          i.productId === item.productId && i.size === item.size
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }

      return [...prevItems, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (productId: string, size: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => !(item.productId === productId && item.size === size))
    );
  };

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setDiscount(null);
    // Written synchronously as well: callers may clear the cart immediately
    // before a redirect, which can navigate away before the effect above runs.
    writeStoredCart([]);
    clearPendingCheckout();
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        discount,
        setDiscount,
        isCartOpen,
        setIsCartOpen,
        markCheckoutStarted,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

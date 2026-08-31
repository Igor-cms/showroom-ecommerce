import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getCustomer,
  hasStoredSession,
  logout as logoutRequest,
  type Customer,
} from "@/lib/customerAuth";

/**
 * One session, one request, one source of truth.
 *
 * Before this provider every component that cared about the logged-in customer
 * ran its own lookup, so the menu, the cart and the account page could each
 * believe something different, and the header simply had no idea a session
 * existed. Now the session is resolved once at the app root and read from
 * context everywhere.
 */
export interface CustomerContextValue {
  customer: Customer | null;
  /** Still resolving the session (only ever true when a token is stored). */
  loading: boolean;
  /** Server said there is no valid session (or there was never a token). */
  unauthenticated: boolean;
  /** Server-verified sign-in. Never trust this for access control alone. */
  isLoggedIn: boolean;
  /** Best label for the signed-in person: name, else email. */
  displayName: string | null;
  email: string | null;
  /** Re-read the live Shopify customer (e.g. after an admin approves them). */
  refresh: () => Promise<void>;
  /** Ends the Shopify session and clears local state. */
  signOut: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const started = useRef(false);

  const refresh = useCallback(async () => {
    // No stored token => anonymous visitor. Skip the request: it would be a
    // guaranteed 401 that tells us nothing and shows up as a runtime error.
    if (!hasStoredSession()) {
      setCustomer(null);
      setUnauthenticated(true);
      setLoading(false);
      return;
    }
    const res = await getCustomer();
    if (res.status === 401) {
      setCustomer(null);
      setUnauthenticated(true);
    } else if (res.ok && res.data?.customer) {
      setCustomer(res.data.customer);
      setUnauthenticated(false);
    }
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    await logoutRequest();
    setCustomer(null);
    setUnauthenticated(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void refresh();
  }, [refresh]);

  const email = customer?.emailAddress?.emailAddress ?? null;
  const name = (customer?.displayName ?? "").trim();

  const value: CustomerContextValue = {
    customer,
    loading,
    unauthenticated,
    isLoggedIn: !!customer,
    displayName: name || email,
    email,
    refresh,
    signOut,
  };

  return (
    <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
  );
}

/** Safe default so a component rendered outside the provider still works. */
const ANONYMOUS: CustomerContextValue = {
  customer: null,
  loading: false,
  unauthenticated: true,
  isLoggedIn: false,
  displayName: null,
  email: null,
  refresh: async () => {},
  signOut: async () => {},
};

export function useCustomer(): CustomerContextValue {
  return useContext(CustomerContext) ?? ANONYMOUS;
}

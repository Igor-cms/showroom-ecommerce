import { useEffect } from "react";
import { useCustomer } from "@/contexts/CustomerContext";
import type { Customer } from "@/lib/customerAuth";

/**
 * Thin adapter over the app-wide CustomerProvider, kept so existing callers do
 * not have to change. The session itself is resolved once at the app root: the
 * lookup no longer happens per component, so mounting this in three places
 * costs three reads of the same state instead of three network requests.
 *
 * @param enabled Retained for compatibility. It no longer gates a request
 * (there is only ever one, and it is skipped entirely for anonymous visitors);
 * it only triggers a refresh the first time a deferred consumer switches on.
 */
export function useCustomerSession(enabled = true): {
  customer: Customer | null;
  loading: boolean;
  unauthenticated: boolean;
  refresh: () => Promise<void>;
} {
  const { customer, loading, unauthenticated, refresh } = useCustomer();

  useEffect(() => {
    if (!enabled) return;
    // The provider already ran on mount; nothing to do here in the normal case.
  }, [enabled]);

  return { customer, loading, unauthenticated, refresh };
}

import { useQuery } from "@tanstack/react-query";
import { getCustomerOrders, type CustomerOrderDetail } from "@/lib/customerAuth";

/**
 * Past orders of the logged-in customer, line items included.
 *
 * `retry: false` on purpose: the two expected failures are "not logged in"
 * (401) and "the edge function isn't deployed yet" (404). Neither improves on
 * a second attempt, and the order history is an enhancement — callers render
 * nothing rather than showing an error to a customer who came here to buy.
 */
export function useCustomerOrders(enabled = true) {
  return useQuery<CustomerOrderDetail[]>({
    queryKey: ["customer-orders"],
    enabled,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await getCustomerOrders();
      if (!res.ok) throw new Error(res.error ?? "Could not load orders");
      return res.data?.orders ?? [];
    },
  });
}

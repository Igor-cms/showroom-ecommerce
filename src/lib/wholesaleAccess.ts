import { isProfileComplete, type Customer } from "@/lib/customerAuth";

/**
 * The single definition of "may this visitor be inside the wholesale portal".
 *
 * Two pages depend on this answer and MUST agree on it:
 *   - /wholesale-copy sends the visitor to /wholesale-row once it is true.
 *   - /wholesale-row (ProtectedWholesaleRow) sends them back to /wholesale-copy
 *     while it is false.
 * If the two ever computed it differently, a visitor who satisfies one and not
 * the other would be bounced between the pages forever. Keeping it here — one
 * function, imported by both — makes that failure mode impossible rather than
 * merely unlikely.
 *
 * The portal needs BOTH independent states, which is why a Shopify session
 * alone is not enough:
 *   A) wholesale access granted — the `wholesale-approved` tag OR a valid
 *      wholesale password (`passwordOk`);
 *   B) identity confirmed — an active Shopify customer session.
 * plus a complete profile, since the offer list prices against the customer's
 * own shop and country.
 */
export function canEnterWholesalePortal({
  customer,
  passwordOk,
}: {
  customer: Customer | null;
  passwordOk: boolean;
}): boolean {
  // State B: no session means we cannot know who this is, whatever password
  // they hold.
  if (!customer) return false;

  // An explicit admin decision always wins.
  if (customer.wholesaleStatus === "rejected") return false;

  // State A.
  if (!(passwordOk || customer.wholesaleStatus === "approved")) return false;

  return isProfileComplete(customer);
}

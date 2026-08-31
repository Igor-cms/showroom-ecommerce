import { useEffect, useState } from "react";

/**
 * The quantity readout inside a cart line, made typeable.
 *
 * The − / + buttons stay for small nudges, but going from 1 to 20 no longer
 * means twenty clicks: the number itself is an input. Shared by both carts so
 * they cannot drift apart.
 */
interface CartQtyFieldProps {
  quantity: number;
  onChange: (quantity: number) => void;
  className?: string;
}

const CartQtyField = ({ quantity, onChange, className = "" }: CartQtyFieldProps) => {
  /* Held as a string while editing so the field can be emptied mid-typing;
     re-clamping on every keystroke would make multi-digit entry impossible. */
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw.replace(/[^\d]/g, ""), 10);
    // Zero is a legitimate way to clear a line — the cart's own updateQuantity
    // removes the item — but an unparseable entry falls back to the current
    // quantity rather than silently deleting it.
    const next = Number.isFinite(parsed) ? parsed : quantity;
    setDraft(String(next));
    if (next !== quantity) onChange(next);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label="Quantity"
      value={draft}
      onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit(e.currentTarget.value);
          e.currentTarget.blur();
        }
      }}
      title="Type a quantity"
      /* Looked exactly like static text before — no border, no background — so
         nobody could tell it was typeable and everyone clicked the arrows. The
         underline uses currentColor, so it inherits whichever ink the cart it
         sits in already uses, and deepens on hover/focus. */
      className={`bg-transparent outline-none text-center p-0 cursor-text rounded-none border-0 border-b border-current/30 hover:border-current/70 focus:border-current transition-colors ${className}`}
    />
  );
};

export default CartQtyField;

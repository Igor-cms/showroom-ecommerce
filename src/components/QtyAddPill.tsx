import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import useFitText from "./useFitText";

/**
 * The "3 | ADD" pill used on every product card (home, shop, producers,
 * wholesale). The quantity is a real input: buying twenty bags means typing
 * "20" instead of clicking a stepper twenty times.
 *
 * The field and the ADD action share one pill so the control still reads as a
 * single button. Clicking the number only focuses it — it never adds — while
 * pressing Enter there submits, which is what someone typing a quantity
 * expects.
 */
interface QtyAddPillProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  /**
   * Receives the quantity that was just committed. It is passed explicitly
   * because onQuantityChange only *schedules* a state update: reading the
   * parent's `quantity` here would still see the previous value and add 1 when
   * the customer typed 20.
   */
  onAdd: (quantity: number) => void;
  disabled?: boolean;
  /** Shows the post-add confirmation instead of the field. */
  added?: boolean;
  /** Upper bound, when stock is known. */
  max?: number;
  /** "solid" is the beige product pill; "outline" is the Producers island's
   *  transparent, cream-outlined one. */
  variant?: "solid" | "outline";
  /** Label after the divider. Producers uses the longer "ADD TO CART". */
  label?: string;
  /**
   * Outer height in px. It is a prop, and applied inline, because this pill
   * always sits beside a sibling variant pill and the two must agree exactly:
   * the wholesale table's selector is 18px while this one used to derive 16px
   * from its own inner padding, so their outlines never lined up. Passing a
   * height through `className` instead would be decided by stylesheet order
   * rather than attribute order, which is not something a caller can rely on.
   */
  heightPx?: number;
  /**
   * Outer width in px. Omitted, the pill sizes to its content, which is what
   * home, shop and producers want. The wholesale table sets it so every pill
   * in the ORDER column is the same width regardless of how many digits the
   * quantity has; the digits shrink to fit rather than pushing the pill wider.
   */
  widthPx?: number;
  /**
   * Adds − / + either side of the field, the shape the cart already uses.
   *
   * Off by default on purpose. This pill is shared with home, shop and
   * producers, whose pills are content-sized: switching the steppers on there
   * would widen every one of them by ~28px and shift layouts that were tuned
   * to the pixel. The wholesale order table asks for them explicitly.
   */
  showSteppers?: boolean;
  className?: string;
}

const QtyAddPill = ({
  quantity,
  onQuantityChange,
  onAdd,
  disabled = false,
  added = false,
  max,
  variant = "solid",
  label = "ADD",
  heightPx = 16,
  widthPx,
  showSteppers = false,
  className = "",
}: QtyAddPillProps) => {
  const isOutline = variant === "outline";
  const fill = isOutline ? "bg-transparent" : "bg-[#c9c2b2]";
  const hover = isOutline ? "hover:bg-ink/5" : "hover:bg-[#b8b0a0]";
  /* Kept as a string while focused so the field can be emptied mid-typing —
     forcing it back to 1 on every keystroke would make "20" impossible to
     type (clearing "1" would instantly restore it). */
  const [draft, setDraft] = useState(String(quantity));

  /* Both refs are declared before the `added` branch below returns: hooks have
     to run in the same order on every render, so they cannot sit inside it. */
  const fixed = widthPx !== undefined;
  const draftRef = useFitText<HTMLInputElement>(fixed ? draft : null);
  const addedRef = useFitText<HTMLSpanElement>(fixed ? "ADDED" : null);

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw.replace(/[^\d]/g, ""), 10);
    const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    const clamped = max ? Math.min(safe, max) : safe;
    setDraft(String(clamped));
    onQuantityChange(clamped);
    return clamped;
  };

  /* − / + nudge whatever the field currently shows, then hand it to `commit`,
     which is the single place the floor of 1 and the stock ceiling are applied.
     Reading `draft` rather than `quantity` keeps the buttons consistent with a
     number the customer has typed but not yet committed. */
  const step = (delta: number) => {
    if (disabled) return;
    const current = parseInt(draft.replace(/[^\d]/g, ""), 10);
    const base = Number.isFinite(current) ? current : quantity;
    commit(String(base + delta));
  };

  if (added) {
    return (
      <span
        style={{ height: heightPx, width: widthPx }}
        className={`rounded-full border border-ink text-[10px] font-extended px-2 leading-none text-black whitespace-nowrap tracking-wide inline-flex items-center justify-center overflow-hidden ${
          isOutline ? "bg-transparent" : "bg-[#b8b0a0]"
        } ${className}`}
      >
        <span ref={addedRef} className="min-w-0 flex-1 overflow-hidden text-center">
          ADDED ✓
        </span>
      </span>
    );
  }

  return (
    <span
      style={{ height: heightPx, width: widthPx }}
      className={`rounded-full border border-ink text-[10px] font-extended leading-none text-black whitespace-nowrap tracking-wide inline-flex items-center overflow-hidden transition-all ${
        /* At a fixed width the inner padding is trimmed so the digits get the
           room instead — otherwise "120" would have to shrink far below
           legibility just to clear the padding. */
        fixed ? "pl-2" : "pl-3"
      } ${disabled ? "bg-gray-300 cursor-not-allowed" : fill} ${className}`}
    >
      {/* − / + around the field, the same shape the cart already uses. Typing
          stays available: these only nudge the value the field already holds,
          and both go through `commit`, so the max/min clamping is enforced once
          rather than in three places. */}
      {showSteppers && (
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled}
        onClick={() => step(-1)}
        className={`flex shrink-0 items-center justify-center self-stretch px-1 text-[11px] ${
          disabled ? "cursor-not-allowed" : `${hover} active:scale-95`
        }`}
      >
        {/* Lucide icons, not the − and + characters, and for the same reason
            the cart uses them: a glyph is placed by the font's metrics, so it
            lands wherever that font puts it. Measured in this face, the ink
            centre of "−" sits 3.0px above the baseline and "+" 3.5px, while the
            digit beside them sits at 4.5px — which is the 1px of float that
            reads as "not centred". An SVG is centred by its own viewBox, so
            items-center/justify-center place it exactly, in any font. */}
        <Minus className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
      </button>
      )}
      <input
        type="text"
        inputMode="numeric"
        aria-label="Quantity"
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const qty = commit(e.currentTarget.value);
            if (!disabled) onAdd(qty);
          }
        }}
        /* Width tracks the digits so "1" stays as tight as the old label while
           "100" still fits without the pill jumping.

           It must be the CONTENT width and nothing else. This element inherits
           `box-sizing: border-box`, so back when the field also carried the
           pl-3, that 12px of padding was subtracted from the 1ch declared here
           — the content box collapsed to zero and the digit was clipped away
           entirely: the pill read "| ADD" with no quantity in front of it. The
           padding now lives on the wrapper, and the +2px absorbs digits that
           are marginally wider than the `ch` unit's reference "0". */
        ref={draftRef}
        style={fixed ? undefined : { width: `calc(${Math.max(1, draft.length)}ch + 2px)` }}
        className={`bg-transparent border-0 outline-none text-center p-0 text-[10px] leading-none text-black focus:ring-0 ${
          /* Fixed-width pill: the field takes whatever is left rather than
             growing the pill, and useFitText shrinks the digits if they
             outrun it. */
          fixed ? "min-w-0 flex-1" : ""
        }`}
      />
      {showSteppers && (
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled}
        onClick={() => step(1)}
        className={`flex shrink-0 items-center justify-center self-stretch px-1 text-[11px] ${
          disabled ? "cursor-not-allowed" : `${hover} active:scale-95`
        }`}
      >
        <Plus className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
      </button>
      )}
      <span aria-hidden className="px-1 opacity-70">
        |
      </span>
      <button
        type="button"
        onClick={() => onAdd(commit(draft))}
        disabled={disabled}
        /* self-stretch, not vertical padding: the button used to set the
           pill's height itself (py-0.5), which meant a caller passing an
           explicit h-* got a pill whose fill and hover band were shorter than
           its own border. Stretching makes the whole pill the hit area and lets
           the height be decided in one place — the wrapper. */
        className={`flex shrink-0 items-center self-stretch leading-none tracking-wide ${
          fixed ? "pr-2" : "pr-3"
        } ${disabled ? "cursor-not-allowed" : `${hover} active:scale-95`}`}
      >
        {label}
      </button>
    </span>
  );
};

export default QtyAddPill;

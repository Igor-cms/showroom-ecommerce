import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Product } from "../data/products";
import { useCart } from "../contexts/CartContext";
import { hasStoredSession, subscribeBackInStock } from "@/lib/customerAuth";
import { toast } from "@/hooks/use-toast";
import HorizontalPinScroll from "./HorizontalPinScroll";
import AnchoredMenu from "./AnchoredMenu";
import QtyAddPill from "./QtyAddPill";
import useFitText from "./useFitText";
import NotifyBackInStockDialog from "./NotifyBackInStockDialog";

// Readymag reference: the product shot sits in a 308×286 box. Cap the photo to
// that width and to the container height, with width/height auto so it scales
// down proportionally — each photo keeps its own aspect ratio (the source files
// differ: some are wide crops, some square with baked-in white margin).
// maxWidth/maxHeight are applied via Tailwind on the <img> (max-w-… / max-h-full)
// so they can differ per breakpoint. They must NOT be set here: an inline
// maxHeight always beats the class, which is what let the taller photos overflow
// the mobile image slot and get cropped top and bottom by its overflow-hidden.
const PRODUCT_IMAGE_STYLE: CSSProperties = {
  width: "auto",
  height: "auto",
  objectFit: "contain",
};

// The card centres its content, which leaves the first product floating right
// of the section title. Pulling only the first card left lands its photo near
// the section's left edge (~x=44, aligned with the "01 NEW DROPS" heading).
//
// The shift has to track the card width, or a fixed value that aligns on a wide
// screen jams the photo against the viewport edge on a smaller one (the card is
// floored at 400px until ~1428px, then grows with 28vw). Since the image is
// centred, its offset inside the card is (cardW-308)/2 = cardW/2 - 154, and
// cardW/2 = max(14vw, 200px). marginLeft = 44 - offset = 198px - max(14vw,200px)
// keeps the photo at ~x=44 at every width. Desktop only — mobile uses full-width
// cards with native swipe, so no shift there.
const FIRST_CARD_SHIFT_CLASS = "md:ml-[calc(198px_-_max(14vw,200px))]";

/* MOBILE_CARD_RHYTHM — client reference, Iteration 2 PDF p18.
 *
 * The reference is a screenshot of the Readymag mobile page, whose canvas is
 * 320 wide, so every number below is in CSS px on a 320 viewport. They were
 * read two ways that agree: pixel-measured off the PDF's embedded 672×1166
 * screenshot (÷2.0125), and queried off the live Readymag DOM for the values it
 * exposes (product box 218×277 at x=51; nav 8px; section title 25px/40px).
 *
 * Distances are between *ink* (glyph cap top/bottom, photo edge, pill border),
 * not line boxes, because that is what the reference can be measured on:
 *
 *   section divider  ──┐
 *                      │ 28.1
 *   photo top          ┤
 *                      │ 128.7   photo slot (218 wide, ink 197.8 × 128.7)
 *   photo bottom       ┤
 *                      │ 59.1
 *   title cap top      ┤ 6.5 tall  (9px bold)
 *                      │ 2.9
 *   price cap top      ┤ 6.0 tall  (8px)
 *                      │ 11.4
 *   process cap top    ┤ 4.5 tall  (6.5px bold)
 *                      │ 1.5
 *   notes cap top      ┤ 4.5 tall  (6.5px italic)
 *                      │ 24.8
 *   pill top           ┤ 9.4 tall
 *                      │ 37.7
 *   next photo top     ┘            → 305 per card, vs the ~304 pitch RM uses
 *
 * Two deliberate departures. The pills stay at the site's 10px/16px instead of
 * the reference's 9.4px box: that card is a baked screenshot of the DESKTOP card
 * scaled to ~55% (218/400), which puts its pill text at ~4px — unreadable and
 * far under a tappable size, so the 6.6px of extra pill height is absorbed here.
 * And the text column is the reference's 218 (68.1vw) rather than the full
 * viewport, so the tasting-notes line wraps where the reference wraps it.
 *
 * Each value is min(Xvw, cap): it scales with the viewport exactly as the 320
 * design does, and the cap freezes it at the 430px-wide equivalent so the tablet
 * end of the mobile range (up to 767px) does not keep inflating.
 */

/* The card's buttons, sized once instead of by their own labels.

   Same rule as the wholesale table: a fixed width so the controls read as one
   consistent set, with the type giving way when a label is too long. The
   figures differ from wholesale's because the space does — a card has ~312px
   of usable row at the narrowest, against 174px for a table cell — but the
   height and the 10px base are deliberately identical across both.

   SELECT_W is set by the one label in the catalogue that has to shrink at all:
   "250G / UNITED STATES - $17", which with its chevron needs 102px of room even
   at the 7px floor, so 148 leaves it 104. Every other label is ~70px of text
   and stays at the full 10px. */
const CONTROL_H = 16;
const SELECT_W = 148;
const ADD_W = 66;
const CONTROL_GAP = 6;
/* NOTIFY and MORE COMING SOON stand in for the qty pill ONLY — the variant
   selector stays beside them — so they are a second slot, not a span of both.
   (The wholesale table is the opposite: there, MORE COMING SOON replaces the
   pair.) 200 is the widest that still lets SELECT_W + gap + this fit the 355px
   card row, so the two keep sitting side by side; it also happens to be almost
   exactly what "NOTIFY ME WHEN BACK IN STOCK" needs, so it stays at 10px while
   the shorter "SAVING…" and "WE'LL EMAIL YOU ✓" no longer resize the button
   mid-flow. */
const NOTIFY_W = 200;

const statusLabel: Record<Product["status"], string | null> = {
  available: null,
  sold_out: null,
  coming_soon: "COMING SOON",
};

/* Which coffees this browser has already signed up for. Kept locally so the
   "we'll email you" confirmation survives a reload — the authoritative record
   is the stock_notify_signups row, and the server treats a repeat signup as a
   no-op either way. */
const NOTIFY_STORAGE_KEY = "back-in-stock-signups";

const readNotifiedHandles = (): string[] => {
  try {
    const raw = localStorage.getItem(NOTIFY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const rememberNotifiedHandle = (handle: string) => {
  try {
    const next = new Set(readNotifiedHandles());
    next.add(handle);
    localStorage.setItem(NOTIFY_STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // Storage unavailable (private mode) — the signup still saved server-side.
  }
};

interface NewDropCardProps {
  product: Product;
  index: number;
}

const NewDropCard = ({ product, index }: NewDropCardProps) => {
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedWeight, setSelectedWeight] = useState(product.defaultWeight);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const weightLabelRef = useFitText<HTMLSpanElement>(selectedWeight);

  /* "checking" and "saving" are both "request in flight" — they differ only in
     what the button says. See handleNotify. */
  const [notifyState, setNotifyState] = useState<"idle" | "checking" | "saving" | "done">(() =>
    readNotifiedHandles().includes(product.id) ? "done" : "idle",
  );
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  /* Declared here, not up with the other refs: it keys off notifyState, whose
     `const` is only initialised on the line above. */
  const notifyLabelRef = useFitText<HTMLSpanElement>(notifyState);

  const isDisabled = product.status !== "available";

  /* Year-round coffees (tagged in Shopify) restock routinely, so running out is
     temporary — they show "MORE COMING SOON" rather than collecting signups. */
  const showNotify = product.status === "sold_out" && !product.isYearRound;

  const markNotified = () => {
    rememberNotifiedHandle(product.id);
    setNotifyState("done");
  };

  /* No session check on render: /shop draws 20+ cards and checking each would
     fire 20+ account requests. The server reads the session from the request
     and tells us whether it still needs an email.

     The label, though, must not claim to be saving when it isn't: without a
     session this same request only resolves who you are and then opens the
     dialog, so "SAVING…" would flash over a step that saved nothing. A stored
     session id is a local read (no network, safe for every card) and tells us
     which of the two is about to happen. It is only a hint — an expired token
     still comes back as needsEmail — but it is right whenever it matters, and
     being wrong costs a brief label, never a wrong outcome. */
  const handleNotify = async () => {
    if (notifyState !== "idle") return;
    setNotifyState(hasStoredSession() ? "saving" : "checking");

    const res = await subscribeBackInStock({
      productHandle: product.id,
      productTitle: product.title,
    });

    if (res.data?.needsEmail) {
      setNotifyState("idle");
      setNotifyDialogOpen(true);
      return;
    }

    if (!res.ok || res.data?.error) {
      setNotifyState("idle");
      toast({
        title: "Couldn't sign you up",
        description: res.data?.error ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }

    markNotified();
  };

  const currentPrice = product.priceByWeight?.[selectedWeight] ?? product.price;
  const hasMultipleWeights = (product.weights?.length ?? 0) > 1;

  const handleAdd = (qty: number = quantity) => {
    if (isDisabled) return;
    const variantId =
      product.variantIdByWeight?.[selectedWeight] ?? `${product.id}-${selectedWeight}`;
    addToCart({
      productId: product.id,
      variantId,
      name: product.title,
      size: selectedWeight,
      price: currentPrice,
      quantity: qty,
      countryCode: "US",
      displaySize: selectedWeight,
    });
    setAdded(true);
    setIsCartOpen(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const selectWeight = (w: string) => {
    setSelectedWeight(w);
    setWeightOpen(false);
  };

  return (
    <article
      data-card-root
      // md:min-w floors the card at its full-page proportion: on reduced widths
      // it keeps the same size and simply shows fewer per view (horizontal
      // scroll) instead of squeezing 3 in and colliding the buttons.
      // Mobile pt/pb split the 37.7px the reference leaves between one card's
      // buttons and the next card's photo: 28.1 above the photo (which is also
      // exactly the gap the reference puts between the section divider and the
      // FIRST photo) and 9.6 below the buttons. See MOBILE_CARD_RHYTHM.
      className={`snap-start shrink-0 flex flex-col items-center justify-center w-full md:w-[28vw] md:min-w-[400px] max-md:pt-[min(8.78vw,37.8px)] md:pt-1 max-md:pb-[min(3vw,12.9px)] md:pb-4 ${index === 0 ? FIRST_CARD_SHIFT_CLASS : ""}`}
    >

      {/* ── Image — fluid height so it never pushes content off-screen ── */}
      <div
        data-card-layer="image"
        /* Mobile had no height cap (h-auto) plus 64+72px of margin, so a tall
           source photo made each card ~1745px. The slot is now the reference's
           128.7px-tall photo band; the card's own pt supplies the space above it
           and mb the 59.1px the reference leaves below. See MOBILE_CARD_RHYTHM.
           The RM box is 218×277, but that 277 is the whole card baked into one
           image — photo, text and pills — not the photo band alone. */
        /* Desktop margins trimmed (8->4 above, 56->28 below) so the card is
           more compact, as in the mockup. The mobile values are left alone:
           they are calibrated against the reference canvas above. */
        className="relative overflow-hidden mx-auto flex items-center justify-center shrink-0 h-[min(40.3vw,173px)] md:h-[260px] md:mt-[4px] mb-[min(15.4vw,66px)] md:mb-[28px]"
        style={{
          width: "100%",
        }}
      >
        <img
          src={product.image}
          alt={product.title}
          /* RM mobile box is 218 wide on the 320 canvas (68%). max-h-full keeps
             the photo inside the slot: our bags are wider than 218/128.7, so
             they end up height-limited and land at the reference's ~198 width. */
          className="object-contain rounded-md mx-auto max-h-full max-w-[min(68vw,292px)] md:max-w-[308px]"
          style={PRODUCT_IMAGE_STYLE}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        {isDisabled && statusLabel[product.status] && (
          <div className="absolute top-3 left-3">
            <span className="text-[10px] tracking-widest font-medium bg-ink text-bg-cream px-2 py-1">
              {statusLabel[product.status]}
            </span>
          </div>
        )}
        <div className="absolute bottom-3 right-3 text-[10px] tracking-widest text-bg-cream/50 font-mono select-none">
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>

      {/* ── Description area — fixed reserved height with title+price pinned to
          the top and process+notes pinned to the bottom (justify-between). That
          keeps every card's title on one line and its process/notes lines on
          another, aligned across cards, regardless of how many lines the title
          or process wrap to. Height covers the tallest case (2-line title +
          2-line process + notes). ── */}
      {/* max-md:px-[16vw] narrows the text column to the reference's 218 of the
          320 canvas, so the tasting-notes line wraps where the reference does. */}
      <div className="flex flex-col items-center justify-between text-center w-full max-md:px-[16vw] md:px-6 pt-2 md:pt-1 pb-0 md:min-h-[64px]">

        {/* Title + price — tightly grouped */}
        <div className="flex flex-col items-center gap-0">
          {/* Title */}
          {/* Sizes live in classes (not inline) so the md: values can override
              them — an inline fontSize would always win over a class. */}
          <h3
            data-card-layer="title"
            /* Reference: ~9px on the 320 canvas ⇒ 2.8vw. Ours ran at 15px. The
               leading is tight (10px at 320) because the reference leaves only
               2.9px between the title's cap bottom and the price's cap top —
               a 14.6px line box on both cannot close up that far. */
            className="uppercase text-[min(2.8vw,12px)] leading-[min(3.13vw,13.4px)] md:text-[12px] md:leading-[14px]"
            style={{
              fontFamily: "custom_75141, Helvetica, Arial, sans-serif",
              fontWeight: 700,
              letterSpacing: "-0.3px",
            }}
          >
            {product.title}
          </h3>

          {/* Weight options + price */}
          <p
            data-card-layer="price"
            className="text-foreground uppercase text-[min(2.5vw,10.7px)] leading-[min(3.13vw,13.4px)] md:text-[11px] md:leading-[13px]"
            style={{
              fontFamily: "custom_75139, Helvetica, Arial, sans-serif",
              fontWeight: 400,
              letterSpacing: "-0.3px",
            }}
          >
            {product.weights.map((w, wi) => {
              const wp = product.priceByWeight?.[w] ?? product.price;
              const isLast = wi === product.weights.length - 1;
              return (
                <span key={w}>
                  <span style={{ fontFamily: "custom_75141, Helvetica, Arial, sans-serif", fontWeight: 700 }}>
                    {w.toUpperCase()}
                  </span>
                  <span style={{ fontWeight: 400, fontFamily: "custom_75139, Helvetica, Arial, sans-serif" }}>
                    {" "}- ${wp}{isLast ? "" : " | "}
                  </span>
                </span>
              );
            })}
          </p>
        </div>

        {/* Process + tasting notes — always rendered (even when empty) and
            pinned to the bottom of the reserved area, so the notes line lands on
            the same baseline across every card and the process line sits just
            above it, aligned. */}
        {(
          <div className="flex flex-col items-center gap-0 w-full mt-[min(2.06vw,8.9px)] md:mt-0">
            {/* Process */}
            {product.process && (
              <p
                data-card-layer="process"
                // Same size as the tasting notes below it on desktop — the two
                // read as one block (process was 13px against the notes' 8px).
                /* Reference: 6.5px on the 320 canvas (this ran at 8px, which
                   read as a second title line rather than a caption). */
                className="uppercase text-foreground text-[min(2.03vw,8.7px)] leading-[min(2.5vw,10.7px)] md:text-[9px] md:leading-[12px]"
                style={{
                  fontFamily: "custom_75141, Helvetica, Arial, sans-serif",
                  fontWeight: 700,
                  letterSpacing: "-0.2px",
                }}
              >
                {product.process}
              </p>
            )}

            {/* Tasting notes */}
            {product.tastingNotes && product.tastingNotes.length > 0 && (
              <p
                data-card-layer="notes"
                className="uppercase text-foreground text-[min(2.03vw,8.7px)] leading-[min(2.5vw,10.7px)] md:text-[9px] md:leading-[12px]"
                style={{
                  fontFamily: "custom_75142, Helvetica, Arial, sans-serif",
                  fontWeight: 400,
                  fontStyle: "italic",
                  letterSpacing: "-0.14px",
                }}
              >
                {product.tastingNotes.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Interaction area ── */}
      <div
        data-card-layer="buttons"
        /* Kept at px-6 rather than narrowed to the text column's 218: the
           reference puts the weight pill and ADD side by side on one row, and at
           our pill size (see MOBILE_CARD_RHYTHM) 218 is too narrow for both, so
           they wrapped. The card's own pb closes the gap to the next photo. */
        className="flex flex-wrap items-center gap-1.5 px-6 max-md:pb-0 md:pb-2 pt-[min(7.25vw,31px)] md:pt-[10px] w-full max-w-full justify-center"
      >
        {/* `flex`, not a plain block: the pill is inline-flex, so a block wrapper
            gives it a line box (24px from the inherited 16px/1.5 body type) and
            baseline-shifts it 5px down — which offset the whole button row from
            where MOBILE_CARD_RHYTHM puts it and padded the card 8px taller. */}
        <div className="relative flex">
          <button
            ref={pillRef}
            type="button"
            onClick={() => hasMultipleWeights && setWeightOpen((o) => !o)}
            aria-haspopup={hasMultipleWeights ? "listbox" : undefined}
            aria-expanded={hasMultipleWeights ? weightOpen : undefined}
            style={{ height: CONTROL_H, width: SELECT_W }}
            className={`rounded-full border border-ink text-[10px] font-extended leading-none bg-[#f5f0e6] text-black whitespace-nowrap tracking-wide transition-opacity hover:opacity-60 inline-flex items-center ${
              hasMultipleWeights ? "pl-3 pr-2 gap-1" : "px-3"
            }`}
          >
            {/* min-w-0 + overflow-hidden gives this a measurable box; a bare
                inline span reports clientWidth 0 and cannot be fitted. */}
            <span ref={weightLabelRef} className="min-w-0 flex-1 overflow-hidden text-center">
              {selectedWeight.toUpperCase()} - ${currentPrice}
            </span>
            {hasMultipleWeights && (
              <ChevronDown
                size={16}
                strokeWidth={2.25}
                className={`shrink-0 text-gray-500 -my-[3px] transition-transform ${weightOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            )}
          </button>

          {/* Opens DOWNWARD via a body-level portal so it stays IN FRONT of the
              next section instead of being clipped by the carousel track. */}
          <AnchoredMenu anchorRef={pillRef} open={weightOpen && hasMultipleWeights} onClose={() => setWeightOpen(false)}>
            <div
              role="listbox"
              className="overflow-hidden rounded-2xl border border-ink bg-[#f5f0e6] py-1 shadow-lg"
            >
              {product.weights.map((w) => {
                const wp = product.priceByWeight?.[w] ?? product.price;
                return (
                  <button
                    key={w}
                    type="button"
                    role="option"
                    aria-selected={w === selectedWeight}
                    onClick={() => selectWeight(w)}
                    className={`block w-full whitespace-nowrap px-3 py-1 text-left text-[10px] font-extended text-black transition-colors hover:bg-[#e7dfce] ${
                      w === selectedWeight ? "bg-[#e7dfce]" : ""
                    }`}
                  >
                    {w.toUpperCase()} - ${wp}
                  </button>
                );
              })}
            </div>
          </AnchoredMenu>
        </div>

        {showNotify ? (
          <button
            type="button"
            onClick={handleNotify}
            disabled={notifyState !== "idle"}
            style={{ height: CONTROL_H, width: NOTIFY_W }}
            className={`rounded-full border border-ink text-[10px] font-extended px-3 leading-none text-black whitespace-nowrap tracking-wide transition-all inline-flex items-center justify-center overflow-hidden ${
              notifyState === "done"
                ? "bg-[#b8b0a0] cursor-default"
                : "bg-gray-300 hover:bg-gray-400 active:scale-95 disabled:opacity-60"
            }`}
          >
            <span ref={notifyLabelRef} className="min-w-0 flex-1 overflow-hidden text-center">
            {/* "checking" deliberately keeps the original label: the button is
                disabled against a double-click, but nothing is being saved yet. */}
            {notifyState === "done"
              ? "WE'LL EMAIL YOU ✓"
              : notifyState === "saving"
              ? "SAVING…"
              : "NOTIFY ME WHEN BACK IN STOCK"}
            </span>
          </button>
        ) : product.status === "sold_out" ? (
          // Year-round coffee that's temporarily out — no signup, it's coming back.
          <button
            type="button"
            disabled
            style={{ height: CONTROL_H, width: NOTIFY_W }}
            className="inline-flex items-center justify-center rounded-full border border-ink text-[10px] font-extended px-3 leading-none text-black whitespace-nowrap tracking-wide bg-gray-300 cursor-not-allowed"
          >
            MORE COMING SOON
          </button>
        ) : (
          <QtyAddPill
            heightPx={CONTROL_H}
            widthPx={ADD_W}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onAdd={handleAdd}
            disabled={isDisabled}
            added={added}
          />
        )}
      </div>

      {/* Only mounted for coffees that can collect signups. Radix portals it to
          the body, so the carousel's clipped track doesn't cut it off. */}
      {showNotify && (
        <NotifyBackInStockDialog
          open={notifyDialogOpen}
          onOpenChange={setNotifyDialogOpen}
          productHandle={product.id}
          productTitle={product.title}
          onSubscribed={markNotified}
        />
      )}
    </article>
  );
};


interface NewDropsSectionProps {
  products: Product[];
  /** Optional content rendered at the right of the header row (e.g. category nav). */
  headerRight?: ReactNode;
  /** Section heading title. Defaults to "NEW DROPS". */
  title?: string;
  /** Two-digit index shown before the title. Defaults to "01". */
  indexLabel?: string;
  /** DOM id applied to the section, used as a scroll anchor target. */
  sectionId?: string;
  /** When true, the section title sticks under the fixed header and is pushed
   *  out by the next section's title during scroll (used on the Shop page). */
  stickyHeader?: boolean;
  /** When true, the section dims slightly while the cursor is over it (active
   *  horizontal-scroll target). Used on the Shop page. */
  highlightActive?: boolean;
  /** When false, the large "01 NEW DROPS" section heading is not rendered.
   *  The Shop page uses this so the selected section is shown only by the
   *  category nav highlight, with no separate/oversized title line. */
  showTitle?: boolean;
  /** When true, the (non-sticky) section title gets a full-width divider line
   *  below it — used on Shop so each section in the body is marked by a line
   *  with just its name. */
  titleDivider?: boolean;
  /** When true, the inline title bar is rendered (and keeps its space) but is
   *  visually hidden — used when the page-level fixed active bar is currently
   *  sitting on top of this section, preventing visible duplication. */
  inlineTitleHidden?: boolean;
}

const NewDropsSection = ({
  products,
  headerRight,
  title = "NEW DROPS",
  indexLabel = "01",
  sectionId,
  stickyHeader = false,
  highlightActive = false,
  showTitle = true,
  titleDivider = false,
  inlineTitleHidden = false,
}: NewDropsSectionProps) => {
  if (!products || products.length === 0) return null;

  const cards = (
    <>
      {products.map((product, i) => (
        <NewDropCard key={product.id} product={product} index={i} />
      ))}
      <div className="shrink-0 w-[8vw] lg:w-[5vw]" aria-hidden />
    </>
  );

  const header = (
    <div style={inlineTitleHidden ? { visibility: "hidden" } : undefined}>
      {/* Mobile size/tracking come from the reference: 25px on the 320 canvas in
          a 40px row, and -1px of tracking (the desktop -2.4px is -0.06em, which
          at 25px would pull "01 NEW DROPS" 17px narrower than the reference).
          These must stay in step with TITLE_FONT_MOBILE / TITLE_TRACKING_MOBILE
          in Shop.tsx — the fixed bar renders the same line for the active
          section while this one is hidden underneath it. */}
      {/* max-md pl is the shared 7px mobile inset (MOBILE_BAND_EDGE): the
          reference starts the section title at x 6.5–7.2, and pl-14 left it at
          15 — a 7px step between the header above and everything under it. */}
      <div className={`flex items-center max-md:gap-[6px] md:gap-3 max-md:pl-[7px] md:pl-[14px] pr-6 ${stickyHeader ? "py-1" : titleDivider ? "py-0 mb-0 md:mb-2 border-y-2 max-md:border-y border-ink/40" : "max-md:pt-[6px] md:pt-4 mb-2"}`}>
        <span
          className="uppercase text-[25px] md:text-[40px] leading-[36px] md:leading-[56px] tracking-[-1px] md:tracking-[-2.4px]"
          style={{
            fontFamily: "Helvetica, Arial, sans-serif",
            fontWeight: 700,
          }}
        >
          {indexLabel}
        </span>
        <h2
          className="uppercase text-[25px] md:text-[40px] leading-[36px] md:leading-[56px] tracking-[-1px] md:tracking-[-2.4px]"
          style={{
            fontFamily: "Helvetica, Arial, sans-serif",
            fontWeight: 400,
          }}
        >
          {title}
        </h2>
        {headerRight && <div className="flex-1 self-center min-w-0">{headerRight}</div>}
      </div>
    </div>
  );


  // When the big section heading is suppressed (Shop page), render a small
  // non-sticky spacer instead so the first product row keeps a little breathing
  // room under the fixed header/category nav — without a separate title line.
  const spacer = <div aria-hidden style={{ height: 12 }} />;

  return (
    <section id={sectionId} style={{ scrollMarginTop: "var(--site-header-h, 110px)" }}>
      {/* Pinned horizontal scroll (desktop) / native swipe (mobile) */}
      <HorizontalPinScroll
        heightVh={100}
        header={showTitle ? header : spacer}
        stickyHeader={stickyHeader && showTitle}
        highlightActive={highlightActive}
      >
        {cards}
      </HorizontalPinScroll>
    </section>
  );
};

export default NewDropsSection;

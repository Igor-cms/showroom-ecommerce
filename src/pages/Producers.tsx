import { Fragment, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronDown } from "lucide-react";
import WholesaleHeader from "../components/WholesaleHeader";
import AnchoredMenu from "../components/AnchoredMenu";
import { useShopifyStorefrontProducts } from "../hooks/useShopifyStorefrontProducts";
import { mockProducts } from "../data/products";
import { useCart } from "../contexts/CartContext";
import CartDrawer from "../components/CartDrawer";
import FloatingCartToggle from "../components/FloatingCartToggle";
import SignupBar from "../components/SignupBar";
import SiteFooterBar from "../components/SiteFooterBar";
import QtyAddPill from "../components/QtyAddPill";

/* A coffee row as rendered inside a producer's MY COFFEES island. */
interface CoffeeItem {
  /** Stable unique id (Shopify handle) — used for React keys and cart. */
  id: string;
  name: string;
  process: string;
  notes: string;
  price: string;
  weight: string;
  weights: string[];
  priceByWeight?: Record<string, number>;
  /** Shopify variant GID per weight, for a real checkout line item. */
  variantIdByWeight?: Record<string, string>;
  basePrice: number;
  image: string;
}

/* Left pill on each coffee card: a size selector (dropdown) + its price.
   Replaces the old static weight/price span so every producer coffee — like
   the ones on home/shop — lets you pick the size. Opens DOWNWARD under the
   pill. */
const CoffeeSizePill = ({
  coffee,
  selected,
  onSelect,
}: {
  coffee: CoffeeItem;
  /** Controlled by the parent CoffeeCard so ADD TO CART knows the size. */
  selected: string;
  onSelect: (w: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const hasMultiple = coffee.weights.length > 1;
  const priceOf = (w: string) => `$${coffee.priceByWeight?.[w] ?? coffee.basePrice}`;

  return (
    <div className="relative h-[15px] flex items-center">
      <button
        ref={pillRef}
        type="button"
        onClick={() => hasMultiple && setOpen((o) => !o)}
        aria-haspopup={hasMultiple ? "listbox" : undefined}
        aria-expanded={hasMultiple ? open : undefined}
        className="rounded-full border border-ink text-[10px] px-1.5 h-[15px] bg-transparent text-black whitespace-nowrap tracking-wide inline-flex items-center justify-center gap-0.5"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Mockup shows the weight only on the closed pill; prices stay
            visible inside the dropdown options. */}
        <span className="uppercase">{selected}</span>
        {hasMultiple && (
          <ChevronDown
            size={10}
            strokeWidth={2.25}
            className={`shrink-0 text-black/50 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        )}
      </button>

      {/* Opens DOWNWARD via a body-level portal so it escapes the island's
          overflow/scale and floats in front of everything below. */}
      <AnchoredMenu anchorRef={pillRef} open={open && hasMultiple} onClose={() => setOpen(false)}>
        <div
          role="listbox"
          className="overflow-hidden rounded-xl border border-ink bg-[#f5f0e6] py-1 shadow-lg"
        >
          {coffee.weights.map((w) => (
            <button
              key={w}
              type="button"
              role="option"
              aria-selected={w === selected}
              onClick={() => {
                onSelect(w);
                setOpen(false);
              }}
              className={`block w-full whitespace-nowrap px-3 py-1 text-left text-[10px] text-black transition-colors hover:bg-[#e7dfce] ${
                w === selected ? "bg-[#e7dfce]" : ""
              }`}
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {w} - {priceOf(w)}
            </button>
          ))}
        </div>
      </AnchoredMenu>
    </div>
  );
};

/* A single MY COFFEES card: image, name, sensory, size selector + ADD TO CART.
   Holds the selected weight so the ADD button commits the right variant to the
   shared cart (client PDF: the buy button must actually add the coffee). */
const CoffeeCard = ({ coffee, index }: { coffee: CoffeeItem; index: number }) => {
  const { addToCart, setIsCartOpen } = useCart();
  const [selected, setSelected] = useState(coffee.weight);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAdd = (qty: number = quantity) => {
    addToCart({
      productId: coffee.id,
      variantId: coffee.variantIdByWeight?.[selected] ?? `${coffee.id}-${selected}`,
      name: coffee.name,
      size: selected,
      price: coffee.priceByWeight?.[selected] ?? coffee.basePrice,
      quantity: qty,
      countryCode: "US",
      displaySize: selected,
    });
    setAdded(true);
    setIsCartOpen(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className={`flex flex-col items-center text-center px-3 py-4 ${
        index % 2 === 0 ? "border-r-2 border-ink/40" : ""
      } ${index >= 2 ? "border-t-2 border-ink/40" : ""}`}
    >
      {/* No backdrop fill: the Shopify PNGs are transparent and must read that
          way (client feedback — matches home/shop). */}
      <div className="w-44 h-32 shrink-0 overflow-hidden mb-1 flex items-center justify-center">
        <img
          src={coffee.image}
          alt={coffee.name}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>
      {/* Variable text block between the fixed photo and the fixed buttons. */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-end overflow-hidden pb-1">
        <p className="uppercase font-bold" style={{ fontSize: "13px", letterSpacing: "0.03em", fontFamily: RM_BOLD }}>
          {coffee.name}
        </p>
        {/* Client feedback: sensory notes under the name (not process/varietal),
            in custom_75142 (Helvetica Oblique). */}
        <p
          className="italic text-black/70 mt-1"
          style={{ fontSize: "9.5px", lineHeight: 1.35, fontFamily: RM_ITALIC }}
        >
          {coffee.notes}
        </p>
      </div>
      <div className="flex items-center gap-1.5 mt-2 shrink-0">
        <CoffeeSizePill coffee={coffee} selected={selected} onSelect={setSelected} />
        {/* RM/mockup: cream-outlined pill. Now wired to the shared cart, with
            the quantity typeable instead of fixed at 1. */}
        <QtyAddPill
          quantity={quantity}
          onQuantityChange={setQuantity}
          onAdd={handleAdd}
          added={added}
          variant="outline"
          label="ADD TO CART"
          /* Matches CoffeeSizePill beside it, which is also h-[15px]. Moved off
             className so it is not overridden by the pill's inline height. */
          heightPx={15}
        />
      </div>
    </div>
  );
};

/* =========================================================================
 *  /producers  —  faithful replica of the Readymag "Producers" scene.
 *
 *  The scene is one fixed 100vh viewport (no page scroll). Scrolling the
 *  mouse wheel / trackpad inside the scene is converted into a `progress`
 *  value 0→1 that pans the panorama left, fades Diego out down-left, and
 *  fades Diana in from the right (horizontal pointer drag still works as a
 *  secondary control). When scrolling stops — or on pointer release —
 *  progress snaps to the nearest endpoint (0 or 1) with an ease-out
 *  animation. Each producer's three hotspot buttons
 *  travel with their portrait. Clicking a button slides in a left-side
 *  panel (INTERVIEW + topics, HOT TAKES, or MY COFFEES).
 * ========================================================================= */

type PanelKey = "story" | "interview" | "coffees" | null;
/* The three producers of the scene, in visit order (client: "Add Allan after
   Diana"). Allan's cutout was extracted from the client's Readymag project. */
type ProducerKey = "diego" | "diana" | "allan";

const BG_PANORAMA = "/producers/background-mist.webp";
const DIEGO_IMG = "/producers/diego-rm.webp";
const DIANA_IMG = "/producers/diana-rm.webp";
const ALLAN_IMG = "/producers/allan-rm.webp";

const TOPICS = [
  "WHAT'S NOT WORKING IN SPECIALITY COFFEE?",
  "WHY ARE YOU ALWAYS PUSHING BOUNDARIES?",
  "WHAT IS THE MOST DIFFICULT PART OF BEING A PRODUCER?",
  "HOW WOULD THE CLOSEST PERSON IN YOUR LIFE DESCRIBE YOU?",
  "WHAT IS YOUR FIRST MEMORY DRINKING COFFEE?",
  "WHAT DO YOU WISH PEOPLE KNEW ABOUT YOUR EXPERIENCE?",
  "WHO IS SOMEONE YOU WANT TO BE LIKE AND WHY?",
  "WHAT DO PEOPLE NEED TO BE REMINDED OF?",
];

/* Accent-insensitive, case-insensitive normaliser so a producer's surname matches
   regardless of how the Producer field is cased/accented in Shopify
   (e.g. "DIEGO BERMÚDEZ" / "Diego Bermudez"). */
const normalizeProducer = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();

/* Display-only cleanup for the COFFEES cards: Shopify titles arrive with
   workflow prefixes/suffixes ("NEW - WHOLESALE - GOLDEN HOUR - DIEGO BERMUDEZ
   - COLOMBIA"); the mockup shows just the coffee name ("GOLDEN HOUR"). Strips
   known noise segments, never touching the actual name. */
const cleanCoffeeTitle = (title: string, producer?: string) => {
  const NOISE = new Set(["NEW", "WHOLESALE", "COLOMBIA", "PANAMA", "PANAMÁ"]);
  const prod = producer ? normalizeProducer(producer) : "";
  const parts = title.split(/\s+-\s+/).filter((seg) => {
    const s = normalizeProducer(seg);
    if (!s) return false;
    if (NOISE.has(s)) return false;
    if (prod && (prod.includes(s) || s.includes(prod))) return false;
    return true;
  });
  return (parts.length ? parts.join(" - ") : title).trim();
};

const HOT_TAKES_BY = {
  diego: [
    "Processing is where the magic happens — varietal matters, but technique unlocks the cup.",
    "If we don't experiment, the next generation has nothing to inherit.",
    "Coffee is a science — fermentation, not luck.",
  ],
  diana: [
    "Behind every great cup is a community — the producer is just the visible part.",
    "Sustainability isn't a label, it's a daily decision.",
    "Specialty coffee should pay specialty wages, period.",
  ],
};

/* MY STORY slideshow — main image + thumbnail strip (client mockup). Slides
   are per-producer; captions optional (serif overlay on the main image).
   ONE placeholder slide per producer until the client sends the real story
   photos — the thumbnail strip only renders when there is more than one
   slide, so the panel never shows the same portrait repeated. */
const STORY_SLIDES: Record<ProducerKey, { src: string; caption?: string }[]> = {
  /* Diego's five story photos extracted from the client's Readymag design
     (preview page 5 — the captions are baked into the photos themselves). */
  diego: [
    { src: "/producers/diego-story-1.webp" },
    { src: "/producers/diego-story-2.webp" },
    { src: "/producers/diego-story-3.webp" },
    { src: "/producers/diego-story-4.webp" },
    { src: "/producers/diego-story-5.webp" },
  ],
  /* Diana/Allan: the client's design has no story photos for them yet — one
     placeholder keeps the thumbnail strip hidden until their sets land. */
  diana: [{ src: "/producers/diana-hartmann.png" }],
  allan: [{ src: ALLAN_IMG }],
};

/* RM's Readymag fonts (loaded in index.css from the project export). */
const RM_TEXT = "'custom_75139', Helvetica, Arial, sans-serif";
const RM_BOLD = "'custom_75141', Helvetica, Arial, sans-serif";
const RM_ITALIC = "'custom_75142', Helvetica, Arial, sans-serif";

/* MY STORY body copy, one string per paragraph. Diego's paragraphs are copied
   verbatim from the client's Readymag design (only the clipped leading letters
   were restored — the RM text nodes arrive truncated: "ur…", "e…", "y…"). */
const BIO_BY: Record<ProducerKey, string[]> = {
  diego: [
    "Our Oxidative Natural Process consists in a controlled fermentation by submerging freshly harvested cherries in water for 48 hours, allowing for a deep oxidative phase without microbial overload. This method draws out chlorogenic acids and aromatic precursors from the fruit's skin, enhancing complexity while preserving structure.",
    "After oxidation, the cherries are dried slowly on a UV-free dark room equipped with dehumidifiers for slow, controlled drying. The result is a clean and elegant cup, with no overfermented notes.",
    "The cherries are dried slowly on a UV-free dark room equipped with dehumidifiers for slow, controlled drying. The result is a clean and elegant cup, with no overfermented notes.",
    "Freshly harvested cherries in water for 48 hours, allowing for a deep oxidative phase without microbial overload. This method draws out chlorogenic acids and aromatic precursors from the fruit's skin, enhancing complexity while preserving structure.",
  ],
  diana: [
    "Diana runs Hachi alongside Diego, leading the operation out of Chiriquí, Panamá. She is the constant voice for sustainability, traceability and the producers' families behind every lot.",
  ],
  /* Placeholder copy — swap for the client's official Allan bio when it lands. */
  allan: [
    "Allan Hartmann helps lead HACHI Panamá out of Chiriquí, growing and processing coffees — including sous-vide experimental lots — that push what Panamanian coffee can be.",
  ],
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/* Scene progress now spans TWO transitions: 0 = Diego, 1 = Diana, 2 = Allan. */
const MAX_PROGRESS = 2;
const clampP = (n: number) => Math.max(0, Math.min(MAX_PROGRESS, n));

/* Shared editorial layout for BOTH producers (Diego & Diana are framed the same
   way, so the name / hotspots / leader line use identical coordinates — only the
   portrait image + its position differ). Adjusting these applies to both. */
/* Pixel-measured against the RM reference frame (p5 screenshot at the native
   1600×900 stage): name block and pills shifted to the RM positions. */
const SHARED_NAME_POS = { top: 255, left: 642 };
/* The name block was NOT actually shared in Readymag — SHARED_NAME_POS was
   measured from Diego's frame (p5) and the other two simply inherited it and
   drifted. Measured against their own RM references (PDF p11, resized to our
   frame): Diana's name belongs 58px higher and 15px right, Allan's 21px lower
   and 30px left. Diego keeps the original value. */
const DIANA_NAME_POS = { top: 197, left: 657 };
const ALLAN_NAME_POS = { top: 276, left: 612 };

/* Base geometry of the leader line that runs from the name to the producer's
   ear/shoulder. Only `width` differs per producer — a single shared length
   cannot reach three bodies standing in three different places, which is why
   Allan's stopped 60px short of him. Each width is solved with
   scripts/rm-compare/ray-to-body.py (+3px so it overlaps rather than just
   grazing) and MUST be re-solved whenever a name position or portrait moves. */
const SHARED_NAME_LINE = { top: "calc(5% + 41px)", marginLeft: 14, width: 49, deg: 38 };
const DIEGO_NAME_LINE = { ...SHARED_NAME_LINE, width: 46 };
const DIANA_NAME_LINE = { ...SHARED_NAME_LINE, width: 18 };
const ALLAN_NAME_LINE = { ...SHARED_NAME_LINE, width: 122 };
const SHARED_HOTSPOTS: { label: string; top: number; left: number; lineLen: number; lineDeg: number; k: "story" | "interview" | "coffees" }[] = [
  { label: "MY STORY", top: 392, left: 853, lineLen: 228, lineDeg: 38, k: "story" },
  { label: "INTERVIEW", top: 498, left: 762, lineLen: 134, lineDeg: 38, k: "interview" },
  { label: "MY COFFEES", top: 676, left: 669, lineLen: 132, lineDeg: 38, k: "coffees" },
];
/* Diana diverges from Diego from here on — Diego is locked. */
/* Lines re-measured against the RM reference (scene-step2, Diana settled): her
   pills step down-and-left in a shallow diagonal (screen centres ~597/507/480 at
   y ~417/523/695), each with a short leader to her body. Values below are raw
   stage coords; DIANA_SHIFT (-550) is applied on top when rendered. */
/* Client (2026-08-04): "as linhas e pílulas ... estão desalinhadas com a foto do
   corpo". Read off the RM reference (PDF p11) on a pixel grid: every pill sat a
   consistent 88 stage px too low, and 28-43px too far left. The lengths are no
   longer hand-tuned — scripts/rm-compare/ray-to-body.py marches each line from
   the pill edge until it hits the cutout's alpha, so they touch the body exactly.
   Re-run it after ANY change to DIANA_PORTRAIT or to these coordinates. */
const DIANA_HOTSPOTS: typeof SHARED_HOTSPOTS = [
  { label: "MY STORY", top: 329, left: 869, lineLen: 72, lineDeg: 30, k: "story" },
  { label: "INTERVIEW", top: 435, left: 770, lineLen: 38, lineDeg: 28, k: "interview" },
  { label: "MY COFFEES", top: 607, left: 737, lineLen: 50, lineDeg: 30, k: "coffees" },
];

/* Diana is framed tighter than Diego: her portrait is SMALLER and positioned
   independently from her connected elements (name + hotspots + lines).
   - DIANA_PORTRAIT.height shrinks only the image; .left positions the image.
   - DIANA_SHIFT translates the WHOLE slot (image + elements). To move ONLY the
     elements (keeping the image put), shift the slot further left here and add
     the same amount back to DIANA_PORTRAIT.left so the image stays fixed.
   Net image x = DIANA_SHIFT.x + DIANA_PORTRAIT.left. Negative x = left. */
/* Client (2026-08-04): "a Diana ta bem maior no RM do que está no nosso local."
   Measured against the RM reference (PDF p11 resized to our frame, so both are
   width-scaled and directly comparable) by matching the cap-brim width row by
   row at several depths: ours needed +20%. Her cap top stays at stage y 200 —
   it already matched — and the cap centre moves 35px left, which is why `left`
   grows less than the width does. 920 → 1104, bottom = 900 - 200 - 1104. */
const DIANA_PORTRAIT = { left: 883, bottom: -404, height: 1104 };
const DIANA_SHIFT = { x: -550, y: 0 };

/* Allan (third slot, after Diana). Client direction: match the RM reference for
   Allan directly (NOT a mirror of Diana). In RM (scene-step6) Allan is framed
   like Diego — larger figure sitting to the RIGHT, taller/higher than Diana, with
   his pills nearly vertically stacked to his left (screen centres ~880/860/915 at
   y ~415/522/678) and longer leaders reaching across to his body (~x1015). */
/* Lengths solved against the cutout's alpha with ray-to-body.py, same as
   Diana's. They had drifted badly: MY STORY stopped 41px short of his arm while
   MY COFFEES drove 83px into his hip. Re-run that script after any change to
   ALLAN_PORTRAIT — growing him +8% moved every one of these targets. */
const ALLAN_HOTSPOTS: typeof SHARED_HOTSPOTS = [
  { label: "MY STORY", top: 407, left: 830, lineLen: 119, lineDeg: 28, k: "story" },
  { label: "INTERVIEW", top: 512, left: 808, lineLen: 130, lineDeg: 22, k: "interview" },
  { label: "MY COFFEES", top: 670, left: 863, lineLen: 73, lineDeg: 26, k: "coffees" },
];
/* RM's Allan is ~1.5x larger than Diego/Diana (measured: cap width 124 vs 82,
   album-art height 531 vs 346) — a much tighter, head-to-thigh crop. Scaled to
   match, cap-top pinned at RM's y~141, feet running well below the fold.

   Client Iteration 2 (PDF p11): "Make Allan's picture slightly bigger ... and
   move it a little over to the right when landed." +8% and +45px right. The
   growth is anchored at the image's TOP edge (bottom = 771 - height) rather than
   at its base, so the head stays at the same height and only gets larger — with
   the base anchored, +8% of 1256 would have shoved his head 100px up and off
   the top of the stage. */
const ALLAN_PORTRAIT = { left: 1035, bottom: -589, height: 1360 };
const ALLAN_SHIFT = { x: 0, y: 0 };

/* Client Iteration 2 (PDF p19): the buttons are ALWAYS visible next to each
   producer's name — the ⊥ tap-to-open menu they replaced is gone. The reference
   also names them MY STORY / INTERVIEWS / SHOP COFFEES on mobile; the desktop
   scene keeps its own labels (SHARED_HOTSPOTS), which the earlier round set. */
const MOBILE_HOTSPOTS: { label: string; k: Exclude<PanelKey, null> }[] = [
  { label: "MY STORY", k: "story" },
  { label: "INTERVIEWS", k: "interview" },
  { label: "SHOP COFFEES", k: "coffees" },
];

/* Mobile layout: the scene doesn't pan sideways — instead the producers stack
   VERTICALLY (page scroll) in the client's order (Diana, then Allan, then
   Diego). Each producer's portrait alternates sides — right, left, right — so
   the name sits beside the body and the buttons sit further out, in the gap. */
const MOBILE_PRODUCERS: {
  key: ProducerKey;
  name: string;
  role: string;
  /** Vertical position (% of the scene) of the NAME, at the producer's head
   *  (Diana / Allan) or shoulder (Diego). */
  overlayTop: string;
  /** Side the name sits on — justified toward the producer's OWN body side. */
  overlaySide: "left" | "right";
  /** Horizontal inset of the name from its side — a gap between the name and
   *  the producer's head/shoulder. Applied as `left` (left side) or `right`. */
  nameInset: string;
  /** Stack the buttons UNDER the name instead of beside it — the reference does
   *  this for Diego, whose free space is vertical rather than horizontal. */
  menuBelow?: boolean;
}[] = [
  /* Horizontal placement read straight off the Readymag mobile canvas (320 wide),
     expressed as a % so it holds at any phone width:
       Diana  pills x24..109, name/role right-aligned at x226  ⇒ right inset 29.4%
       Allan  name/role left at x91, pills x216..301           ⇒ left  inset 28.4%
       Diego  name/role right-aligned at x135, pills BELOW     ⇒ right inset 57.8%
     Only Diego stacks; Diana and Allan sit beside their pills, which fits once
     the name is at RM's 10px instead of the 15px we had. */
  { key: "diana", name: "DIANA HARTMANN", role: "CO-OWNER | HACHI PANAMA", overlayTop: "11%", overlaySide: "right", nameInset: "29.4%" },
  { key: "allan", name: "ALLAN HARTMANN", role: "CO-OWNER | HACHI PANAMA", overlayTop: "27%", overlaySide: "left", nameInset: "28.4%" },
  { key: "diego", name: "DIEGO BERMUDEZ", role: "CO-FOUNDER | HACHI COLOMBIA", overlayTop: "68%", overlaySide: "right", nameInset: "57.8%", menuBelow: true },
];

const Producers = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [viewportW, setViewportW] = useState(typeof window !== "undefined" ? window.innerWidth : 1440);
  const [viewportH, setViewportH] = useState(typeof window !== "undefined" ? window.innerHeight : 900);
  const [panel, setPanel] = useState<{ producer: ProducerKey; key: PanelKey } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  /* Loading gate: the scene stays behind a cream-dots screen until the panorama
     + first producer image are ready, so it doesn't pop in half-drawn. */
  const [sceneReady, setSceneReady] = useState(false);

  /* progressRef mirrors the state so RAF / pointer handlers read the latest
     value without stale-closure problems. dragRef.pending = pointer is down
     but movement hasn't crossed the threshold, so a tap still fires a real
     click on whatever button is underneath. dragRef.active = real drag,
     pointer captured, scrubbing progress. */
  const progressRef = useRef(0);
  const dragRef = useRef({
    pending: false,
    active: false,
    startX: 0,
    startProgress: 0,
    pointerId: 0,
  });
  const rafRef = useRef<number | null>(null);
  const DRAG_THRESHOLD = 6; // px before a press becomes a drag

  /* Scroll/wheel navigation: targetRef is where the wheel is steering
     `progress`; a smoothing RAF eases progress toward it for fluid lateral
     motion. Progress rests wherever the user stops — no snap-back. */
  const targetRef = useRef(0);
  const wheelRafRef = useRef<number | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  /* Kick off the above-the-fold asset downloads as early as possible (before the
     <img> elements finish painting) so the backdrop + first producer appear fast
     on the first visit. Diana is intentionally left out: she's off-screen until
     the user scrolls and is tiny, so she loads at normal priority. */
  useEffect(() => {
    const critical = [
      { href: BG_PANORAMA, priority: "high" },
      { href: DIEGO_IMG, priority: "high" },
    ];
    const links = critical.map(({ href, priority }) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.setAttribute("fetchpriority", priority);
      document.head.appendChild(link);
      return link;
    });
    return () => links.forEach((l) => l.remove());
  }, []);

  /* Flip `sceneReady` once the critical images (panorama + first producer) have
     actually downloaded, so the cream-dots loader hides only when the scene can
     paint cleanly. Cached images resolve instantly; errors and a 6s safety
     timeout guarantee it never stays stuck on a broken/slow asset. */
  useEffect(() => {
    const critical = [BG_PANORAMA, DIEGO_IMG];
    const loaded = new Set<string>();
    let cancelled = false;
    const mark = (src: string) => {
      loaded.add(src);
      if (!cancelled && loaded.size >= critical.length) setSceneReady(true);
    };
    critical.forEach((src) => {
      const img = new Image();
      const done = () => mark(src);
      img.onload = done;
      img.onerror = done;
      img.src = src;
      if (img.complete) done();
    });
    const t = window.setTimeout(() => {
      if (!cancelled) setSceneReady(true);
    }, 6000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      setViewportW(window.innerWidth);
      setViewportH(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* Distance the pointer must travel to cross the full 0→1 transition. */
  const DRAG_DIST = Math.max(viewportW * 1.2, 600);

  /* ── Scroll-to-pan: mouse-wheel / trackpad scroll is converted into smooth
     horizontal `progress`. A native, non-passive listener is required so we
     can preventDefault (React's synthetic onWheel is passive). ── */
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;

    // Frame-rate-independent exponential smoothing toward targetRef. Using a
    // time-based decay constant (instead of a fixed per-frame coefficient)
    // keeps motion identical on 60 / 120 / 144 Hz displays and avoids the
    // "stair-step" feel of chunky wheel deltas.
    //
    // smoothing = 1 - exp(-dt / TAU); larger TAU → slower, silkier glide.
    const TAU_MS = 160;
    let lastTs = 0;
    const runWheelAnim = () => {
      if (wheelRafRef.current != null) return;
      lastTs = 0;
      const tick = (ts: number) => {
        if (!lastTs) lastTs = ts;
        const dt = Math.min(64, ts - lastTs); // clamp big tab-switch gaps
        lastTs = ts;
        const cur = progressRef.current;
        const diff = targetRef.current - cur;
        if (Math.abs(diff) < 0.00025) {
          progressRef.current = targetRef.current;
          setProgress(targetRef.current);
          wheelRafRef.current = null;
          return;
        }
        const k = 1 - Math.exp(-dt / TAU_MS);
        const next = cur + diff * k;
        progressRef.current = next;
        setProgress(next);
        wheelRafRef.current = requestAnimationFrame(tick);
      };
      wheelRafRef.current = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      if (panel) return; // panel open → let the side panel scroll normally
      e.preventDefault();
      // Interrupt any in-flight drag-release snap so the two never fight.
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

      // Pick the dominant axis (vertical mouse OR horizontal trackpad) and
      // normalise across deltaMode (pixels / lines / pages).
      let delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) delta *= 16;
      else if (e.deltaMode === 2) delta *= viewportH;

      // Soft-cap a single wheel tick so a hard mouse-wheel notch (often
      // 100-120px) can't punch progress across in one jump — that's what
      // produces the "jerky / too fast" feel. Trackpads emit small deltas
      // and pass through untouched.
      const MAX_TICK = 90;
      if (delta > MAX_TICK) delta = MAX_TICK;
      else if (delta < -MAX_TICK) delta = -MAX_TICK;

      // Sensitivity: full 0→1 traversal needs ~0.85 viewport widths of
      // scrolling. Less effort per transition than before (was 1.4) while the
      // MAX_TICK cap above + TAU smoothing keep it from snapping across in one
      // notch or skipping the handoff — fluid but quicker to advance.
      const SCROLL_DIST = Math.max(viewportW * 0.85, 680);
      targetRef.current = clampP(targetRef.current + delta / SCROLL_DIST);
      runWheelAnim();

      // No snap: progress rests exactly where the user left it. The smoothing
      // RAF eases toward `targetRef` and stops there — scrolling a little
      // advances a little and holds, scrolling more continues from that point.
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelRafRef.current) { cancelAnimationFrame(wheelRafRef.current); wheelRafRef.current = null; }
    };
  }, [panel, viewportW, viewportH]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (panel) return;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (wheelRafRef.current) { cancelAnimationFrame(wheelRafRef.current); wheelRafRef.current = null; }
    targetRef.current = progressRef.current;
    /* Pending — not yet a drag. Wait for movement past DRAG_THRESHOLD before
       capturing the pointer, so short taps fall through as real clicks. */
    dragRef.current = {
      pending: true,
      active: false,
      startX: e.clientX,
      startProgress: progressRef.current,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.pending && !d.active) return;
    const dx = e.clientX - d.startX;
    if (d.pending) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      d.pending = false;
      d.active = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setIsDragging(true);
    }
    // Dragging LEFT (negative dx) advances progress — Diana, then Allan enter.
    const next = clampP(d.startProgress - dx / DRAG_DIST);
    progressRef.current = next;
    targetRef.current = next;
    setProgress(next);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (d.active) {
      d.active = false;
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture?.(d.pointerId);
      } catch {
        /* pointer already released */
      }
      // No snap on release: leave progress exactly where the drag ended.
    }
    d.pending = false;
  };

  /* Panorama is 6101 × 1023 — scaled to viewport height it becomes
     6101 * (vh / 1023) wide. Pan from 0 to -(scaledW - viewportW). */
  const panoramaScaledW = 6101 * (viewportH / 1023);
  const maxPan = Math.max(0, panoramaScaledW - viewportW);
  /* progress spans 0..MAX_PROGRESS across the whole panorama. */
  const bgX = -(progress / MAX_PROGRESS) * maxPan;

  /* The producer composition (name + portrait + hotspots) is authored as a FIXED
     1600×900 stage in absolute pixels. Responsiveness = scale that stage to the
     viewport with a "cover" factor (fill, crop overflow), exactly like Readymag
     scales its canvas — the layout never reflows, it only zooms. */
  const STAGE_W = 1600;
  const STAGE_H = 900;
  const stageScale = Math.max(viewportW / STAGE_W, viewportH / STAGE_H);

  /* Below this width the horizontal-pan scene is replaced by a vertical scroll
     of stacked producers (mobile layout). */
  const isMobile = viewportW < 768;

  /* The floating island (MY COFFEES / MY STORY / INTERVIEW) is authored at a FIXED
     design size (720×710, 20px edge margins) just like the stage. To keep the page
     looking identical across screen sizes — elements shrink but occupation/design
     stay the same — scale the island by the SAME factor as the stage, clamped so it
     never overflows the available width/height on off-aspect or small screens. */
  /* Island geometry measured from the client's mockup (panel ≈ 34% of the
     viewport width, ≈ 86% of its height, ~1.8% in from the edge). */
  const ISLAND_W = 549;
  const ISLAND_H = 734;
  const ISLAND_MARGIN = 20;
  const HEADER_H = 64;
  const islandScale = Math.min(
    stageScale,
    (viewportW - ISLAND_MARGIN * 2) / ISLAND_W,
    (viewportH - HEADER_H - ISLAND_MARGIN * 2) / ISLAND_H,
  );

  /* Tight overlapping handoff: the outgoing producer is still clearing the
     stage while the next one is already sliding in, so there is no empty middle
     frame.

     Client Iteration 2 (PDF p10) removed the portrait cross-fade, so a portrait
     is only hidden once it is genuinely off the 1600-wide stage. Landed spans,
     measured in stage px: Diego 838..1464, Diana 401..740, Allan 1035..1507.
     OFF_LEFT must carry the widest right edge (1464) past 0 and OFF_RIGHT must
     carry the leftmost left edge (401) past 1600; both keep ~100px of slack.
     The travel SPANS were widened to match (Diego 0→0.6 became 0→0.9, Diana's
     entrance now starts at 0.15) so the longer distance is covered at roughly
     the previous speed instead of snapping across. */
  const OFF_LEFT = -1570;
  /* 1350 rather than 1300: Diana grew 20% leftwards, so her landed left edge is
     now 333 and 1300 would have parked her start at 1633 — only 33px clear. */
  const OFF_RIGHT = 1350;

  const diegoT = clamp01(progress / 0.9);
  const diegoX = lerp(0, OFF_LEFT, diegoT);
  const diegoY = lerp(0, 300, diegoT);
  /* Elements only: 1 until 0.30, then faded out by 0.50. */
  const diegoElements = 1 - clamp01((progress - 0.3) / 0.2);

  /* Diana: enters over 0.15→0.9 and exits over 1→1.9, handing the slot to Allan. */
  const dianaT = clamp01((progress - 0.15) / 0.75);
  const dianaExitT = clamp01((progress - 1) / 0.9);
  const dianaX = lerp(OFF_RIGHT, 0, dianaT) + lerp(0, OFF_LEFT, dianaExitT);
  const dianaY = lerp(320, 0, dianaT) + lerp(0, 300, dianaExitT);
  /* Elements only: 0 until 0.35, 1 by 0.55; faded back out over 1.3→1.5. */
  const dianaElements =
    clamp01((progress - 0.35) / 0.2) * (1 - clamp01((progress - 1.3) / 0.2));

  /* Allan: mirrors Diana's entrance one transition later (1.15→1.9). */
  const allanT = clamp01((progress - 1.15) / 0.75);
  const allanX = lerp(OFF_RIGHT, 0, allanT);
  const allanY = lerp(320, 0, allanT);
  const allanElements = clamp01((progress - 1.35) / 0.2);

  const openPanel = (producer: ProducerKey, key: Exclude<PanelKey, null>) => {
    setPanel({ producer, key });
  };

  const closePanel = () => setPanel(null);

  return (
    <div className="bg-[#9aa593] text-white">
      {/* Loading screen — cream dots on the scene's own sage backdrop, shown
          until the panorama + first producer finish loading so the scene never
          pops in half-drawn. Fades out (never unmounts abruptly) when ready. */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{
          background: "#9aa593",
          opacity: sceneReady ? 0 : 1,
          pointerEvents: sceneReady ? "none" : "auto",
          transition: "opacity 500ms ease",
        }}
        role="status"
        aria-live="polite"
        aria-label="Loading"
        aria-hidden={sceneReady}
      >
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-full animate-bounce"
              style={{ background: "#F8F5E4", animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Client feedback: transparent nav over the scene, black text (no cream). */}
      <WholesaleHeader compact fixed noBorder />

      {/* Shared cart — the MY COFFEES cards add to it, so the drawer + floating
          toggle must exist on this page too (they're fixed overlays). */}
      <CartDrawer />
      <FloatingCartToggle />

      {/* ── DESKTOP: single fixed 100vh horizontal-pan scene. Wheel / trackpad
          scroll drives `progress` across the producers; pointer drag works too. ── */}
      {!isMobile && (
      <div
        ref={sceneRef}
        className="relative overflow-hidden"
        style={{
          height: "100vh",
          background: "#9aa593",
          cursor: panel ? "auto" : isDragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Panoramic background — real <img> so the picture stays visible
            across the whole pan, instead of a viewport-clipped background. */}
        <img
          src={BG_PANORAMA}
          alt=""
          aria-hidden="true"
          draggable={false}
          decoding="async"
          fetchPriority="high"
          className="absolute top-0 left-0 h-full max-w-none select-none pointer-events-none"
          style={{
            width: panoramaScaledW,
            transform: `translateX(${bgX}px)`,
            willChange: "transform",
          }}
        />

        {/* Soft mist / cream overlay (the tree-foreground PNG in the original).
            Client Iteration 2 (PDF p11): "There is a black opacity layer ... When
            you scroll near Allan, you can see the edge of this layer". It was
            parallaxed with translateX(treeX * 0.3), which slid an `inset-0` box
            up to 132px sideways at full progress and left that much of the right
            edge uncovered. The gradient is uniform horizontally, so the parallax
            was invisible anyway — only its exposed edge ever showed. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(248,245,228,0.12) 0%, rgba(40,38,30,0.18) 100%)",
          }}
        />

        {/* ── Fixed 1600×900 stage, scaled to the viewport (cover) ── */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `translate(-50%, -50%) scale(${stageScale})`,
            transformOrigin: "center center",
          }}
        >
        {/* ── Diego ── */}
        <ProducerSlot
          name="DIEGO BERMUDEZ"
          role="CO-FOUNDER - HACHI COLOMBIA"
          image={DIEGO_IMG}
          translateX={diegoX}
          translateY={diegoY}
          elementsOpacity={diegoElements}
          onButton={(k) => openPanel("diego", k)}
          namePos={SHARED_NAME_POS}
          /* RM-measured: Diego is larger, sits lower (cropped below the fold)
             and further left than the previous framing. */
          portraitPos={{ left: 838, bottom: -68, height: 782 }}
          hotspots={SHARED_HOTSPOTS}
          nameLine={DIEGO_NAME_LINE}
          portraitZ={30}
          imgPriority="high"
        />


        {/* ── Diana ── */}
        <ProducerSlot
          name="DIANA HARTMANN"
          role="HACHI PANAMA"
          image={DIANA_IMG}
          translateX={dianaX + DIANA_SHIFT.x}
          translateY={dianaY + DIANA_SHIFT.y}
          elementsOpacity={dianaElements}
          onButton={(k) => openPanel("diana", k)}
          namePos={DIANA_NAME_POS}
          portraitPos={DIANA_PORTRAIT}
          hotspots={DIANA_HOTSPOTS}
          nameLine={DIANA_NAME_LINE}
          portraitZ={30}
        />

        {/* ── Allan (third slot — client: "Add Allan after Diana") ── */}
        <ProducerSlot
          name="ALLAN HARTMANN"
          role="HACHI PANAMA"
          image={ALLAN_IMG}
          translateX={allanX + ALLAN_SHIFT.x}
          translateY={allanY + ALLAN_SHIFT.y}
          elementsOpacity={allanElements}
          onButton={(k) => openPanel("allan", k)}
          namePos={ALLAN_NAME_POS}
          portraitPos={ALLAN_PORTRAIT}
          hotspots={ALLAN_HOTSPOTS}
          nameLine={ALLAN_NAME_LINE}
          portraitZ={30}
        />
        </div>
      </div>
      )}

      {/* ── MOBILE: the client's single flattened scene — the savanna with all
          three producers baked into ONE image (Readymag export). Each
          producer's name + hotspot buttons overlay on their empty side. ── */}
      {isMobile && (
        <div style={{ paddingTop: "var(--site-header-h, 64px)" }}>
          <div className="relative w-full">
          <img
            src="/producers/producers-mobile.jpg"
            alt="Native producers in the field"
            draggable={false}
            className="block w-full h-auto select-none"
          />
          {/* Client Iteration 2 (p20): "I added a 6% black opaque layer in between
              the background landscape image and the Producer's name and buttons
              so it's easier to read" — so it sits above the photo and below every
              overlay that follows. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
          />
          {MOBILE_PRODUCERS.map(({ key, name, role, overlayTop, overlaySide, nameInset, menuBelow }) => {
            const bodyOnRight = overlaySide === "right";
            return (
            <Fragment key={key}>
              {/* Name + buttons as ONE group, per the reference: the name sits
                  against the producer's body and the buttons run further out into
                  the empty half of the frame (under the name for Diego, whose gap
                  is vertical). */}
              <div
                className={`absolute flex ${
                  menuBelow
                    ? "flex-col"
                    : bodyOnRight
                    ? "flex-row-reverse items-start"
                    : "flex-row items-start"
                } gap-[min(4.4vw,20px)]`}
                style={{
                  top: overlayTop,
                  [bodyOnRight ? "right" : "left"]: nameInset,
                }}
              >
                <div className={bodyOnRight ? "text-right" : "text-left"}>
                  {/* RM mobile canvas: name 10px BOLD / -0.4 / 11, role 8px
                      regular / -0.4 / 11 — both cream. Ours ran at 15/11, which
                      is what pushed the block onto the producers' faces. */}
                  <h2
                    className="uppercase text-[rgba(255,251,228,1)] whitespace-nowrap text-[min(3.125vw,13.4px)] leading-[min(3.44vw,14.7px)]"
                    style={{ fontFamily: RM_BOLD, letterSpacing: "-0.4px", fontWeight: 700 }}
                  >
                    {name}
                  </h2>
                  <p
                    className="uppercase text-[rgba(255,251,228,1)] whitespace-nowrap text-[min(2.5vw,10.7px)] leading-[min(3.44vw,14.7px)]"
                    style={{ fontFamily: RM_TEXT, letterSpacing: "-0.4px" }}
                  >
                    {role}
                  </p>
                </div>

                {/* Outlined pills, translucent over the scene — tapping one opens
                    that producer's panel as a popup over the page. */}
                <div
                  className={`flex flex-col gap-[min(0.94vw,4px)] shrink-0 ${
                    menuBelow ? (bodyOnRight ? "items-end mt-[min(2.5vw,10.7px)]" : "items-start mt-[min(2.5vw,10.7px)]") : ""
                  }`}
                >
                  {MOBILE_HOTSPOTS.map((b) => (
                    <button
                      key={b.k}
                      type="button"
                      onClick={() => openPanel(key, b.k)}
                      /* RM mobile canvas: 85×12 with a 6px radius and a 0.8px
                         cream hairline at 50%, NO fill (ours was tinted), label
                         7px regular in cream. */
                      className="w-[min(26.5vw,113px)] h-[min(3.75vw,16px)] whitespace-nowrap rounded-[6px] border-[0.8px] border-[rgba(255,251,228,0.5)] bg-transparent text-[rgba(255,251,228,1)] text-[min(2.19vw,9.4px)] uppercase tracking-normal leading-none text-center transition-colors hover:bg-[rgba(255,251,228,0.9)] hover:text-black active:bg-[rgba(255,251,228,0.9)] active:text-black"
                      style={{ fontFamily: RM_TEXT }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

            </Fragment>
            );
          })}
          </div>

          {/* ── Page tail — same close as the homepage: the newsletter signup
              followed by the ©2026 bar. Both sit in the flow BELOW the scene
              photo (never over it), so the page simply ends here. ── */}
          <SignupBar />
          <SiteFooterBar />
        </div>
      )}

      {/* ── Floating island (MY STORY / INTERVIEW / COFFEES) — rendered for BOTH
          layouts; a fixed, centred overlay on mobile. ── */}
      {panel && (
        <ProducerIsland
          key={`${panel.producer}-${panel.key}`}
          producer={panel.producer}
          kind={panel.key}
          scale={islandScale}
          onClose={closePanel}
          mobile={isMobile}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Producer figure + name label + 3 hotspot buttons w/ connector     */
/* ------------------------------------------------------------------ */
type ProducerSlotProps = {
  name: string;
  role: string;
  image: string;
  translateX: number;
  translateY: number;
  /* Client Iteration 2 (PDF p10): "their headshot should never be faded in — it
     should be full opacity/full seen the entire time, although the lines and
     buttons should fade in when they reach the correct spot". So this drives ONLY
     the name, leader lines and pills; the portrait always renders at opacity 1
     and leaves the frame by travelling, never by dissolving. That is why the
     entry/exit throws below must clear the whole 1600-wide stage. */
  elementsOpacity: number;
  onButton: (k: Exclude<PanelKey, null>) => void;
  /* Per-producer transform applied ONLY to the portrait container, so we
     can re-center or scale one producer without shifting their name/buttons.
     Origin is bottom-center so scale keeps the feet anchored at the bottom.
     OffsetY accepts any CSS length (e.g. "17vh") for viewport-relative tuning. */
  /* ── Absolute pixel layout, authored for a FIXED 1600×900 viewport and measured
     directly from the Readymag reference (page 5). No responsive units (no %, vw,
     vh, clamp, translateX) — these are hard coordinates. Responsiveness is a
     later, separate concern. ── */
  namePos: { top: number; left: number };
  portraitPos: { left: number; bottom: number; height: number };
  hotspots: { label: string; top: number; left: number; lineLen: number; lineDeg: number; k: Exclude<PanelKey, null> }[];
  /* Leader line from the name to the producer's ear (per-producer; the two
     producers are framed differently). */
  nameLine: { top: string; marginLeft: number; width: number; deg: number };
  /* Stacking order of the portrait relative to the name/hotspots/lines (all z-20).
     Default 10 keeps the figure behind the elements; raise above 20 to bring the
     figure in front of them. Per-producer. */
  portraitZ?: number;
  /* Load priority for the portrait image. The first-visible producer (Diego)
     loads "high" so he paints fast; the off-screen one loads at normal priority. */
  imgPriority?: "high" | "auto";
};

const ProducerSlot = ({
  name,
  role,
  image,
  translateX,
  translateY,
  elementsOpacity,
  onButton,
  namePos,
  portraitPos,
  hotspots,
  nameLine,
  portraitZ = 10,
  imgPriority = "auto",
}: ProducerSlotProps) => {
  const buttons = hotspots;
  /* Shared by the three fading groups. Also gates hit-testing: a fully faded
     producer's pills stayed clickable at opacity 0 anywhere on the stage, so a
     click could open the wrong producer's island. The threshold is deliberately
     near zero rather than 0.5 — anything the visitor can actually see should be
     clickable, and during the handoff both producers are legitimately on screen. */
  const fading = {
    opacity: elementsOpacity,
    transition: "opacity 0.4s linear",
    willChange: "opacity",
  } as const;
  const interactive = elementsOpacity > 0.05;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
        willChange: "transform",
      }}
    >
      {/* Producer name — large, floated left of the face, subtitle right-aligned */}
      <div
        className="absolute z-20"
        style={{
          top: `${namePos.top}px`,
          left: `${namePos.left}px`,
          width: "max-content",
          ...fading,
        }}
      >
        {/* Readymag-faithful (measured from the live page-5 render): cream name,
            no shadow, 27px / -1.5px tracking, line-height 1. */}
        <h2
          className="text-[rgba(255,251,228,1)] uppercase font-rm-display whitespace-nowrap"
          style={{
            /* RM-exact: 27px/-1.5px at the 1024 stage ⇒ 42px/-2.3px here. */
            fontSize: "42px",
            lineHeight: 1,
            letterSpacing: "-2.3px",
            fontWeight: 400,
          }}
        >
          {name}
        </h2>
        <p
          className="text-[rgba(255,251,228,1)] uppercase mt-[2px] text-right"
          /* RM-exact: custom_75139 7px at the 1024 stage ⇒ 11px here. */
          style={{
            fontSize: "11px",
            letterSpacing: "0",
            fontFamily: RM_TEXT,
          }}
        >
          {role}
        </p>
        {/* Leader line pointing from the name toward the producer's face (RM:
            thin cream stroke at a slight upward angle). */}
        <span
          aria-hidden="true"
          className="absolute block pointer-events-none"
          style={{
            top: nameLine.top,
            left: "100%",
            marginLeft: nameLine.marginLeft,
            width: nameLine.width,
            height: 0.4,
            background: "rgba(255,251,228,0.5)",
            transformOrigin: "left center",
            transform: `rotate(${nameLine.deg}deg)`,
          }}
        />
      </div>

      {/* Connector lines — rendered IN FRONT of the portrait so they stay
          visible when the figure overlaps them (was z-0, tucked behind). */}
      {buttons.map((b, i) => (
        <div
          key={`line-${b.label}`}
          aria-hidden="true"
          className="absolute z-20 flex items-center pointer-events-none"
          style={{
            top: `${b.top}px`,
            left: `${b.left}px`,
            animation: `fade-in-up 600ms cubic-bezier(0.22,1,0.36,1) ${200 + i * 120}ms both`,
            ...fading,
          }}
        >
          {/* Invisible pill replica to anchor the line at the same spot —
              metrics must mirror the visible pill below exactly. */}
          <span
            className="rounded-full border-[0.3px] border-transparent px-[18px] py-[3px] text-[12.5px] leading-none tracking-normal text-center uppercase opacity-0"
            style={{ fontFamily: "Arial, 'Helvetica Neue', sans-serif", fontWeight: 400 }}
          >
            {b.label}
          </span>
          <span
            className="absolute"
            style={{
              left: "100%",
              top: "50%",
              width: b.lineLen,
              height: 0.4,
              background: "rgba(248,245,228,0.65)",
              transformOrigin: "left center",
              transform: `rotate(${b.lineDeg}deg)`,
              marginLeft: 7,
            }}
          />
        </div>
      ))}

      {/* Portrait — absolute px cutout (left edge / bottom / height in px) */}
      <div
        className="absolute flex items-end"
        style={{
          left: `${portraitPos.left}px`,
          bottom: `${portraitPos.bottom}px`,
          height: `${portraitPos.height}px`,
          zIndex: portraitZ,
        }}
      >
        <img
          src={image}
          alt={name}
          style={{ height: `${portraitPos.height}px` }}
          className="w-auto object-contain object-bottom select-none"
          draggable={false}
          decoding="async"
          fetchPriority={imgPriority}
        />
      </div>

      {/* Outlined pill hotspots staggered down-left, each with a connector */}
      {buttons.map((b, i) => (
        <button
          key={b.label}
          type="button"
          onClick={() => onButton(b.k)}
          tabIndex={interactive ? 0 : -1}
          aria-hidden={!interactive}
          className="group absolute z-20 flex items-center"
          style={{
            top: `${b.top}px`,
            left: `${b.left}px`,
            animation: `fade-in-up 600ms cubic-bezier(0.22,1,0.36,1) ${200 + i * 120}ms both`,
            pointerEvents: interactive ? "auto" : "none",
            ...fading,
          }}
        >
          {/* RM-exact pill text: Arial 8px, no tracking, centered at the 1024
              stage ⇒ 12.5px here. No opaque fill, no shadow (client feedback). */}
          <span
            className="rounded-full border-[0.3px] border-[rgb(255,251,228)] text-[rgb(255,251,228)] px-[18px] py-[3px] text-[12.5px] leading-none tracking-normal text-center uppercase transition-colors duration-200 group-hover:bg-[rgba(248,245,228,0.95)] group-hover:text-[#0e0e0e]"
            style={{ fontFamily: "Arial, 'Helvetica Neue', sans-serif", fontWeight: 400 }}
          >
            {b.label}
          </span>
        </button>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Floating island card (MY STORY / INTERVIEW)                        */
/*                                                                     */
/*  A self-contained off-white card that floats over the Producers     */
/*  scene on the LEFT, below the header — NOT a full-height sidebar and */
/*  NOT a page replacement. It lives OUTSIDE the scaled 1600×900 stage, */
/*  in unscaled scene coordinates, so it reads at a constant on-screen  */
/*  size. Height is driven by content, capped to the viewport with      */
/*  internal scroll only when needed. Everything is sized in px         */
/*  (browser-zoom-friendly) with vw/vh caps (screen-size-friendly).     */
/* ------------------------------------------------------------------ */
type IslandProps = {
  producer: ProducerKey;
  kind: Exclude<PanelKey, null>;
  /* Uniform zoom factor (matches the stage) so the fixed 720×710 design scales
     with the rest of the page instead of staying a constant pixel size. */
  scale: number;
  onClose: () => void;
  /* Mobile: render as a fixed, horizontally-centred overlay instead of the
     desktop left/right-anchored floating card. */
  mobile?: boolean;
};

const ISLAND_LABELS: Record<Exclude<PanelKey, null>, string> = {
  story: "MY STORY",
  interview: "INTERVIEW",
  coffees: "COFFEES",
};

/* COFFEES island shows the producer's coffees in a paginated 2-column grid. */
const COFFEES_PER_PAGE = 4;

const ProducerIsland = ({ producer, kind, scale, onClose, mobile = false }: IslandProps) => {
  const [openTopic, setOpenTopic] = useState<number | null>(null);
  const [coffeePage, setCoffeePage] = useState(0);
  const asideRef = useRef<HTMLElement>(null);

  /* The small label (MY STORY / INTERVIEW / COFFEES) must always sit at the END
     of the surname, right-aligned to it — regardless of how wide the surname is
     (BERMUDEZ vs HARTMANN). Instead of a hand-tuned per-producer offset, measure
     the surname's rendered right edge and slide the label so their right edges
     line up. Vertical position stays fixed (tuned separately below). */
  const surnameRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  /* Desktop starts from a hand-tuned offset and the layout effect below refines
     it. Mobile keeps 0: it skips that alignment (see the effect), so a non-zero
     seed would simply stay applied and drag the label onto the surname. */
  const [labelDX, setLabelDX] = useState(mobile ? 0 : -98);

  /* Close the island on any interaction OUTSIDE the card. Clicks inside the card
     are ignored; the X button still closes via onClose. Clicking another hotspot
     closes this island and opens the new one (its onClick fires after this). */
  useEffect(() => {
    const onOutside = (e: PointerEvent) => {
      if (asideRef.current && !asideRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [onClose]);

  const name =
    producer === "diego" ? "DIEGO BERMUDEZ" : producer === "allan" ? "ALLAN HARTMANN" : "DIANA HARTMANN";
  const [firstLine, ...restName] = name.split(" ");
  const secondLine = restName.join(" ");
  const label = ISLAND_LABELS[kind];

  /* MY STORY slideshow: which slide is shown large. Resets naturally because
     the island remounts (key) whenever the producer/panel changes. */
  const [storyIdx, setStoryIdx] = useState(0);
  const storySlides = STORY_SLIDES[producer];

  /* Align the label's right edge to the surname's right edge. Both live inside the
     `scale`-transformed aside, so getBoundingClientRect returns screen px scaled by
     the same factor — divide the gap by `scale` to get the local shift to apply.
     Converges in one extra layout pass (the transform is linear), so no flash. */
  useLayoutEffect(() => {
    let cancelled = false;
    /* Mobile skips this. The card is only ~351px wide there, so the title is set
       much smaller; pulling the label back to the surname's right edge lands it
       ON TOP of the surname instead of beside it. Left alone, `justify-between`
       already parks it at the top-right corner, which is what the reference
       shows at this size. */
    if (mobile) return;
    const align = () => {
      const s = surnameRef.current;
      const l = labelRef.current;
      if (cancelled || !s || !l) return;
      const gap = (s.getBoundingClientRect().right - l.getBoundingClientRect().right) / (scale || 1);
      if (Math.abs(gap) > 0.5) setLabelDX((dx) => dx + gap);
    };
    align();
    // Re-align once the display font finishes loading (it changes surname width).
    document.fonts?.ready.then(align);
    return () => {
      cancelled = true;
    };
  }, [name, label, scale, labelDX, mobile]);

  /* COFFEES content: pull the REAL products (Shopify Storefront, falling back to
     the project's product data) and show only the ones whose Producer field
     matches the selected producer — never a hardcoded list, never mixing
     producers. Matched on the producer's surname, accent-insensitive. */
  const { data: shopProducts } = useShopifyStorefrontProducts();
  const productList = shopProducts && shopProducts.length ? shopProducts : mockProducts;
  const producerKey = normalizeProducer(secondLine || firstLine);
  const coffees = productList
    .filter((p) => p.producer && normalizeProducer(p.producer).includes(producerKey))
    .map((p) => ({
      id: p.id,
      name: cleanCoffeeTitle(p.title, p.producer),
      process: p.process ?? "",
      notes: (p.tastingNotes ?? []).join(", "),
      price: `$${p.price}`,
      weight: p.defaultWeight ?? "250G",
      weights: p.weights && p.weights.length ? p.weights : [p.defaultWeight ?? "250G"],
      priceByWeight: p.priceByWeight,
      variantIdByWeight: p.variantIdByWeight,
      basePrice: p.price,
      image: p.image,
    }));

  const pageCount = Math.max(1, Math.ceil(coffees.length / COFFEES_PER_PAGE));
  const pageCoffees = coffees.slice(coffeePage * COFFEES_PER_PAGE, coffeePage * COFFEES_PER_PAGE + COFFEES_PER_PAGE);
  const goPrev = () => setCoffeePage((p) => Math.max(0, p - 1));
  const goNext = () => setCoffeePage((p) => Math.min(pageCount - 1, p + 1));

  return (
    <div
      className={`z-50 flex items-center pointer-events-none ${
        mobile ? "fixed inset-0 justify-center" : "absolute"
      }`}
      style={
        mobile
          ? {
              /* Mobile: fixed, horizontally-centred overlay below the header. */
              top: "var(--site-header-h, 64px)",
              bottom: 0,
              paddingLeft: "12px",
              paddingRight: "12px",
            }
          : {
              /* RM: Diego and Allan stand on the RIGHT of the stage, so their
                 islands open on the LEFT; only Diana stands on the left → her
                 island opens on the RIGHT (~1.8% in from the screen edge). */
              ...(producer === "diana" ? { right: "1.8vw" } : { left: "1.8vw" }),
              top: "var(--site-header-h, 64px)",
              bottom: 0,
              /* Fixed DESIGN width (mockup: 34% of a 1600-wide stage) — the aside
                 is scaled by `scale` to match the page. */
              width: "549px",
            }
      }
    >
    <aside
      role="dialog"
      aria-label={`${name} — ${label}`}
      ref={asideRef}
      className="bg-[#FFFBE4] text-[#0e0e0e] border-2 border-ink/40 overflow-y-auto overflow-x-hidden pointer-events-auto flex flex-col"
      style={{
        /* Fixed DESIGN island size (549×734) — does not grow/shrink with content.
           The whole card is then scaled by `scale` (same factor as the stage) so
           it zooms uniformly with the page instead of staying a constant pixel
           size. On mobile it is centred (transform-origin center); on desktop the
           origin is the anchored edge so the card stays pinned to its margin. */
        width: mobile ? "549px" : "100%",
        height: "734px",
        transform: `scale(${scale})`,
        transformOrigin: mobile ? "center center" : producer === "diana" ? "right center" : "left center",
        borderRadius: 0,
        /* No drop shadow: the outer contour must read as the SAME flat line as the
           internal dividers and the header divider (border-2 border-ink/40), not an
           elevated/haloed edge — keeping the island's outline visually standardized. */
        animation: "fade-in-up 360ms cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {/* ── Top: big two-line title + small label + discreet close X ──
          The mockup boxes the title block with a full-width divider below it. */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2 shrink-0 border-b-2 border-ink/40">
        <h3
          className="font-rm-display uppercase"
          style={{
            /* RM-exact (preview computed style ×1.5625 stage conversion):
               51px/42px/-2.7px at the 1024 stage ⇒ 77/63/-4 at ours.
               On mobile the card is only ~351px wide, where the longest surname
               (HARTMANN) measures 403px against 347px of usable width and spilled
               past the edge, shoving the MY STORY label out of the card. Scaled to
               fit that width with room for the label beside it. */
            fontSize: mobile ? "46px" : "77px",
            lineHeight: mobile ? "39px" : "63px",
            letterSpacing: mobile ? "-2.4px" : "-4px",
            fontWeight: 400,
            color: "#0e0e0e",
            /* Nudge only the name block a touch left. The close X /
               label on the right and the dividers below stay where they are.
               Vertical shift removed to center the name between the top and the first division. */
            transform: "translate(-13px, 0px)",
          }}
        >
          {firstLine}
          <br />
          <span ref={surnameRef}>{secondLine}</span>
        </h3>

        <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="relative w-4 h-4 text-black/55 hover:text-black transition-colors"
          >
            <span className="absolute left-0 top-1/2 w-full h-px bg-current rotate-45" />
            <span className="absolute left-0 top-1/2 w-full h-px bg-current -rotate-45" />
          </button>
          <span
            ref={labelRef}
            className="uppercase whitespace-nowrap"
            style={{
              /* RM-exact: custom_75139 9px/-0.1px at the 1024 stage ⇒ 14px/-0.15px. */
              fontSize: "14px",
              lineHeight: "15px",
              fontWeight: 400,
              letterSpacing: "-0.15px",
              color: "#0e0e0e",
              fontFamily: RM_TEXT,
              /* Sit the label at the first-line height with clearance above the
                 surname caps (mockup: ~18px gap). The horizontal shift (labelDX)
                 right-aligns the label with the END of the surname. */
              marginTop: "14px",
              transform: `translate(${labelDX}px, 6px)`,
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* ── INTERVIEW: media + topics (mockup: full-width bordered media, filled
          ▶ markers, topic rows stretching to the island's bottom edge) ── */}
      {kind === "interview" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mt-2.5 px-2.5 shrink-0">
            <div className="relative w-full aspect-video bg-black overflow-hidden border-2 border-ink/40">
              <iframe
                title={`${name} interview`}
                src="https://player.vimeo.com/video/851072637?title=0&byline=0&portrait=0&dnt=1"
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                allow="autoplay; fullscreen; picture-in-picture"
              />
            </div>
          </div>

          {/* TOPICS */}
          <p
            className="uppercase px-5 mt-3 mb-1 shrink-0"
            /* RM-exact heading: custom_75141 (bold face) 9px at the 1024 stage ⇒ 14px. */
            style={{ fontSize: "14px", lineHeight: "14px", fontWeight: 700, letterSpacing: "-0.15px", fontFamily: RM_BOLD }}
          >
            TOPICS
          </p>
          {/* RM/mockup: hairline separators on the topic rows (thinner than the
              island frame and the title divider). */}
          <ul className="px-5 border-t border-ink/40 flex-1 flex flex-col min-h-0">
            {TOPICS.map((t, i) => (
              <li key={i} className="border-b border-ink/40 flex-1 min-h-0 flex flex-col justify-center">
                <button
                  type="button"
                  onClick={() => setOpenTopic(openTopic === i ? null : i)}
                  className="w-full flex items-center gap-2.5 py-1 text-left hover:opacity-70 transition-opacity"
                >
                  <span
                    className="shrink-0 leading-none text-black"
                    style={{ fontSize: "8px" }}
                  >
                    {openTopic === i ? "▼" : "▶"}
                  </span>
                  <span
                    className="uppercase flex-1"
                    /* RM-exact: custom_75139, uniform weight — the number is
                       NOT bolded or dimmed in the design. */
                    style={{
                      fontSize: "11px",
                      lineHeight: "13px",
                      letterSpacing: "0.02em",
                      fontFamily: RM_TEXT,
                    }}
                  >
                    <span className="mr-2">{i + 1}.0</span>
                    {t}
                  </span>
                </button>
                {openTopic === i && (
                  <p
                    className="pb-2 pl-5 text-black/70"
                    style={{ fontSize: "11px", lineHeight: 1.5, fontFamily: RM_TEXT }}
                  >
                    {/* Placeholder answer — fill with the real interview answer */}
                    Coming soon — full interview answer for this topic.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── MY STORY: bio on top, main portrait, thumbnail picker at the bottom ──
          Bio text sits directly under the title; the main portrait (reduced
          height) spans the FULL modal width; a 4-up thumbnail row pinned to the
          bottom lets the visitor switch which photo is shown. */}
      {kind === "story" && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Client feedback: TEXT sits ABOVE the picture. RM-exact body:
              custom_75139 (the RM Helvetica), 6px/9px/+0.1px at the 1024 stage
              ⇒ 9.5px/1.5/0.15px, uppercase, paragraph gap ~10px. */}
          <div className="px-5 mt-3 mb-3 space-y-[10px] shrink-0">
            {BIO_BY[producer].map((para, i) => (
              <p
                key={i}
                className="text-black/85 uppercase"
                style={{ fontSize: "9.5px", lineHeight: 1.5, letterSpacing: "0.15px", fontFamily: RM_TEXT, fontWeight: 400 }}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Main image — RM insets it ~5px from the panel edges, with an
              optional serif caption overlaid. */}
          <div className="relative flex-1 min-h-0 overflow-hidden mx-[5px]">
            <img
              src={storySlides[storyIdx]?.src}
              alt={name}
              /* Center crop, as in the mockup — the photos' baked-in captions
                 sit mid-frame. */
              className="absolute inset-0 w-full h-full object-cover select-none"
              draggable={false}
            />
            {storySlides[storyIdx]?.caption && (
              <p
                className="absolute inset-x-0 top-[38%] text-center text-[#F8F5E4] px-6"
                style={{ fontSize: "17px", lineHeight: 1.3, fontFamily: "Georgia, 'Times New Roman', serif", textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}
              >
                {storySlides[storyIdx].caption}
              </p>
            )}
          </div>

          {/* Thumbnail strip — selects the main image. Inactive thumbs carry a
              10%-opacity #F8F5E4 veil that clears on hover (client spec).
              Hidden while there's only one (placeholder) photo. */}
          {/* RM-exact: 56px square thumbs, 8px gap at the 1024 stage ⇒ 87px / 12px. */}
          {storySlides.length > 1 && (
          <div className="flex gap-[12px] px-[23px] py-3 shrink-0">
            {storySlides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => setStoryIdx(i)}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === storyIdx}
                className="group/thumb relative w-[87px] h-[87px] shrink-0 overflow-hidden"
              >
                <img
                  src={s.src}
                  alt=""
                  className="w-full h-full object-cover object-top select-none"
                  draggable={false}
                />
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${
                    i === storyIdx ? "opacity-0" : "opacity-10 group-hover/thumb:opacity-0"
                  }`}
                  style={{ background: "#F8F5E4" }}
                />
              </button>
            ))}
          </div>
          )}
        </div>
      )}

      {/* ── COFFEES: producer's coffees in a paginated 2-column grid ── */}
      {kind === "coffees" && (
        /* Fill the remaining island height so the grid grows to absorb the
           leftover space instead of leaving a gap above the footer controls. */
        <div className="flex-1 flex flex-col min-h-0">

          {coffees.length === 0 ? (
            <p
              className="px-5 py-10 text-center text-black/50 uppercase"
              style={{ fontSize: "11px", letterSpacing: "0.12em" }}
            >
              No coffees available for this producer yet.
            </p>
          ) : (
          <>
          {/* 2-column grid with thin dividers. Fixed 2 rows (grid-rows-2) so a
              short last page never stretches cards to fill the height and the
              layout stays put across pages. Stable per-product keys (coffee.id)
              prevent the reconciliation garbage that duplicate cleaned names
              (e.g. two "LUMEN") used to cause when paging. */}
          <div className="grid grid-cols-2 grid-rows-2 flex-1 min-h-0">
            {pageCoffees.map((c, i) => (
              <CoffeeCard key={c.id} coffee={c} index={i} />
            ))}
          </div>

          {/* Bottom controls: ‹ arrow · pagination dots · arrow › — pinned to the
              island footer; the flex-1 grid above pushes them down. */}
          <div className="border-t-2 border-ink/40 flex items-center justify-between px-2 py-1 shrink-0">
            <button
              type="button"
              aria-label="Previous"
              onClick={goPrev}
              disabled={coffeePage === 0}
              className="text-black/70 hover:text-black disabled:opacity-25 disabled:hover:text-black/70 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Page ${i + 1}`}
                  onClick={() => setCoffeePage(i)}
                  className="rounded-full transition-colors"
                  style={{
                    width: 6,
                    height: 6,
                    background: i === coffeePage ? "#0e0e0e" : "rgba(14,14,14,0.25)",
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next"
              onClick={goNext}
              disabled={coffeePage >= pageCount - 1}
              className="text-black/70 hover:text-black disabled:opacity-25 disabled:hover:text-black/70 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          </>
          )}
        </div>
      )}
    </aside>
    </div>
  );
};

export default Producers;

import { useEffect, useMemo, useState } from "react";
import BrandLockup from "./BrandLockup";
import { useCrispPitch } from "../hooks/useCrispPitch";
import { useCustomerSession } from "../hooks/useCustomerSession";
import {
  beginAuthRedirect,
  hasStoredSession,
  logout,
  startAuth,
} from "../lib/customerAuth";
import { supabase } from "@/integrations/supabase/client";
import { useShopifyStorefrontProducts } from "../hooks/useShopifyStorefrontProducts";
import type { Product } from "../data/products";
import slidePhoto1 from "../assets/menu-slide-1.webp";
import slidePhoto2 from "../assets/menu-slide-2.webp";
import slidePhoto3 from "../assets/menu-slide-3.webp";
import slidePhoto4 from "../assets/menu-slide-4.webp";
import slidePhoto5 from "../assets/menu-slide-5.webp";
import markLogo from "../assets/company-logo.webp";

// Photos cycled in the left-panel slideshow while the menu is open — the
// client's lifestyle set pulled from the Readymag project (slide 1 is the
// street photo shown in the menu mockup).
const menuSlides = [slidePhoto1, slidePhoto2, slidePhoto3, slidePhoto4, slidePhoto5];

/* Vertical framing for photos whose subject sits too high for a centred crop.
 *
 * The carousel box is `w-full h-[57.5%]`: its width follows the panel and its
 * height follows the viewport, so its shape swings from square to wide —
 * measured 1.00 at 1440x900 up to 1.48 at 2560x1080. object-cover then crops
 * top and bottom evenly, and the wider the box, the more of the top it eats.
 *
 * Slide 2 puts both men's faces in the top 6-17% of the frame, so at five of
 * the seven sizes measured the crop reached 9.6-16.7% and cut them. Pulling
 * the framing to 8% keeps the window starting at ~2.7% even in the worst case,
 * while at the sizes that already worked it moves the photo by a tenth of a
 * percent — invisible.
 *
 * A percentage, not an offset in pixels: the box has no fixed shape, so a
 * fixed nudge would be correct at one screen size and wrong at every other. */
const SLIDE_FOCUS: Record<string, string> = {
  [slidePhoto2]: "50% 8%",
};

// Readymag-faithful typography: the RM-exported Helvetica the mockup was
// composed with (custom_75139 regular / custom_75141 bold, from index.css).
const HELVETICA = "'custom_75139', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const HELVETICA_BOLD = "'custom_75141', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Readymag renders form inputs in the system UI font (not the custom face),
// medium weight. Used for the menu's SEARCH / EMAIL / PASSWORD placeholders.
const SYSTEM = "-apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const searchType = {
  fontFamily: SYSTEM,
  fontWeight: 400,
  fontSize: "9px",
  letterSpacing: "-0.2px",
} as const;

const fieldType = {
  fontFamily: SYSTEM,
  fontWeight: 400,
  fontSize: "10px",
  letterSpacing: "-0.2px",
} as const;

/* The Wholesale Portal's own inputs run larger than the menu's other small
   type — they are a form to be filled, not a label to be read. */
const portalFieldType = { ...fieldType, fontSize: "12px" } as const;

// Readymag-style right column: bold section titles + larger, legible regular
// items in Helvetica, with comfortable vertical rhythm.
const rightTitle = {
  fontFamily: HELVETICA_BOLD,
  fontWeight: 700,
  fontSize: "10px",
  lineHeight: "11px",
  letterSpacing: "normal",
} as const;

const rightItem = {
  fontFamily: HELVETICA,
  fontWeight: 400,
  fontSize: "11px",
  lineHeight: "11px",
  letterSpacing: "-0.2px",
} as const;

/* =========================================================================
 *  MenuOverlay — the single, shared navigation menu used across the whole
 *  site (homepage Header and the internal ShopHeader). There is intentionally
 *  no per-route variant: every page opens exactly this overlay so the menu
 *  component and behaviour stay identical everywhere.
 * ========================================================================= */

const mainNav = [
  { num: "01", label: "HOME", href: "/", active: true },
  { num: "02", label: "SHOP", href: "/shop", active: true },
  { num: "03", label: "ABOUT US", href: "/about", active: false },
  { num: "04", label: "PRODUCERS", href: "/producers", active: true },
  { num: "05", label: "PODCAST", href: "/podcast", active: true },
  { num: "06", label: "BLOG", href: "/blog", active: true },
  { num: "07", label: "WHOLESALE", href: "/wholesale", active: true },
  { num: "08", label: "CONTACT", href: "/contact", active: true },
];

const shopLinks = ["COFFEE", "EQUIPMENT", "APPAREL"];
const infoLinks = [
  "OUR STORY",
  "OUR PHILOSOPHY",
  "ROASTING STYLE",
  "COFFEE SOURCING",
  "PROFIT SHARE MODEL",
  "BREWING",
  "MEDIA KIT",
];
/* Each level deep-links to its own band on /shop — the ids come from the
   CATEGORIES table in Shop.tsx, so "TOP SHELF" lands on "03 TOP SHELF". */
const coffeeLevels = [
  { num: "01", label: "BASE", href: "/shop#cat-base" },
  { num: "02", label: "TOP SHELF", href: "/shop#cat-top-shelf" },
  { num: "03", label: "COMPETITION", href: "/shop#cat-competition" },
  { num: "04", label: "EXOTIC", href: "/shop#cat-exotic" },
  { num: "05", label: "HYPER LIMITED", href: "/shop#cat-hyper-limited" },
];

/* Search results deep-link into the /shop category section that holds the
   product (Shop.tsx section ids). */
const LEVEL_TO_SECTION: Record<Product["level"], string> = {
  "BASE": "cat-base",
  "TOP SHELF": "cat-top-shelf",
  "COMPETITION": "cat-competition",
  "EXOTICS": "cat-exotic",
  "HYPER-LIMITED": "cat-hyper-limited",
  "UNCATEGORIZED": "cat-new-drops",
};

const productHref = (p: Product) => `/shop#${LEVEL_TO_SECTION[p.level] ?? "cat-new-drops"}`;

/* MOBILE_MENU_RHYTHM — client reference, Iteration 2 PDF p17 (the image the
 * "Menu" heading at the end of p16 points at). Mobile only: this file's mobile
 * and desktop menus are two disjoint trees (`lg:hidden` vs `hidden lg:flex`)
 * with no shared class, so none of it reaches the signed-off desktop menu.
 *
 * Same method as MOBILE_CARD_RHYTHM in NewDropsSection: the reference is a shot
 * of the 320-wide Readymag mobile canvas, measured at ÷2.0125, and distances are
 * between ink (glyph cap top/bottom, rule, mark edges).
 *
 *   header rule       ──┐            reference puts this at y 54.2
 *                       │ 19.9  (to the LOGIN line box)
 *   LOGIN               ┤ 10px bold, cap 7.2
 *                       │ 3.9
 *   CREATE ACCOUNT      ┤ 10px bold          → pitch 15.9
 *                       │ 36.2
 *   HOME                ┤ 24px bold, cap 17.2
 *                       │ 7.8                → pitch 35.8, ×8 items
 *   CONTACT             ┘
 *                       │ 38.9
 *   WHOLESALE PORTAL    ┤ 10px bold
 *                       │ 26.7
 *   ⊥ mark              ┤ 28.3 tall
 *
 * The band above the rule is the shared MOBILE_BAND_* geometry, so it is the
 * reference's own 54.2 and the close button lands exactly on the page header's
 * hamburger. This block first shipped with the band left at 72, which put the
 * whole column ~19px below the reference — that gap closed when the Home block
 * brought MobileBrandHeader onto the same measurements.
 *
 * Values are min(Xvw, cap) as elsewhere: the 320 design scaled by viewport
 * width, frozen at the 430px-wide equivalent.
 */

/* Small bold links (LOGIN / CREATE ACCOUNT / WHOLESALE PORTAL): 10px on the 320
   canvas. Tracking is -0.05em, not the -0.2px this used to carry — measured
   against the reference, "CREATE ACCOUNT" is 87.0 wide where our face sets it
   at 93.9, and LOGIN 28.3 against 31.7. */
const MOBILE_MINOR_LINK =
  "uppercase text-ink hover:opacity-60 text-[min(3.13vw,13.4px)] leading-[min(3.75vw,16.1px)] tracking-[-0.05em]";

/* Punctuation is noise in a product search: the catalogue writes "Thermal
   Shock" while people type "thermal-shock", and either has to find the other.
   Fold every separator to a single space and compare on that. */
const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** The product's searchable text, normalized, as one haystack. */
const haystack = (p: Product) =>
  normalize(
    [p.title, p.origin, p.producer, p.process, ...(p.tastingNotes ?? [])]
      .filter(Boolean)
      .join(" "),
  );

/* Every word of the query must appear, in any order and any field — so
   "golden hour" and "hour golden" both find the coffee, and a second word
   narrows the result instead of discarding it. */
const matchesQuery = (p: Product, tokens: string[]) => {
  const hay = haystack(p);
  return tokens.every((t) => hay.includes(t));
};

/* The catalogue carries a "Wholesale - X" twin of many retail coffees, and
   both match the same search. Collapse them to one row, keeping the retail
   entry when it exists — the menu's search is the storefront's, and a
   duplicate pair reads as two different coffees. A wholesale-only product
   still shows (under its cleaned-up name) so nothing becomes unfindable. */
const WHOLESALE_PREFIX = /^\s*wholesale\s*[-–—]\s*/i;
const retailTitle = (p: Product) => p.title.replace(WHOLESALE_PREFIX, "").trim();

const dedupeByTitle = (list: Product[]): Product[] => {
  const byName = new Map<string, Product>();
  list.forEach((p) => {
    const key = normalize(retailTitle(p));
    const kept = byName.get(key);
    if (!kept) {
      byName.set(key, p);
      return;
    }
    // Prefer the entry that is NOT the wholesale twin.
    if (WHOLESALE_PREFIX.test(kept.title) && !WHOLESALE_PREFIX.test(p.title)) {
      byName.set(key, p);
    }
  });
  return [...byName.values()];
};

/* Shared mobile top-band geometry. The page header (MobileBrandHeader) and this
 * overlay's own band MUST draw the icon in the same place, or it jumps the
 * moment the menu opens. Both live here because MobileBrandHeader already
 * imports HamburgerIcon from this file — putting them the other way round would
 * make the two modules import each other.
 *
 * The reference draws the icon identically on every page (Iteration 2 PDF p14,
 * p17 and p18 all measure bars at y 18.9–24.9, x 288.3–314.1, 25.8 wide) and
 * puts the rule under the band at y 54.2, on the 320 canvas.
 *
 * This used to be "same px-4 / pt-3 as the header, so it does not shift" — but
 * only the padding was shared. The header draws Readymag's 26px-wide icon while
 * the overlay drew the default 36px one, so the two never actually lined up.
 */
/* Inset from the viewport edge. The reference clusters every left edge between
   6.5 and 7.5 on the 320 canvas (coordinates 7.5, section titles 7.2 on Home and
   6.5 on Shop, the Shop category nav 6.5) and our text renders ~0.5 right of its
   padding from the glyph's side bearing — so 7 puts the coordinates on 7.5
   exactly and everything else within a pixel. */
export const MOBILE_BAND_EDGE = 7;
export const MOBILE_BAND_RULE_Y = 55;   // top of the rule that closes the band
export const MOBILE_BAND_ICON_TOP = 8;  // button top; HamburgerIcon adds pt-11

/* Readymag draws the mobile icon as two 1px strokes 26 wide, 5 apart, on the 320
   canvas. Width and pitch both scale from that ratio, capped together at ~430px
   of viewport so they do not drift apart. The pitch goes through useCrispPitch
   rather than a plain vw so it lands on the device pixel grid — otherwise one of
   the two hairlines rasterises thinner than the other. */
export const MOBILE_BAND_ICON_WIDTH = "w-[min(8.125vw,35px)]";
export const MOBILE_BAND_ICON_BAR = "bg-black/50";
export const MOBILE_BAND_PITCH_RATIO = 5 / 320;
export const MOBILE_BAND_PITCH_MAX = (5 / 26) * 35;

export const HamburgerIcon = ({
  large = false,
  barClass = "bg-black",
  widthClass,
  gapClass,
  gapPx,
  topPadClass,
}: {
  large?: boolean;
  /** Tailwind background-color class for the bars (defaults to solid black so
   *  the thin 1px lines read with full weight). Readymag draws these at
   *  `rgba(0,0,0,0.5)`, so surfaces matching RM pass `bg-black/50`. */
  barClass?: string;
  /** Overrides the bar width (default w-9, or w-12 when `large`). */
  widthClass?: string;
  /**
   * Overrides the gap between the two bars; defaults to the desktop icon's
   * signed-off 5px.
   *
   * Keep the resulting PITCH (1px bar + gap) a whole number of device pixels: a
   * 1px hairline rasterises differently depending on where it lands in the
   * device-pixel grid, and the two bars only share a sub-pixel phase when
   * pitch × devicePixelRatio is an integer. The 6px pitch from the default 5px
   * gap is 7.5 device px at 1.25 dpr — half a pixel — so the top bar smears
   * over two rows and reads thinner than the bottom one. 4px is the smallest
   * pitch that stays whole at 1.25, 1.5, 2 and 3 dpr. This is also why the gap
   * is a fixed length rather than a fluid one: a vw value lands on fractional
   * pitches at essentially every width. scripts/probe-hamburger.cjs sweeps
   * widths × dprs and reports any phase mismatch.
   */
  gapClass?: string;
  /**
   * Renders the RM-proportioned SVG icon instead of the two-`span` stack.
   *
   * The span version can't scale its gap: its 1px hairlines only rasterise
   * identically when the pitch is a whole number of device pixels, which pins
   * the gap to a fixed 4px while the bar width grows. Here the whole icon is
   * one SVG on Readymag's 26×6 grid (1px strokes, 5px pitch), so width, height
   * and spacing all scale together from a single `width` — the proportions stay
   * identical on every screen. `shape-rendering="crispEdges"` turns off
   * antialiasing so both strokes snap to the pixel grid the same way instead of
   * one smearing across two rows.
   */
  /**
   * Exact gap in CSS px, applied inline (overrides `gapClass`). Use with
   * `useCrispPitch`, which sizes it against the real device pixel grid so the
   * icon can scale with the screen and still render both bars identically.
   */
  gapPx?: number;
  /**
   * Overrides the default 11px top nudge. Headers that need the bars to sit on
   * the same top edge as the logo and the locations pass "pt-0"; everywhere
   * else keeps the nudge, which several surfaces are positioned against.
   */
  topPadClass?: string;
}) => {
  const w = widthClass ?? (large ? "w-12" : "w-9");
  // pt nudges the whole icon down and the smaller gap pulls the two bars closer
  // together. items-end right-aligns the bars, so widening them grows leftward.
  return (
    <div
      className={`flex flex-col items-end ${topPadClass ?? "pt-[11px]"} ${gapPx == null ? gapClass ?? "gap-[5px]" : ""}`}
      style={gapPx == null ? undefined : { gap: `${gapPx}px` }}
    >
      <span className={`block ${barClass} h-px ${w}`} />
      <span className={`block ${barClass} h-px ${w}`} />
    </div>
  );
};

type MenuOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const MenuOverlay = ({ open, onClose }: MenuOverlayProps) => {
  // Same crisp-pitch hairline spacing the page header's icon uses.
  const bandPitch = useCrispPitch(MOBILE_BAND_PITCH_RATIO, MOBILE_BAND_PITCH_MAX);
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Product search: fetch (react-query cached, shared with /shop) only once
  // the user actually types a query, never on plain page loads.
  const query = search.trim().toLowerCase();
  const { data: products } = useShopifyStorefrontProducts(open && query.length >= 2);
  const results = useMemo(() => {
    if (query.length < 2 || !products) return [];
    const tokens = normalize(query).split(" ").filter(Boolean);
    if (tokens.length === 0) return [];
    return dedupeByTitle(products.filter((p) => matchesQuery(p, tokens))).slice(0, 6);
  }, [products, query]);

  // Clear the query whenever the menu closes so it reopens clean.
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  /* Account state. The lookup is deferred until the menu is actually opened, so
     browsing the site costs no session requests. `hasStoredSession()` gives the
     first paint the right labels for a returning customer instead of flashing
     LOGIN at them; the verified answer replaces it a moment later. */
  const { customer, unauthenticated } = useCustomerSession(open);
  const [assumeLoggedIn] = useState(() => hasStoredSession());
  const loggedIn = customer ? true : unauthenticated ? false : assumeLoggedIn;
  const [signingOut, setSigningOut] = useState(false);

  const onLogout = async () => {
    setSigningOut(true);
    await logout();
    // Full reload so every page-level session read starts clean.
    window.location.href = "/";
  };

  /* Wholesale Portal box. Its two fields map onto the portal's two independent
     gates: the PASSWORD is the shared wholesale password (grants access) and the
     EMAIL starts the Shopify login (proves identity). Entry needs both, so the
     box verifies the password first and only then hands off to Shopify — the
     gate on /wholesale-copy re-checks both on the way back. */
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  const onPortalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPortalError(null);
    setPortalBusy(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "verify-wholesale-password",
        { body: { password } },
      );
      if (error || data?.error || !data?.token) {
        setPortalError("Wrong password.");
        setPassword("");
        setPortalBusy(false);
        return;
      }
      localStorage.setItem("wholesale-copy-token", data.token);
      sessionStorage.setItem("post_login_redirect", "/wholesale-copy");
    } catch {
      setPortalError("Something went wrong. Please try again.");
      setPortalBusy(false);
      return;
    }

    const auth = await startAuth(email);
    if (auth.ok && beginAuthRedirect(auth.data)) return;
    setPortalError("Couldn't start login. Please try again.");
    setPortalBusy(false);
  };
  const [slide, setSlide] = useState(0);
  // When false, the carousel track snaps instantly (used to loop seamlessly
  // from the cloned first slide back to the real first slide).
  const [animate, setAnimate] = useState(true);

  // Advance the left-panel carousel only while the menu is open.
  useEffect(() => {
    if (!open) return;
    setSlide(0);
    setAnimate(true);
    const id = setInterval(() => {
      setSlide((s) => s + 1);
    }, 3000);
    return () => clearInterval(id);
  }, [open]);

  // Seamless loop: once we slide onto the cloned first image (index === length),
  // wait for the transition to finish, then snap back to the real first image
  // without animation so the leftward motion reads as continuous.
  useEffect(() => {
    if (slide === menuSlides.length) {
      const t = setTimeout(() => {
        setAnimate(false);
        setSlide(0);
      }, 700);
      return () => clearTimeout(t);
    }
    if (!animate) {
      const r = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(r);
    }
  }, [slide, animate]);

  // Lock body scroll while the overlay is open (preserve + restore position).
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    const preventWheel = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", preventWheel, { passive: false });
    window.addEventListener("touchmove", preventWheel, { passive: false });

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.removeEventListener("wheel", preventWheel);
      window.removeEventListener("touchmove", preventWheel);
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-150 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Click-outside catcher — page stays visible underneath, no overlay tint */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* ── Mobile menu — single centred column (the three-panel layout below is
          desktop only). Same destinations, different composition. ── */}
      <div className="lg:hidden relative flex h-full w-full flex-col bg-bg-cream">
        {/* Band geometry AND icon config both come from the shared constants
            above — matching only the padding is what let the icon jump. */}
        <div
          className="flex items-start justify-end shrink-0"
          style={{
            height: MOBILE_BAND_RULE_Y,
            paddingLeft: MOBILE_BAND_EDGE,
            paddingRight: MOBILE_BAND_EDGE,
            paddingTop: MOBILE_BAND_ICON_TOP,
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="pl-3 pr-0 hover:opacity-60 transition-opacity"
          >
            <HamburgerIcon
              barClass={MOBILE_BAND_ICON_BAR}
              widthClass={MOBILE_BAND_ICON_WIDTH}
              gapPx={bandPitch - 1}
            />
          </button>
        </div>
        <div className="border-t border-black shrink-0" />

        {/* Flows DOWN from the header rule — it must NOT be justify-center. A
            centred flex column that overflows pushes the excess out BOTH ends,
            and content above a scroll container's origin cannot be scrolled to:
            at 320×568 the LOGIN / CREATE ACCOUNT pair sat behind the header band
            with no way to reach it, and the ⊥ mark was cut off the bottom. Only
            viewports tall enough to fit the whole column ever showed them.
            See MOBILE_MENU_RHYTHM for where each gap comes from. */}
        <div className="flex-1 flex flex-col items-center overflow-y-auto min-h-0 px-6 pb-6">
          {/* Account links */}
          <div className="flex flex-col items-center gap-[min(1.22vw,5.2px)] mt-[min(6.22vw,26.7px)]">
            {loggedIn ? (
              <>
                <a
                  href="/account"
                  onClick={onClose}
                  className={MOBILE_MINOR_LINK}
                  style={{ fontFamily: HELVETICA_BOLD, fontWeight: 700 }}
                >
                  My Account
                </a>
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={signingOut}
                  className={`${MOBILE_MINOR_LINK} disabled:opacity-40`}
                  style={{ fontFamily: HELVETICA_BOLD, fontWeight: 700 }}
                >
                  {signingOut ? "Logging out…" : "Logout"}
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={onClose}
                  className={MOBILE_MINOR_LINK}
                  style={{ fontFamily: HELVETICA_BOLD, fontWeight: 700 }}
                >
                  Login
                </a>
                <a
                  href="/signup"
                  onClick={onClose}
                  className={MOBILE_MINOR_LINK}
                  style={{ fontFamily: HELVETICA_BOLD, fontWeight: 700 }}
                >
                  Create Account
                </a>
              </>
            )}
          </div>

          {/* Main navigation */}
          <nav className="flex flex-col items-center gap-[min(2.44vw,10.5px)] mt-[min(11.31vw,48.6px)]">
            {mainNav.map((item) => (
              <a
                key={item.label}
                href={item.active ? item.href : undefined}
                onClick={item.active ? onClose : undefined}
                // Same colour for every entry — an item without a destination is
                // simply not clickable, but never looks disabled.
                // 24px in a 28px line box on the 320 canvas (was 30/36), and
                // -0.075em of tracking rather than -0.8px: at the reference's
                // size our face sets "WHOLESALE" at 153 against its 139, and
                // "PRODUCERS" at 153 against 138. See MOBILE_MENU_RHYTHM.
                className={`uppercase text-ink text-[min(7.5vw,32.3px)] leading-[min(8.75vw,37.6px)] tracking-[-0.075em] ${
                  item.active ? "hover:opacity-50 cursor-pointer" : "cursor-default pointer-events-none"
                }`}
                // The 4-way textShadow that used to fatten these is gone. It was
                // calibrated at 30px; at the reference's 24px the same 0.4px
                // offsets are proportionally half again as heavy, and since a
                // shadow adds ink without changing advance width, it closed up
                // the counters and the gaps between letters — the line matched
                // the reference's width while reading visibly heavier than it.
                // custom_75141 ships only a 700 weight, and plain 700 is what
                // the reference shows.
                style={{ fontFamily: HELVETICA_BOLD, fontWeight: 700 }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Wholesale portal + ⊥ mark. The mark is sized by HEIGHT with width
              auto — the reference draws it 22.9×28.3, so the old 44×44 square
              both oversized it and squared off its proportion. The box is 29.7
              rather than 28.3 because company-logo.webp carries transparent
              padding: at 28.3 the drawn mark came out 27.0, and 28.3/27.0
              scales the box to put the STROKE on the reference's height. */}
          <div className="flex flex-col items-center gap-[min(8.34vw,35.9px)] mt-[min(12.16vw,52.3px)]">
            <a
              href="/wholesale"
              onClick={onClose}
              className={MOBILE_MINOR_LINK}
              style={{ fontFamily: HELVETICA_BOLD, fontWeight: 700 }}
            >
              Wholesale Portal
            </a>
            <img
              src={markLogo}
              alt=""
              className="h-[min(9.27vw,39.8px)] w-auto object-contain shrink-0"
            />
          </div>
        </div>
      </div>

      <div className="relative hidden lg:flex h-full">

        {/* ── Left panel: brand composition (large logo + photo slideshow) ──
            Fills what used to be empty space so the menu reads as a full-screen
            page, not a partial right-side drawer. */}
        <div className="hidden lg:flex flex-1 flex-col min-h-0 bg-bg-cream relative">
          {/* pt matches the search pill's own top offset in the right panel, so
              the wordmark and the search sit on one horizontal line across the
              three columns. Change both together or the alignment breaks. */}
          <div className="pl-[14px] pr-2 pt-[6px]">
            {/* Wordmark letters sit slightly taller than the 75px center-nav
                labels (user-approved size; sublines scale with the lockup). */}
            <BrandLockup className="w-full max-w-[290px] pb-5" />
          </div>
          {/* Carousel pinned flush to the bottom-left corner, with no
              surrounding margin. The block fills the bottom ~57.5% of the
              viewport (top edge at 42.5%, as in the client mockup) and the
              photos crop to fit (object-cover, no letterboxing). Images slide
              horizontally to the left like a continuous side carousel (the track
              holds a clone of the first image so the loop is seamless). */}
          <div className="absolute bottom-0 left-0 w-full h-[57.5%] overflow-hidden border-t-2 border-ink/40">
            <div
              className="flex h-full w-full"
              style={{
                transform: `translateX(-${slide * 100}%)`,
                transition: animate ? "transform 700ms ease-in-out" : "none",
              }}
            >
              {[...menuSlides, menuSlides[0]].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  style={{ objectPosition: SLIDE_FOCUS[src] ?? "50% 50%" }}
                  className="w-full h-full shrink-0 object-cover"
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Center panel: main nav ── */}
        <div className="flex flex-col flex-1 lg:w-[36%] lg:flex-none border-x-2 border-ink/40 min-h-0 bg-bg-cream">
          <div className="flex items-center justify-end h-[72px] lg:h-3 px-7 shrink-0 lg:pointer-events-none">
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 hover:opacity-60 transition-opacity lg:invisible"
            >
              <HamburgerIcon />
            </button>
          </div>
          {/* pt-4 (not pt-2) puts the cap top of the first label — 8px below the
              link box, see the number's marginTop — on the same line as LOGIN in
              the right panel. */}
          {/* overflow-y-auto is a safety net, not a feature: the eight labels
              are a fixed ~650px tall, so below roughly 700px of viewport the
              last one (CONTACT) would sit off-screen with no way to reach it —
              the same trap the mobile column already guards against. */}
          <nav className="flex-1 flex flex-col justify-start px-7 lg:px-6 pt-10 pb-8 gap-[6px] min-h-0 overflow-y-auto">
            {mainNav.map((item) => (
              <a
                key={item.label}
                href={item.active ? item.href : undefined}
                onClick={item.active ? onClose : undefined}
                className={`group flex items-start gap-2 ${
                  item.active
                    ? "hover:opacity-60 cursor-pointer"
                    : "cursor-default pointer-events-none"
                }`}
              >
                <span
                  className="shrink-0"
                  style={{
                    fontFamily: HELVETICA,
                    fontWeight: 400,
                    fontSize: "11px",
                    lineHeight: "13px",
                    letterSpacing: "-0.2px",
                    color: "#000000",
                    // Aligns the number's top with the label's cap top (the
                    // 75px line box has ~8px of leading above the caps).
                    marginTop: "8px",
                  }}
                >
                  {item.num}
                </span>
                <span
                  className="uppercase whitespace-nowrap"
                  style={{
                    fontFamily: HELVETICA,
                    fontWeight: 400,
                    fontSize: "75px",
                    lineHeight: "75px",
                    letterSpacing: "-2px",
                    paddingBottom: "1px",
                    color: "#000000",
                  }}
                >
                  {item.label}
                </span>
              </a>
            ))}
          </nav>
        </div>

        {/* ── Right panel: inline search + close in the top row, then links ── */}
        <div className="hidden lg:flex w-[28%] flex-col min-h-0 bg-bg-cream relative">
          <div className="flex items-center gap-2 h-[32px] px-5 shrink-0">
            <div className="relative flex items-center w-[58%] min-w-0 ml-auto border-[0.5px] border-ink/30 rounded-full px-4 h-[20px]">
              <input
                type="text"
                placeholder="SEARCH"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) {
                    window.location.href = productHref(results[0]);
                    onClose();
                  }
                }}
                style={searchType}
                className="w-full bg-transparent text-left uppercase placeholder:text-ink/40 text-ink outline-none"
              />
              {/* Results dropdown — RM-style tiny uppercase rows on cream. */}
              {query.length >= 2 && (
                <div className="absolute left-0 right-0 top-full mt-[4px] z-10 bg-bg-cream border-[0.5px] border-ink/30 rounded-[10px] py-[5px] overflow-hidden">
                  {results.length === 0 ? (
                    <p className="px-4 py-[3px] uppercase text-ink/40" style={searchType}>
                      No results
                    </p>
                  ) : (
                    results.map((p) => (
                      <a
                        key={p.id}
                        href={productHref(p)}
                        onClick={onClose}
                        className="flex items-center gap-2 px-3 py-[3px] uppercase text-ink hover:opacity-50"
                        style={searchType}
                      >
                        {/* The thumbnail is what makes a row scannable — the
                            names alone read as a wall of text. It is decorative
                            (the title carries the meaning), hence empty alt. */}
                        {p.image ? (
                          <img
                            src={p.image}
                            alt=""
                            loading="lazy"
                            className="h-[22px] w-[22px] shrink-0 rounded-[3px] object-cover bg-ink/5"
                          />
                        ) : (
                          <span className="h-[22px] w-[22px] shrink-0 rounded-[3px] bg-ink/5" />
                        )}
                        <span className="truncate flex-1 min-w-0">{retailTitle(p)}</span>
                        <span className="shrink-0 text-ink/40">{p.level !== "UNCATEGORIZED" ? p.level : ""}</span>
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* The icon's optical centre — the midpoint between its two bars —
                sits on the same line as the logo's top edge and the search
                pill's top. HamburgerIcon carries its own pt-[11px] + 5px gap
                inside the button's p-2, putting that midpoint 22.5px below the
                row's top; the offset lifts it onto the 6px line. self-start is
                load-bearing: under items-center flexbox absorbs half of a
                negative margin, so the shift would only half apply. */}
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 shrink-0 self-start hover:opacity-60 transition-opacity"
              style={{ marginTop: "-8px" }}
            >
              <HamburgerIcon />
            </button>
          </div>
          {/* Bottom padding reserves room for the pinned Wholesale Portal so
              MEDIA KIT etc. can always scroll clear of it on short screens. */}
          {/* pt keeps LOGIN on the same line as the first nav label: it has to
              absorb the 32px search row above it, so it moves in step with the
              nav's own pt whenever that block is nudged. */}
          {/* pb reserves room for the pinned Wholesale Portal below. It must
              clear the block's TALLEST case — the title wraps to two lines on
              narrow desktops — or MEDIA KIT ends up hidden behind it. */}
          <div className="flex-1 flex flex-col gap-16 pl-[13px] pr-7 pt-7 pb-[250px] overflow-y-auto overflow-x-hidden min-h-0">
            <div className="flex flex-col gap-[5px]">
              {loggedIn ? (
                <>
                  <a href="/account" onClick={onClose}
                    className="w-fit uppercase text-ink hover:opacity-60"
                    style={{ ...rightTitle, fontSize: "10px", lineHeight: "12px" }}>
                    My Account
                  </a>
                  <button type="button" onClick={onLogout} disabled={signingOut}
                    className="w-fit uppercase text-left text-ink hover:opacity-60 disabled:opacity-40 cursor-pointer"
                    style={{ ...rightTitle, fontSize: "10px", lineHeight: "12px" }}>
                    {signingOut ? "Logging out…" : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <a href="/login" onClick={onClose}
                    className="w-fit uppercase text-ink hover:opacity-60"
                    style={{ ...rightTitle, fontSize: "10px", lineHeight: "12px" }}>
                    Login
                  </a>
                  <a href="/signup" onClick={onClose}
                    className="w-fit uppercase text-left text-ink hover:opacity-60 cursor-pointer"
                    style={{ ...rightTitle, fontSize: "10px", lineHeight: "12px" }}>
                    Create Account
                  </a>
                </>
              )}
            </div>
            <div>
              <p className="text-ink mb-[7px] uppercase" style={rightTitle}>Shop</p>
              <div className="space-y-[5px]">
                {shopLinks.map((link) => (
                  <a key={link} href="/shop" onClick={onClose}
                    style={rightItem}
                    className="block text-ink hover:opacity-50 uppercase">
                    {link}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-ink mb-[7px] uppercase" style={rightTitle}>Coffee Levels</p>
              <div className="space-y-[5px]">
                {coffeeLevels.map((level) => (
                  <div key={level.label} className="flex items-baseline gap-[4px]">
                    <span className="text-ink shrink-0 w-[13px]" style={{ ...rightItem, fontWeight: 700, fontFamily: HELVETICA_BOLD }}>{level.num}</span>
                    <a href={level.href} onClick={onClose}
                      style={rightItem}
                      className="text-ink hover:opacity-50 uppercase">
                      {level.label}
                    </a>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-[40px]">
              <p className="text-ink mb-[7px] uppercase" style={rightTitle}>Info</p>
              <div className="space-y-[5px]">
                {infoLinks.map((link) => (
                  <a key={link} href="#" onClick={(e) => e.preventDefault()}
                    style={rightItem}
                    className="block text-ink hover:opacity-50 uppercase cursor-pointer">
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>
          {/* Wholesale Portal pinned to the bottom of the right panel (as in
              the client mockup) — outside the scroll flow, so it is always
              fully visible regardless of viewport height and never pushes the
              LOGIN pill below the fold. */}
          {/* pl matches the links column above (pl-[13px]), so LOGIN, SHOP,
              COFFEE LEVELS, INFO and this block all start on one left axis.
              The extra pt lifts the rule slightly off the content below it. */}
          <div className="absolute bottom-0 left-0 right-0 bg-bg-cream border-t border-ink/40 pt-[18px] pl-[13px] pr-7 pb-[18px]">
            {/* A fixed max-width instead of w-fit: the inputs used to inherit
                whatever width the title happened to render at, which coupled
                their size to the font size. Capping the group lets the fields be
                wider than the title without either overflowing the panel. */}
            <div className="w-full max-w-[340px]">
              <p className="uppercase mb-8" style={{ ...rightTitle, fontFamily: HELVETICA, fontWeight: 400, fontSize: "31px", lineHeight: "31px", letterSpacing: "-0.7px" }}>Wholesale Portal</p>
              {loggedIn ? (
                /* Already signed in — showing a login form would ask them to do
                   what they have already done, so the box is just the way in. */
                <a href="/wholesale-copy" onClick={onClose}
                  style={{ fontFamily: SYSTEM, fontWeight: 700, fontSize: "10px", letterSpacing: "-0.2px" }}
                  className="inline-flex items-center justify-center w-[130px] bg-ink text-bg-cream rounded-full h-[22px] hover:opacity-80 uppercase">
                  Enter Portal
                </a>
              ) : (
                <form onSubmit={onPortalSubmit} className="flex flex-col gap-[6px]">
                  <input
                    type="email"
                    placeholder="EMAIL"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setPortalError(null);
                    }}
                    style={portalFieldType}
                    className="w-full border-[0.5px] border-ink/70 rounded-full px-4 h-[28px] bg-transparent uppercase placeholder:text-black placeholder:font-bold text-ink outline-none"
                  />
                  <input
                    type="password"
                    placeholder="PASSWORD"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPortalError(null);
                    }}
                    style={portalFieldType}
                    className="w-full border-[0.5px] border-ink/70 rounded-full px-4 h-[28px] bg-transparent uppercase placeholder:text-black placeholder:font-bold text-ink outline-none"
                  />
                  <button
                    type="submit"
                    disabled={portalBusy || !email || !password}
                    style={{ fontFamily: SYSTEM, fontWeight: 700, fontSize: "10px", letterSpacing: "-0.2px" }}
                    className="inline-flex items-center justify-center w-[130px] bg-ink text-bg-cream rounded-full h-[22px] mt-[5px] hover:opacity-80 disabled:opacity-40 uppercase">
                    {portalBusy ? "Checking…" : "Login"}
                  </button>
                  {portalError && (
                    <p style={fieldType} className="text-red-600 mt-[2px]" aria-live="polite">
                      {portalError}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MenuOverlay;

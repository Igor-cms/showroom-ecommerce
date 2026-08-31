import { useState, type CSSProperties, type FormEvent } from "react";
import WholesaleHeader from "../components/WholesaleHeader";
import { toast } from "@/hooks/use-toast";
import SiteFooterBar from "../components/SiteFooterBar";

/* =========================================================================
 *  /contact  —  Contact page modelled on the Readymag reference scene, set
 *  on the site's light ground and sharing the WHOLESALE REQUEST chrome.
 *
 *  Layout mirrors the original CONTACT page: a right-hand column holds a
 *  "CLICK HERE FOR WHOLESALE INQUIRIES" pill, the large "CONTACT" wordmark,
 *  and the contact form (NAME / EMAIL / TOPIC dropdown / YOUR MESSAGE /
 *  SUBMIT). Palette + field rules match the WHOLESALE REQUEST page — #efe9d7
 *  ground, black ink, and the same full-width `border-b border-black` field
 *  lines that run all the way to the right edge.
 * ========================================================================= */

/* Client PDF: main content background EBE7D8, buttons BAB5A4. */
const BG = "#EBE7D8";
const HELVETICA = "'Helvetica', Arial, sans-serif";
/* Readymag-exported faces (index.css) — the reference page is set in these. */
const RM_TEXT = "'custom_75139', Helvetica, Arial, sans-serif";
const RM_BOLD = "'custom_75141', Helvetica, Arial, sans-serif";
const BTN_BG = "#BAB5A4";

/* --------------------------------------------------------------------------
 *  `--u` — one Readymag canvas pixel, expressed in CSS px.
 *
 *  Every `lg:` measure below is written as `calc(N * var(--u))`, where N is the
 *  value read straight off the 1024-wide RM canvas. Readymag itself scales the
 *  canvas by WIDTH alone and simply lets the excess fall off the top and bottom
 *  of the window (measured on the live page: at 1600x900 it clips ~95px at each
 *  end). That is fine for a portfolio viewer but not for a real form — it would
 *  push SUBMIT off screen — and scaling by width alone here made the page
 *  scroll on every common laptop (88px at 1366x768, 116px at 1440x780).
 *
 *  So `--u` takes the SMALLER of the two ratios. The scale stays uniform, so
 *  the composition is never stretched the way locking it to the viewport did;
 *  and the page always fits, so it still never scrolls. When height is the
 *  binding constraint the block simply gets smaller and the slack lands in the
 *  left-hand column — which is empty ground in the reference anyway.
 * -------------------------------------------------------------------------- */
const CANVAS_W = 1024;
/* Height of the form block in canvas px, measured between the header and the
   footer with scripts/rm-compare/contact-uniform-check.cjs. Round UP: an
   over-estimate only shrinks `--u` a hair, while an under-estimate puts the
   block back over the fold. If the composition gains or loses a row, re-measure. */
const BLOCK_H = 562.8;
/* WholesaleHeader (60) + SiteFooterBar (55). Both are shared components with a
   fixed pixel height at every width, so they sit outside the scaled canvas. */
const CHROME_H = 115;
const CANVAS_UNIT = `min(${(100 / CANVAS_W).toFixed(6)}vw, calc((100vh - ${CHROME_H}px) / ${BLOCK_H}))`;

// The TOPIC dropdown options, verbatim from the reference form.
const TOPICS = ["EVENT RENTAL", "OTHER"];

/* Underlined field — identical chrome to the WHOLESALE REQUEST page:
   a full-width wrapper with a 1px black baseline, transparent control. */
const Field = ({
  name,
  label,
  value,
  onChange,
  type = "text",
  textarea = false,
  inputMode,
  autoComplete,
  grow = false,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
  inputMode?: "email";
  autoComplete?: string;
  /** When set, the field stretches to fill remaining height so its baseline
   *  rule sits directly above whatever follows it (used by YOUR MESSAGE). */
  grow?: boolean;
}) => (
  <div
    /* RM mobile row pitch is 25px on the 320 canvas (⇒ 7.8vw): a short input
       with its rule directly beneath, then a gap before the next label. The
       extra bottom margin supplies that gap on mobile only. */
    /* The `- 1px` / `+ 1px` terms cancel the underline, which is a hairline that
       deliberately does NOT scale. Without them the row pitch comes out as
       `16u + 1px` instead of a flat 17u, so it drifted from 16.9 canvas px on a
       small screen to 16.3 on a 4K one. */
    className={`border-b border-ink/40 px-0 py-[3px] lg:py-[calc(1.4*var(--u))]${
      grow
        ? " flex-1 flex flex-col min-h-0 lg:flex-none lg:h-[calc(194.8*var(--u)_+_1px)]"
        : " mb-[min(1.9vw,8px)] lg:mb-[calc(5.2*var(--u)_-_1px)]"
    }`}
  >
    {/* PDF: form text a little smaller (15→13px); typed text solid black,
        placeholder keeps the current muted tone. Row pitch matches the RM
        reference (~28px per field). */}
    {textarea ? (
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        rows={grow ? undefined : 4}
        style={{ fontFamily: HELVETICA, fontWeight: 400, color: "#000000" }}
        className={`text-[min(2.8125vw,12.1px)] lg:text-[calc(9*var(--u))] lg:leading-[calc(12*var(--u))] w-full bg-transparent outline-none placeholder:text-black/60 resize-none${
          grow ? " flex-1 min-h-0" : ""
        }`}
      />
    ) : (
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        inputMode={inputMode}
        autoComplete={autoComplete}
        style={{ fontFamily: HELVETICA, fontWeight: 400, color: "#000000" }}
        className="text-[min(2.8125vw,12.1px)] lg:text-[calc(9*var(--u))] block w-full bg-transparent outline-none placeholder:text-black/60
                   h-[min(4vw,17px)] leading-[min(4vw,17px)] lg:h-[calc(9*var(--u))] lg:leading-[calc(9*var(--u))]"
      />
    )}
  </div>
);

const Contact = () => {
  const [form, setForm] = useState({ NAME: "", EMAIL: "", TOPIC: "", MESSAGE: "" });
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.NAME.trim() || !form.EMAIL.trim() || !form.MESSAGE.trim()) {
      toast({
        title: "Please complete the form",
        description: "Name, email and a message are required.",
        variant: "destructive",
      });
      return;
    }
    // No Readymag form endpoint in this rebuild — acknowledge locally.
    setSubmitted(true);
    toast({ title: "Thank you", description: "We'll be in touch shortly." });
  };

  /* `--u` is declared here and consumed only by the `lg:` measures, so the
     mobile layout below `lg` keeps its own min(vw, cap) values untouched.
     `min-h-screen` (rather than `h-screen`) lets the ground fill a window that
     is taller than the block needs, with the footer still pinned to the
     bottom; the block itself is centred in the leftover space, which is what
     Readymag does with the stage. */
  return (
    <div
      /* `overflow-x-clip` rather than `-hidden`: it guards against `100vw`
         counting a scrollbar the content area does not have, without turning
         the page into a scroll container (which would re-anchor the sticky
         header). */
      className="h-screen lg:h-auto lg:min-h-screen flex flex-col overflow-hidden lg:overflow-x-clip"
      style={{ background: BG, "--u": CANVAS_UNIT } as CSSProperties}
    >
      <main
        className="flex-1 min-h-0 flex flex-col"
        style={{
          background: BG,
          color: "#000",
          fontFamily: HELVETICA,
        }}
      >
        {/* Header identical to /wholesale-request (compact WholesaleHeader).
            `solid` = site-standard opaque cream bar (same as Shop/Producers). */}
        <div className="sticky top-0 z-40 shrink-0">
          <WholesaleHeader compact solid />
        </div>

      {/* Two-column grid (matches WHOLESALE REQUEST): open ground on the left,
          the contact column on the right running flush to the page edge so the
          field lines reach all the way to the right. Fills the viewport between
          the header and the closing bar — the whole page fits on one screen. */}
      {/* RM reference: the form column is 507 canvas px of field plus a 15px
          inset from the right edge. Giving the column that exact width and
          letting `1fr` eat the rest keeps the field rules flush right at any
          scale — and when `--u` is height-bound the extra slack simply widens
          the empty left column instead of distorting anything. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_calc(522*var(--u))] grid-rows-1 flex-1 min-h-0 lg:flex-none lg:my-auto">
        {/* Left column — intentionally open, like the reference scene. */}
        <section className="hidden lg:block" aria-hidden="true" />

        {/* Right column — pill, wordmark, then the form. RM leaves a tall
            breathing space (~180px) between the header and the pill. */}
        {/* Mobile gutters follow RM's 320 canvas (x=7 ⇒ 2.19vw) so the field
            rules run nearly edge to edge as in the reference; lg keeps the RM
            desktop column. The pill sits ~30px below the coordinates bar. */}
        <section className="px-[min(2.1875vw,9.4px)] pt-[min(9.4vw,40px)] pb-6 lg:pl-0 lg:pr-[calc(15*var(--u))] lg:pt-[calc(171.5*var(--u))] lg:pb-[calc(19.5*var(--u))] flex flex-col min-h-0">
          {/* CLICK HERE FOR WHOLESALE INQUIRIES — pill above the wordmark. */}
          {/* PDF: text slightly smaller, thinner shape (less top/bottom padding),
              wide side padding as in the mockup. RM: Arial 11px, ~31px tall,
              ~41px side padding, 14px corner radius, BAB5A4 fill. */}
          {/* Client Iteration 2 (mobile): the pill IS shown on mobile — it was
              hidden before. RM mobile stage (320×568) puts it at x7/y118 with
              w196.5 h22.5, 6px radius, 0.8px black hairline; text Arial 7px
              centred. Those map to vw so the block scales with the phone exactly
              like the RM canvas, capped so tablets below `lg` stay sane. */}
          <a
            href="/wholesale"
            className="inline-flex self-start items-center justify-center transition-colors duration-200
                       w-[min(61.4vw,264px)] h-[min(7.03vw,30px)] rounded-[min(1.875vw,8px)]
                       text-[min(2.1875vw,9.4px)] border-[0.9px]
                       lg:w-[calc(196.5*var(--u))] lg:h-[calc(22.5*var(--u))] lg:rounded-[calc(6*var(--u))]
                       lg:text-[calc(7*var(--u))] lg:border-[0.9px] lg:px-0 lg:py-0 lg:tracking-normal"
            style={{
              fontFamily: "Arial, sans-serif",
              fontWeight: 400,
              color: "#000",
              backgroundColor: BTN_BG,
              borderStyle: "solid",
              borderColor: "#000",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BTN_BG)}
          >
            Click here for wholesale inquiries
          </a>

          {/* CONTACT wordmark — Helvetica regular, very tight tracking. */}
          {/* RM-exact wordmark: custom_75139 60px/-4.4px at the 1024 stage
              ⇒ 94px/-6.9px at our 1600 reference. */}
          {/* Mobile shrinks the wordmark so it clears the right edge (94px filled
              the whole column edge-to-edge); lg keeps the RM-exact 94px/-6.9px. */}
          {/* RM mobile: 60px / -4.4px on the 320 canvas ⇒ 18.75vw / -1.375vw,
              sitting ~12px under the pill. (max() for the negative tracking so
              the cap limits its magnitude, not its sign.) */}
          <h1
            className="uppercase text-[min(18.75vw,80px)] tracking-[max(-1.375vw,-5.9px)] mt-[min(3.9vw,17px)] mb-0
                       leading-[1] lg:leading-[1.173]
                       lg:text-[calc(60*var(--u))] lg:tracking-[calc(-4.4*var(--u))] lg:mt-[calc(8.4*var(--u))] lg:mb-0"
            style={{ fontFamily: RM_TEXT, fontWeight: 400, color: "#000" }}
          >
            Contact
          </h1>

          {submitted ? (
            <p style={{ fontFamily: HELVETICA, fontSize: "16px", lineHeight: 1.5, opacity: 0.85 }}>
              Thanks for reaching out — your message is on its way. We'll get
              back to you soon.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="w-full flex flex-col flex-1 mt-2 lg:mt-0">
              <Field name="NAME" label="NAME" value={form.NAME} onChange={set("NAME")} autoComplete="name" />
              <Field name="EMAIL" label="EMAIL" type="email" inputMode="email" value={form.EMAIL} onChange={set("EMAIL")} autoComplete="email" />

              {/* TOPIC — native select inside the same underlined wrapper. */}
              <div className="border-b border-ink/40 px-0 py-[3px] lg:py-[calc(1.4*var(--u))] mb-[min(1.9vw,8px)] lg:mb-[calc(5.2*var(--u)_-_1px)]">
                <div className="relative">
                  <select
                    name="TOPIC"
                    value={form.TOPIC}
                    onChange={(e) => set("TOPIC")(e.target.value)}
                    className="text-[min(2.8125vw,12.1px)] lg:text-[calc(9*var(--u))] block w-full bg-transparent outline-none appearance-none cursor-pointer pr-6
                               h-[min(4vw,17px)] leading-[min(4vw,17px)] lg:h-[calc(9*var(--u))] lg:leading-[calc(9*var(--u))]"
                    style={{
                      fontFamily: HELVETICA,
                      fontWeight: 400,
                      color: form.TOPIC ? "#000" : "rgba(0,0,0,0.6)",
                    }}
                  >
                    <option value="" disabled>
                      TOPIC
                    </option>
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-0 top-1/2 translate-y-[calc(-50%+2px)] lg:-translate-y-1/2 w-[9px] h-[6px] lg:w-[11px] lg:h-[7px]"
                    width="11"
                    height="7"
                    viewBox="0 0 9 6"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ fill: "rgba(0,0,0,0.5)" }}
                  >
                    <path d="M3.763 5.196L.536 1.676A1 1 0 0 1 1.273 0h6.454a1 1 0 0 1 .737 1.676l-3.227 3.52a1 1 0 0 1-1.474 0z" />
                  </svg>
                </div>
              </div>

              <Field name="MESSAGE" label="YOUR MESSAGE" textarea grow value={form.MESSAGE} onChange={set("MESSAGE")} />

              {/* SUBMIT — RM-exact: a THIN full-width bar (~20px) in the button
                  color with cream regular text (custom_75139 9px at the 1024
                  stage ⇒ 14px). PDF: thinner shape, slightly smaller text. */}
              {/* RM mobile: full-width bar w303 h16 on the 320 canvas (⇒ 5vw
                  tall), NO border, cream text at 9px (⇒ 2.8125vw). Desktop keeps
                  the existing 20px bar with its hairline. */}
              <button
                type="submit"
                /* Flex-centred, not line-height-centred: the desktop bar used
                   h = 8u with a 9u font, so the taller glyphs spilled past the
                   top and bottom edges at every width (measured ~3px over at
                   1920, ~2px at 1024 — it scaled, so it was wrong everywhere,
                   not on one screen). Centring the text in the box instead of
                   relying on the line box means the fit no longer depends on
                   font metrics. The bar is also 8u -> 14u taller so the 9u text
                   clears it with room to spare; still one fluid --u expression,
                   no fixed px, so it holds at any viewport. Mobile already had
                   slack, so only its centring moves to flex. */
                className="mt-3 mb-[14px] flex w-full items-center justify-center leading-none uppercase transition-colors duration-200
                           h-[min(5vw,21px)] text-[min(2.8125vw,12.1px)] border-0
                           lg:mt-[calc(9.9*var(--u))] lg:mb-0 lg:h-[calc(14*var(--u))]
                           lg:text-[calc(9*var(--u))] lg:border lg:border-solid lg:border-black"
                style={{
                  fontFamily: RM_TEXT,
                  fontWeight: 400,
                  backgroundColor: BTN_BG,
                  color: "#FFFBE4",
                  letterSpacing: "normal",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BTN_BG)}
              >
                Submit
              </button>
            </form>
          )}
        </section>
      </div>
      </main>

      {/* Closing bar. Client Iteration 2 (p5) asks for every page to use
          THIS footer, so it now lives in SiteFooterBar and is shared —
          keeping a private copy here is what let the others drift. */}
      <SiteFooterBar />
    </div>
  );
};

export default Contact;

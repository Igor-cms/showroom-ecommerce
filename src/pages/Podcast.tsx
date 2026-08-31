import { useMemo, useState } from "react";
import WholesaleHeader from "../components/WholesaleHeader";
import LoadingDots from "../components/LoadingDots";
import { useImagesReady } from "../hooks/useImagesReady";
import { useIsMobile } from "../hooks/use-mobile";

/* =========================================================================
 *  /podcast — editorial grid of podcast episodes.
 *
 *  Standard Native header on top, then a navigation band (big "PODCAST"
 *  title + year filters + horizontal search), then a 3-up grid of large
 *  episode cards with thin dividers. Placeholder data until real episodes
 *  exist — same off-white / ink, minimalist premium aesthetic as the site.
 * ========================================================================= */

type Episode = {
  id: string;
  year: 2026 | 2027 | 2028;
  date: string;
  title: string;
  description: string;
  image: string;
  href?: string;
};

/* Placeholder reel — replace `href` with real video links when available. */
const EPISODES: Episode[] = [
  {
    id: "ep-12",
    year: 2026,
    date: "MAR 04, 2026",
    title: "THE SCIENCE OF FERMENTATION",
    description:
      "Diego Bermúdez breaks down thermal shock and controlled fermentation — and why technique, not luck, defines the cup.",
    image: "/podcast/podcast-2026-52.png",
  },
  {
    id: "ep-11",
    year: 2026,
    date: "FEB 18, 2026",
    title: "TRACEABILITY FROM THE SOURCE",
    description:
      "Diana Hartmann on the families behind every lot, and what specialty coffee owes the people who grow it.",
    image: "/podcast/podcast-2026-53.png",
  },
  {
    id: "ep-10",
    year: 2026,
    date: "FEB 02, 2026",
    title: "ROASTING FOR ORIGIN",
    description:
      "Inside the Dallas roastery: how a roast profile is built to honour — not flatten — a producer's work.",
    image: "/podcast/podcast-2026-54.png",
  },
  {
    id: "ep-09",
    year: 2026,
    date: "JAN 21, 2026",
    title: "WHAT'S NOT WORKING IN SPECIALTY",
    description:
      "An honest conversation about pricing, hype and the gap between marketing and the farm gate.",
    image: "/podcast/podcast-2026-55.png",
  },
  {
    id: "ep-08",
    year: 2026,
    date: "JAN 07, 2026",
    title: "THE FIRST CUP",
    description:
      "Producers share their earliest coffee memories and the moment the craft became a calling.",
    image: "/podcast/podcast-2026-56.png",
  },
  {
    id: "ep-07",
    year: 2026,
    date: "DEC 17, 2025",
    title: "PUSHING THE BOUNDARIES",
    description:
      "Why experimentation is a responsibility, not a gimmick — and what the next generation stands to inherit.",
    image: "/podcast/podcast-2026-57.png",
  },
  {
    id: "ep-06",
    year: 2027,
    date: "APR 09, 2027",
    title: "SUSTAINABILITY AS A DAILY DECISION",
    description:
      "Beyond the label: the day-to-day choices that keep a farm — and a community — viable for the long run.",
    image: "/rm-assets/image-a7e2857e-37fd-4343-8cbe-918d2b9d242a.png",
  },
  {
    id: "ep-05",
    year: 2027,
    date: "MAR 22, 2027",
    title: "BUILDING A SHOWROOM",
    description:
      "How the roastery + showroom model brings the producer's story to the cup the customer holds.",
    image: "/rm-assets/image-aa0233eb-c710-4028-a049-dc08732bc6c9.png",
  },
  {
    id: "ep-04",
    year: 2027,
    date: "MAR 03, 2027",
    title: "PROCESSING IS WHERE THE MAGIC HAPPENS",
    description:
      "Varietal matters, but post-harvest unlocks the cup. A deep dive into the techniques that change everything.",
    image: "/rm-assets/image-b0714099-bafc-4d76-87d5-a3d69bee1d14.png",
  },
  {
    id: "ep-03",
    year: 2028,
    date: "FEB 11, 2028",
    title: "SPECIALTY WAGES, PERIOD",
    description:
      "Specialty coffee should pay specialty wages. A frank look at value distribution along the chain.",
    image: "/rm-assets/image-e11b443b-9264-4417-9237-fbae915bfa0f.jpg",
  },
  {
    id: "ep-02",
    year: 2028,
    date: "JAN 28, 2028",
    title: "WHAT PEOPLE NEED TO BE REMINDED OF",
    description:
      "Behind every great cup is a community — the producer is just the visible part of a much larger effort.",
    image: "/rm-assets/image-60169f48-20f5-4b39-a946-0f40dbbc6861.png",
  },
  {
    id: "ep-01",
    year: 2028,
    date: "JAN 14, 2028",
    title: "A CONVERSATION ON LEGACY",
    description:
      "If we don't experiment, the next generation has nothing to inherit. On craft, family and the future.",
    image: "/rm-assets/image-50b65287-83f7-46b2-affd-94a72369a084.png",
  },
];

const YEARS = [2026, 2027, 2028] as const;

/* Every cover, hoisted so the array identity is stable and the preload runs
   once. All of them, not just the default year's: preloading the lot keeps the
   grid complete when the year filter switches too, and it is only a dozen
   thumbnails. */
const EPISODE_IMAGES = EPISODES.map((e) => e.image);

const Podcast = () => {
  const [year, setYear] = useState<2026 | 2027 | 2028>(2026);
  const [query, setQuery] = useState("");
  const isMobile = useIsMobile();

  // Hold the three-dot loader until every cover has downloaded, so the grid
  // reveals complete instead of the covers popping in one by one.
  const imagesReady = useImagesReady(EPISODE_IMAGES);

  /* Mobile has no year filter / search band, so it lists every episode —
     matching the client's reference, which goes straight from the coordinates
     bar into the first cover. (Same rule /blog already follows.) */
  const episodes = useMemo(() => {
    if (isMobile) return EPISODES;
    const q = query.trim().toLowerCase();
    return EPISODES.filter((e) => e.year === year).filter(
      (e) =>
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q),
    );
  }, [year, query, isMobile]);

  return (
    <div className="min-h-screen bg-bg-cream text-ink">
      <LoadingDots ready={imagesReady} />
      <WholesaleHeader compact fixed solid />

      {/* Offset for the fixed header (real height published as --site-header-h) */}
      <main style={{ paddingTop: "var(--site-header-h, 72px)" }}>
        {/* ── Navigation band: title + year filters + search (desktop only) ──
            Metrics read off the Readymag desktop canvas (1024 wide, preview/9):
            title 25px at x 3 / y 40.8, the three years 8px on a 29 pitch, SEARCH
            7px in a pill, and the photo grid starting at y 68. Every value is
            min(Xvw, cap) against that 1024 canvas, so the band keeps the
            reference's proportions as the fluid grid below it grows, and freezes
            at the 1920-wide equivalent.

            The title used to be clamp(48px, 9vw, 132px) — 129.6px at 1440 where
            the reference has 35.2, which is what pushed the grid ~180px down the
            page. Client, PDF p13: "Match sizing of this header and the 2016,
            2017, and search bar".

            sticky, not static: p13 also asks for this band to "stay even on
            scroll" — only the site header did. */}
        <section
          className="hidden md:block border-b border-ink/40 sticky z-30 bg-bg-cream"
          style={{ top: "var(--site-header-h, 72px)" }}
        >
          {/* Measured from the DIVIDER, not from the title: on the canvas the
              rule sits at y 38.4 and the title's ink starts 2.4 under it, the
              years' 5.8, and the photo grid 29.6. Anchoring on the title hid an
              absolute offset — every distance between the three was right while
              the whole block sat ~12 too low. pt is 0 and the title's leading is
              tightened so its ink starts almost against the line. */}
          <div className="px-[min(0.293vw,5.6px)] pt-0 pb-[min(0.625vw,12px)]">
            {/* gap-0: the reference spaces these three individually (10.6 from
                the title to the years, 14.2 from the years to the search pill),
                and a shared flex gap stacked on top of each one's own margin. */}
            {/* items-start with per-child offsets: the canvas puts the years'
                ink 3.4 below the title's and the pill 1.2 below that.
                items-baseline lined them up by their baselines instead, which
                dropped the years 14 too low. */}
            <div className="flex flex-row items-start gap-0">
              {/* custom_75139 with -0.06em, both straight off the canvas. This
                  was font-extended at -0.02em — a wider face, which set the line
                  261 wide against the reference's 208.7 at the same cap height. */}
              <h1
                className="uppercase tracking-[-0.06em] shrink-0
                           text-[min(2.441vw,46.9px)] leading-[0.9]"
                style={{ fontFamily: "custom_75139, Helvetica, Arial, sans-serif", fontWeight: 400 }}
              >
                PODCAST
              </h1>

              {/* Years: plain text on a 29 pitch, not the pills this carried.
                  All three render identically — the canvas gives every year the
                  same rgb(0,0,0) at opacity 1, with no marker for the selected
                  one, so the 45% fade used here was invented. */}
              <div className="flex items-start gap-[min(1.289vw,24.8px)] shrink-0 ml-[min(1.035vw,19.9px)] mt-[min(0.459vw,8.8px)]">
                {YEARS.map((y) => {
                  const active = y === year;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYear(y)}
                      style={{ fontFamily: "custom_75139, Helvetica, Arial, sans-serif", fontWeight: 400 }}
                      aria-pressed={active}
                      className="uppercase leading-none tracking-[-0.0625em] text-ink
                                 text-[min(0.781vw,15px)] transition-opacity hover:opacity-70"
                    >
                      {y}
                    </button>
                  );
                })}
              </div>

              {/* Search. Read off the canvas SVG, not estimated from the PDF
                  screenshot as before: the pill is 167.4 x 13 at x 250 (14.2
                  after the last year), fully rounded, stroked rgba(0,0,0,0.5)
                  with no fill, and the label sits 19.3 in at rgba(0,0,0,0.5). */}
              {/* `flex`, not a plain block: an <input> is inline-level, so a
                  block wrapper gives it a line box and baseline-shifts it — the
                  same trap the product card's pill hit. It put the pill 4.4
                  below where the canvas has it. */}
              <div className="relative flex shrink-0 ml-[min(1.387vw,26.7px)] mt-[min(0.352vw,6.8px)]">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SEARCH"
                  aria-label="Search episodes"
                  className="rounded-full border border-black/50 bg-transparent outline-none transition-colors focus:border-black
                             w-[min(16.348vw,314px)] h-[min(1.27vw,24.4px)]
                             pl-[min(1.885vw,36.2px)] pr-[min(1vw,19px)]
                             text-[min(0.684vw,13.1px)] uppercase tracking-[-0.0714em] text-black/50 placeholder:text-black/50"
                  style={{ fontFamily: "custom_75139, Helvetica, Arial, sans-serif" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Episode grid: 3-up on desktop, thin dividers between cards ── */}
        {episodes.length > 0 ? (
          <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {episodes.map((ep) => (
              <article key={ep.id} className="flex flex-col bg-bg-cream">
                {/* Square at every width. The Readymag canvas actually draws the
                    cover 343×318 on desktop, but the client overrides its own
                    mockup in PDF p13: "Image size - should be a perfect square,
                    with the horizontal spacing split evenly between the 3
                    pictures on the line to take up the whole width of the site."
                    A third of the viewport, square — so the instruction is
                    scale-independent and this needs no vw arithmetic. */}
                <div className="aspect-square overflow-hidden bg-line/40">
                  <img
                    src={ep.image}
                    alt={ep.title}
                    loading="lazy"
                    className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-[1.03]"
                  />
                </div>

                {/* Caption block. The desktop canvas (RM 1024, column 343 at
                    x -2) lays this out exactly like the mobile one, which is why
                    the two now share a single structure instead of branching:

                      x 3  y 393   DATE + " - " + TITLE on ONE line, 8px / lh 8
                                   (this was a separate 11px date paragraph above
                                    a larger title — two lines where RM has one)
                           y 401   one blank 8px line
                      x 3  y 409   excerpt 7px / lh 8, three lines (h 24)
                      x 261 y 440  READ pill 72x10, radius 6, #BAB5A4 fill,
                                   0.8px black/50 hairline, Arial 6px label,
                                   right edge 8 in from the column
                           y 460   next photo row

                    The desktop button used to be an outlined transparent pill
                    with an ink hover — a different control from the filled one
                    the reference draws on both breakpoints. */}
                <div className="flex flex-1 flex-col gap-[min(1.9vw,12.2px)] sm:gap-0 px-[min(1.5625vw,10px)] pt-[min(1.9vw,12.2px)] pb-[min(3.4vw,21.8px)]
                                sm:px-[min(0.488vw,9.4px)] sm:pt-[min(0.684vw,13.1px)] sm:pb-[min(0.977vw,18.8px)]">
                  <h3
                    /* Both breakpoints declare the family as an arbitrary
                       property instead of leaning on .font-extended. That class
                       sits in @layer utilities as well, so overriding it is a
                       specificity tie that index.css wins on source order — and
                       neither the plain sm: override nor sm:! beat it. Spelling
                       out both sides keeps the two in the same layer, where the
                       sm variant is emitted last and wins on its own.
                       Mobile is byte-for-byte what .font-extended applied. */
                    className="uppercase text-[min(2.5vw,16px)] leading-[min(2.5vw,16px)] tracking-[-0.1px]
                               [font-family:'Helvetica_53_Extended',Helvetica,Arial,sans-serif] [font-stretch:expanded]
                               sm:font-normal sm:text-[min(0.781vw,15px)] sm:leading-[min(0.781vw,15px)] sm:tracking-[-0.0125em]
                               sm:font-rm sm:[font-stretch:normal]"
                  >
                    {ep.date}&nbsp; - &nbsp;{ep.title}
                  </h3>

                  {/* mt is RM's blank 8px line between the headline and the copy.
                      The copy stays italic on desktop too — the canvas sets it
                      italic/400/black there, and sm:not-italic was overriding it. */}
                  <p className="italic text-[min(2.1875vw,14px)] leading-[min(2.5vw,16px)] tracking-[-0.1px] text-ink-60
                                sm:mt-[min(0.781vw,15px)] sm:text-[min(0.684vw,13.1px)] sm:leading-[min(0.781vw,15px)] sm:tracking-[-0.0143em] sm:text-ink
                                sm:font-rm">
                    {ep.description}
                  </p>

                  <div className="mt-auto flex justify-end pt-[min(1.9vw,12.2px)] sm:pt-[min(0.684vw,13.1px)] sm:pr-[min(0.293vw,5.6px)]">
                    {/* Same filled pill at both breakpoints — 67x10 on the 320
                        canvas, 72x10 on the 1024 one. */}
                    <a
                      href={ep.href ?? "#"}
                      className="inline-flex items-center justify-center uppercase leading-none transition-opacity hover:opacity-80
                                 w-[min(20.9375vw,134px)] h-[min(3.125vw,20px)] rounded-[min(1.875vw,12px)]
                                 border-[0.8px] border-black/50 bg-[#BAB5A4] text-[min(1.875vw,12px)] tracking-normal
                                 sm:w-[min(7.031vw,135px)] sm:h-[min(0.977vw,18.8px)] sm:rounded-[min(0.586vw,11.3px)]
                                 sm:text-[min(0.586vw,11.3px)]"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      WATCH
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-24 text-center text-ink-60 text-[12px] uppercase tracking-[0.14em]">
            No episodes for this selection.
          </div>
        )}

        <div className="h-16" />
      </main>
    </div>
  );
};

export default Podcast;

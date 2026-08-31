import { useState, useEffect } from "react";

const coffeeLevels = [
  { num: "00", label: "NEW DROPS" },
  { num: "01", label: "BASE" },
  { num: "02", label: "TOP SHELF" },
  { num: "03", label: "COMPETITION" },
  { num: "04", label: "EXOTICS" },
  { num: "05", label: "HYPER LIMITED" },
];

/* custom_75139 = Helvetica Neue 400, custom_75141 = Helvetica Neue 700 */
const rmFont = (bold = false): React.CSSProperties => ({
  fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif",
  fontWeight: bold ? 700 : 400,
});

const ShopSidebar = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <aside
      className="hidden lg:flex fixed left-0 bottom-0 flex-col"
      style={{
        top: 47,
        width: 160,
        background: "rgb(255,253,237)",
        borderRight: "1px solid rgba(0,0,0,0.12)",
        zIndex: 30,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-10px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        className="flex flex-col h-full"
        style={{ padding: "18px 14px 16px 8px" }}
      >
        <div className="mb-5" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <p
            style={{
              ...rmFont(false),
              fontSize: 7,
              lineHeight: "9px",
              letterSpacing: "0.1px",
              color: "rgba(0,0,0,1)",
              margin: 0,
            }}
          >
            Origin roasted coffee project.
          </p>
          <p
            style={{
              ...rmFont(false),
              fontSize: 7,
              lineHeight: "9px",
              letterSpacing: "0.1px",
              color: "rgba(0,0,0,1)",
              margin: 0,
            }}
          >
            Our menu features a curation of the greatest coffees in the world, provided by the greatest producers in the world.
          </p>
          <p
            style={{
              ...rmFont(false),
              fontSize: 7,
              lineHeight: "9px",
              letterSpacing: "-0.2px",
              color: "rgba(0,0,0,1)",
              margin: 0,
            }}
          >
            Connecting consumers to origin–{" "}
            like never before.
          </p>
        </div>

        {/* ── Coffee Levels: title bold 7px -0.2px, items 7px ── */}
        <div className="flex-1">
          <p
            style={{
              ...rmFont(true),
              fontSize: 7,
              lineHeight: "8px",
              letterSpacing: "-0.2px",
              color: "rgba(0,0,0,1)",
              margin: "0 0 6px 0",
              textTransform: "uppercase",
            }}
          >
            COFFEE LEVELS :
          </p>
          <nav style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {coffeeLevels.map((level) => (
              <button
                key={level.label}
                style={{
                  ...rmFont(false),
                  fontSize: 7,
                  lineHeight: "8px",
                  letterSpacing: "-0.2px",
                  color: "rgba(0,0,0,1)",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  textTransform: "uppercase",
                  display: "flex",
                  gap: 4,
                  marginBottom: 4,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.45")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <span style={{ ...rmFont(true), fontSize: 7 }}>{level.num}</span>
                <span style={{ ...rmFont(false), fontSize: 7 }}>{"  "}{level.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ── Bottom illustration ── */}
        <div style={{ marginTop: "auto", paddingTop: 12 }}>
          <svg
            width="48"
            height="72"
            viewBox="0 0 48 72"
            fill="none"
            stroke="rgba(0,0,0,0.75)"
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Vertical stem */}
            <path d="M24 4 C23 16 22 30 23 44 C23.5 52 26 58 28 64" />
            {/* Hook curl at bottom */}
            <path d="M28 64 C30 68 28 72 24 71 C18 70 16 65 20 62 C22 60 26 61 27 64" />
            {/* Top serif bar */}
            <line x1="18" y1="5" x2="30" y2="5" />
            {/* Small serif ticks */}
            <line x1="18" y1="3" x2="18" y2="7" />
            <line x1="30" y1="3" x2="30" y2="7" />
          </svg>
        </div>
      </div>
    </aside>
  );
};

export default ShopSidebar;

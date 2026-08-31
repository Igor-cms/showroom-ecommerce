import React, { useState } from "react";
import WholesaleHeader from "../components/WholesaleHeader";
import ShopSidebar from "../components/ShopSidebar";

const rmFont = (bold = false): React.CSSProperties => ({
  fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif",
  fontWeight: bold ? 700 : 400,
});

type Product = {
  level: string;
  name: string;
  nameJp?: string;
  origin: string;
  producer: string;
  process: string;
  variety: string;
  flavor: string;
  img: string;
  soldOut?: boolean;
  tall?: boolean;
};

const products: Product[] = [
  /* ── Row 1: HACHI-UME only (right column) ── */
  {
    level: "01 BASE",
    name: "HACHI - UME",
    nameJp: "うめ",
    origin: "PANAMA",
    producer: "HACHI PANAMA",
    process: "WASHED",
    variety: "CATURRA",
    flavor: "MILK CHOCOLATE, ORANGE, PLUM",
    img: "https://i-p.rmcdn.net/62c4b2b0cb3822001bb504bc/5180650/image-d9e5bcd2-6c5a-4704-822f-a4b59e5cac7a.jpg?w=572",
    tall: true,
  },
  /* ── Row 2 ── */
  {
    level: "01 BASE",
    name: "CHOCOLATE STRUDEL",
    origin: "COLOMBIA",
    producer: "DIEGO BERMUDEZ",
    process: "WASHED",
    variety: "CASTILLO",
    flavor: "SWEET CHOCOLATE, BAKED APPLE, BAKING SPICES",
    img: "https://i-p.rmcdn.net/654a8b2533f821001a19ce94/4630806/image-0ed10045-722b-4e82-82d2-2c38a391bd82.jpg?w=572",
  },
  {
    level: "01 BASE",
    name: "HACHI - TANI",
    nameJp: "谷",
    origin: "COLOMBIA",
    producer: "DIEGO BERMUDEZ",
    process: "NATURAL",
    variety: "CASTILLO",
    flavor: "YELLOW TROPICAL FRUITS, DULCE DE LECHE, CHOCOLATE",
    img: "https://i-p.rmcdn.net/62c4b2b0cb3822001bb504bc/5180650/image-4a326974-3c9b-4531-8c7d-0730ac0bc4e5.jpg?w=572",
    soldOut: true,
  },
  {
    level: "01 BASE",
    name: "EMBER",
    origin: "COLOMBIA",
    producer: "DIEGO BERMUDEZ",
    process: "90% WASHED / 10% DOUBLE-ANAEROBIC THERMAL SHOCK",
    variety: "CASTILLO",
    flavor: "CHOCOLATE MOUSSE, PUFF PASTRY, CINNAMON, BAKED APPLE",
    img: "https://i-p.rmcdn.net/62c4b2b0cb3822001bb504bc/5180650/image-87a57e0d-42f3-4393-8363-a410a3edb04c.jpg?w=572",
    soldOut: true,
  },
  /* ── Row 3 ── */
  {
    level: "01 BASE",
    name: "ARCADIA",
    origin: "COLOMBIA",
    producer: "DIEGO BERMUDEZ",
    process: "60% WASHED / 40% DOUBLE-ANAEROBIC THERMAL SHOCK",
    variety: "CASTILLO",
    flavor: "CHOCOLATE COVERED RASPBERRY, CREAMY, CHERRY",
    img: "https://i-p.rmcdn.net/62c4b2b0cb3822001bb504bc/5180650/image-d7b0bebc-ef56-4164-a88e-d93317e3792a.jpg?w=572",
    soldOut: true,
  },
  {
    level: "01 BASE",
    name: "LUMEN",
    origin: "COLOMBIA",
    producer: "DIEGO BERMUDEZ",
    process: "80% WASHED / 20% DOUBLE-ANAEROBIC THERMAL SHOCK",
    variety: "CASTILLO",
    flavor: "GUAVA, CHEESECAKE, GOLDEN DELICIOUS APPLE, PEAR",
    img: "https://i-p.rmcdn.net/62c4b2b0cb3822001bb504bc/5180650/image-ef34ee51-4d2f-4fe1-96ee-6f44f829a6bf.jpg?w=572",
    soldOut: true,
  },
  {
    level: "02 TOP SHELF",
    name: "DRAGONFRUIT SPRITZ",
    origin: "COLOMBIA",
    producer: "DIEGO BERMUDEZ",
    process: "DOUBLE-ANAEROBIC THERMAL SHOCK",
    variety: "CASTILLO",
    flavor: "DRAGONFRUIT, RASPBERRY, CHERRY, ROSE CANDY",
    img: "https://i-p.rmcdn.net/654a8b2533f821001a19ce94/4630806/image-336fbb03-d7f4-438b-881f-4d77bd546437.jpg?w=572",
  },
  /* ── Row 4 ── */
  {
    level: "02 TOP SHELF",
    name: "GOLDEN HOUR",
    origin: "COLOMBIA",
    producer: "DIEGO BERMUDEZ",
    process: "DOUBLE-ANAEROBIC THERMAL SHOCK",
    variety: "CASTILLO",
    flavor: "LYCHEE, PEACH, YELLOW FRUITS, HONEY, APPLE",
    img: "https://i-p.rmcdn.net/654a8b2533f821001a19ce94/4630806/image-b80ae33e-91e7-4158-9107-5a002f1b4569.jpg?w=572",
  },
  {
    level: "02 TOP SHELF",
    name: "SPICED CITRUS",
    origin: "COLOMBIA",
    producer: "DIEGO BERMUDEZ",
    process: "DOUBLE-ANAEROBIC THERMAL SHOCK",
    variety: "CASTILLO",
    flavor: "SPRITE, GINGER, LEMONGRASS, LIME, BLACK TEA",
    img: "https://i-p.rmcdn.net/654a8b2533f821001a19ce94/4630806/image-3f4dc2be-ff02-4788-88de-4e7b33dfd8eb.jpg?w=572",
    soldOut: true,
  },
  {
    level: "02 TOP SHELF",
    name: "CINNAMON LECHE",
    origin: "COLOMBIA",
    producer: "DIEGO BERMUDEZ",
    process: "DOUBLE-ANAEROBIC THERMAL SHOCK",
    variety: "CASTILLO",
    flavor: "CINNAMON, APPLE, HORCHATA, CHOCOLATE, CREAMY",
    img: "https://i-p.rmcdn.net/654a8b2533f821001a19ce94/4630806/image-c363987b-b0ff-486b-a9f6-9a959d21b144.jpg?w=572",
  },
];

const hyperLimited: Product[] = [
  {
    level: "03  COMPETITION",
    name: "HACHI - YUGEN",
    nameJp: "幽玄",
    origin: "COLOMBIA",
    producer: "DIEGO BERMUDEZ",
    process: "ENZYFLOW WASHED",
    variety: "SUPREMO",
    flavor: "CITRUS, DRIED FRUITS, ORANGE, CACAO NIBS",
    img: "https://i-p.rmcdn.net/62c4b2b0cb3822001bb504bc/5180650/image-85860559-e564-4582-9751-ab7ac88db82b.jpg?w=572",
    soldOut: true,
  },
  {
    level: "05  HYPER LIMITED",
    name: "HACHI - HONNE",
    nameJp: "本音",
    origin: "COLOMBIA",
    producer: "CLARI BERMUDEZ",
    process: "OXIDATIVE NATURAL",
    variety: "CHIROSO",
    flavor: "ROSE PETALS, GREEN APPLE, WHITE CHOCOLATE",
    img: "https://i-p.rmcdn.net/62c4b2b0cb3822001bb504bc/5180650/image-6f8c55d5-661f-417f-98d5-9b8dbd0f2ae7.jpg?w=572",
    soldOut: true,
  },
  {
    level: "05  HYPER LIMITED",
    name: "HACHI - KOHARU",
    nameJp: "小春",
    origin: "COLOMBIA",
    producer: "DIEGO BERMUDEZ",
    process: "ENZYFLOW NATURAL",
    variety: "MARAGOGIPE",
    flavor: "DATES, CANDIED STRAWBERRY, BLUEBERRY",
    img: "https://i-p.rmcdn.net/62c4b2b0cb3822001bb504bc/5180650/image-c4d087be-1197-497b-a0ab-330756e0abdc.jpg?w=572",
    soldOut: true,
  },
  {
    level: "05  HYPER LIMITED",
    name: "CRISTIAN ZUNIGA",
    origin: "COLOMBIA",
    producer: "CRISTIAN ZUNIGA",
    process: "NATURAL",
    variety: "CHIROSO",
    flavor: "CHERRY, BLUEBERRY, CHAMPAGNE",
    img: "https://i-p.rmcdn.net/62c4b2b0cb3822001bb504bc/5180650/image-6bf350fd-0389-46af-a905-b01acca3b43d.jpg?w=572",
  },
];

function ProductCard({ product, h }: { product: Product; h?: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Image area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          ...(h ? { height: h } : { aspectRatio: "1 / 1" }),
          flexShrink: 0,
          cursor: "pointer",
          overflow: "hidden",
          background: "#000",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Product image */}
        <img
          src={product.img}
          alt={product.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
            opacity: hovered ? 0.82 : 1,
            transition: "opacity 0.35s ease",
          }}
        />
        {/* Hover overlay text */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "8px 5px",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.35s ease",
            pointerEvents: "none",
          }}
        >
          <p
            style={{
              ...rmFont(true),
              fontSize: 5,
              lineHeight: "14px",
              letterSpacing: "0.3px",
              color: "rgba(255,251,228,1)",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            {product.level}
          </p>
          <p
            style={{
              ...rmFont(true),
              fontSize: 10,
              lineHeight: "15px",
              letterSpacing: "-0.3px",
              color: "rgba(255,251,228,1)",
              margin: 0,
            }}
          >
            {product.name}{" "}
            {product.nameJp && (
              <span style={{ fontSize: 6 }}>{product.nameJp}</span>
            )}
          </p>
          <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {[
              ["ORIGIN", product.origin],
              ["PRODUCER", product.producer],
              ["PROCESS", product.process],
              ["VARIETY", product.variety],
            ].map(([label, value]) => (
              <p
                key={label}
                style={{
                  ...rmFont(false),
                  fontSize: 5,
                  lineHeight: "7px",
                  letterSpacing: 0,
                  color: "rgba(255,251,228,1)",
                  margin: 0,
                }}
              >
                <span style={{ ...rmFont(true), fontSize: 5 }}>{label}</span>
                <span style={{ ...rmFont(false), fontSize: 5 }}> : {value}</span>
              </p>
            ))}
          </div>
          <p
            style={{
              ...rmFont(true),
              fontSize: 6,
              lineHeight: "18px",
              letterSpacing: "-0.3px",
              color: "rgba(255,251,228,1)",
              margin: 0,
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            {product.flavor}
          </p>
        </div>
      </div>
      {/* Buy / Sold-out button */}
      <div style={{ height: 27, display: "flex", alignItems: "center", paddingLeft: 5 }}>
        {product.soldOut ? (
          <button
            style={{
              ...rmFont(false),
              fontSize: 8,
              lineHeight: "8px",
              color: "rgba(255,251,228,0.45)",
              background: "none",
              border: "1px solid rgba(255,251,228,0.25)",
              borderRadius: 30,
              padding: "3px 8px",
              cursor: "default",
              whiteSpace: "nowrap",
            }}
          >
            SOLD OUT — MORE COMING SOON
          </button>
        ) : (
          <button
            style={{
              ...rmFont(false),
              fontSize: 10,
              fontWeight: 500,
              lineHeight: 0,
              color: "rgba(255,251,228,1)",
              background: "transparent",
              border: "1.5px solid rgba(255,251,228,1)",
              borderRadius: 30,
              height: 17,
              padding: "0 6px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,251,228,1)";
              e.currentTarget.style.color = "#000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,251,228,1)";
            }}
          >
            ADD TO CART
          </button>
        )}
      </div>
    </div>
  );
}

/* ── SUBASTA POR LA PAZ — featured section ── */
function SubastaSection() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        background: "#000",
        borderBottom: "1px solid rgba(255,251,228,0.12)",
      }}
    >
      {/* Left: 2/3 width — Subasta details */}
      <div
        style={{
          flex: 2,
          padding: "14px 14px 14px 8px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Large display title */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p
              style={{
                ...rmFont(true),
                fontSize: 36,
                lineHeight: "29px",
                letterSpacing: "-2.7px",
                color: "rgba(255,251,228,1)",
                margin: 0,
              }}
            >
              SUBASTA<br />POR
            </p>
            <p
              style={{
                ...rmFont(true),
                fontSize: 36,
                lineHeight: "29px",
                letterSpacing: "-2.7px",
                color: "rgba(255,251,228,1)",
                margin: 0,
                textAlign: "right",
              }}
            >
              LA<br />PAZ
            </p>
          </div>

          <div style={{ marginTop: 12 }}>
            <p
              style={{
                ...rmFont(false),
                fontSize: 10,
                lineHeight: "9px",
                letterSpacing: "-0.3px",
                color: "rgba(255,251,228,1)",
                margin: "0 0 6px",
                textAlign: "right",
              }}
            >
              <em>EXTREMELY</em> LIMITED
            </p>
            <p
              style={{
                ...rmFont(false),
                fontSize: 10,
                lineHeight: "9px",
                letterSpacing: "-0.3px",
                color: "rgba(255,251,228,1)",
                margin: "0 0 4px",
                textAlign: "right",
              }}
            >
              4 SINGLE-DOSES OF EACH
            </p>
            <p
              style={{
                ...rmFont(false),
                fontSize: 10,
                lineHeight: "9px",
                letterSpacing: "-0.3px",
                color: "rgba(255,251,228,1)",
                margin: "0 0 4px",
                textAlign: "right",
              }}
            >
              SPLP BOLIVAR '25 AUCTION WINNING COFFEE
            </p>
            {["60g FIRST PLACE", "60g SECOND PLACE", "60g THIRD PLACE"].map((l) => (
              <p
                key={l}
                style={{
                  ...rmFont(false),
                  fontSize: 10,
                  lineHeight: "9px",
                  letterSpacing: "-0.3px",
                  color: "rgba(255,251,228,1)",
                  margin: "0 0 2px",
                  textAlign: "right",
                }}
              >
                {l}
              </p>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "auto" }}>
          <p
            style={{
              ...rmFont(false),
              fontSize: 10,
              lineHeight: "9px",
              letterSpacing: "-0.3px",
              color: "rgba(255,251,228,1)",
              margin: "0 0 2px",
            }}
          >
            COLLAB ROASTED WITH SEPTEMBER &amp; HYDRANGEA
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <p
              style={{
                ...rmFont(false),
                fontSize: 21,
                lineHeight: "15px",
                letterSpacing: "-1.6px",
                color: "rgba(255,251,228,1)",
                margin: 0,
              }}
            >
              100% PROFIT GIVEBACK
            </p>
            <p
              style={{
                ...rmFont(false),
                fontSize: 10,
                lineHeight: "9px",
                color: "rgba(255,251,228,1)",
                margin: 0,
              }}
            >
              $200
            </p>
            <button
              style={{
                ...rmFont(false),
                fontSize: 10,
                fontWeight: 500,
                lineHeight: 0,
                color: "rgba(255,251,228,1)",
                background: "transparent",
                border: "1.5px solid rgba(255,251,228,1)",
                borderRadius: 30,
                height: 17,
                padding: "0 8px",
                cursor: "pointer",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,251,228,1)";
                e.currentTarget.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,251,228,1)";
              }}
            >
              ADD TO CART
            </button>
          </div>
        </div>
      </div>

      {/* Right: 1/3 width — HACHI-UME card */}
      <div style={{ flex: 1 }}>
        <ProductCard product={products[0]} />
      </div>
    </div>
  );
}

/* ── THERMAL SHOCK EXPLORATION section ── */
function ThermalShockSection() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        background: "#000",
        borderTop: "1px solid rgba(255,251,228,0.12)",
        borderBottom: "1px solid rgba(255,251,228,0.12)",
      }}
    >
      {/* Left: box set description */}
      <div
        style={{
          flex: 2,
          padding: "14px 14px 14px 8px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: 233,
        }}
      >
        <div>
          <p
            style={{
              ...rmFont(true),
              fontSize: 5,
              lineHeight: "19px",
              letterSpacing: "0.6px",
              color: "rgba(255,251,228,1)",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            4 COFFEE BOX SET
          </p>
          <p
            style={{
              ...rmFont(true),
              fontSize: 17,
              lineHeight: "14px",
              letterSpacing: "-0.7px",
              color: "rgba(255,251,228,1)",
              margin: 0,
            }}
          >
            THERMAL SHOCK
          </p>
          <p
            style={{
              ...rmFont(true),
              fontSize: 17,
              lineHeight: "14px",
              letterSpacing: "-0.7px",
              color: "rgba(255,251,228,1)",
              margin: "0 0 8px",
            }}
          >
            EXPLORATION
          </p>
          {["4 CASTILLOS (SAME COFFEE CHERRY)", "4 DIFFERENT PROCESSES", "4 DIFFERENT COFFEES (250G / EACH)"].map((l) => (
            <p
              key={l}
              style={{
                ...rmFont(true),
                fontSize: 6,
                lineHeight: "8px",
                color: "rgba(255,251,228,1)",
                margin: "0 0 2px",
              }}
            >
              {l}
            </p>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <p style={{ ...rmFont(true), fontSize: 6, lineHeight: "7px", color: "rgba(255,251,228,1)", margin: "0 0 4px" }}>
            INCLUDES:
          </p>
          {[
            "- DRAGONFRUIT SPRITZ (CASTILLO) — 250G",
            "- SPICED CITRUS (CASTILLO) — 250G",
            "- GOLDEN HOUR (CASTILLO) — 250G",
            "- CINNAMON LECHE (CASTILLO) — 250G",
          ].map((l) => (
            <p key={l} style={{ ...rmFont(true), fontSize: 5, lineHeight: "7px", color: "rgba(255,251,228,1)", margin: 0 }}>
              {l}
            </p>
          ))}
          <div style={{ marginTop: 10 }}>
            <button
              style={{
                ...rmFont(false),
                fontSize: 10,
                fontWeight: 500,
                lineHeight: 0,
                color: "rgba(255,251,228,1)",
                background: "transparent",
                border: "1.5px solid rgba(255,251,228,1)",
                borderRadius: 30,
                height: 17,
                padding: "0 8px",
                cursor: "pointer",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,251,228,1)";
                e.currentTarget.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,251,228,1)";
              }}
            >
              ADD TO CART
            </button>
          </div>
        </div>
      </div>
      {/* Right: HACHI-YUGEN card */}
      <div style={{ flex: 1 }}>
        <ProductCard product={hyperLimited[0]} />
      </div>
    </div>
  );
}

const ShopLegacy = () => {
  /* products 1-9 (skip index 0 = HACHI-UME used in SubastaSection) */
  const mainGrid = products.slice(1);

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      <WholesaleHeader compact fixed solid />
      <ShopSidebar />

      {/* Main content — offset by header + sidebar */}
      <main className="pt-[47px] lg:pl-[160px] min-h-screen" style={{ background: "#000" }}>
        {/* Black product area */}
        <div style={{ background: "#000", minHeight: "calc(100vh - 47px)", display: "flex", flexDirection: "column" }}>

          {/* ── Featured section: SUBASTA POR LA PAZ + HACHI-UME ── */}
          <SubastaSection />

          {/* ── Divider line ── */}
          <div style={{ width: "100%", height: 1, background: "rgba(255,251,228,0.12)" }} />

          {/* ── Main product grid: 3 columns ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              width: "100%",
            }}
          >
            {mainGrid.map((p) => (
              <div
                key={p.name}
                style={{ borderRight: "1px solid rgba(255,251,228,0.08)", borderBottom: "1px solid rgba(255,251,228,0.08)" }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          {/* ── Thermal Shock Exploration + HACHI-YUGEN ── */}
          <ThermalShockSection />

          {/* ── Hyper Limited row ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              width: "100%",
              borderTop: "1px solid rgba(255,251,228,0.12)",
            }}
          >
            {hyperLimited.slice(1).map((p) => (
              <div
                key={p.name}
                style={{ borderRight: "1px solid rgba(255,251,228,0.08)", borderBottom: "1px solid rgba(255,251,228,0.08)" }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          {/* ── Footer bar ── */}
          <div
            style={{
              width: "100%",
              borderTop: "1px solid rgba(255,251,228,0.25)",
              padding: "14px 14px 14px 8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 20 }}>
              {["HOME", "SHOP", "WHOLESALE", "CONTACT"].map((link) => (
                <a
                  key={link}
                  href={link === "HOME" ? "/" : `/${link.toLowerCase()}`}
                  style={{
                    ...rmFont(true),
                    fontSize: 8,
                    letterSpacing: "-0.4px",
                    color: "rgba(255,251,228,1)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,251,228,0.5)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,251,228,1)")}
                >
                  {link}
                </a>
              ))}
            </div>
            <p
              style={{
                ...rmFont(true),
                fontSize: 6,
                letterSpacing: "-0.3px",
                color: "rgba(255,251,228,0.6)",
                margin: 0,
                textAlign: "right",
              }}
            >
              DALLAS, TX<br />32.7767° N, 96.7970° W
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShopLegacy;

import coffeeArcadia from "../assets/coffee-arcadia.png";
import coffeeGoldenHour from "../assets/coffee-golden-hour.png";
import coffeeChocolateStrudel from "../assets/coffee-chocolate-strudel.png";
import coffeeChocolateStrudel2 from "../assets/coffee-chocolate-strudel-2.png";

export interface Product {
  id: string;
  title: string;
  status: "available" | "sold_out" | "coming_soon";
  weights: string[];
  defaultWeight: string;
  image: string;
  level: "BASE" | "TOP SHELF" | "COMPETITION" | "EXOTICS" | "HYPER-LIMITED" | "UNCATEGORIZED";
  origin?: string;
  producer?: string;
  process?: string;
  tastingNotes?: string[];
  price: number;
  /** When present, maps a weight label (e.g. "250g") to the Shopify variant GID. */
  variantIdByWeight?: Record<string, string>;
  /** When present, maps a weight label to the live price for that variant. */
  priceByWeight?: Record<string, number>;
  /** Raw Shopify product tags, as fetched by the storefront query. */
  tags?: string[];
  /** True when the coffee carries the "year-round" Shopify tag. These are
   *  restocked routinely, so going out of stock is temporary — they show
   *  "MORE COMING SOON" instead of the back-in-stock notify signup. */
  isYearRound?: boolean;
  /** When present, maps a weight label to whether that specific variant is
   *  currently purchasable. `status`/`level` above are product-wide, but one
   *  weight can be sold out while another isn't — this is what lets reorder
   *  check the exact variant a past order used, not just the product. */
  variantAvailableByWeight?: Record<string, boolean>;
  /** When present, maps a weight label to Shopify's live stock count for that
   *  variant. Can be negative (Shopify's "continue selling when out of stock"
   *  setting) — treat as a soft cap only when positive, never as a hard fact. */
  variantStockByWeight?: Record<string, number>;
}

export const mockProducts: Product[] = [
  {
    id: "hachi-ma",
    title: "HACHI - MA",
    status: "available",
    weights: ["100g", "250g", "500g"],
    defaultWeight: "100g",
    image: coffeeArcadia,
    level: "HYPER-LIMITED",
    origin: "HACHI COLOMBIA",
    producer: "DIEGO BERMÚDEZ",
    process: "SYMBIOTIC",
    tastingNotes: ["WHITE FLOWERS", "WHITE PEACH", "CANDIED ORANGE PEEL", "SIMPLE SYRUP"],
    price: 45
  },
  {
    id: "thermal-shock",
    title: "THERMAL SHOCK EXPLORATION",
    status: "available",
    weights: ["250g", "500g"],
    defaultWeight: "250g",
    image: coffeeGoldenHour,
    level: "COMPETITION",
    origin: "COLOMBIA",
    producer: "DIEGO BERMÚDEZ",
    process: "THERMAL SHOCK",
    tastingNotes: ["FRUIT EXPLOSION", "SYRUP BODY", "FLORAL FINISH"],
    price: 35
  },
  {
    id: "science-vs-ferment",
    title: "SCIENCE VS CO-FERMENT SET",
    status: "available",
    weights: ["100g", "250g"],
    defaultWeight: "250g",
    image: coffeeChocolateStrudel,
    level: "EXOTICS",
    origin: "COLOMBIA",
    producer: "DIEGO BERMÚDEZ",
    process: "CO-FERMENT",
    tastingNotes: ["COMPLEX", "BALANCED", "UNIQUE"],
    price: 55
  },
  {
    id: "red-bourbon",
    title: "RED BOURBON CLASSIC",
    status: "sold_out",
    weights: ["250g", "500g", "1kg"],
    defaultWeight: "250g",
    image: coffeeChocolateStrudel2,
    level: "TOP SHELF",
    origin: "COLOMBIA",
    producer: "DIEGO BERMÚDEZ",
    process: "WASHED",
    tastingNotes: ["CHOCOLATE", "CARAMEL", "NUTS"],
    price: 28
  },
  {
    id: "green-blend",
    title: "FOREST GREEN BLEND",
    status: "available",
    weights: ["250g", "500g"],
    defaultWeight: "250g",
    image: coffeeArcadia,
    level: "BASE",
    origin: "COLOMBIA",
    producer: "MULTIPLE FARMS",
    process: "MIXED",
    tastingNotes: ["HERBAL", "FRESH", "BALANCED"],
    price: 22
  },
  {
    id: "blue-process",
    title: "BLUE LAGOON PROCESS",
    status: "coming_soon",
    weights: ["100g", "250g"],
    defaultWeight: "100g",
    image: coffeeGoldenHour,
    level: "COMPETITION",
    origin: "COLOMBIA",
    producer: "DIEGO BERMÚDEZ",
    process: "EXPERIMENTAL",
    tastingNotes: ["CITRUS", "BRIGHT", "SPARKLING"],
    price: 42
  }
];

export const featuredProduct = mockProducts[0];
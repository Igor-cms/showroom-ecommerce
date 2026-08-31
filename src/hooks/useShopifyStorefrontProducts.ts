import { useQuery } from "@tanstack/react-query";
import { fetchStorefrontProducts, type StorefrontProduct } from "@/lib/shopifyStorefront";
import type { Product } from "@/data/products";

const LEVEL_TAGS: Array<{ tag: string; level: Product["level"] }> = [
  { tag: "base", level: "BASE" },
  { tag: "top shelf", level: "TOP SHELF" },
  { tag: "top-shelf", level: "TOP SHELF" },
  { tag: "competition", level: "COMPETITION" },
  { tag: "exotic", level: "EXOTICS" },
  { tag: "exotics", level: "EXOTICS" },
  { tag: "hyper limited", level: "HYPER-LIMITED" },
  { tag: "hyper-limited", level: "HYPER-LIMITED" },
];

const inferLevel = (tags: string[]): Product["level"] => {
  const lowered = tags.map((t) => t.toLowerCase());
  for (const { tag, level } of LEVEL_TAGS) {
    if (lowered.includes(tag)) return level;
  }
  return "UNCATEGORIZED";
};

/* Coffees we carry all year (Chocolate Strudel, Ume, the blends, the Paraiso
   Castillos) are tagged in Shopify so the list stays self-serve. They restock
   routinely, so running out is temporary and they don't offer the
   back-in-stock signup — see NewDropsSection.
   Absent tag = seasonal, deliberately: a forgotten tag then shows a notify
   button on a coffee that would have come back anyway (harmless), rather than
   silently hiding it on a seasonal coffee (the case we actually care about). */
const YEAR_ROUND_TAGS = ["year-round", "year round", "yearround"];

const inferYearRound = (tags: string[]): boolean => {
  const lowered = tags.map((t) => t.toLowerCase().trim());
  return YEAR_ROUND_TAGS.some((t) => lowered.includes(t));
};

/* ─── Coffee detail extraction (process / tasting notes) ──────────────────────
   Mirrors supabase/functions/get-shopify-products: data lives in product
   metafields, with the labeled product description as a fallback. */

// Labels that mark each field, plus the full set used to detect where a value ends.
const SENSORY_LABELS = ["Sensory", "Tasting Notes", "Flavor Profile", "Cup Profile", "Notes"];
const ALL_LABELS = [
  "Origin", "Producer", "Estate", "Region", "Varietal", "Altitude",
  "Process", "Roast", ...SENSORY_LABELS,
];

const htmlToText = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&rsquo;|&apos;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"');
};

/** Find "Label: value" in plain text, reading up to the next known label. */
const extractLabeledField = (text: string, labels: string[]): string | null => {
  if (!text) return null;
  for (const label of labels) {
    const match = new RegExp(`${label}\\s*:`, "i").exec(text);
    if (!match) continue;
    const start = match.index + match[0].length;
    let end = text.length;
    for (const other of ALL_LABELS) {
      const next = new RegExp(`${other}\\s*:`, "i").exec(text.slice(start));
      if (next) end = Math.min(end, start + next.index);
    }
    const value = text
      .slice(start, end)
      .replace(/\s+/g, " ")
      .replace(/^[\s,;•·\-–]+|[\s,;•·\-–]+$/g, "")
      .trim();
    if (value) return value;
  }
  return null;
};

const extractCoffeeDetails = (p: StorefrontProduct): { producer?: string; process?: string; tastingNotes?: string[] } => {
  const meta = new Map<string, string>();
  for (const mf of p.metafields ?? []) {
    if (mf?.key && mf.value?.trim()) meta.set(mf.key.toLowerCase(), mf.value.trim());
  }

  const text = htmlToText(p.descriptionHtml ?? "");

  const producerRaw =
    meta.get("producer") ?? extractLabeledField(text, ["Producer"]) ?? undefined;

  const processRaw =
    meta.get("process") ?? extractLabeledField(text, ["Process"]) ?? undefined;

  const sensoryRaw =
    meta.get("sensory") ??
    meta.get("tasting_notes") ??
    meta.get("notes") ??
    meta.get("flavor_profile") ??
    extractLabeledField(text, SENSORY_LABELS) ??
    undefined;

  const tastingNotes = sensoryRaw
    ? sensoryRaw
        .split(/[,;·\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  return {
    producer: producerRaw,
    process: processRaw,
    tastingNotes: tastingNotes && tastingNotes.length ? tastingNotes : undefined,
  };
};

const mapProduct = (p: StorefrontProduct): Product | null => {
  const variantNodes = p.variants.edges.map((e) => e.node);
  if (variantNodes.length === 0) return null;

  const weights = variantNodes.map((v) => v.title);
  const variantIdByWeight: Record<string, string> = {};
  const priceByWeight: Record<string, number> = {};
  const variantAvailableByWeight: Record<string, boolean> = {};
  const variantStockByWeight: Record<string, number> = {};
  for (const v of variantNodes) {
    variantIdByWeight[v.title] = v.id;
    priceByWeight[v.title] = Number(v.price.amount);
    variantAvailableByWeight[v.title] = v.availableForSale;
    if (v.quantityAvailable !== null) variantStockByWeight[v.title] = v.quantityAvailable;
  }

  const availablePrices = variantNodes
    .filter((v) => v.availableForSale)
    .map((v) => Number(v.price.amount));
  const minPrice = (availablePrices.length ? availablePrices : variantNodes.map((v) => Number(v.price.amount)))
    .reduce((min, n) => (n < min ? n : min), Number.POSITIVE_INFINITY);

  const status: Product["status"] = p.availableForSale ? "available" : "sold_out";

  const { producer, process, tastingNotes } = extractCoffeeDetails(p);

  return {
    id: p.handle,
    title: p.title,
    status,
    weights,
    defaultWeight: weights[0],
    image: p.featuredImage?.url ?? "",
    level: inferLevel(p.tags),
    tags: p.tags,
    isYearRound: inferYearRound(p.tags),
    price: Number.isFinite(minPrice) ? minPrice : 0,
    variantIdByWeight,
    priceByWeight,
    variantAvailableByWeight,
    variantStockByWeight,
    producer,
    process,
    tastingNotes,
  };
};

export const useShopifyStorefrontProducts = (enabled = true) => {
  return useQuery({
    enabled,
    queryKey: ["shopify-storefront-products"],
    queryFn: async (): Promise<Product[]> => {
      const raw = await fetchStorefrontProducts(100);
      return raw
        .map(mapProduct)
        .filter((p): p is Product => p !== null);
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

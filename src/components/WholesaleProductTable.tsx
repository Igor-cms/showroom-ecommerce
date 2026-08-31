import { useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useShopifyStorefrontProducts } from "@/hooks/useShopifyStorefrontProducts";
import { toast } from "sonner";
import AnchoredMenu from "./AnchoredMenu";
import QtyAddPill from "./QtyAddPill";
import useFitText from "./useFitText";

interface ShopifyVariant {
  id: string;
  countryCode: string;
  option1?: string | null;
  option2?: string | null;
  inventoryQuantity?: number;
}

interface Product {
  id: string;
  name: string;
  origin: string;
  producer: string;
  process: string;
  varietal?: string | null;
  sensory: string;
  prices: {
    [key: string]: number;
  };
  variants: {
    [key: string]: ShopifyVariant;
  };
  available: boolean;
  inventoryQuantity: number;
  status?: string;
}

interface WholesaleProductTableProps {
  title: string;
  subtitle: string;
  products: Product[];
  countryCode?: string;
  description?: string[];
  backgroundColor?: string;
  titleSize?: string;
  subtitleSize?: string;
  hideHeader?: boolean;
  boxSetLayout?: boolean;
  showVarietal?: boolean;
}

/* Every control in the ORDER cell — the variant selector, the qty|ADD pill and
   the disabled MORE COMING SOON — is this tall. They sit side by side, so a
   single number is the only way they stay aligned: they used to be 18px and
   16px respectively, which left their outlines 2px out of step on every row at
   every breakpoint. */
const CONTROL_H = 16;

/* ...and these are how wide they are. Fixed, not content-derived: the variant
   labels come from Shopify and range from "250G - $13" to "BOX SET - $200",
   which made every pill a different width and left the ORDER column with a
   ragged edge down the page. A label too long for its pill now gives way on
   type size instead (useFitText), so the column stays a straight line.

   The budget is set by the narrowest place these ever sit: the ORDER cell of a
   boxed section (ESSENTIALS) at 1024px, measured at 213px — it was 174px until
   the PRICE column went and ORDER took one of its two freed tracks.
   98 + 6 + 104 = 208 leaves ~5px of slack there, and the pair no longer depends
   on label length, so it cannot spill or wrap at any width.

   ADD_W is 104 rather than the 92 the − / + strictly need: at 92 the typeable
   field came out 11.9px wide, which holds the digit but is not a target anyone
   can reliably click. 104 gives it 23.9px, so the number stays clickable and
   two digits fit at full size. */
const SELECT_W = 98;
const ADD_W = 104;
const ORDER_GAP = 6;
/* Out of stock, this replaces both pills, so it occupies both footprints. */
const SOON_W = SELECT_W + ORDER_GAP + ADD_W;

// Dropdown selector for a product's variants (same UX as homepage/Shop)
const VariantDropdown = ({
  selectedSize,
  filteredProduct,
  onSelect,
}: {
  selectedSize: string;
  filteredProduct: Product;
  onSelect: (size: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const selectedVariant = filteredProduct.variants[selectedSize];
  const price = filteredProduct.prices[selectedSize];
  /* Every size, sold-out ones included. They used to be filtered out here, and
     the row's PRICE column was the only place a buyer could see that a size
     existed but was gone. With that column removed they would have vanished
     silently, so the menu lists them — struck through, labelled, and not
     selectable — and the range on offer stays legible.

     `hasMultiple` counts all of them for the same reason: a coffee with one
     size left in stock still needs an openable menu to show what is sold out. */
  const allSizes = Object.keys(filteredProduct.variants);
  const isSoldOut = (size: string) =>
    (filteredProduct.variants[size]?.inventoryQuantity || 0) <= 0;
  const hasMultiple = allSizes.length > 1;
  const label = `${(selectedVariant?.option1 ?? selectedSize).toUpperCase()} - $${price}`;
  const labelRef = useFitText<HTMLSpanElement>(label);

  return (
    <div className="relative flex">
      <button
        ref={pillRef}
        type="button"
        onClick={() => hasMultiple && setOpen((o) => !o)}
        style={{ height: CONTROL_H, width: SELECT_W }}
        className={`rounded-full border border-ink text-[10px] font-extended leading-none bg-[#f5f0e6] text-black whitespace-nowrap tracking-wide transition-opacity hover:opacity-60 inline-flex items-center ${
          hasMultiple ? "pl-3 pr-2 gap-1" : "px-3"
        }`}
      >
        {/* min-w-0 + overflow-hidden is what gives this a measurable box: a bare
            inline span reports clientWidth 0 and useFitText cannot size it. */}
        <span ref={labelRef} className="min-w-0 flex-1 overflow-hidden text-center">
          {label}
        </span>
        {hasMultiple && (
          <ChevronDown
            size={16}
            strokeWidth={2.25}
            className={`shrink-0 text-gray-500 -my-[3px] transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        )}
      </button>

      <AnchoredMenu
        anchorRef={pillRef}
        open={open && hasMultiple}
        onClose={() => setOpen(false)}
      >
        <div
          role="listbox"
          className="overflow-hidden rounded-2xl border border-ink bg-[#f5f0e6] py-1 shadow-lg"
        >
          {allSizes.map((size) => {
            const variant = filteredProduct.variants[size];
            const variantPrice = filteredProduct.prices[size];
            const soldOut = isSoldOut(size);
            return (
              <button
                key={size}
                type="button"
                role="option"
                aria-selected={size === selectedSize}
                /* disabled AND an early return: the attribute keeps it out of
                   the tab order and off pointer events, the guard makes it
                   impossible to select by any other route. */
                disabled={soldOut}
                aria-disabled={soldOut || undefined}
                onClick={() => {
                  if (soldOut) return;
                  onSelect(size);
                  setOpen(false);
                }}
                className={`block w-full whitespace-nowrap px-3 py-1 text-left text-[10px] font-extended transition-colors ${
                  soldOut
                    ? "cursor-not-allowed text-black/45"
                    : "text-black hover:bg-[#e7dfce]"
                } ${size === selectedSize && !soldOut ? "bg-[#e7dfce]" : ""}`}
              >
                {/* Struck through AND labelled: the rule alone reads as a style
                    quirk at 10px, the words alone are easy to skim past. */}
                <span className={soldOut ? "line-through" : ""}>
                  {(variant.option1 || size).toUpperCase()} - ${variantPrice}
                </span>
                {soldOut && <span className="ml-1">(SOLD OUT)</span>}
              </button>
            );
          })}
        </div>
      </AnchoredMenu>
    </div>
  );
};

const BOX_SET_DESCRIPTIONS: Record<string, string> = {
  'subasta por la paz': "Extremely Limited. 4 single-doses of each SPLP Bolivar '25 auction winning coffee: 60g First Place, 60g Second Place and 60g Third Place. Collab roasted with September & Hydrangea.",
};

const getBoxSetDescription = (name: string) => {
  const lower = name.toLowerCase();
  for (const key in BOX_SET_DESCRIPTIONS) {
    if (lower.includes(key)) return BOX_SET_DESCRIPTIONS[key];
  }
  return '';
};

const WholesaleProductTable = ({ title, subtitle, products, countryCode, description, backgroundColor, titleSize, subtitleSize, hideHeader, boxSetLayout, showVarietal = true }: WholesaleProductTableProps) => {
  const { addToCart, setIsCartOpen } = useCart();

  /* Product photos, matched by variant id.
   *
   * The wholesale catalogue itself carries none: get-shopify-products maps the
   * REST payload field by field and never copies the image across, so adding it
   * there would mean an edge-function deploy. The Storefront API already
   * returns a featuredImage and the retail pages already read it from the
   * browser, so the photo is borrowed from there instead — no deploy, and the
   * same picture the rest of the site shows.
   *
   * Variant id is the join because it is the one field both APIs agree on; the
   * Storefront returns it as a gid:// URI, so only the trailing number is kept.
   * Measured against the live data: all 27 wholesale products resolve. React
   * Query dedupes the request, so the several tables on the page share one. */
  const { data: storefrontProducts } = useShopifyStorefrontProducts();
  const imageByVariantId = useMemo(() => {
    const map = new Map<string, string>();
    (storefrontProducts ?? []).forEach((sp) => {
      if (!sp.image) return;
      Object.values(sp.variantIdByWeight ?? {}).forEach((gid) => {
        const numeric = String(gid).split("/").pop();
        if (numeric) map.set(numeric, sp.image);
      });
    });
    return map;
  }, [storefrontProducts]);

  const imageFor = (p: Product): string | null => {
    for (const variant of Object.values(p.variants ?? {})) {
      const hit = variant?.id && imageByVariantId.get(String(variant.id));
      if (hit) return hit;
    }
    return null;
  };
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedId, setAddedId] = useState<string | null>(null);

  const processProductName = (name: string) => {
    const parts = name.split('WHOLESALE -');
    return parts.length > 1 ? parts[1].trim() : name;
  };

  /* Products whose Shopify metafields are empty come back from the
     get-shopify-products function carrying these placeholders. Showing them
     as words reads like real content ("UNKNOWN ORIGIN"), so render a plain
     dash instead — same as an absent varietal. */
  const PLACEHOLDERS = [
    'unknown origin',
    'unknown producer',
    'unknown process',
    'unknown varietal',
    'tasting notes available upon request',
  ];

  const field = (value?: string | null) => {
    const text = (value ?? '').trim();
    if (!text || PLACEHOLDERS.includes(text.toLowerCase())) return '-';
    return text.toUpperCase();
  };

  const getSelectedSize = (productId: string, filteredProduct: Product) => {
    if (selectedSizes[productId]) {
      return selectedSizes[productId];
    }
    
    // Default to first IN-STOCK variant, not just first variant
    const inStockSize = Object.entries(filteredProduct.variants)
      .find(([_, variant]) => (variant.inventoryQuantity || 0) > 0)?.[0];
    
    return inStockSize || Object.keys(filteredProduct.prices)[0];
  };

  const getQuantity = (productId: string) => {
    return quantities[productId] || 1;
  };

  const setSelectedSize = (productId: string, size: string, product: Product, filteredProduct: Product) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
    
    // Reset quantity if current quantity exceeds new variant's inventory
    const newVariant = filteredProduct.variants[size];
    const maxInventory = newVariant?.inventoryQuantity || 0;
    const currentQty = getQuantity(productId);
    
    if (currentQty > maxInventory) {
      setQuantity(productId, Math.min(1, maxInventory), maxInventory);
    }
  };


  const setQuantity = (productId: string, qty: number, maxQty?: number) => {
    if (qty >= 1) {
      const finalQty = maxQty ? Math.min(qty, maxQty) : qty;
      setQuantities(prev => ({ ...prev, [productId]: finalQty }));
    }
  };

  const hasAnyInventory = (filteredProduct: Product) => {
    return Object.values(filteredProduct.variants).some(
      variant => (variant.inventoryQuantity || 0) > 0
    );
  };

  /* `qty` is passed in by the pill: setQuantity only schedules a state update,
     so reading getQuantity() here would still return the previous value and add
     1 when the buyer typed 20. */
  const handleAddToCart = (product: Product, filteredProduct: Product, qty?: number) => {
    const availableSizes = Object.keys(filteredProduct.prices);
    const selectedSize = getSelectedSize(product.id, filteredProduct);
    const quantity = qty ?? getQuantity(product.id);
    const price = filteredProduct.prices[selectedSize];
    const variant = filteredProduct.variants[selectedSize];

    if (!variant) {
      toast.error("Variant not found");
      return;
    }

    // Check if quantity exceeds available inventory
    const maxInventory = variant.inventoryQuantity || 0;
    if (quantity > maxInventory) {
      toast.error(`Only ${maxInventory} units available for ${variant.option1}`);
      return;
    }

    addToCart({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      size: selectedSize,
      price: price,
      quantity: quantity,
      countryCode: countryCode || 'ROW',
      displaySize: variant.option1,
    });
    
    // Open cart sidebar
    setIsCartOpen(true);

    // Reset quantity after adding
    setQuantity(product.id, 1);

    // Brief "ADDED" confirmation on the pill (homepage pattern)
    setAddedId(product.id);
    setTimeout(() => setAddedId((prev) => (prev === product.id ? null : prev)), 1800);
  };

  // Return all product variants without country filtering
  const filterProductByCountry = (product: Product) => {
    // No filtering - show all variants
    return product;
  };


  return (
    <section className={backgroundColor ? "w-full border-2 border-black rounded-lg" : "w-full"} style={backgroundColor ? { backgroundColor } : undefined}>
      <div className={`${backgroundColor ? "px-4 sm:px-6 lg:px-8" : "px-0"} space-y-6 pt-6 pb-5`}>
        <div className="flex items-end gap-2">
          <h2 className="font-bold text-wholesale-primary" style={{ fontSize: titleSize || '40px', letterSpacing: '-3px' }}>{title}</h2>
          <span className="text-wholesale-secondary mb-1" style={{ fontSize: subtitleSize || undefined, letterSpacing: '-0.1px' }}>{subtitle}</span>
        </div>

        {description && description.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {description.map((point, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-[10px] mt-1 text-black">•</span>
                <p className="text-[10px] text-black leading-tight uppercase" style={{ letterSpacing: '-0.1px' }}>
                  {point}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden lg:block rounded-lg">
          {/* Table Header */}
          {!hideHeader && (
            <div
              className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-x-2 py-4 border-b border-black/70 text-xs font-bold text-wholesale-primary"
              style={backgroundColor ? { backgroundColor, letterSpacing: '-0.1px' } : { backgroundColor: 'var(--wholesale-bg)', letterSpacing: '-0.1px' }}
            >
              <div className={`${boxSetLayout ? 'col-[1/6]' : 'col-span-5'} flex items-center min-w-0`}>PROFILE</div>
              {boxSetLayout ? (
                <div className="col-[6/19] flex items-center min-w-0">DESCRIPTION</div>
              ) : (
                <>
                  <div className="col-span-3 flex items-center min-w-0">ORIGIN / PRODUCER</div>
                  <div className={`${showVarietal ? 'col-span-3' : 'col-span-5'} flex items-center min-w-0`}>PROCESS</div>
                  {showVarietal && <div className="col-span-2 flex items-center min-w-0">VARIETAL</div>}
                  <div className="col-span-5 pl-4 flex items-center min-w-0">SENSORY</div>
                </>
              )}
              {/* No PRICE column: every size and its price live in the ORDER
                  dropdown, so listing them here repeated the same figures twice
                  on one row. The two freed tracks go back to the longest text on
                  the row — SENSORY, or DESCRIPTION on a box set — which is where
                  they came from when ORDER needed the room. */}
              <div className={`${boxSetLayout ? 'col-[19/25]' : 'col-span-6'} flex items-center justify-end`}>ORDER</div>
            </div>
          )}

          {/* Table Rows */}
          {products.map((product) => {
            const filteredProduct = filterProductByCountry(product);
            if (Object.keys(filteredProduct.prices).length === 0) return null;
            return filteredProduct;
          }).filter(Boolean).map((filteredProduct, index) => {
            const product = products.find(p => p.id === filteredProduct.id)!;
            
            return (
            <div key={product.id} className={`grid grid-cols-[repeat(24,minmax(0,1fr))] gap-x-2 py-4 border-b border-black/45 last:border-b-black/70 transition-colors ${backgroundColor ? '' : 'hover:bg-wholesale-bg/50'} ${hideHeader && index === 0 ? 'border-t border-black/70' : ''}`}>
              <div className={`${boxSetLayout ? 'col-[1/6]' : 'col-span-5'} flex items-center gap-2 min-w-0`}>
                <div className="text-[10px] font-bold text-wholesale-primary shrink-0" style={{ letterSpacing: '-0.1px' }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                {/* The box is always rendered, photo or not, so a product
                    without one cannot shunt its neighbours' names out of line.
                    object-contain matches the rest of the site: these shots
                    have their own margins baked in and cropping them square
                    would cut into the packaging. */}
                <div className="h-9 w-9 shrink-0 flex items-center justify-center overflow-hidden">
                  {imageFor(filteredProduct) && (
                    <img
                      src={imageFor(filteredProduct)!}
                      alt=""
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>
                <h3 className="font-bold text-wholesale-primary text-xs leading-tight break-words min-w-0" style={{ letterSpacing: '-0.1px' }}>
                  {processProductName(filteredProduct.name)}
                </h3>
              </div>
              
              {boxSetLayout ? (
                <div className="col-[6/19] text-[10px] font-bold text-black flex items-center min-w-0" style={{ letterSpacing: '-0.1px' }}>
                  {getBoxSetDescription(filteredProduct.name) || field(filteredProduct.sensory)}
                </div>
              ) : (
                <>
                  <div className="col-span-3 text-[10px] font-bold text-black flex items-center min-w-0" style={{ letterSpacing: '-0.1px' }}>
                    <div className="min-w-0">
                      <div>{field(filteredProduct.origin)}</div>
                      <div className="text-[10px] font-bold">{field(filteredProduct.producer)}</div>
                    </div>
                  </div>

                  <div className={`${showVarietal ? 'col-span-3' : 'col-span-5'} text-[10px] font-bold text-black flex items-center min-w-0`} style={{ letterSpacing: '-0.1px' }}>
                    {field(filteredProduct.process)}
                  </div>

                  {showVarietal && (
                    <div className="col-span-2 text-[10px] font-bold text-black flex items-center min-w-0" style={{ letterSpacing: '-0.1px' }}>
                      {field(filteredProduct.varietal)}
                    </div>
                  )}

                  <div className="col-span-5 pl-4 text-[10px] font-bold text-black flex items-center min-w-0" style={{ letterSpacing: '-0.1px' }}>
                    {field(filteredProduct.sensory)}
                  </div>
                </>
              )}

              <div className={`${boxSetLayout ? 'col-[19/25]' : 'col-span-6'} flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1`}>
                {filteredProduct.status === 'MORE COMING SOON' || !hasAnyInventory(filteredProduct) ? (
                  <button
                    disabled
                    style={{ height: CONTROL_H, width: SOON_W }}
                    className="inline-flex items-center justify-center rounded-full border border-black text-[10px] font-bold px-2 leading-none bg-gray-300 text-black whitespace-nowrap tracking-wide cursor-not-allowed opacity-70"
                  >
                    MORE COMING SOON
                  </button>
                ) : (
                  <>
                    {/* Variant dropdown — matches homepage/Shop pill selector */}
                    <VariantDropdown
                      selectedSize={getSelectedSize(product.id, filteredProduct)}
                      filteredProduct={filteredProduct}
                      onSelect={(size) => setSelectedSize(product.id, size, product, filteredProduct)}
                    />

                    {/* Right pill: editable qty | ADD */}
                    <QtyAddPill
                      heightPx={CONTROL_H}
                      widthPx={ADD_W}
                      showSteppers
                      quantity={getQuantity(product.id)}
                      onQuantityChange={(q) => setQuantity(product.id, q)}
                      onAdd={(q) => handleAddToCart(product, filteredProduct, q)}
                      added={addedId === product.id}
                    />
                  </>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {products.map((product) => {
            const filteredProduct = filterProductByCountry(product);
            if (Object.keys(filteredProduct.prices).length === 0) return null;
            return filteredProduct;
          }).filter(Boolean).map((filteredProduct, index) => {
            const product = products.find(p => p.id === filteredProduct.id)!;
            
            return (
              <div key={product.id} className={`border border-black/30 rounded-lg p-4 bg-wholesale-bg/30 ${hideHeader && index === 0 ? 'border-t-2 border-t-black/70' : ''}`}>
                {/* Product Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-xs font-bold text-wholesale-primary" style={{ letterSpacing: '-0.1px' }}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  {/* Bigger than the table's thumbnail: on a phone this is the
                      main thing being scanned, and the card has the room. */}
                  <div className="h-14 w-14 shrink-0 flex items-center justify-center overflow-hidden">
                    {imageFor(filteredProduct) && (
                      <img
                        src={imageFor(filteredProduct)!}
                        alt=""
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-wholesale-primary text-base mb-2" style={{ letterSpacing: '-0.1px' }}>
                      {processProductName(filteredProduct.name)}
                    </h3>
                    
                    {/* Info Grid */}
                    {boxSetLayout ? (
                      <div className="text-sm" style={{ letterSpacing: '-0.1px' }}>
                        <span className="text-wholesale-secondary font-semibold text-xs block mb-1">DESCRIPTION</span>
                        <p className="text-black font-bold leading-snug">
                          {getBoxSetDescription(filteredProduct.name) || field(filteredProduct.sensory)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm" style={{ letterSpacing: '-0.1px' }}>
                        <div>
                          <span className="text-wholesale-secondary font-semibold text-xs">ORIGIN: </span>
                          <span className="text-black font-bold">{field(filteredProduct.origin)}</span>
                        </div>
                        <div>
                          <span className="text-wholesale-secondary font-semibold text-xs">PRODUCER: </span>
                          <span className="text-black font-bold">{field(filteredProduct.producer)}</span>
                        </div>
                        <div>
                          <span className="text-wholesale-secondary font-semibold text-xs">PROCESS: </span>
                          <span className="text-black font-bold">{field(filteredProduct.process)}</span>
                        </div>
                        {showVarietal && (
                          <div>
                            <span className="text-wholesale-secondary font-semibold text-xs">VARIETAL: </span>
                            <span className="text-black font-bold">{field(filteredProduct.varietal)}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-wholesale-secondary font-semibold text-xs">SENSORY: </span>
                          <span className="text-black font-bold">{field(filteredProduct.sensory)}</span>
                        </div>
                      </div>
                    )}

                    {/* No price list here either — the card's own selector below
                        carries every size and price, sold-out ones included. */}
                  </div>
                </div>

                {/* Order Controls */}
                <div className="pt-4 border-t border-black/20">
                  {filteredProduct.status === 'MORE COMING SOON' || !hasAnyInventory(filteredProduct) ? (
                    <button
                      disabled
                      style={{ height: CONTROL_H, width: SOON_W }}
                      className="inline-flex items-center justify-center rounded-full border border-black text-[10px] font-bold px-2 leading-none bg-gray-300 text-black whitespace-nowrap tracking-wide cursor-not-allowed opacity-70"
                    >
                      MORE COMING SOON
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      {/* Variant dropdown — matches homepage/Shop pill selector */}
                      <VariantDropdown
                        selectedSize={getSelectedSize(product.id, filteredProduct)}
                        filteredProduct={filteredProduct}
                        onSelect={(size) => setSelectedSize(product.id, size, product, filteredProduct)}
                      />

                      {/* Right pill: editable qty | ADD */}
                      <QtyAddPill
                        heightPx={CONTROL_H}
                      widthPx={ADD_W}
                      showSteppers
                        quantity={getQuantity(product.id)}
                        onQuantityChange={(q) => setQuantity(product.id, q)}
                        onAdd={(q) => handleAddToCart(product, filteredProduct, q)}
                        added={addedId === product.id}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WholesaleProductTable;
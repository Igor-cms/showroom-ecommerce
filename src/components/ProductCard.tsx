import { useState } from "react";
import { Product } from "../data/products";
import { useCart } from "../contexts/CartContext";
import QtyAddPill from "./QtyAddPill";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, weight: string, quantity: number) => void;
}

const statusLabel: Record<Product["status"], string | null> = {
  available: null,
  sold_out: "SOLD OUT",
  coming_soon: "COMING SOON",
};

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedWeight, setSelectedWeight] = useState(product.defaultWeight);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const isDisabled = product.status !== "available";

  const handleAdd = (qty: number = quantity) => {
    if (isDisabled) return;
    addToCart({
      productId: product.id,
      variantId: `${product.id}-${selectedWeight}`,
      name: product.title,
      size: selectedWeight,
      price: product.price,
      quantity: qty,
      countryCode: "US",
      displaySize: selectedWeight,
    });
    setIsCartOpen(true);
    if (onAddToCart) onAddToCart(product, selectedWeight, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const cycleWeight = () => {
    if (!product.weights || product.weights.length <= 1) return;
    const idx = product.weights.indexOf(selectedWeight);
    setSelectedWeight(product.weights[(idx + 1) % product.weights.length]);
  };

  return (
    <div className="flex flex-col items-center">

      {/* ── Image: 308×286px, ratio 14:13 ── */}
      <div
        className="relative overflow-hidden bg-badge"
        style={{ width: "308px", height: "286px", aspectRatio: "14/13", flexShrink: 0 }}
      >
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
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
      </div>

      {/* ── Description area: centered ── */}
      <div
        className="flex flex-col items-center text-center w-full px-4 pt-9 pb-5 gap-[12px] font-pixel"
        style={{ maxWidth: "356px", fontSmooth: "never", WebkitFontSmoothing: "none", imageRendering: "pixelated" } as React.CSSProperties}
      >

        {/* Title */}
        <h3 className="font-pixel font-bold text-[16px] uppercase tracking-tight leading-snug">
          {product.title}
        </h3>

        {/* Weight options + price */}
        <p className="font-pixel text-[12px] tracking-wide leading-relaxed text-foreground">
          {product.weights.map((w) => (
            <span key={w}>
              {w}
              <span style={{ fontWeight: 400 }}>
                {" "}- ${product.price} |{" "}
              </span>
            </span>
          ))}
        </p>

        {/* Process */}
        {product.process && (
          <p className="font-pixel text-[11px] uppercase tracking-widest text-muted-foreground leading-tight">
            {product.process}
          </p>
        )}

        {/* Tasting notes */}
        {product.tastingNotes && product.tastingNotes.length > 0 && (
          <p className="font-pixel italic text-[11px] uppercase tracking-widest text-muted-foreground leading-tight">
            {product.tastingNotes.join(", ")}
          </p>
        )}
      </div>

      {/* ── Interaction area: two pill buttons ── */}
      <div
        className="flex items-center gap-1.5 px-4 pb-6 pt-2 justify-center"
        style={{ WebkitFontSmoothing: "none", fontSmooth: "never" } as React.CSSProperties}
      >

        {/* Left pill: selected variant + price — off-white */}
        <button
          onClick={cycleWeight}
          className="rounded-full border border-ink text-[10px] font-pixel px-3 py-[3px] leading-none bg-[#f5f0e6] text-black whitespace-nowrap tracking-wide transition-opacity hover:opacity-60"
        >
          {selectedWeight} - ${product.price}
        </button>

        {/* Right pill: editable qty | ADD — darker beige/gray */}
        <QtyAddPill
          quantity={quantity}
          onQuantityChange={setQuantity}
          onAdd={handleAdd}
          disabled={isDisabled}
          added={added}
        />
      </div>

    </div>
  );
};

export default ProductCard;

import { useState } from "react";
import { Product } from "../data/products";
import WeightSelect from "./WeightSelect";
import QtyStepper from "./QtyStepper";
import Chip from "./Chip";

interface FeatureBandProps {
  product: Product;
  title: string;
  description: string;
  backgroundImage?: string;
  onAddToCart?: (product: Product, weight: string, quantity: number) => void;
}

const FeatureBand = ({
  product,
  title,
  description,
  backgroundImage,
  onAddToCart,
}: FeatureBandProps) => {
  const [selectedWeight, setSelectedWeight] = useState(product.defaultWeight);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (product.status === "available" && onAddToCart) {
      onAddToCart(product, selectedWeight, quantity);
    }
  };

  const isDisabled = product.status !== "available";

  return (
    <section className="mx-6 my-16">
      <div className="bg-ink text-bg-cream overflow-hidden min-h-[420px] grid lg:grid-cols-2">

        {/* Left: text + controls */}
        <div className="flex flex-col justify-between p-8 lg:p-12">
          <div>
            <p className="text-[10px] font-extended tracking-[0.2em] text-bg-cream/40 mb-4 uppercase">
              {product.level}
            </p>

            <h2 className="text-3xl lg:text-4xl font-extended font-bold mb-4 tracking-tight uppercase">
              {title}
            </h2>

            <p className="text-sm font-extended leading-relaxed mb-6 text-bg-cream/70 max-w-sm">
              {description}
            </p>

            {product.status === "sold_out" && (
              <div className="mb-6">
                <Chip variant="sold-out">SOLD OUT — MORE COMING SOON</Chip>
              </div>
            )}

            <div className="space-y-2 text-xs mb-8">
              {product.origin && (
                <div className="flex gap-6">
                  <span className="w-16 text-bg-cream/40 font-mono tracking-widest shrink-0">ORIGIN</span>
                  <span className="font-medium">{product.origin}</span>
                </div>
              )}
              {product.process && (
                <div className="flex gap-6">
                  <span className="w-16 text-bg-cream/40 font-mono tracking-widest shrink-0">PROCESS</span>
                  <span className="font-medium">{product.process}</span>
                </div>
              )}
              {product.tastingNotes && (
                <div className="flex gap-6">
                  <span className="w-16 text-bg-cream/40 font-mono tracking-widest shrink-0">NOTES</span>
                  <span className="font-medium">{product.tastingNotes.join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <WeightSelect
              weights={product.weights}
              defaultWeight={product.defaultWeight}
              onWeightChange={setSelectedWeight}
              disabled={isDisabled}
            />
            <QtyStepper
              quantity={quantity}
              onQuantityChange={setQuantity}
              disabled={isDisabled}
            />
            <button
              onClick={handleAddToCart}
              disabled={isDisabled}
              className={`h-10 px-8 text-xs tracking-widest font-mono border transition-all duration-fast ${
                isDisabled
                  ? "border-bg-cream/20 text-bg-cream/30 cursor-not-allowed"
                  : "border-bg-cream text-bg-cream hover:bg-bg-cream hover:text-ink active:scale-95"
              }`}
            >
              ADD
            </button>
          </div>
        </div>

        {/* Right: image placeholder */}
        <div className="relative min-h-[280px] lg:min-h-full border-l border-bg-cream/10 overflow-hidden">
          {backgroundImage ? (
            <img
              src={backgroundImage}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
            />
          ) : null}

          {/* Placeholder overlay — always visible */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
            {/* Crosshair frame */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-bg-cream/30" />
              <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-bg-cream/30" />
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-bg-cream/30" />
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-bg-cream/30" />
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="opacity-30">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1" />
                <line x1="10" y1="1" x2="10" y2="19" stroke="currentColor" strokeWidth="1" />
                <line x1="1" y1="10" x2="19" y2="10" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-[9px] tracking-[0.3em] font-mono text-bg-cream/30 uppercase mb-1">
                Image / Video
              </p>
              <p className="text-[9px] tracking-[0.15em] font-mono text-bg-cream/20 uppercase">
                {product.title}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FeatureBand;

import { ShoppingBag } from "lucide-react";
import { useCart } from "../contexts/CartContext";

const FloatingCartToggle = () => {
  const { getTotalItems, setIsCartOpen } = useCart();
  const itemCount = getTotalItems();

  // Only show the floating cart once there's at least one product in it.
  if (itemCount === 0) return null;

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-30 bg-accent text-accent-foreground p-3 rounded-full shadow-card hover:shadow-card-hover hover:translate-x-1 transition-all duration-fast group"
      aria-label={`Cart${itemCount > 0 ? ` (${itemCount} items)` : ""}`}
    >
      <div className="relative">
        <ShoppingBag size={20} />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-ink text-bg-cream text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
            {itemCount}
          </span>
        )}
      </div>
    </button>
  );
};

export default FloatingCartToggle;

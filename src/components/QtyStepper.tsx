import { Minus, Plus } from "lucide-react";

interface QtyStepperProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const QtyStepper = ({ 
  quantity, 
  onQuantityChange, 
  min = 1, 
  max = 10, 
  disabled = false 
}: QtyStepperProps) => {
  const decrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const increase = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="flex items-center border border-border rounded-full overflow-hidden">
      <button
        type="button"
        onClick={decrease}
        disabled={disabled || quantity <= min}
        className="w-11 h-11 md:w-9 md:h-9 flex items-center justify-center hover:bg-muted transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        <Minus size={16} className="md:w-3.5 md:h-3.5" />
      </button>
      
      <div className="w-14 h-11 md:w-12 md:h-9 flex items-center justify-center text-sm font-medium border-x border-border">
        {quantity}
      </div>
      
      <button
        type="button"
        onClick={increase}
        disabled={disabled || quantity >= max}
        className="w-11 h-11 md:w-9 md:h-9 flex items-center justify-center hover:bg-muted transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Increase quantity"
      >
        <Plus size={16} className="md:w-3.5 md:h-3.5" />
      </button>
    </div>
  );
};

export default QtyStepper;
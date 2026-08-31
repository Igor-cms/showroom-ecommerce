import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface WeightSelectProps {
  weights: string[];
  defaultWeight: string;
  onWeightChange: (weight: string) => void;
  disabled?: boolean;
}

const WeightSelect = ({ weights, defaultWeight, onWeightChange, disabled = false }: WeightSelectProps) => {
  const [selectedWeight, setSelectedWeight] = useState(defaultWeight);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (weight: string) => {
    setSelectedWeight(weight);
    onWeightChange(weight);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{ color: "#000000" }}
        className={`flex items-center justify-between gap-2 px-4 py-2 h-11 md:h-9 bg-background border border-border rounded-full text-sm font-medium transition-colors duration-fast ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-muted focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-95'
        }`}
      >
        <span>{selectedWeight}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-fast ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && !disabled && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-1 left-0 right-0 min-w-[120px] bg-background border border-border rounded-lg shadow-card-hover z-20 py-1">
            {weights.map((weight) => (
              <button
                key={weight}
                onClick={() => handleSelect(weight)}
                className={`w-full px-4 py-3 md:py-2 text-left text-sm hover:bg-muted transition-colors duration-fast ${
                  weight === selectedWeight ? 'bg-muted font-medium' : ''
                }`}
              >
                {weight}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default WeightSelect;
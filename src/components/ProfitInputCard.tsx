import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

// Conversion constants
const LITERS_PER_GALLON = 3.78541;
const ML_PER_OZ = 29.5735;

interface ProfitInputCardProps {
  title: string;
  description: string;
  price: number;
  grams: number;
  onPriceChange: (value: number) => void;
  onGramsChange: (value: number) => void;
  gramsLabel?: string;
  inputMode?: 'price' | 'margin';
  margin?: number;
  onInputModeChange?: (mode: 'price' | 'margin') => void;
  onMarginChange?: (value: number) => void;
  costPerKg?: number;
  // Batch brew specific
  isBatchBrew?: boolean;
  litersPerBatch?: number;
  servingSizeML?: number;
  wastedServings?: number;
  onLitersChange?: (value: number) => void;
  onServingSizeChange?: (value: number) => void;
  onWastedServingsChange?: (value: number) => void;
  // Volume unit for batch brew
  batchVolumeUnit?: 'metric' | 'imperial';
  onBatchVolumeUnitChange?: (unit: 'metric' | 'imperial') => void;
}

const ProfitInputCard = ({
  title,
  description,
  price,
  grams,
  onPriceChange,
  onGramsChange,
  gramsLabel = "g/serving",
  inputMode = 'price',
  margin = 0,
  onInputModeChange,
  onMarginChange,
  costPerKg = 0,
  isBatchBrew = false,
  litersPerBatch = 2.5,
  servingSizeML = 250,
  wastedServings = 1,
  onLitersChange,
  onServingSizeChange,
  onWastedServingsChange,
  batchVolumeUnit = 'metric',
  onBatchVolumeUnitChange
}: ProfitInputCardProps) => {
  const { symbol } = useCurrency();
  const showModeToggle = onInputModeChange && onMarginChange;
  
  // Calculate price from margin: price = cost / (1 - margin/100)
  const calculatePriceFromMargin = (marginPercent: number, gramsPerServing: number): number => {
    if (marginPercent >= 100 || costPerKg <= 0) return 0;
    const costPerServing = (costPerKg / 1000) * gramsPerServing;
    return costPerServing / (1 - marginPercent / 100);
  };

  // Calculate margin from price: margin = ((price - cost) / price) * 100
  const calculateMarginFromPrice = (sellingPrice: number, gramsPerServing: number): number => {
    if (sellingPrice <= 0 || costPerKg <= 0) return 0;
    const costPerServing = (costPerKg / 1000) * gramsPerServing;
    return ((sellingPrice - costPerServing) / sellingPrice) * 100;
  };

  // Calculate effective margin for batch brew (accounting for waste)
  const calculateEffectiveMargin = (sellingPrice: number, gramsPerBatch: number): number => {
    if (sellingPrice <= 0 || costPerKg <= 0) return 0;
    const totalServings = litersPerBatch * 1000 / servingSizeML;
    const servingsSold = Math.max(0, totalServings - wastedServings);
    if (servingsSold <= 0) return 0;
    
    const costPerBatch = (costPerKg / 1000) * gramsPerBatch;
    const revenuePerBatch = sellingPrice * servingsSold;
    const profitPerBatch = revenuePerBatch - costPerBatch;
    return (profitPerBatch / revenuePerBatch) * 100;
  };

  const displayedMargin = inputMode === 'price' 
    ? (isBatchBrew ? calculateEffectiveMargin(price, grams) : calculateMarginFromPrice(price, grams))
    : margin;

  const displayedPrice = inputMode === 'margin'
    ? calculatePriceFromMargin(margin, grams)
    : price;

  // Batch brew calculations
  const totalServingsPerBatch = litersPerBatch * 1000 / servingSizeML;
  const actualServingsSold = Math.max(0, totalServingsPerBatch - wastedServings);

  return (
    <div className="border border-wholesale-primary/20 p-6 bg-[#e8e2cc]/30">
      <h3 className="font-helvetica-bold text-sm tracking-wide text-wholesale-primary mb-1">
        {title}
      </h3>
      <p className="text-xs text-wholesale-primary/60 mb-4">{description}</p>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-wholesale-primary/70">
              {inputMode === 'price' ? 'Selling Price' : 'Target Margin'}
            </Label>
            {showModeToggle && (
              <div className="flex items-center gap-1 bg-[#e8e2cc] rounded border border-wholesale-primary/20 p-0.5">
                <button
                  type="button"
                  onClick={() => onInputModeChange('price')}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    inputMode === 'price'
                      ? 'bg-wholesale-primary text-white'
                      : 'text-wholesale-primary/60 hover:text-wholesale-primary'
                  }`}
                >
                  {symbol}
                </button>
                <button
                  type="button"
                  onClick={() => onInputModeChange('margin')}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    inputMode === 'margin'
                      ? 'bg-wholesale-primary text-white'
                      : 'text-wholesale-primary/60 hover:text-wholesale-primary'
                  }`}
                >
                  %
                </button>
              </div>
            )}
          </div>
          
          {inputMode === 'price' ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-wholesale-primary/60">
                {symbol}
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
                className="pl-7 bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
              />
            </div>
          ) : (
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="99.9"
                value={margin}
                onChange={(e) => onMarginChange?.(parseFloat(e.target.value) || 0)}
                className="pr-7 bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-wholesale-primary/60">
                %
              </span>
            </div>
          )}
          
          {showModeToggle && (
            <p className="text-sm font-bold text-wholesale-primary mt-2">
              {inputMode === 'price' 
                ? `Margin: ${displayedMargin.toFixed(1)}%`
                : `Price: ${symbol}${displayedPrice.toFixed(2)}`
              }
            </p>
          )}
        </div>
        
        <div>
          <Label className="text-xs text-wholesale-primary/70 mb-1 block">
            Dose ({gramsLabel})
          </Label>
          <div className="relative">
            <Input
              type="number"
              step="1"
              min="1"
              value={grams}
              onChange={(e) => onGramsChange(parseInt(e.target.value) || 1)}
              className="pr-7 bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-sm">
              g
            </span>
          </div>
        </div>

        {/* Batch Brew specific fields */}
        {isBatchBrew && (
          <>
            {/* Unit toggle for batch brew */}
            {onBatchVolumeUnitChange && (
              <div className="flex items-center justify-between">
                <Label className="text-xs text-wholesale-primary/70">Volume Unit</Label>
                <div className="flex items-center gap-1 bg-[#e8e2cc] rounded border border-wholesale-primary/20 p-0.5">
                  <button
                    type="button"
                    onClick={() => onBatchVolumeUnitChange('metric')}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      batchVolumeUnit === 'metric'
                        ? 'bg-wholesale-primary text-white'
                        : 'text-wholesale-primary/60 hover:text-wholesale-primary'
                    }`}
                  >
                    L / mL
                  </button>
                  <button
                    type="button"
                    onClick={() => onBatchVolumeUnitChange('imperial')}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      batchVolumeUnit === 'imperial'
                        ? 'bg-wholesale-primary text-white'
                        : 'text-wholesale-primary/60 hover:text-wholesale-primary'
                    }`}
                  >
                    gal / oz
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-wholesale-primary/70 mb-1 block">
                  {batchVolumeUnit === 'imperial' ? 'Gallons/Batch' : 'Liters/Batch'}
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={batchVolumeUnit === 'imperial' 
                      ? (litersPerBatch / LITERS_PER_GALLON).toFixed(2)
                      : litersPerBatch
                    }
                    onChange={(e) => {
                      const inputValue = parseFloat(e.target.value) || 0.1;
                      const liters = batchVolumeUnit === 'imperial' 
                        ? inputValue * LITERS_PER_GALLON 
                        : inputValue;
                      onLitersChange?.(liters);
                    }}
                    className="pr-10 bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-sm">
                    {batchVolumeUnit === 'imperial' ? 'gal' : 'L'}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-wholesale-primary/70 mb-1 block">
                  Serving Size
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step={batchVolumeUnit === 'imperial' ? "1" : "10"}
                    min={batchVolumeUnit === 'imperial' ? "1" : "50"}
                    value={batchVolumeUnit === 'imperial'
                      ? Math.round(servingSizeML / ML_PER_OZ)
                      : servingSizeML
                    }
                    onChange={(e) => {
                      const inputValue = parseInt(e.target.value) || 1;
                      const ml = batchVolumeUnit === 'imperial'
                        ? inputValue * ML_PER_OZ
                        : inputValue;
                      onServingSizeChange?.(Math.round(ml));
                    }}
                    className="pr-10 bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-sm">
                    {batchVolumeUnit === 'imperial' ? 'oz' : 'ml'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-xs text-wholesale-primary/70 mb-1 block">
                Wasted Servings
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={wastedServings}
                onChange={(e) => onWastedServingsChange?.(parseFloat(e.target.value) || 0)}
                className="bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
              />
            </div>
            
            <div className="flex items-start gap-2 p-2 bg-wholesale-primary/5 rounded text-xs text-wholesale-primary/60">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                {totalServingsPerBatch.toFixed(1)} servings/batch, {actualServingsSold.toFixed(1)} sold after waste
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfitInputCard;
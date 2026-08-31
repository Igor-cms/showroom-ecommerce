import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";
import { BrewingPrices, BrewingMethodInputMode } from "@/pages/ProfitCalculator";
import { useCurrency } from "@/contexts/CurrencyContext";

// Conversion constants
const LITERS_PER_GALLON = 3.78541;
const ML_PER_OZ = 29.5735;

interface CoffeePriceEditorProps {
  coffeeName: string;
  selectedSize: string;
  pricePerKg: number;
  prices: BrewingPrices;
  inputModes: BrewingMethodInputMode;
  onPriceChange: (method: 'espresso' | 'pourOver' | 'batchBrew', field: 'price' | 'grams' | 'litersPerBatch' | 'servingSizeML' | 'wastedServings', value: number) => void;
  onInputModeChange: (method: 'espresso' | 'pourOver' | 'batchBrew', mode: 'price' | 'margin') => void;
  onMarginChange: (method: 'espresso' | 'pourOver' | 'batchBrew', margin: number) => void;
  margins: { espresso: number; pourOver: number; batchBrew: number };
  batchVolumeUnit?: 'metric' | 'imperial';
  onBatchVolumeUnitChange?: (unit: 'metric' | 'imperial') => void;
}

// Calculate price from margin and cost
const calculatePriceFromMargin = (costPerServing: number, marginPercent: number): number => {
  if (marginPercent >= 100) return costPerServing * 10; // Cap at 10x cost
  return costPerServing / (1 - marginPercent / 100);
};

// Calculate margin from price and cost
const calculateMarginFromPrice = (costPerServing: number, price: number): number => {
  if (price <= 0) return 0;
  return ((price - costPerServing) / price) * 100;
};

const MethodInput = ({
  label,
  price,
  grams,
  pricePerKg,
  inputMode,
  margin,
  gramsLabel = "g",
  onPriceChange,
  onGramsChange,
  onInputModeChange,
  onMarginChange,
  symbol,
}: {
  label: string;
  price: number;
  grams: number;
  pricePerKg: number;
  inputMode: 'price' | 'margin';
  margin: number;
  gramsLabel?: string;
  onPriceChange: (value: number) => void;
  onGramsChange: (value: number) => void;
  onInputModeChange: (mode: 'price' | 'margin') => void;
  onMarginChange: (value: number) => void;
  symbol: string;
}) => {
  const costPerServing = (pricePerKg / 1000) * grams;
  const calculatedPrice = inputMode === 'margin' 
    ? calculatePriceFromMargin(costPerServing, margin) 
    : price;
  const calculatedMargin = inputMode === 'price' 
    ? calculateMarginFromPrice(costPerServing, price) 
    : margin;

  return (
    <div className="flex-1 min-w-[160px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-helvetica-bold text-wholesale-primary/70 uppercase tracking-wide">
          {label}
        </div>
        {/* Input Mode Toggle */}
        <div className="flex text-[10px] bg-wholesale-primary/10 rounded overflow-hidden">
          <button
            onClick={() => onInputModeChange('price')}
            className={`px-2 py-0.5 transition-colors ${
              inputMode === 'price' 
                ? 'bg-wholesale-primary text-white' 
                : 'text-wholesale-primary/60 hover:bg-wholesale-primary/20'
            }`}
          >
            {symbol}
          </button>
          <button
            onClick={() => onInputModeChange('margin')}
            className={`px-2 py-0.5 transition-colors ${
              inputMode === 'margin' 
                ? 'bg-wholesale-primary text-white' 
                : 'text-wholesale-primary/60 hover:bg-wholesale-primary/20'
            }`}
          >
            %
          </button>
        </div>
      </div>
      
      <div className="flex gap-2">
        {inputMode === 'price' ? (
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-xs">
              {symbol}
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
              className="pl-5 h-9 text-sm bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
              placeholder="Price"
            />
          </div>
        ) : (
          <div className="relative flex-1">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="99"
              value={margin}
              onChange={(e) => onMarginChange(parseFloat(e.target.value) || 0)}
              className="pr-5 h-9 text-sm bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
              placeholder="Margin"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-xs">
              %
            </span>
          </div>
        )}
        <div className="relative w-20">
          <Input
            type="number"
            step="1"
            min="1"
            value={grams}
            onChange={(e) => onGramsChange(parseInt(e.target.value) || 1)}
            className="pr-5 h-9 text-sm bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
            placeholder="Dose"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-xs">
            {gramsLabel}
          </span>
        </div>
      </div>
      
      {/* Show calculated value */}
      <div className="mt-1 text-[10px] text-wholesale-primary/50">
        {inputMode === 'margin' ? (
          <>Price: {symbol}{calculatedPrice.toFixed(2)}</>
        ) : (
          <>Margin: {calculatedMargin.toFixed(1)}%</>
        )}
      </div>
    </div>
  );
};

const BatchBrewInput = ({
  price,
  grams,
  pricePerKg,
  inputMode,
  margin,
  litersPerBatch,
  servingSizeML,
  wastedServings,
  onPriceChange,
  onGramsChange,
  onInputModeChange,
  onMarginChange,
  onLitersChange,
  onServingSizeChange,
  onWastedServingsChange,
  batchVolumeUnit = 'metric',
  onBatchVolumeUnitChange,
  symbol,
}: {
  price: number;
  grams: number;
  pricePerKg: number;
  inputMode: 'price' | 'margin';
  margin: number;
  litersPerBatch: number;
  servingSizeML: number;
  wastedServings: number;
  onPriceChange: (value: number) => void;
  onGramsChange: (value: number) => void;
  onInputModeChange: (mode: 'price' | 'margin') => void;
  onMarginChange: (value: number) => void;
  onLitersChange: (value: number) => void;
  onServingSizeChange: (value: number) => void;
  onWastedServingsChange: (value: number) => void;
  batchVolumeUnit?: 'metric' | 'imperial';
  onBatchVolumeUnitChange?: (unit: 'metric' | 'imperial') => void;
  symbol: string;
}) => {
  const costPerServing = (pricePerKg / 1000) * grams;
  const calculatedPrice = inputMode === 'margin' 
    ? calculatePriceFromMargin(costPerServing, margin) 
    : price;
  const calculatedMargin = inputMode === 'price' 
    ? calculateMarginFromPrice(costPerServing, price) 
    : margin;
  
  const totalServingsPerBatch = litersPerBatch * 1000 / servingSizeML;
  const actualServingsSold = Math.max(0, totalServingsPerBatch - wastedServings);

  return (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-xs font-helvetica-bold text-wholesale-primary/70 uppercase tracking-wide">
            Batch Brew
          </div>
          {/* Volume Unit Toggle */}
          {onBatchVolumeUnitChange && (
            <div className="flex text-[10px] bg-wholesale-primary/10 rounded overflow-hidden">
              <button
                onClick={() => onBatchVolumeUnitChange('metric')}
                className={`px-1.5 py-0.5 transition-colors ${
                  batchVolumeUnit === 'metric' 
                    ? 'bg-wholesale-primary text-white' 
                    : 'text-wholesale-primary/60 hover:bg-wholesale-primary/20'
                }`}
              >
                L
              </button>
              <button
                onClick={() => onBatchVolumeUnitChange('imperial')}
                className={`px-1.5 py-0.5 transition-colors ${
                  batchVolumeUnit === 'imperial' 
                    ? 'bg-wholesale-primary text-white' 
                    : 'text-wholesale-primary/60 hover:bg-wholesale-primary/20'
                }`}
              >
                gal
              </button>
            </div>
          )}
        </div>
        {/* Input Mode Toggle */}
        <div className="flex text-[10px] bg-wholesale-primary/10 rounded overflow-hidden">
          <button
            onClick={() => onInputModeChange('price')}
            className={`px-2 py-0.5 transition-colors ${
              inputMode === 'price' 
                ? 'bg-wholesale-primary text-white' 
                : 'text-wholesale-primary/60 hover:bg-wholesale-primary/20'
            }`}
          >
            {symbol}
          </button>
          <button
            onClick={() => onInputModeChange('margin')}
            className={`px-2 py-0.5 transition-colors ${
              inputMode === 'margin' 
                ? 'bg-wholesale-primary text-white' 
                : 'text-wholesale-primary/60 hover:bg-wholesale-primary/20'
            }`}
          >
            %
          </button>
        </div>
      </div>
      
      <div className="flex gap-2 mb-2">
        {inputMode === 'price' ? (
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-xs">
              {symbol}
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
              className="pl-5 h-9 text-sm bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
              placeholder="Price"
            />
          </div>
        ) : (
          <div className="relative flex-1">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="99"
              value={margin}
              onChange={(e) => onMarginChange(parseFloat(e.target.value) || 0)}
              className="pr-5 h-9 text-sm bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
              placeholder="Margin"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-xs">
              %
            </span>
          </div>
        )}
        <div className="relative w-20">
          <Input
            type="number"
            step="1"
            min="1"
            value={grams}
            onChange={(e) => onGramsChange(parseInt(e.target.value) || 1)}
            className="pr-5 h-9 text-sm bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
            placeholder="Dose"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-xs">
            g
          </span>
        </div>
      </div>
      
      {/* Liters/Gallons + Serving Size + Waste Row */}
      <div className="flex gap-2 mb-1">
        <div className="relative flex-1">
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
              onLitersChange(liters);
            }}
            className="pr-7 h-8 text-xs bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
            placeholder={batchVolumeUnit === 'imperial' ? "gal" : "L"}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-[10px]">
            {batchVolumeUnit === 'imperial' ? 'gal' : 'L'}
          </span>
        </div>
        <div className="relative flex-1">
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
              onServingSizeChange(Math.round(ml));
            }}
            className="pr-6 h-8 text-xs bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
            placeholder={batchVolumeUnit === 'imperial' ? "oz" : "ml"}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-[10px]">
            {batchVolumeUnit === 'imperial' ? 'oz' : 'ml'}
          </span>
        </div>
        <div className="relative flex-1">
          <Input
            type="number"
            step="0.5"
            min="0"
            value={wastedServings}
            onChange={(e) => onWastedServingsChange(parseFloat(e.target.value) || 0)}
            className="pr-10 h-8 text-xs bg-[#e8e2cc] border-wholesale-primary/20 text-wholesale-primary"
            placeholder="Waste"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-wholesale-primary/60 text-[10px]">
            waste
          </span>
        </div>
      </div>
      
      {/* Info Row */}
      <div className="flex items-center gap-1 text-[10px] text-wholesale-primary/50">
        <Info className="w-3 h-3" />
        <span>
          {inputMode === 'margin' ? `Price: ${symbol}${calculatedPrice.toFixed(2)}` : `Margin: ${calculatedMargin.toFixed(1)}%`}
          {" · "}
          {totalServingsPerBatch.toFixed(1)} servings, {actualServingsSold.toFixed(1)} sold
        </span>
      </div>
    </div>
  );
};

const CoffeePriceEditor = ({
  coffeeName,
  selectedSize,
  pricePerKg,
  prices,
  inputModes,
  margins,
  onPriceChange,
  onInputModeChange,
  onMarginChange,
  batchVolumeUnit = 'metric',
  onBatchVolumeUnitChange,
}: CoffeePriceEditorProps) => {
  const { symbol } = useCurrency();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-wholesale-primary/20 bg-[#e8e2cc]/30">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-wholesale-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-helvetica-bold text-sm text-wholesale-primary uppercase tracking-wide">
            {coffeeName}
          </span>
          <span className="text-xs text-wholesale-primary/60">
            {selectedSize} @ {symbol}{pricePerKg.toFixed(2)}/kg
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-wholesale-primary/60" />
        ) : (
          <ChevronDown className="w-4 h-4 text-wholesale-primary/60" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="flex flex-wrap gap-4">
            <MethodInput
              label="Espresso"
              price={prices.espresso.price}
              grams={prices.espresso.grams}
              pricePerKg={pricePerKg}
              inputMode={inputModes.espresso}
              margin={margins.espresso}
              onPriceChange={(v) => onPriceChange('espresso', 'price', v)}
              onGramsChange={(v) => onPriceChange('espresso', 'grams', v)}
              onInputModeChange={(mode) => onInputModeChange('espresso', mode)}
              onMarginChange={(v) => onMarginChange('espresso', v)}
              symbol={symbol}
            />
            <MethodInput
              label="Pour Over"
              price={prices.pourOver.price}
              grams={prices.pourOver.grams}
              pricePerKg={pricePerKg}
              inputMode={inputModes.pourOver}
              margin={margins.pourOver}
              onPriceChange={(v) => onPriceChange('pourOver', 'price', v)}
              onGramsChange={(v) => onPriceChange('pourOver', 'grams', v)}
              onInputModeChange={(mode) => onInputModeChange('pourOver', mode)}
              onMarginChange={(v) => onMarginChange('pourOver', v)}
              symbol={symbol}
            />
            <BatchBrewInput
              price={prices.batchBrew.price}
              grams={prices.batchBrew.grams}
              pricePerKg={pricePerKg}
              inputMode={inputModes.batchBrew}
              margin={margins.batchBrew}
              litersPerBatch={prices.batchBrew.litersPerBatch}
              servingSizeML={prices.batchBrew.servingSizeML}
              wastedServings={prices.batchBrew.wastedServings}
              onPriceChange={(v) => onPriceChange('batchBrew', 'price', v)}
              onGramsChange={(v) => onPriceChange('batchBrew', 'grams', v)}
              onInputModeChange={(mode) => onInputModeChange('batchBrew', mode)}
              onMarginChange={(v) => onMarginChange('batchBrew', v)}
              onLitersChange={(v) => onPriceChange('batchBrew', 'litersPerBatch', v)}
              onServingSizeChange={(v) => onPriceChange('batchBrew', 'servingSizeML', v)}
              onWastedServingsChange={(v) => onPriceChange('batchBrew', 'wastedServings', v)}
              batchVolumeUnit={batchVolumeUnit}
              onBatchVolumeUnitChange={onBatchVolumeUnitChange}
              symbol={symbol}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CoffeePriceEditor;
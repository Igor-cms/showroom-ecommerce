import { ShopifyProduct } from "@/hooks/useShopifyProducts";
import { X } from "lucide-react";
import { BrewingPrices } from "@/pages/ProfitCalculator";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ProfitAnalysisCardProps {
  product: ShopifyProduct;
  selectedSize: string;
  pricePerKg: number;
  basePricePerKg?: number;
  extraCostPerKg?: number;
  brewingPrices: BrewingPrices;
  onRemove: () => void;
}

interface MethodAnalysis {
  costPerServing: number;
  profitPerServing: number;
  marginPercent: number;
  servingsPerKg: number;
  profitPerKg: number;
}

interface BatchBrewAnalysis {
  costPerBatch: number;
  totalServingsPerBatch: number;
  actualServingsSold: number;
  revenuePerBatch: number;
  profitPerBatch: number;
  effectiveMarginPercent: number;
  batchesPerKg: number;
  profitPerKg: number;
}

const calculateAnalysis = (
  pricePerKg: number,
  sellingPrice: number,
  gramsPerServing: number
): MethodAnalysis => {
  const costPerServing = (pricePerKg / 1000) * gramsPerServing;
  const profitPerServing = sellingPrice - costPerServing;
  const marginPercent = sellingPrice > 0 ? (profitPerServing / sellingPrice) * 100 : 0;
  const servingsPerKg = 1000 / gramsPerServing;
  const profitPerKg = profitPerServing * servingsPerKg;

  return {
    costPerServing,
    profitPerServing,
    marginPercent,
    servingsPerKg,
    profitPerKg
  };
};

const calculateBatchBrewAnalysis = (
  pricePerKg: number,
  sellingPrice: number,
  gramsPerBatch: number,
  litersPerBatch: number,
  servingSizeML: number,
  wastedServings: number
): BatchBrewAnalysis => {
  const costPerBatch = (pricePerKg / 1000) * gramsPerBatch;
  const totalServingsPerBatch = (litersPerBatch * 1000) / servingSizeML;
  const actualServingsSold = Math.max(0, totalServingsPerBatch - wastedServings);
  const revenuePerBatch = sellingPrice * actualServingsSold;
  const profitPerBatch = revenuePerBatch - costPerBatch;
  const effectiveMarginPercent = revenuePerBatch > 0 ? (profitPerBatch / revenuePerBatch) * 100 : 0;
  const batchesPerKg = 1000 / gramsPerBatch;
  const profitPerKg = profitPerBatch * batchesPerKg;

  return {
    costPerBatch,
    totalServingsPerBatch,
    actualServingsSold,
    revenuePerBatch,
    profitPerBatch,
    effectiveMarginPercent,
    batchesPerKg,
    profitPerKg
  };
};

const formatCurrency = (value: number, symbol: string) => {
  const isNegative = value < 0;
  return `${isNegative ? '-' : ''}${symbol}${Math.abs(value).toFixed(2)}`;
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const MetricRow = ({ 
  label, 
  value, 
  isHighlight = false,
  isNegative = false 
}: { 
  label: string; 
  value: string; 
  isHighlight?: boolean;
  isNegative?: boolean;
}) => (
  <div className={`${isHighlight ? 'mt-2 pt-2 border-t border-wholesale-primary/10' : ''}`}>
    <div className="text-[10px] text-wholesale-primary/50 uppercase tracking-wide">{label}</div>
    <div className={`font-helvetica-bold text-sm ${isNegative ? 'text-red-600' : isHighlight ? 'text-green-700' : 'text-wholesale-primary'}`}>
      {value}
    </div>
  </div>
);

const MethodColumn = ({ 
  title, 
  analysis,
  sellingPrice,
  symbol,
  exchangeRateToEUR,
  currency,
  servingsLabel = "Servings/kg"
}: { 
  title: string; 
  analysis: MethodAnalysis;
  sellingPrice: number;
  symbol: string;
  exchangeRateToEUR: number;
  currency: string;
  servingsLabel?: string;
}) => (
  <div className="flex-1 p-4 border-r border-wholesale-primary/10 last:border-r-0">
    <h4 className="font-helvetica-bold text-xs tracking-wide text-wholesale-primary/70 mb-3 uppercase">
      {title}
    </h4>
    <div className="space-y-2">
      <MetricRow label="Cost/Serving" value={formatCurrency(analysis.costPerServing, symbol)} />
      <MetricRow label="Your Price" value={formatCurrency(sellingPrice, symbol)} />
      <MetricRow 
        label="Profit/Serving" 
        value={formatCurrency(analysis.profitPerServing, symbol)} 
        isHighlight 
        isNegative={analysis.profitPerServing < 0}
      />
      <MetricRow 
        label="Margin" 
        value={formatPercent(analysis.marginPercent)} 
        isNegative={analysis.marginPercent < 0}
      />
      <MetricRow label={servingsLabel} value={analysis.servingsPerKg.toFixed(1)} />
      <div>
        <MetricRow 
          label="Profit/kg" 
          value={formatCurrency(analysis.profitPerKg, symbol)} 
          isHighlight
          isNegative={analysis.profitPerKg < 0}
        />
        {currency !== 'EUR' && (
          <div className="text-[10px] text-wholesale-primary/40 mt-0.5">
            ≈ €{(analysis.profitPerKg * exchangeRateToEUR).toFixed(2)} EUR
          </div>
        )}
      </div>
    </div>
  </div>
);

const BatchBrewColumn = ({ 
  analysis,
  sellingPrice,
  symbol,
  exchangeRateToEUR,
  currency
}: { 
  analysis: BatchBrewAnalysis;
  sellingPrice: number;
  symbol: string;
  exchangeRateToEUR: number;
  currency: string;
}) => (
  <div className="flex-1 p-4 border-r border-wholesale-primary/10 last:border-r-0">
    <h4 className="font-helvetica-bold text-xs tracking-wide text-wholesale-primary/70 mb-3 uppercase">
      Batch Brew
    </h4>
    <div className="space-y-2">
      <MetricRow label="Cost/Batch" value={formatCurrency(analysis.costPerBatch, symbol)} />
      <MetricRow label="Price/Serving" value={formatCurrency(sellingPrice, symbol)} />
      <MetricRow 
        label="Servings/Batch" 
        value={`${analysis.totalServingsPerBatch.toFixed(1)} (${analysis.actualServingsSold.toFixed(1)} sold)`} 
      />
      <MetricRow 
        label="Profit/Batch" 
        value={formatCurrency(analysis.profitPerBatch, symbol)} 
        isHighlight 
        isNegative={analysis.profitPerBatch < 0}
      />
      <MetricRow 
        label="Effective Margin" 
        value={formatPercent(analysis.effectiveMarginPercent)} 
        isNegative={analysis.effectiveMarginPercent < 0}
      />
      <MetricRow label="Batches/kg" value={analysis.batchesPerKg.toFixed(1)} />
      <div>
        <MetricRow 
          label="Profit/kg" 
          value={formatCurrency(analysis.profitPerKg, symbol)} 
          isHighlight
          isNegative={analysis.profitPerKg < 0}
        />
        {currency !== 'EUR' && (
          <div className="text-[10px] text-wholesale-primary/40 mt-0.5">
            ≈ €{(analysis.profitPerKg * exchangeRateToEUR).toFixed(2)} EUR
          </div>
        )}
      </div>
    </div>
  </div>
);

// Clean product name by removing tag prefixes
const cleanProductName = (name: string): string => {
  return name.replace(/^(new\s*-\s*)?(wholesale\s*-\s*)?/i, '').trim();
};

const ProfitAnalysisCard = ({ product, selectedSize, pricePerKg, basePricePerKg, extraCostPerKg, brewingPrices, onRemove }: ProfitAnalysisCardProps) => {
  const { symbol, exchangeRateToEUR, currency } = useCurrency();
  
  const espressoAnalysis = calculateAnalysis(pricePerKg, brewingPrices.espresso.price, brewingPrices.espresso.grams);
  const pourOverAnalysis = calculateAnalysis(pricePerKg, brewingPrices.pourOver.price, brewingPrices.pourOver.grams);
  const batchBrewAnalysis = calculateBatchBrewAnalysis(
    pricePerKg, 
    brewingPrices.batchBrew.price, 
    brewingPrices.batchBrew.grams,
    brewingPrices.batchBrew.litersPerBatch,
    brewingPrices.batchBrew.servingSizeML,
    brewingPrices.batchBrew.wastedServings
  );

  const displayName = cleanProductName(product.name);

  return (
    <div className="border border-wholesale-primary/20 bg-[#f8f3de]">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-wholesale-primary/10">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-helvetica-bold text-lg text-wholesale-primary uppercase tracking-wide">
              {displayName}
            </h3>
            <span className="font-helvetica-bold text-sm text-wholesale-primary/70">
              {selectedSize} @ {symbol}{pricePerKg.toFixed(2)}/kg
            </span>
            {extraCostPerKg && extraCostPerKg > 0 && (
              <span className="text-xs text-wholesale-primary/50 bg-wholesale-primary/10 px-2 py-0.5 rounded">
                incl. {symbol}{extraCostPerKg.toFixed(2)} extra
              </span>
            )}
          </div>
          <p className="text-xs text-wholesale-primary/60 mt-1">
            {product.origin} • {product.producer} • {product.process}
          </p>
        </div>
        <button 
          onClick={onRemove}
          className="p-1 hover:bg-wholesale-primary/5 rounded transition-colors"
        >
          <X className="w-4 h-4 text-wholesale-primary/40" />
        </button>
      </div>
      
      {/* Analysis Grid */}
      <div className="flex flex-col md:flex-row">
        <MethodColumn 
          title="Espresso" 
          analysis={espressoAnalysis} 
          sellingPrice={brewingPrices.espresso.price}
          symbol={symbol}
          exchangeRateToEUR={exchangeRateToEUR}
          currency={currency}
        />
        <MethodColumn 
          title="Pour Over" 
          analysis={pourOverAnalysis}
          sellingPrice={brewingPrices.pourOver.price}
          symbol={symbol}
          exchangeRateToEUR={exchangeRateToEUR}
          currency={currency}
        />
        <BatchBrewColumn 
          analysis={batchBrewAnalysis}
          sellingPrice={brewingPrices.batchBrew.price}
          symbol={symbol}
          exchangeRateToEUR={exchangeRateToEUR}
          currency={currency}
        />
      </div>
    </div>
  );
};

export default ProfitAnalysisCard;
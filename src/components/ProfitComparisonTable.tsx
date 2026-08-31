import { SelectedCoffee, BrewingPrices, BrewingMethodInputMode, BrewingMargins } from "@/pages/ProfitCalculator";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PerCoffeeData {
  prices: BrewingPrices;
  inputModes: BrewingMethodInputMode;
  margins: BrewingMargins;
}

interface ProfitComparisonTableProps {
  selectedCoffees: SelectedCoffee[];
  brewingPrices: BrewingPrices;
  pricingMode: 'same' | 'different';
  perCoffeeData?: Record<string, PerCoffeeData>;
  extraCostPerKg?: number;
}

interface CoffeeMetrics {
  name: string;
  size: string;
  pricePerKg: number;
  espressoMargin: number;
  espressoProfitPerKg: number;
  pourOverMargin: number;
  pourOverProfitPerKg: number;
  batchBrewMargin: number;
  batchBrewProfitPerKg: number;
}

// Calculate price from margin and cost
const calculatePriceFromMargin = (costPerServing: number, marginPercent: number): number => {
  if (marginPercent >= 100) return costPerServing * 10; // Cap at 10x cost
  return costPerServing / (1 - marginPercent / 100);
};

const calculateMarginAndProfit = (
  pricePerKg: number,
  sellingPrice: number,
  gramsPerServing: number
): { margin: number; profitPerKg: number } => {
  const costPerServing = (pricePerKg / 1000) * gramsPerServing;
  const profitPerServing = sellingPrice - costPerServing;
  const margin = sellingPrice > 0 ? (profitPerServing / sellingPrice) * 100 : 0;
  const servingsPerKg = 1000 / gramsPerServing;
  const profitPerKg = profitPerServing * servingsPerKg;
  return { margin, profitPerKg };
};

const calculateBatchBrewMarginAndProfit = (
  pricePerKg: number,
  sellingPrice: number,
  gramsPerBatch: number,
  litersPerBatch: number,
  servingSizeML: number,
  wastedServings: number
): { margin: number; profitPerKg: number } => {
  const costPerBatch = (pricePerKg / 1000) * gramsPerBatch;
  const totalServingsPerBatch = (litersPerBatch * 1000) / servingSizeML;
  const actualServingsSold = Math.max(0, totalServingsPerBatch - wastedServings);
  const revenuePerBatch = sellingPrice * actualServingsSold;
  const profitPerBatch = revenuePerBatch - costPerBatch;
  const effectiveMargin = revenuePerBatch > 0 ? (profitPerBatch / revenuePerBatch) * 100 : 0;
  const batchesPerKg = 1000 / gramsPerBatch;
  const profitPerKg = profitPerBatch * batchesPerKg;
  return { margin: effectiveMargin, profitPerKg };
};

const formatPercent = (value: number) => {
  if (value < 0) return <span className="text-red-600">{value.toFixed(1)}%</span>;
  return <span className="text-green-700">{value.toFixed(1)}%</span>;
};

const formatCurrency = (value: number, symbol: string) => {
  if (value < 0) return <span className="text-red-600">-{symbol}{Math.abs(value).toFixed(2)}</span>;
  return <span className="text-green-700">{symbol}{value.toFixed(2)}</span>;
};

// Clean product name by removing tag prefixes
const cleanProductName = (name: string): string => {
  return name.replace(/^(new\s*-\s*)?(wholesale\s*-\s*)?/i, '').trim();
};

// Get actual price considering input mode (price vs margin)
const getActualPrice = (
  pricePerKg: number,
  data: PerCoffeeData,
  method: 'espresso' | 'pourOver' | 'batchBrew'
): number => {
  if (data.inputModes[method] === 'price') {
    return data.prices[method].price;
  }
  // Calculate price from margin
  const costPerServing = (pricePerKg / 1000) * data.prices[method].grams;
  return calculatePriceFromMargin(costPerServing, data.margins[method]);
};

const ProfitComparisonTable = ({ 
  selectedCoffees, 
  brewingPrices, 
  pricingMode, 
  perCoffeeData,
  extraCostPerKg 
}: ProfitComparisonTableProps) => {
  const { symbol, exchangeRateToEUR, currency } = useCurrency();
  
  const metrics: CoffeeMetrics[] = selectedCoffees.map(coffee => {
    const pricePerKg = coffee.pricePerKg;
    const coffeeKey = `${coffee.product.id}-${coffee.selectedSize}`;
    
    let prices: BrewingPrices;
    
    if (pricingMode === 'different' && perCoffeeData?.[coffeeKey]) {
      const data = perCoffeeData[coffeeKey];
      prices = {
        espresso: { 
          price: getActualPrice(pricePerKg, data, 'espresso'), 
          grams: data.prices.espresso.grams 
        },
        pourOver: { 
          price: getActualPrice(pricePerKg, data, 'pourOver'), 
          grams: data.prices.pourOver.grams 
        },
        batchBrew: { 
          price: getActualPrice(pricePerKg, data, 'batchBrew'), 
          grams: data.prices.batchBrew.grams,
          litersPerBatch: data.prices.batchBrew.litersPerBatch,
          servingSizeML: data.prices.batchBrew.servingSizeML,
          wastedServings: data.prices.batchBrew.wastedServings
        }
      };
    } else {
      prices = brewingPrices;
    }
    
    const espresso = calculateMarginAndProfit(pricePerKg, prices.espresso.price, prices.espresso.grams);
    const pourOver = calculateMarginAndProfit(pricePerKg, prices.pourOver.price, prices.pourOver.grams);
    const batchBrew = calculateBatchBrewMarginAndProfit(
      pricePerKg, 
      prices.batchBrew.price, 
      prices.batchBrew.grams,
      prices.batchBrew.litersPerBatch,
      prices.batchBrew.servingSizeML,
      prices.batchBrew.wastedServings
    );
    
    return {
      name: cleanProductName(coffee.product.name),
      size: coffee.selectedSize,
      pricePerKg,
      espressoMargin: espresso.margin,
      espressoProfitPerKg: espresso.profitPerKg,
      pourOverMargin: pourOver.margin,
      pourOverProfitPerKg: pourOver.profitPerKg,
      batchBrewMargin: batchBrew.margin,
      batchBrewProfitPerKg: batchBrew.profitPerKg,
    };
  });

  // Find best performers
  const bestEspressoMargin = Math.max(...metrics.map(m => m.espressoMargin));
  const bestPourOverMargin = Math.max(...metrics.map(m => m.pourOverMargin));
  const bestEspressoProfitPerKg = Math.max(...metrics.map(m => m.espressoProfitPerKg));

  const bestMarginCoffee = metrics.find(m => m.espressoMargin === bestEspressoMargin || m.pourOverMargin === bestPourOverMargin);
  const bestProfitCoffee = metrics.find(m => m.espressoProfitPerKg === bestEspressoProfitPerKg);

  if (selectedCoffees.length === 0) return null;

  return (
    <div className="border border-wholesale-primary/20 bg-[#f8f3de]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-wholesale-primary/10">
              <TableHead className="font-helvetica-bold text-xs text-wholesale-primary uppercase tracking-wide">
                Coffee
              </TableHead>
              <TableHead className="font-helvetica-bold text-xs text-wholesale-primary uppercase tracking-wide text-right">
                Size
              </TableHead>
              <TableHead className="font-helvetica-bold text-xs text-wholesale-primary uppercase tracking-wide text-right">
                Price/kg ({symbol})
              </TableHead>
              <TableHead className="font-helvetica-bold text-xs text-wholesale-primary uppercase tracking-wide text-right">
                Espresso Margin
              </TableHead>
              <TableHead className="font-helvetica-bold text-xs text-wholesale-primary uppercase tracking-wide text-right">
                Pour Over Margin
              </TableHead>
              <TableHead className="font-helvetica-bold text-xs text-wholesale-primary uppercase tracking-wide text-right">
                Espresso {symbol}/kg
              </TableHead>
              <TableHead className="font-helvetica-bold text-xs text-wholesale-primary uppercase tracking-wide text-right">
                Pour Over {symbol}/kg
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((coffee, index) => (
              <TableRow key={index} className="border-b border-wholesale-primary/5">
                <TableCell className="font-helvetica-bold text-sm text-wholesale-primary">
                  {coffee.name}
                </TableCell>
                <TableCell className="text-right text-sm text-wholesale-primary/70">
                  {coffee.size}
                </TableCell>
                <TableCell className="text-right text-sm text-wholesale-primary/70">
                  {symbol}{coffee.pricePerKg.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatPercent(coffee.espressoMargin)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatPercent(coffee.pourOverMargin)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatCurrency(coffee.espressoProfitPerKg, symbol)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatCurrency(coffee.pourOverProfitPerKg, symbol)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Summary Insights */}
      <div className="p-4 border-t border-wholesale-primary/10 bg-[#e8e2cc]/20">
        <div className="flex flex-col md:flex-row gap-4 text-sm">
          {bestMarginCoffee && (
            <div>
              <span className="text-wholesale-primary/60">Best Margin: </span>
              <span className="font-helvetica-bold text-green-700">
                {bestMarginCoffee.name} ({bestMarginCoffee.size}) at {bestEspressoMargin.toFixed(1)}%
              </span>
            </div>
          )}
          {bestProfitCoffee && (
            <div>
              <span className="text-wholesale-primary/60">Best Profit/kg: </span>
              <span className="font-helvetica-bold text-green-700">
                {bestProfitCoffee.name} ({bestProfitCoffee.size}) at {symbol}{bestEspressoProfitPerKg.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        {extraCostPerKg && extraCostPerKg > 0 && (
          <div className="text-xs text-wholesale-primary/50 mt-2">
            * All prices include {symbol}{extraCostPerKg.toFixed(2)}/kg in additional costs
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitComparisonTable;

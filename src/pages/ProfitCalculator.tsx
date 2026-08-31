import { useState, useMemo, useEffect } from "react";
import WholesaleHeader from "@/components/WholesaleHeader";
import WholesaleFooter from "@/components/WholesaleFooter";
import ProfitInputCard from "@/components/ProfitInputCard";
import ProfitAnalysisCard from "@/components/ProfitAnalysisCard";
import ProfitComparisonTable from "@/components/ProfitComparisonTable";
import CoffeePriceEditor from "@/components/CoffeePriceEditor";
import { useShopifyProducts, ShopifyProduct } from "@/hooks/useShopifyProducts";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { CurrencyProvider, CURRENCY_SYMBOLS } from "@/contexts/CurrencyContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Calculator, RefreshCw, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface SelectedCoffee {
  product: ShopifyProduct;
  selectedSize: string;
  pricePerKg: number;
}

export interface BrewingPrices {
  espresso: { price: number; grams: number };
  pourOver: { price: number; grams: number };
  batchBrew: { 
    price: number; 
    grams: number;
    litersPerBatch: number;
    servingSizeML: number;
    wastedServings: number;
  };
}

export interface BrewingMethodInputMode {
  espresso: 'price' | 'margin';
  pourOver: 'price' | 'margin';
  batchBrew: 'price' | 'margin';
}

export interface BrewingMargins {
  espresso: number;
  pourOver: number;
  batchBrew: number;
}

interface PerCoffeeData {
  prices: BrewingPrices;
  inputModes: BrewingMethodInputMode;
  margins: BrewingMargins;
}

// Parse grams from size string (e.g., "250G" → 250, "1 KG" → 1000)
const parseGramsFromSize = (size: string): number => {
  const normalized = size.toUpperCase().replace(/\s/g, '');
  
  if (normalized.includes('KG')) {
    const match = normalized.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) * 1000 : 1000;
  }
  if (normalized.includes('G')) {
    const match = normalized.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 250;
  }
  return 1000;
};

// Calculate price per kg from size price
const calculatePricePerKg = (price: number, sizeKey: string): number => {
  const grams = parseGramsFromSize(sizeKey);
  return (price / grams) * 1000;
};

// Clean product name by removing tag prefixes like "new - wholesale -"
const cleanProductName = (name: string): string => {
  return name.replace(/^(new\s*-\s*)?(wholesale\s*-\s*)?/i, '').trim();
};

// Calculate price from margin and cost
const calculatePriceFromMargin = (costPerServing: number, marginPercent: number): number => {
  if (marginPercent >= 100) return costPerServing * 10; // Cap at 10x cost
  return costPerServing / (1 - marginPercent / 100);
};

const DEFAULT_BREWING_PRICES: BrewingPrices = {
  espresso: { price: 4.50, grams: 17 },
  pourOver: { price: 5.00, grams: 25 },
  batchBrew: { 
    price: 3.50, 
    grams: 250,
    litersPerBatch: 2.5,
    servingSizeML: 250,
    wastedServings: 1
  }
};

const DEFAULT_INPUT_MODES: BrewingMethodInputMode = {
  espresso: 'price',
  pourOver: 'price',
  batchBrew: 'price'
};

const DEFAULT_MARGINS: BrewingMargins = {
  espresso: 50,
  pourOver: 50,
  batchBrew: 50
};

const ProfitCalculator = () => {
  const { data: productsByCategory, isLoading } = useShopifyProducts();
  
  const [brewingPrices, setBrewingPrices] = useState<BrewingPrices>({ ...DEFAULT_BREWING_PRICES });
  const [selectedCoffees, setSelectedCoffees] = useState<SelectedCoffee[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  
  // New state for pricing mode
  const [pricingMode, setPricingMode] = useState<'same' | 'different'>('same');
  const [perCoffeeData, setPerCoffeeData] = useState<Record<string, PerCoffeeData>>({});
  
  // Global input modes and margins for "same price" mode
  const [globalInputModes, setGlobalInputModes] = useState<BrewingMethodInputMode>({ ...DEFAULT_INPUT_MODES });
  const [globalMargins, setGlobalMargins] = useState<BrewingMargins>({ ...DEFAULT_MARGINS });
  
  // Custom coffee states
  const [isCustomCoffee, setIsCustomCoffee] = useState(false);
  const [customCoffeeName, setCustomCoffeeName] = useState("");
  const [customCoffeeSize, setCustomCoffeeSize] = useState("");
  const [customCoffeePrice, setCustomCoffeePrice] = useState<number>(0);
  
  // Batch volume unit (metric: L/mL, imperial: gal/oz)
  const [batchVolumeUnit, setBatchVolumeUnit] = useState<'metric' | 'imperial'>('metric');
  
  // Currency settings
  const [saleCurrency, setSaleCurrency] = useState<string>('EUR');
  const [exchangeRateToEUR, setExchangeRateToEUR] = useState<number>(1);
  const [isManualRate, setIsManualRate] = useState(false);
  
  // Advanced pricing / extra costs
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  const [extraCosts, setExtraCosts] = useState<{
    importFee: number;
    shipping: number;
    other: number;
  }>({ importFee: 0, shipping: 0, other: 0 });
  
  // Computed total extra cost per kg
  const totalExtraCostPerKg = extraCosts.importFee + extraCosts.shipping + extraCosts.other;
  
  // Fetch exchange rates
  const { rates: exchangeRates, loading: ratesLoading, lastUpdated } = useExchangeRates();
  
  // Update exchange rate when currency changes (unless manual override)
  useEffect(() => {
    if (!isManualRate && exchangeRates && exchangeRates[saleCurrency]) {
      setExchangeRateToEUR(exchangeRates[saleCurrency]);
    }
  }, [saleCurrency, exchangeRates, isManualRate]);
  
  // Use the first selected coffee's pricePerKg as reference for margin calculation in "same" mode (include extra costs)
  const referencePricePerKg = selectedCoffees.length > 0 ? selectedCoffees[0].pricePerKg + totalExtraCostPerKg : 50;

  // Flatten all products with any prices
  const allProducts = useMemo(() => {
    if (!productsByCategory) return [];
    return Object.values(productsByCategory)
      .flat()
      .filter(product => Object.keys(product.prices).length > 0);
  }, [productsByCategory]);

  // Get the selected product for size dropdown
  const selectedProduct = useMemo(() => {
    return allProducts.find(p => p.id === selectedProductId);
  }, [allProducts, selectedProductId]);

  // Get available sizes for the selected product
  const availableSizes = useMemo(() => {
    if (!selectedProduct) return [];
    return Object.entries(selectedProduct.prices)
      .filter(([_, price]) => typeof price === 'number' && price > 0)
      .map(([size, price]) => ({ size, price: price as number }));
  }, [selectedProduct]);

  // Filter out already selected product+size combinations
  const availableProducts = useMemo(() => {
    const selectedKeys = new Set(selectedCoffees.map(c => `${c.product.id}-${c.selectedSize}`));
    return allProducts.filter(p => {
      // Show product if at least one size hasn't been selected
      return Object.keys(p.prices).some(size => !selectedKeys.has(`${p.id}-${size}`));
    });
  }, [allProducts, selectedCoffees]);

  const handleAddCoffee = () => {
    if (!selectedProduct || !selectedSize) return;
    
    const price = selectedProduct.prices[selectedSize];
    if (!price) return;

    const pricePerKg = calculatePricePerKg(price, selectedSize);
    const coffeeKey = `${selectedProduct.id}-${selectedSize}`;
    
    setSelectedCoffees(prev => [...prev, {
      product: selectedProduct,
      selectedSize,
      pricePerKg
    }]);
    
    // Initialize per-coffee data from shared defaults
    setPerCoffeeData(prev => ({
      ...prev,
      [coffeeKey]: {
        prices: { ...brewingPrices },
        inputModes: { ...DEFAULT_INPUT_MODES },
        margins: { ...DEFAULT_MARGINS }
      }
    }));
    
    setSelectedProductId("");
    setSelectedSize("");
  };

  const handleAddCustomCoffee = () => {
    if (!customCoffeeName || !customCoffeeSize || customCoffeePrice <= 0) return;
    
    const pricePerKg = calculatePricePerKg(customCoffeePrice, customCoffeeSize);
    const customId = `custom-${Date.now()}`;
    
    // Create a "fake" ShopifyProduct to maintain compatibility
    const customProduct: ShopifyProduct = {
      id: customId,
      name: customCoffeeName,
      origin: "Custom",
      producer: "Custom",
      process: "",
      sensory: "",
      varietal: null,
      prices: { [customCoffeeSize]: customCoffeePrice },
      variants: {},
      available: true,
      inventoryQuantity: 0,
      category: "Custom",
      tags: []
    };
    
    const coffeeKey = `${customId}-${customCoffeeSize}`;
    
    setSelectedCoffees(prev => [...prev, {
      product: customProduct,
      selectedSize: customCoffeeSize,
      pricePerKg
    }]);
    
    // Initialize per-coffee data
    setPerCoffeeData(prev => ({
      ...prev,
      [coffeeKey]: {
        prices: { ...brewingPrices },
        inputModes: { ...DEFAULT_INPUT_MODES },
        margins: { ...DEFAULT_MARGINS }
      }
    }));
    
    // Clear fields and reset mode
    setCustomCoffeeName("");
    setCustomCoffeeSize("");
    setCustomCoffeePrice(0);
    setIsCustomCoffee(false);
  };

  const handleRemoveCoffee = (productId: string, size: string) => {
    const coffeeKey = `${productId}-${size}`;
    setSelectedCoffees(prev => prev.filter(c => !(c.product.id === productId && c.selectedSize === size)));
    setPerCoffeeData(prev => {
      const newData = { ...prev };
      delete newData[coffeeKey];
      return newData;
    });
  };

  const updatePerCoffeePrice = (
    coffeeKey: string,
    method: 'espresso' | 'pourOver' | 'batchBrew',
    field: 'price' | 'grams' | 'litersPerBatch' | 'servingSizeML' | 'wastedServings',
    value: number
  ) => {
    setPerCoffeeData(prev => ({
      ...prev,
      [coffeeKey]: {
        ...prev[coffeeKey],
        prices: {
          ...prev[coffeeKey].prices,
          [method]: { ...prev[coffeeKey].prices[method], [field]: value }
        }
      }
    }));
  };

  const updatePerCoffeeInputMode = (
    coffeeKey: string,
    method: 'espresso' | 'pourOver' | 'batchBrew',
    mode: 'price' | 'margin'
  ) => {
    setPerCoffeeData(prev => ({
      ...prev,
      [coffeeKey]: {
        ...prev[coffeeKey],
        inputModes: {
          ...prev[coffeeKey].inputModes,
          [method]: mode
        }
      }
    }));
  };

  const updatePerCoffeeMargin = (
    coffeeKey: string,
    method: 'espresso' | 'pourOver' | 'batchBrew',
    margin: number
  ) => {
    setPerCoffeeData(prev => ({
      ...prev,
      [coffeeKey]: {
        ...prev[coffeeKey],
        margins: {
          ...prev[coffeeKey].margins,
          [method]: margin
        }
      }
    }));
  };

  // Get the correct brewing prices for a coffee (calculating from margin if needed)
  const getBrewingPricesForCoffee = (coffeeKey: string, pricePerKg: number): BrewingPrices => {
    if (pricingMode === 'same') {
      // Calculate actual prices based on global input modes
      const getActualPrice = (method: 'espresso' | 'pourOver' | 'batchBrew') => {
        if (globalInputModes[method] === 'price') {
          return brewingPrices[method].price;
        }
        // Calculate price from margin
        const costPerServing = (pricePerKg / 1000) * brewingPrices[method].grams;
        return calculatePriceFromMargin(costPerServing, globalMargins[method]);
      };
      
      return {
        espresso: { price: getActualPrice('espresso'), grams: brewingPrices.espresso.grams },
        pourOver: { price: getActualPrice('pourOver'), grams: brewingPrices.pourOver.grams },
        batchBrew: { 
          price: getActualPrice('batchBrew'), 
          grams: brewingPrices.batchBrew.grams,
          litersPerBatch: brewingPrices.batchBrew.litersPerBatch,
          servingSizeML: brewingPrices.batchBrew.servingSizeML,
          wastedServings: brewingPrices.batchBrew.wastedServings
        }
      };
    }
    
    const data = perCoffeeData[coffeeKey];
    if (!data) return brewingPrices;
    
    const { prices, inputModes, margins } = data;
    
    // Calculate actual prices based on input mode
    const getActualPrice = (method: 'espresso' | 'pourOver' | 'batchBrew') => {
      if (inputModes[method] === 'price') {
        return prices[method].price;
      }
      // Calculate price from margin
      const costPerServing = (pricePerKg / 1000) * prices[method].grams;
      return calculatePriceFromMargin(costPerServing, margins[method]);
    };
    
    return {
      espresso: { price: getActualPrice('espresso'), grams: prices.espresso.grams },
      pourOver: { price: getActualPrice('pourOver'), grams: prices.pourOver.grams },
      batchBrew: { 
        price: getActualPrice('batchBrew'), 
        grams: prices.batchBrew.grams,
        litersPerBatch: prices.batchBrew.litersPerBatch,
        servingSizeML: prices.batchBrew.servingSizeML,
        wastedServings: prices.batchBrew.wastedServings
      }
    };
  };

  const updateBrewingPrice = (method: 'espresso' | 'pourOver' | 'batchBrew', field: 'price' | 'grams' | 'litersPerBatch' | 'servingSizeML' | 'wastedServings', value: number) => {
    setBrewingPrices(prev => ({
      ...prev,
      [method]: { ...prev[method], [field]: value }
    }));
  };

  const updateGlobalInputMode = (method: 'espresso' | 'pourOver' | 'batchBrew', mode: 'price' | 'margin') => {
    setGlobalInputModes(prev => ({ ...prev, [method]: mode }));
  };

  const updateGlobalMargin = (method: 'espresso' | 'pourOver' | 'batchBrew', margin: number) => {
    setGlobalMargins(prev => ({ ...prev, [method]: margin }));
  };

  // Reset size when product changes
  const handleProductChange = (productId: string) => {
    if (productId === 'custom') {
      setIsCustomCoffee(true);
      setSelectedProductId("");
      setSelectedSize("");
    } else {
      setIsCustomCoffee(false);
      setSelectedProductId(productId);
      setSelectedSize("");
    }
  };

  return (
    <CurrencyProvider currency={saleCurrency} exchangeRateToEUR={exchangeRateToEUR}>
      <div className="min-h-screen bg-wholesale-bg" style={{ paddingTop: "var(--site-header-h, 72px)" }}>
        <WholesaleHeader compact fixed solid />
        
        <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-6 h-6 text-wholesale-primary/70" />
            <h1 className="font-helvetica-bold text-3xl md:text-4xl text-wholesale-primary uppercase tracking-wide">
              Profit Margin Calculator
            </h1>
          </div>
          <p className="text-wholesale-primary/60 text-sm max-w-2xl">
            Calculate your potential profit margins for each coffee based on your selling prices. 
            Compare multiple coffees to find the best options for your business.
          </p>
        </div>

        {/* Section 1: Select Coffees */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="font-helvetica-bold text-sm text-wholesale-primary/70 tracking-wider uppercase mb-1">
              1.0 Select Coffees to Compare
            </h2>
            <p className="text-xs text-wholesale-primary/50">
              Add coffees and package sizes to analyze their profit margins
            </p>
          </div>
          
          <div className="flex flex-col gap-3 mb-4">
            {!isCustomCoffee ? (
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Coffee Dropdown */}
                <Select value={selectedProductId} onValueChange={handleProductChange}>
                  <SelectTrigger className="w-full sm:w-64 bg-[#e8e2cc] border-wholesale-primary/20">
                    <SelectValue placeholder={isLoading ? "Loading coffees..." : "Select a coffee"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#e8e2cc]">
                    {availableProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {cleanProductName(product.name)}
                      </SelectItem>
                    ))}
                    <SelectItem 
                      value="custom" 
                      className="font-semibold border-t border-wholesale-primary/20 mt-1 pt-2"
                    >
                      ➕ Other (Enter Manually)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Size Dropdown - only shows when a product is selected */}
                <Select 
                  value={selectedSize} 
                  onValueChange={setSelectedSize}
                  disabled={!selectedProductId}
                >
                  <SelectTrigger className="w-full sm:w-48 bg-[#e8e2cc] border-wholesale-primary/20">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#e8e2cc]">
                    {availableSizes.map(({ size, price }) => (
                      <SelectItem key={size} value={size}>
                        {size} - ${price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleAddCoffee}
                  disabled={!selectedProductId || !selectedSize}
                  className="bg-[#101213] text-white hover:bg-[#101213]/90 rounded-full px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <Input
                  placeholder="Coffee name"
                  value={customCoffeeName}
                  onChange={(e) => setCustomCoffeeName(e.target.value)}
                  className="w-full sm:w-48 bg-[#e8e2cc] border-wholesale-primary/20"
                />
                <Input
                  placeholder="Size (e.g., 1KG, 250G)"
                  value={customCoffeeSize}
                  onChange={(e) => setCustomCoffeeSize(e.target.value)}
                  className="w-full sm:w-40 bg-[#e8e2cc] border-wholesale-primary/20"
                />
                <div className="relative w-full sm:w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wholesale-primary/60">$</span>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={customCoffeePrice || ""}
                    onChange={(e) => setCustomCoffeePrice(parseFloat(e.target.value) || 0)}
                    className="pl-7 bg-[#e8e2cc] border-wholesale-primary/20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddCustomCoffee}
                    disabled={!customCoffeeName || !customCoffeeSize || customCoffeePrice <= 0}
                    className="bg-[#101213] text-white hover:bg-[#101213]/90 rounded-full px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCustomCoffee(false);
                      setCustomCoffeeName("");
                      setCustomCoffeeSize("");
                      setCustomCoffeePrice(0);
                    }}
                    variant="outline"
                    className="rounded-full px-4 border-wholesale-primary/20"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Selected Coffees Tags */}
          {selectedCoffees.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCoffees.map(coffee => {
                const adjustedPricePerKg = coffee.pricePerKg + totalExtraCostPerKg;
                return (
                  <div 
                    key={`${coffee.product.id}-${coffee.selectedSize}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-wholesale-primary/10 rounded-full"
                  >
                    <span className="text-sm text-wholesale-primary font-medium">
                      {cleanProductName(coffee.product.name)} ({coffee.selectedSize} @ ${adjustedPricePerKg.toFixed(2)}/kg)
                    </span>
                    {totalExtraCostPerKg > 0 && (
                      <span className="text-xs text-wholesale-primary/50">
                        +${totalExtraCostPerKg.toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveCoffee(coffee.product.id, coffee.selectedSize)}
                      className="hover:bg-wholesale-primary/10 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3 text-wholesale-primary/60" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Currency Settings */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="font-helvetica-bold text-sm text-wholesale-primary/70 tracking-wider uppercase mb-1">
              1.5 Sale Currency
            </h2>
            <p className="text-xs text-wholesale-primary/50">
              Select the currency you sell in and view EUR conversion
            </p>
          </div>
          
          <div className="p-4 border border-wholesale-primary/20 bg-[#f8f3de]">
            <div className="flex flex-wrap items-center gap-4">
              {/* Currency Select */}
              <div className="flex items-center gap-2">
                <Label className="text-xs text-wholesale-primary/70">Currency</Label>
                <Select value={saleCurrency} onValueChange={(val) => {
                  setSaleCurrency(val);
                  setIsManualRate(false);
                }}>
                  <SelectTrigger className="w-32 bg-[#e8e2cc] border-wholesale-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#e8e2cc]">
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* EUR Conversion Rate Display/Edit */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-wholesale-primary/60">1 {saleCurrency} =</span>
                <Input
                  type="number"
                  step="0.0001"
                  value={exchangeRateToEUR.toFixed(4)}
                  onChange={(e) => {
                    setExchangeRateToEUR(parseFloat(e.target.value) || 0);
                    setIsManualRate(true);
                  }}
                  className="w-24 h-8 text-center bg-[#e8e2cc] border-wholesale-primary/20"
                />
                <span className="text-wholesale-primary/60">EUR</span>
                
                {/* Reset to auto button */}
                {isManualRate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsManualRate(false);
                      if (exchangeRates?.[saleCurrency]) {
                        setExchangeRateToEUR(exchangeRates[saleCurrency]);
                      }
                    }}
                    className="text-xs text-wholesale-primary/50 hover:text-wholesale-primary h-8 px-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Auto
                  </Button>
                )}
              </div>

              {/* Last updated indicator */}
              {lastUpdated && !isManualRate && saleCurrency !== 'EUR' && (
                <span className="text-xs text-wholesale-primary/40">
                  Rate from {lastUpdated.toLocaleDateString()}
                </span>
              )}
              {isManualRate && (
                <span className="text-xs text-wholesale-primary/40 italic">
                  Manual rate
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Advanced Pricing / Extra Costs (Collapsible) */}
        <section className="mb-8">
          <button 
            onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
            className="flex items-center gap-2 text-sm text-wholesale-primary/60 hover:text-wholesale-primary transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedPricing ? 'rotate-180' : ''}`} />
            Advanced Pricing (Extra Costs)
            {totalExtraCostPerKg > 0 && (
              <span className="text-xs bg-wholesale-primary/10 px-2 py-0.5 rounded-full">
                +${totalExtraCostPerKg.toFixed(2)}/kg
              </span>
            )}
          </button>
          
          {showAdvancedPricing && (
            <div className="mt-4 p-4 border border-wholesale-primary/20 bg-[#f8f3de]">
              <p className="text-xs text-wholesale-primary/50 mb-4">
                Add any additional costs per kg that should be included in your cost calculations (import fees, shipping, taxes, etc.)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Import Fee */}
                <div>
                  <Label className="text-xs text-wholesale-primary/70 mb-1.5 block">Import Fee (/kg)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wholesale-primary/60">{CURRENCY_SYMBOLS[saleCurrency] || saleCurrency}</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={extraCosts.importFee || ""}
                      onChange={(e) => setExtraCosts(prev => ({ ...prev, importFee: parseFloat(e.target.value) || 0 }))}
                      className="pl-7 bg-[#e8e2cc] border-wholesale-primary/20"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {/* Shipping */}
                <div>
                  <Label className="text-xs text-wholesale-primary/70 mb-1.5 block">Shipping (/kg)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wholesale-primary/60">{CURRENCY_SYMBOLS[saleCurrency] || saleCurrency}</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={extraCosts.shipping || ""}
                      onChange={(e) => setExtraCosts(prev => ({ ...prev, shipping: parseFloat(e.target.value) || 0 }))}
                      className="pl-7 bg-[#e8e2cc] border-wholesale-primary/20"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {/* Other */}
                <div>
                  <Label className="text-xs text-wholesale-primary/70 mb-1.5 block">Other (/kg)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wholesale-primary/60">{CURRENCY_SYMBOLS[saleCurrency] || saleCurrency}</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={extraCosts.other || ""}
                      onChange={(e) => setExtraCosts(prev => ({ ...prev, other: parseFloat(e.target.value) || 0 }))}
                      className="pl-7 bg-[#e8e2cc] border-wholesale-primary/20"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              {/* Total Display */}
              {totalExtraCostPerKg > 0 && (
                <div className="mt-4 pt-3 border-t border-wholesale-primary/10 flex items-center justify-between">
                  <span className="text-sm text-wholesale-primary/70">Total Extra Cost:</span>
                  <span className="font-helvetica-bold text-wholesale-primary">{CURRENCY_SYMBOLS[saleCurrency] || saleCurrency}{totalExtraCostPerKg.toFixed(2)}/kg</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Section 2: Selling Prices */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="font-helvetica-bold text-sm text-wholesale-primary/70 tracking-wider uppercase mb-1">
              2.0 Your Selling Prices
            </h2>
            <p className="text-xs text-wholesale-primary/50">
              Enter what you charge customers for each brewing method ({CURRENCY_SYMBOLS[saleCurrency] || saleCurrency})
            </p>
            
            {/* Pricing Mode Toggle */}
            {selectedCoffees.length > 0 && (
              <div className="flex items-center gap-3 mt-4 p-3 bg-wholesale-primary/5 rounded-lg">
                <Label htmlFor="pricing-mode" className="text-sm text-wholesale-primary/70">
                  Same prices for all coffees
                </Label>
                <Switch
                  id="pricing-mode"
                  checked={pricingMode === 'different'}
                  onCheckedChange={(checked) => setPricingMode(checked ? 'different' : 'same')}
                />
                <Label htmlFor="pricing-mode" className="text-sm text-wholesale-primary/70">
                  Different prices per coffee
                </Label>
              </div>
            )}
          </div>
          
          {/* Same Prices Mode */}
          {pricingMode === 'same' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProfitInputCard
                title="Espresso"
                description="Single shot of espresso"
                price={brewingPrices.espresso.price}
                grams={brewingPrices.espresso.grams}
                onPriceChange={(v) => updateBrewingPrice('espresso', 'price', v)}
                onGramsChange={(v) => updateBrewingPrice('espresso', 'grams', v)}
                inputMode={globalInputModes.espresso}
                margin={globalMargins.espresso}
                onInputModeChange={(mode) => updateGlobalInputMode('espresso', mode)}
                onMarginChange={(margin) => updateGlobalMargin('espresso', margin)}
                costPerKg={referencePricePerKg}
              />
              <ProfitInputCard
                title="Pour Over"
                description="Single cup pour over"
                price={brewingPrices.pourOver.price}
                grams={brewingPrices.pourOver.grams}
                onPriceChange={(v) => updateBrewingPrice('pourOver', 'price', v)}
                onGramsChange={(v) => updateBrewingPrice('pourOver', 'grams', v)}
                inputMode={globalInputModes.pourOver}
                margin={globalMargins.pourOver}
                onInputModeChange={(mode) => updateGlobalInputMode('pourOver', mode)}
                onMarginChange={(margin) => updateGlobalMargin('pourOver', margin)}
                costPerKg={referencePricePerKg}
              />
              <ProfitInputCard
                title="Batch Brew"
                description="Large batch for service"
                price={brewingPrices.batchBrew.price}
                grams={brewingPrices.batchBrew.grams}
                onPriceChange={(v) => updateBrewingPrice('batchBrew', 'price', v)}
                onGramsChange={(v) => updateBrewingPrice('batchBrew', 'grams', v)}
                gramsLabel="g/batch"
                inputMode={globalInputModes.batchBrew}
                margin={globalMargins.batchBrew}
                onInputModeChange={(mode) => updateGlobalInputMode('batchBrew', mode)}
                onMarginChange={(margin) => updateGlobalMargin('batchBrew', margin)}
                costPerKg={referencePricePerKg}
                isBatchBrew={true}
                litersPerBatch={brewingPrices.batchBrew.litersPerBatch}
                servingSizeML={brewingPrices.batchBrew.servingSizeML}
                wastedServings={brewingPrices.batchBrew.wastedServings}
                onLitersChange={(v) => updateBrewingPrice('batchBrew', 'litersPerBatch', v)}
                onServingSizeChange={(v) => updateBrewingPrice('batchBrew', 'servingSizeML', v)}
                onWastedServingsChange={(v) => updateBrewingPrice('batchBrew', 'wastedServings', v)}
                batchVolumeUnit={batchVolumeUnit}
                onBatchVolumeUnitChange={setBatchVolumeUnit}
              />
            </div>
          )}
          
          {/* Different Prices Mode */}
          {pricingMode === 'different' && (
            <div className="space-y-3">
              {selectedCoffees.length === 0 ? (
                <p className="text-sm text-wholesale-primary/50 text-center py-8">
                  Add coffees above to set individual prices
                </p>
              ) : (
                selectedCoffees.map(coffee => {
                  const coffeeKey = `${coffee.product.id}-${coffee.selectedSize}`;
                  const data = perCoffeeData[coffeeKey] || {
                    prices: brewingPrices,
                    inputModes: DEFAULT_INPUT_MODES,
                    margins: DEFAULT_MARGINS
                  };
                  return (
                    <CoffeePriceEditor
                      key={coffeeKey}
                      coffeeName={cleanProductName(coffee.product.name)}
                      selectedSize={coffee.selectedSize}
                      pricePerKg={coffee.pricePerKg}
                      prices={data.prices}
                      inputModes={data.inputModes}
                      margins={data.margins}
                      onPriceChange={(method, field, value) => 
                        updatePerCoffeePrice(coffeeKey, method, field, value)
                      }
                      onInputModeChange={(method, mode) =>
                        updatePerCoffeeInputMode(coffeeKey, method, mode)
                      }
                      onMarginChange={(method, margin) =>
                        updatePerCoffeeMargin(coffeeKey, method, margin)
                      }
                      batchVolumeUnit={batchVolumeUnit}
                      onBatchVolumeUnitChange={setBatchVolumeUnit}
                    />
                  );
                })
              )}
            </div>
          )}
        </section>

        {/* Section 3: Profit Analysis */}
        {selectedCoffees.length > 0 && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="font-helvetica-bold text-sm text-wholesale-primary/70 tracking-wider uppercase mb-1">
                3.0 Profit Analysis
              </h2>
              <p className="text-xs text-wholesale-primary/50">
                Detailed breakdown for each selected coffee
              </p>
            </div>
            
            <div className="space-y-4">
              {selectedCoffees.map(coffee => {
                const coffeeKey = `${coffee.product.id}-${coffee.selectedSize}`;
                const adjustedPricePerKg = coffee.pricePerKg + totalExtraCostPerKg;
                return (
                  <ProfitAnalysisCard
                    key={coffeeKey}
                    product={coffee.product}
                    selectedSize={coffee.selectedSize}
                    pricePerKg={adjustedPricePerKg}
                    basePricePerKg={coffee.pricePerKg}
                    extraCostPerKg={totalExtraCostPerKg}
                    brewingPrices={getBrewingPricesForCoffee(coffeeKey, adjustedPricePerKg)}
                    onRemove={() => handleRemoveCoffee(coffee.product.id, coffee.selectedSize)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Section 4: Comparison Summary */}
        {selectedCoffees.length > 1 && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="font-helvetica-bold text-sm text-wholesale-primary/70 tracking-wider uppercase mb-1">
                4.0 Comparison Summary
              </h2>
              <p className="text-xs text-wholesale-primary/50">
                Side-by-side comparison of all selected coffees
              </p>
            </div>
            
            <ProfitComparisonTable
              selectedCoffees={selectedCoffees.map(c => ({
                ...c,
                pricePerKg: c.pricePerKg + totalExtraCostPerKg
              }))}
              brewingPrices={brewingPrices}
              pricingMode={pricingMode}
              perCoffeeData={perCoffeeData}
              extraCostPerKg={totalExtraCostPerKg}
            />
          </section>
        )}

        {/* Empty State */}
        {selectedCoffees.length === 0 && (
          <div className="text-center py-16 border border-dashed border-wholesale-primary/20 rounded-lg">
            <Calculator className="w-12 h-12 text-wholesale-primary/20 mx-auto mb-4" />
            <p className="text-wholesale-primary/40 text-sm">
              Select coffees above to see profit analysis
            </p>
          </div>
        )}
      </main>

        <WholesaleFooter />
      </div>
    </CurrencyProvider>
  );
};

export default ProfitCalculator;

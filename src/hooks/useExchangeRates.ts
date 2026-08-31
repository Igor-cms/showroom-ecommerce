import { useState, useEffect } from 'react';

interface ExchangeRates {
  [currency: string]: number;
}

interface UseExchangeRatesReturn {
  rates: ExchangeRates | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Fetch rates from Frankfurter API (free, no API key required)
export const useExchangeRates = (): UseExchangeRatesReturn => {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Base EUR, get rates for common currencies
        const response = await fetch(
          'https://api.frankfurter.app/latest?from=EUR&to=USD,GBP,AUD,CAD,BRL'
        );
        const data = await response.json();
        // Invert rates (we want X → EUR, not EUR → X)
        const invertedRates: ExchangeRates = { EUR: 1 };
        Object.entries(data.rates).forEach(([currency, rate]) => {
          invertedRates[currency] = 1 / (rate as number);
        });
        setRates(invertedRates);
        setLastUpdated(new Date());
      } catch (err) {
        setError('Failed to fetch exchange rates');
        // Fallback rates
        setRates({
          EUR: 1,
          USD: 0.92,
          GBP: 1.17,
          AUD: 0.60,
          CAD: 0.68,
          BRL: 0.16
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  return { rates, loading, error, lastUpdated };
};

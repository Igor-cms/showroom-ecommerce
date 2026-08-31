import { createContext, useContext, ReactNode } from 'react';

interface CurrencyConfig {
  currency: string;
  symbol: string;
  exchangeRateToEUR: number;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  BRL: 'R$',
};

const CurrencyContext = createContext<CurrencyConfig>({
  currency: 'EUR',
  symbol: '€',
  exchangeRateToEUR: 1,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ 
  children, 
  currency, 
  exchangeRateToEUR 
}: { 
  children: ReactNode; 
  currency: string; 
  exchangeRateToEUR: number;
}) => (
  <CurrencyContext.Provider value={{
    currency,
    symbol: CURRENCY_SYMBOLS[currency] || currency,
    exchangeRateToEUR,
  }}>
    {children}
  </CurrencyContext.Provider>
);

// Helper function
export const getCurrencySymbol = (currency: string): string => 
  CURRENCY_SYMBOLS[currency] || currency;

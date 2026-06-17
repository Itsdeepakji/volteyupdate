import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
const STORAGE_KEY = "voltey_currency";

export interface CurrencyDef {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  enabled: boolean;
  isDefault: boolean;
}

const DEFAULT_USD: CurrencyDef = {
  code: "USD", name: "US Dollar", symbol: "$", rate: 1, enabled: true, isDefault: true,
};

interface CurrencyContextValue {
  currencies: CurrencyDef[];
  selected: CurrencyDef;
  setCode: (code: string) => void;
  fmt: (cents: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currencies: [DEFAULT_USD],
  selected: DEFAULT_USD,
  setCode: () => {},
  fmt: (cents) => `$${(cents / 100).toFixed(2)}`,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencies, setCurrencies] = useState<CurrencyDef[]>([DEFAULT_USD]);
  const [selectedCode, setSelectedCode] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? "USD"
  );

  useEffect(() => {
    const endpoint = `${API}/api/currencies`;
    fetch(endpoint)
      .then(r => r.ok ? r.json() : [DEFAULT_USD])
      .then((data: CurrencyDef[]) => {
        if (data && data.length) setCurrencies(data);
      })
      .catch(() => {});
  }, []);

  const setCode = (code: string) => {
    setSelectedCode(code);
    localStorage.setItem(STORAGE_KEY, code);
    window.dispatchEvent(new Event("voltey-currency-changed"));
  };

  const selected =
    currencies.find(c => c.code === selectedCode) ??
    currencies.find(c => c.isDefault) ??
    DEFAULT_USD;

  const fmt = (cents: number): string => {
    const usd = cents / 100;
    const converted = usd * selected.rate;
    return `${selected.symbol}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currencies, selected, setCode, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);

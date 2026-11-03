"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type DisplayCurrency = "USD" | "PHP";

type CurrencyContextValue = {
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
  phpRate: number;
  format: (usdCents: number) => string;
  formatPhp: (usdCents: number) => string;
  formatUsd: (usdCents: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);
const STORAGE_KEY = "nebula.currency";

export function CurrencyProvider({ children, phpRate }: { children: ReactNode; phpRate: number }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>("USD");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "USD" || saved === "PHP") setCurrencyState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setCurrency = (next: DisplayCurrency) => {
    setCurrencyState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const value = useMemo<CurrencyContextValue>(() => {
    const formatUsd = (usdCents: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usdCents / 100);
    const formatPhp = (usdCents: number) => {
      const centavos = Math.max(100, Math.round(usdCents * phpRate));
      return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(centavos / 100);
    };
    return {
      currency,
      setCurrency,
      phpRate,
      formatUsd,
      formatPhp,
      format: (usdCents) => (currency === "PHP" ? formatPhp(usdCents) : formatUsd(usdCents)),
    };
  }, [currency, phpRate]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error("useCurrency must be used inside CurrencyProvider");
  return value;
}

"use client";

import { useCurrency, type DisplayCurrency } from "@/components/currency-provider";

export function CurrencyToggle({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { currency, setCurrency } = useCurrency();
  const dark = tone === "dark";

  return (
    <div
      className={
        dark
          ? "inline-flex rounded-full border border-white/15 bg-[#0d2429]/55 p-0.5 text-[11px] font-bold tracking-wide"
          : "inline-flex rounded-full border border-[#12343c]/12 bg-white/80 p-0.5 text-[11px] font-bold tracking-wide"
      }
      role="group"
      aria-label="Display currency"
    >
      {(["USD", "PHP"] as DisplayCurrency[]).map((option) => {
        const active = currency === option;
        return (
          <button
            key={option}
            type="button"
            className={
              active
                ? dark
                  ? "rounded-full bg-[#5eead4] px-2.5 py-1 text-[#0d2429]"
                  : "rounded-full bg-[#12343c] px-2.5 py-1 text-[#f6f0e4]"
                : dark
                  ? "rounded-full px-2.5 py-1 text-[#c6e4df]"
                  : "rounded-full px-2.5 py-1 text-[#3d5158]"
            }
            aria-pressed={active}
            onClick={() => setCurrency(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

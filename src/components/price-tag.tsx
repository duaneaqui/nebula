"use client";

import { useCurrency } from "@/components/currency-provider";

export function PriceTag({
  priceCents,
  compareAtCents,
  size = "lg",
}: {
  priceCents: number;
  compareAtCents?: number;
  size?: "sm" | "lg" | "xl";
}) {
  const { format } = useCurrency();
  const onSale = typeof compareAtCents === "number" && compareAtCents > priceCents;
  const sizeClass =
    size === "xl" ? "text-4xl" : size === "lg" ? "text-3xl" : "text-lg";

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {onSale ? (
        <span className="text-sm font-semibold text-[#9aa8ad] line-through decoration-[#9aa8ad]">
          {format(compareAtCents)}
        </span>
      ) : null}
      <span className={`font-display leading-none ${sizeClass}`}>{format(priceCents)}</span>
      {onSale ? (
        <span className="rounded-full bg-[#fff1e6] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#9a3412] uppercase">
          Sale
        </span>
      ) : null}
    </span>
  );
}

/** 1 = lowest value … steps = highest value */
export function ValueMeter({
  level,
  steps = 5,
  accent,
  label = "Value",
}: {
  level: number;
  steps?: number;
  accent: string;
  label?: string;
}) {
  const clamped = Math.min(steps, Math.max(1, level));
  return (
    <div className="relative mt-3" aria-label={`${label}: ${clamped} of ${steps}`}>
      <div className="mb-1 flex items-center justify-between text-[10px] font-bold tracking-[0.14em] text-[#5c6d73] uppercase">
        <span>{label}</span>
        <span>
          {clamped}/{steps}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: steps }, (_, index) => {
          const filled = index < clamped;
          return (
            <span
              key={index}
              className="h-1.5 flex-1 rounded-full"
              style={{
                background: filled ? accent : "rgba(18, 52, 60, 0.12)",
                opacity: filled ? 0.55 + (index / steps) * 0.45 : 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

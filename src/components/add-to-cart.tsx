"use client";

import { useCart } from "@/components/cart-provider";
import { useState } from "react";

export function AddToCart({
  productId,
  maxQuantity,
  singular,
  label,
  compact,
}: {
  productId: string;
  maxQuantity: number;
  singular?: boolean;
  label?: string;
  compact?: boolean;
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);

  return (
    <div className={compact ? "mt-0 flex w-full justify-stretch" : "mt-4 flex flex-wrap items-center gap-2"}>
      {singular || compact ? null : (
        <div className="stepper" aria-label="Quantity">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
            −
          </button>
          <span className="min-w-6 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
          >
            +
          </button>
        </div>
      )}
      <button
        className={compact ? "btn btn-orange min-h-10 w-full px-4 text-xs" : "btn btn-orange"}
        type="button"
        disabled={pending}
        onClick={() => {
          setPending(true);
          void add(productId, singular || compact ? 1 : quantity).finally(() => setPending(false));
        }}
      >
        {label ?? (singular ? "Add rank" : "Add to cart")}
      </button>
    </div>
  );
}

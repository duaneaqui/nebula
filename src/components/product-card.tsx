"use client";

import { AddToCart } from "@/components/add-to-cart";
import { PriceTag, ValueMeter } from "@/components/price-tag";
import type { Product } from "@/lib/catalog";
import Link from "next/link";

export function ProductCard({ product }: { product: Product }) {
  const delivery = product.delivery;
  const showValue = (delivery.type === "rank" || delivery.type === "key") && product.valueLevel;

  return (
    <article className="product-card lift flex h-full flex-col p-5 transition duration-300 hover:-translate-y-1">
      <div className="product-card-glow" style={{ background: product.accent }} />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: product.accent }}>
          {delivery.type === "key" ? `Tier ${delivery.tier}` : delivery.type === "stardust" ? "Currency" : "Rank"}
        </p>
        {product.badge ? (
          <span className="rounded-full bg-[#fff1e6] px-2 py-1 text-[11px] font-bold tracking-wide text-[#9a3412] uppercase">
            {product.badge}
          </span>
        ) : null}
      </div>
      <Link href={`/product/${product.id}`} className="relative mt-3 block hover:underline">
        <span className="font-display text-3xl leading-none">{bigLabel(product)}</span>
      </Link>
      {delivery.type === "stardust" && delivery.amount !== delivery.baseAmount ? (
        <p className="relative mt-2 text-sm text-[#66777c] line-through">
          {delivery.baseAmount.toLocaleString("en-US")} Stardust
        </p>
      ) : null}
      {delivery.type === "stardust" ? <p className="relative mt-2 text-sm font-semibold">Stardust</p> : null}
      <p className={`relative ${delivery.type === "stardust" ? "mt-1" : "mt-2"} text-sm leading-6 text-[#3d5158]`}>
        {product.blurb}
      </p>
      {showValue ? <ValueMeter level={product.valueLevel!} accent={product.accent} /> : null}
      <div className="relative mt-4">
        <PriceTag priceCents={product.priceCents} compareAtCents={product.compareAtCents} />
      </div>
      <div className="relative mt-auto pt-3">
        <AddToCart productId={product.id} maxQuantity={product.maxQuantity} singular={delivery.type === "rank"} />
      </div>
    </article>
  );
}

function bigLabel(product: Product) {
  if (product.delivery.type === "stardust") return product.delivery.amount.toLocaleString("en-US");
  return product.name;
}

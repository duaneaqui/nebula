"use client";

import { useCart } from "@/components/cart-provider";
import { useCurrency } from "@/components/currency-provider";
import { PlayerHead } from "@/components/player-head";
import { PriceTag } from "@/components/price-tag";
import { EMPTY_CART_ART } from "@/lib/art";
import { getProduct } from "@/lib/catalog";
import Image from "next/image";
import Link from "next/link";

export function CartView() {
  const { ready, lines, username, player, ensureUsername, changeUsername, setQuantity, remove } = useCart();
  const { format } = useCurrency();

  if (!ready) return <p className="text-sm text-[#3d5158]">Loading your cart…</p>;

  const detailed = lines
    .map((line) => {
      const product = getProduct(line.productId);
      if (!product) return null;
      return { line, product, total: product.priceCents * line.quantity };
    })
    .filter((entry) => entry !== null);

  const total = detailed.reduce((sum, entry) => sum + entry.total, 0);

  if (detailed.length === 0) {
    return (
      <div className="plaza-card overflow-hidden p-0">
        <div className="grid items-stretch md:grid-cols-[1.05fr_0.95fr]">
          <div className="p-8">
            <div className="flex flex-wrap items-center gap-4">
              {player ? <PlayerHead player={player} size={56} rounded="md" className="ring-2 ring-[#12343c]/15" /> : null}
              <div>
                <h1 className="font-display text-4xl">
                  {username ? `${username}'s cart is empty` : "Your cart is empty"}
                </h1>
                <p className="mt-3 max-w-lg text-[#3d5158]">Ranks, Stardust, and crate keys will show up here.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/store/ranks" className="btn btn-orange">
                Browse ranks
              </Link>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => void (username ? changeUsername() : ensureUsername())}
              >
                {username ? "Change Minecraft name" : "Set Minecraft name"}
              </button>
            </div>
          </div>
          <div className="relative min-h-[14rem] md:min-h-full">
            <Image
              src={EMPTY_CART_ART}
              alt="An empty crate waiting to be filled"
              fill
              sizes="(max-width: 768px) 100vw, 420px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {player ? <PlayerHead player={player} size={44} rounded="md" /> : null}
          <h1 className="font-display text-4xl">{username ? `${username}'s cart` : "Cart"}</h1>
        </div>
        {detailed.map(({ line, product, total: lineTotal }) => (
          <article key={product.id} className="plaza-card flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <Link href={`/product/${product.id}`} className="font-display text-xl">
                {product.name}
              </Link>
              <p className="text-sm text-[#3d5158]">
                <PriceTag priceCents={product.priceCents} compareAtCents={product.compareAtCents} size="sm" /> each
              </p>
            </div>
            <div className="flex items-center gap-3">
              {product.maxQuantity === 1 ? (
                <span className="text-sm">Qty 1</span>
              ) : (
                <div className="stepper">
                  <button type="button" aria-label={`Decrease ${product.name}`} onClick={() => setQuantity(product.id, line.quantity - 1)}>
                    −
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold">{line.quantity}</span>
                  <button type="button" aria-label={`Increase ${product.name}`} onClick={() => setQuantity(product.id, line.quantity + 1)}>
                    +
                  </button>
                </div>
              )}
              <p className="min-w-20 text-right font-semibold">{format(lineTotal)}</p>
              <button className="text-sm underline" type="button" onClick={() => remove(product.id)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
      <aside className="plaza-card h-fit p-5">
        <p className="text-sm text-[#3d5158]">Deliver to</p>
        <button
          className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-[#12343c]/10 bg-[#fff9f0] px-3 py-2.5 text-left"
          type="button"
          onClick={() => void (username ? changeUsername() : ensureUsername())}
        >
          {player ? <PlayerHead player={player} size={40} rounded="md" /> : null}
          <span className="min-w-0">
            <span className="block truncate font-display text-xl">{username || "Set a username"}</span>
            <span className="block text-xs font-bold tracking-wide text-[#0f766e] uppercase">
              {player?.bedrock ? "Bedrock" : player ? "Java · confirmed" : "Tap to set"}
            </span>
          </span>
        </button>
        <p className="mt-4 text-sm text-[#3d5158]">Total</p>
        <p className="font-display text-4xl">{format(total)}</p>
        <Link href="/checkout" className="btn btn-orange mt-5 w-full">
          Checkout
        </Link>
        <p className="mt-3 text-xs leading-5 text-[#5c6d73]">
          A paid rank replaces any lower paid rank on that account. Ascension is separate and stays.
        </p>
      </aside>
    </div>
  );
}

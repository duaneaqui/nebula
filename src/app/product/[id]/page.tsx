import { AddToCart } from "@/components/add-to-cart";
import { PriceTag, ValueMeter } from "@/components/price-tag";
import { LANE_ART, RANK_SIGIL } from "@/lib/art";
import { getProduct, PRODUCTS, RANK_STYLE } from "@/lib/catalog";
import { perksForRank } from "@/lib/rank-perks";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  return { title: product?.name ?? "Package" };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  const rank = product.delivery.type === "rank" ? product.delivery.group : null;
  const style = rank ? RANK_STYLE[rank] : null;

  const lane = LANE_ART[product.category];
  const sigil = rank ? RANK_SIGIL[rank] : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="flex flex-wrap items-center gap-4">
          {sigil ? (
            <Image
              src={sigil.src}
              alt={sigil.alt}
              width={72}
              height={72}
              className="rank-sigil h-[72px] w-[72px] rounded-full object-cover ring-1 ring-[#12343c]/10"
            />
          ) : null}
          <div>
            <p className="kicker" style={style ? { color: style.color } : undefined}>
              {product.category}
            </p>
            <h1 className="mt-2 font-display text-5xl">{product.name}</h1>
          </div>
        </div>
        <p className="mt-4 max-w-xl text-lg leading-8 text-[#314249]">{product.blurb}</p>
        {product.highlights.length > 0 ? (
          <ul className="mt-6 grid gap-2 text-sm">
            {product.highlights.map((highlight) => (
              <li key={highlight} className="rounded-2xl bg-white/70 px-4 py-3">
                {highlight}
              </li>
            ))}
          </ul>
        ) : null}
        {rank ? (
          <div className="mt-6">
            <h2 className="font-display text-2xl">At this rank</h2>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {perksForRank(rank).map((perk) => (
                <div key={perk.label} className="rounded-2xl bg-white/70 px-4 py-3" title={perk.tip}>
                  <dt className="text-xs font-bold tracking-wide text-[#5c6d73] uppercase">{perk.label}</dt>
                  <dd className="mt-1 font-semibold">{perk.value === "Yes" ? "Included" : perk.value}</dd>
                </div>
              ))}
            </dl>
            <Link href="/ranks" className="mt-4 inline-block text-sm font-semibold underline">
              Compare with the other ranks
            </Link>
          </div>
        ) : null}
      </div>
      <aside className="plaza-card h-fit overflow-hidden p-0" style={{ boxShadow: `inset 0 4px 0 ${product.accent}, 0 18px 40px rgba(18, 52, 60, 0.06)` }}>
        <div className="relative aspect-[16/10]">
          <Image src={lane.src} alt={lane.alt} fill sizes="(max-width: 1024px) 90vw, 420px" className="object-cover" />
        </div>
        <div className="p-6">
          {(product.delivery.type === "rank" || product.delivery.type === "key") && product.valueLevel ? (
            <ValueMeter level={product.valueLevel} accent={product.accent} />
          ) : null}
          <div className="mt-4">
            <PriceTag priceCents={product.priceCents} compareAtCents={product.compareAtCents} size="xl" />
          </div>
          <AddToCart productId={product.id} maxQuantity={product.maxQuantity} singular={product.delivery.type === "rank"} />
          <ul className="mt-5 grid gap-2 text-sm leading-6 text-[#3d5158]">
            {notes(product.delivery.type).map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function notes(type: "rank" | "stardust" | "key") {
  if (type === "rank") {
    return [
      "Buying this rank removes any other paid rank on that account, then sets this one.",
      "Ascension (Spark through Zenith) is separate and is put back if a rank command clears it.",
      "You keep this rank's kit. Lower paid kits are turned off.",
      "Flight, when included, works inside land you own and turns off when you leave.",
      "Applied cosmetics stay on the account.",
    ];
  }
  if (type === "stardust") {
    return [
      "Added with the in-game Stardust balance.",
      "Extra claim chunks stay in /claimshop — this store does not sell Lands chunks.",
      "This store does not sell gold.",
    ];
  }
  return [
    "Delivered with /cratekey the next time that player is online.",
    "Open them at /warp crates.",
    "Vote, Seasonal, and Ascendant keys are earned in game.",
  ];
}

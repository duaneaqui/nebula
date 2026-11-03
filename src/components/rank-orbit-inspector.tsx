"use client";

import { AddToCart } from "@/components/add-to-cart";
import { PriceTag, ValueMeter } from "@/components/price-tag";
import { RANK_SIGIL } from "@/lib/art";
import { PAID_RANKS, RANK_STYLE, rankProduct, type PaidRank } from "@/lib/catalog";
import { perksForRank } from "@/lib/rank-perks";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

export function RankOrbitInspector({ initial }: { initial?: PaidRank }) {
  const [selected, setSelected] = useState<PaidRank>(initial ?? "voyager");
  const panel = useRef<HTMLDivElement>(null);
  const product = rankProduct(selected);
  const style = RANK_STYLE[selected];
  const sigil = RANK_SIGIL[selected];
  const perks = perksForRank(selected);

  useGSAP(
    () => {
      if (!panel.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        panel.current,
        { opacity: 0.35, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" },
      );
    },
    { dependencies: [selected] },
  );

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (PAID_RANKS.includes(hash as PaidRank)) setSelected(hash as PaidRank);
  }, []);

  if (!product) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {PAID_RANKS.map((rank, index) => {
          const item = rankProduct(rank);
          const rankStyle = RANK_STYLE[rank];
          const rankSigil = RANK_SIGIL[rank];
          if (!item) return null;
          const active = rank === selected;
          return (
            <button
              key={rank}
              type="button"
              onClick={() => {
                setSelected(rank);
                window.history.replaceState(null, "", `#${rank}`);
              }}
              className={`group flex items-center gap-3 rounded-[1.35rem] border p-3 text-left transition ${
                active
                  ? "border-transparent shadow-[0_18px_40px_rgba(18,52,60,0.12)]"
                  : "border-[#12343c]/10 bg-white/70 hover:-translate-y-0.5 hover:border-[#12343c]/18"
              }`}
              style={
                active
                  ? {
                      background: `linear-gradient(135deg, ${rankStyle.color}18, #fffdf8 55%)`,
                      boxShadow: `inset 0 3px 0 ${rankStyle.color}, 0 18px 40px rgba(18,52,60,0.1)`,
                    }
                  : undefined
              }
              aria-pressed={active}
            >
              <Image
                src={rankSigil.src}
                alt=""
                width={56}
                height={56}
                className={`h-14 w-14 rounded-full object-cover ring-1 ring-[#12343c]/10 transition ${
                  active ? "scale-105" : "group-hover:scale-105"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: rankStyle.color }}>
                  Orbit {index + 1}
                </span>
                <span className="mt-1 block font-display text-xl leading-none" style={{ color: active ? rankStyle.color : undefined }}>
                  {rankStyle.mark ? `${rankStyle.mark} ` : ""}
                  {rankStyle.label}
                </span>
                <span className="mt-2 block">
                  <PriceTag priceCents={item.priceCents} compareAtCents={item.compareAtCents} size="sm" />
                </span>
              </span>
              <span
                className={`text-xs font-bold tracking-wide uppercase ${active ? "text-[#0f766e]" : "text-[#9aa8ad]"}`}
              >
                {active ? "Open" : "Peek"}
              </span>
            </button>
          );
        })}
      </div>

      <div
        ref={panel}
        className="plaza-card overflow-hidden p-0"
        style={{ boxShadow: `inset 0 4px 0 ${style.color}, 0 18px 40px rgba(18,52,60,0.08)` }}
      >
        <div
          className="relative overflow-hidden px-6 py-8 sm:px-8"
          style={{
            background: `radial-gradient(520px 220px at 90% 10%, ${style.color}33, transparent 60%), linear-gradient(160deg, #0d2429, #12343c)`,
          }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <Image
              src={sigil.src}
              alt={sigil.alt}
              width={88}
              height={88}
              className="h-[88px] w-[88px] rounded-full object-cover ring-2 ring-white/20"
            />
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#7fdad2] uppercase">Rank dossier</p>
              <h2 className="mt-2 font-display text-4xl text-[#f4fbf9]" style={{ color: "#f4fbf9" }}>
                <span style={{ color: style.color }}>{style.mark ? `${style.mark} ` : ""}</span>
                {style.label}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#c6e4df]">{product.blurb}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8">
          <ValueMeter level={product.valueLevel ?? 1} accent={style.color} />
          <div>
            <PriceTag priceCents={product.priceCents} compareAtCents={product.compareAtCents} size="xl" />
          </div>

          {product.highlights.length > 0 ? (
            <ul className="grid gap-2 text-sm">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="rounded-2xl bg-[#fff9f0] px-4 py-3 text-[#314249]">
                  {highlight}
                </li>
              ))}
            </ul>
          ) : null}

          <div>
            <h3 className="font-display text-2xl">At this orbit</h3>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {perks.slice(0, 8).map((perk) => (
                <div key={perk.label} className="rounded-2xl border border-[#12343c]/8 bg-white/80 px-4 py-3" title={perk.tip}>
                  <dt className="text-[11px] font-bold tracking-wide text-[#5c6d73] uppercase">{perk.label}</dt>
                  <dd className="mt-1 font-semibold text-[#14242b]">{perk.value === "Yes" ? "Included" : perk.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="min-w-[10rem] flex-1">
              <AddToCart productId={product.id} maxQuantity={1} singular label="Add this rank" />
            </div>
            <Link href={`/product/${product.id}`} className="btn btn-ghost">
              Full product page
            </Link>
            <Link href="/ranks" className="btn btn-ghost">
              Compare board
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

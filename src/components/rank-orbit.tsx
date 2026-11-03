"use client";

import { AddToCart } from "@/components/add-to-cart";
import { PriceTag, ValueMeter } from "@/components/price-tag";
import { RANK_SIGIL } from "@/lib/art";
import { RANK_STYLE, rankProduct, type PaidRank } from "@/lib/catalog";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const RANKS: PaidRank[] = ["voyager", "nova", "pulsar", "quasar", "singularity"];

export function RankOrbit() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".rank-orbit-card", {
        opacity: 0,
        y: 40,
        rotate: -2,
        stagger: 0.08,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 80%",
        },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="rank-orbit">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Paid ranks</p>
          <h2 className="mt-2 font-display text-4xl">Pick your orbit</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#3d5158]">
            A higher rank replaces a lower one. Your free Ascension forge track stays. Kits stay exclusive to the tier
            you buy.
          </p>
        </div>
        <Link href="/ranks" className="text-sm font-semibold underline">
          Open the full compare board
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {RANKS.map((rank, index) => {
          const product = rankProduct(rank);
          const style = RANK_STYLE[rank];
          const sigil = RANK_SIGIL[rank];
          if (!product) return null;
          return (
            <article
              key={rank}
              className="rank-orbit-card"
              style={{
                ["--rank-accent" as string]: style.color,
                transform: `translateY(${index % 2 === 0 ? "0" : "1.1rem"})`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: style.color }}>
                  Tier {index + 1}
                </p>
                <Image
                  src={sigil.src}
                  alt={sigil.alt}
                  width={52}
                  height={52}
                  className="rank-sigil h-[52px] w-[52px] rounded-full object-cover ring-1 ring-[#12343c]/10"
                />
              </div>
              <Link href={`/product/${product.id}`} className="mt-3 block font-display text-2xl" style={{ color: style.color }}>
                {style.mark ? `${style.mark} ` : ""}
                {style.label}
              </Link>
              <p className="mt-2 text-sm leading-5 text-[#3d5158]">{product.blurb}</p>
              <ValueMeter level={product.valueLevel ?? index + 1} accent={style.color} />
              <div className="mt-4">
                <PriceTag priceCents={product.priceCents} compareAtCents={product.compareAtCents} size="lg" />
              </div>
              <AddToCart productId={product.id} maxQuantity={1} singular label="Add to cart" compact />
            </article>
          );
        })}
      </div>
    </div>
  );
}

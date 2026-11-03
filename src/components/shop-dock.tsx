"use client";

import { CATEGORIES } from "@/lib/catalog";
import { COMPARE_ART, LANE_ART } from "@/lib/art";
import Image from "next/image";
import Link from "next/link";

const BLURBS: Record<string, string> = {
  ranks: "Voyager to Singularity",
  stardust: "Premium currency packs",
  keys: "Comet to Empyrean",
};

const DESTINATIONS = [
  ...CATEGORIES.map((category) => ({
    id: category.id,
    href: category.href,
    title: category.title,
    blurb: BLURBS[category.id],
    art: LANE_ART[category.id],
  })),
  {
    id: "compare",
    href: "/ranks",
    title: "Compare",
    blurb: "Every paid perk side by side",
    art: COMPARE_ART,
  },
];

export function ShopDock() {
  return (
    <nav aria-label="Store destinations" className="shop-dock">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
        {DESTINATIONS.map((item) => (
          <Link key={item.href} href={item.href} className="shop-dock-item">
            <span className="shop-dock-thumb">
              <Image src={item.art.src} alt="" fill sizes="96px" className="object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg leading-none tracking-tight">{item.title}</span>
              <span className="mt-1.5 block text-xs leading-snug text-[#5c6d73]">{item.blurb}</span>
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

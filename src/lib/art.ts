import type { CategoryId, PaidRank } from "@/lib/catalog";

export const HERO_ART = "/art/hero.webp";
export const EMPTY_CART_ART = "/art/empty-cart.webp";
export const ORDER_DELIVERED_ART = "/art/order-delivered.webp";

export const LANE_ART: Record<CategoryId, { src: string; alt: string }> = {
  ranks: { src: "/art/lane-ranks.webp", alt: "Orbital crest for paid ranks" },
  stardust: { src: "/art/lane-stardust.webp", alt: "Vial of glowing Stardust" },
  keys: { src: "/art/lane-keys.webp", alt: "Ornate crate key" },
};

export const COMPARE_ART = {
  src: "/art/lane-compare.webp",
  alt: "Overlapping rank seals for the compare board",
};

export const RANK_SIGIL: Record<PaidRank, { src: string; alt: string }> = {
  voyager: { src: "/art/sigil-voyager.webp", alt: "Voyager rank sigil" },
  nova: { src: "/art/sigil-nova.webp", alt: "Nova rank sigil" },
  pulsar: { src: "/art/sigil-pulsar.webp", alt: "Pulsar rank sigil" },
  quasar: { src: "/art/sigil-quasar.webp", alt: "Quasar rank sigil" },
  singularity: { src: "/art/sigil-singularity.webp", alt: "Singularity rank sigil" },
};

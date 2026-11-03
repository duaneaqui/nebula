export const PAID_RANKS = ["voyager", "nova", "pulsar", "quasar", "singularity"] as const;
export type PaidRank = (typeof PAID_RANKS)[number];

export const CRATE_KEYS = [
  "key_comet",
  "key_meteor",
  "key_eclipse",
  "key_horizon",
  "key_empyrean",
] as const;
export type CrateKeyId = (typeof CRATE_KEYS)[number];

export type CategoryId = "ranks" | "stardust" | "keys";

export type Delivery =
  | { type: "rank"; group: PaidRank }
  | { type: "stardust"; amount: number; baseAmount: number }
  | { type: "key"; keyId: CrateKeyId; tier: string };

export type Product = {
  id: string;
  category: CategoryId;
  name: string;
  blurb: string;
  /** Real sale price in USD cents */
  priceCents: number;
  /** Fake “was” price for slash-sale display */
  compareAtCents?: number;
  /** 1 = lowest value … higher = more expensive / better */
  valueLevel?: number;
  badge?: string;
  accent: string;
  maxQuantity: number;
  highlights: string[];
  delivery: Delivery;
};

export type Category = {
  id: CategoryId;
  title: string;
  lede: string;
  href: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "ranks",
    title: "Ranks",
    lede: "Voyager through Singularity. A higher rank replaces a lower one. The free Ascension track stays.",
    href: "/store/ranks",
  },
  {
    id: "stardust",
    title: "Stardust",
    lede: "Premium currency for cosmetics, /claimshop chunks, and the exchange. Gold is not sold here.",
    href: "/store/stardust",
  },
  {
    id: "keys",
    title: "Crate keys",
    lede: "Keys for the paid crates at /warp crates. Vote, Seasonal, and Ascendant keys are earned in game.",
    href: "/store/keys",
  },
];

export const RANK_STYLE: Record<PaidRank | "drifter", { label: string; mark: string; color: string }> = {
  drifter: { label: "Drifter", mark: "", color: "#5c6b73" },
  voyager: { label: "Voyager", mark: "", color: "#0f766e" },
  nova: { label: "Nova", mark: "", color: "#1d4ed8" },
  pulsar: { label: "Pulsar", mark: "", color: "#6d28d9" },
  quasar: { label: "Quasar", mark: "★", color: "#a16207" },
  singularity: { label: "Singularity", mark: "✦", color: "#6b21a8" },
};

export const PRODUCTS: Product[] = [
  {
    id: "rank-voyager",
    category: "ranks",
    name: "Voyager",
    blurb: "The first paid rank. More homes, a second vault, and room to start a shop.",
    priceCents: 599,
    compareAtCents: 1099,
    valueLevel: 1,
    badge: "Starter",
    accent: RANK_STYLE.voyager.color,
    maxQuantity: 1,
    highlights: [
      "3 homes · 10 auction listings · 2 vaults",
      "12 claim chunks · 1 quest slot · 1 player warp",
      "AFK, /hat, nick color, /show, rename color",
      "/repair hand every 12 hours",
      "Common cosmetics",
      "Exclusive /kit voyager",
    ],
    delivery: { type: "rank", group: "voyager" },
  },
  {
    id: "rank-nova",
    category: "ranks",
    name: "Nova",
    blurb: "More room to build, format your nick, and write lore on your gear.",
    priceCents: 899,
    compareAtCents: 1499,
    valueLevel: 2,
    accent: RANK_STYLE.nova.color,
    maxQuantity: 1,
    highlights: [
      "5 homes · 15 auction listings · 3 vaults",
      "20 claim chunks · 2 quest slots · 2 player warps",
      "Nick format, item lore, and /enderchest",
      "/repair hand every 12 hours",
      "Uncommon cosmetics",
      "Exclusive /kit nova",
    ],
    delivery: { type: "rank", group: "nova" },
  },
  {
    id: "rank-pulsar",
    category: "ranks",
    name: "Pulsar",
    blurb: "Solid chat colors, custom kill messages, and a third Nebula Crypt run each day.",
    priceCents: 1399,
    compareAtCents: 2299,
    valueLevel: 3,
    accent: RANK_STYLE.pulsar.color,
    maxQuantity: 1,
    highlights: [
      "7 homes · 20 auction listings · 4 vaults",
      "30 claim chunks · 3 quest slots · 3 player warps",
      "3 Crypt runs a day · /back · portable stations",
      "/repair hand (12h) · /repair all (36h)",
      "Solid chat colors, kill messages, Rare+ cosmetics",
      "Exclusive /kit pulsar",
    ],
    delivery: { type: "rank", group: "pulsar" },
  },
  {
    id: "rank-quasar",
    category: "ranks",
    name: "★ Quasar",
    blurb: "Flight inside land you own, plus gradient chat colors.",
    priceCents: 1899,
    compareAtCents: 2999,
    valueLevel: 4,
    badge: "Flight",
    accent: RANK_STYLE.quasar.color,
    maxQuantity: 1,
    highlights: [
      "10 homes · 5 vaults · 40 claim chunks",
      "4 quest slots · 4 player warps",
      "Flight inside your own claims",
      "/repair hand (12h) · /repair all (36h)",
      "Solar, Nebula, and Horizon chat gradients",
      "Exclusive /kit quasar",
    ],
    delivery: { type: "rank", group: "quasar" },
  },
  {
    id: "rank-singularity",
    category: "ranks",
    name: "✦ Singularity",
    blurb: "The top paid rank. The most homes, vaults, claims, and the Void and Empyrean colors.",
    priceCents: 2599,
    compareAtCents: 3999,
    valueLevel: 5,
    badge: "Top rank",
    accent: RANK_STYLE.singularity.color,
    maxQuantity: 1,
    highlights: [
      "15 homes · 6 vaults · 50 claim chunks",
      "5 quest slots · 5 player warps",
      "Void and Empyrean chat colors · /back on death",
      "/repair hand (12h) · /repair all (36h)",
      "Exclusive /kit singularity",
    ],
    delivery: { type: "rank", group: "singularity" },
  },
  stardust("stardust-700", 700, 700, 199, 299),
  stardust("stardust-1200", 1200, 1000, 399, 599, "20% extra"),
  stardust("stardust-2500", 2500, 2000, 799, 1199, "Popular"),
  stardust("stardust-6000", 6000, 5000, 1499, 2199, "20% extra"),
  stardust("stardust-10000", 10000, 8000, 1999, 2999, "Best value"),
  key("key-comet", "key_comet", "Comet Key", "I", "The first paid crate.", 99, 199, 1, "#0f766e"),
  key("key-meteor", "key_meteor", "Meteor Key", "II", "A hotter roll than Comet.", 299, 499, 2, "#c2410c"),
  key("key-eclipse", "key_eclipse", "Eclipse Key", "III", "The middle of the paid crate ladder.", 499, 799, 3, "#6d28d9"),
  key("key-horizon", "key_horizon", "Horizon Key", "IV", "A high-tier key with a title card on open.", 699, 1099, 4, "#1d4ed8"),
  key(
    "key-empyrean",
    "key_empyrean",
    "Empyrean Key",
    "V",
    "The top paid crate.",
    999,
    1599,
    5,
    "#6b21a8",
    "Top crate",
  ),
];

function stardust(
  id: string,
  amount: number,
  baseAmount: number,
  priceCents: number,
  compareAtCents: number,
  badge?: string,
): Product {
  const bonus = amount - baseAmount;
  return {
    id,
    category: "stardust",
    name: `${amount.toLocaleString("en-US")} Stardust`,
    blurb: bonus > 0 ? `${bonus.toLocaleString("en-US")} extra on this pack.` : "A small Stardust top-up.",
    priceCents,
    compareAtCents,
    badge,
    accent: "#0f766e",
    maxQuantity: 10,
    highlights: [],
    delivery: { type: "stardust", amount, baseAmount },
  };
}

function key(
  id: string,
  keyId: CrateKeyId,
  name: string,
  tier: string,
  blurb: string,
  priceCents: number,
  compareAtCents: number,
  valueLevel: number,
  accent: string,
  badge?: string,
): Product {
  return {
    id,
    category: "keys",
    name,
    blurb,
    priceCents,
    compareAtCents,
    valueLevel,
    badge,
    accent,
    maxQuantity: 20,
    highlights: [`Tier ${tier} on the paid crate ladder`],
    delivery: { type: "key", keyId, tier },
  };
}

export function getCategory(id: string) {
  return CATEGORIES.find((category) => category.id === id);
}

export function getProduct(id: string) {
  return PRODUCTS.find((product) => product.id === id);
}

export function productsIn(category: CategoryId) {
  return PRODUCTS.filter((product) => product.category === category);
}

export function rankProduct(group: PaidRank) {
  return PRODUCTS.find((product) => product.delivery.type === "rank" && product.delivery.group === group);
}

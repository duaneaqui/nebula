import { RankTable } from "@/components/rank-table";
import { ShopDock } from "@/components/shop-dock";
import Link from "next/link";

export const metadata = { title: "Compare ranks" };

export default function RanksPage() {
  return (
    <div>
      <div className="border-b border-[#12343c]/8 bg-[#fff9f0]/85">
        <ShopDock />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="kicker">Ranks</p>
        <h1 className="mt-2 font-display text-5xl">Compare paid ranks</h1>
        <p className="mt-3 max-w-2xl text-[#3d5158]">
          Only the perks that change with Voyager through Singularity. Commands every player already has are left off.
          Higher ranks keep the lower rank&apos;s unlocks, except paid kits — each tier kit is exclusive.
        </p>
        <div className="mt-8">
          <RankTable />
        </div>
        <p className="mt-4 text-sm text-[#5c6d73]">
          Hover or tap the ? next to a perk to see how it works in game. Singularity is highlighted as the top paid rank.
        </p>
        <Link href="/store/ranks" className="btn btn-orange mt-6">
          Browse rank pages
        </Link>
      </div>
    </div>
  );
}

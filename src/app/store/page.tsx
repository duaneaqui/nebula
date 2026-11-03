import { LaneLinks } from "@/components/lane-links";
import { ShopDock } from "@/components/shop-dock";

export const metadata = { title: "Store" };

export default function StorePage() {
  return (
    <div>
      <div className="border-b border-[#12343c]/8 bg-[#fff9f0]/85">
        <ShopDock />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="kicker">Store</p>
        <h1 className="mt-2 font-display text-5xl">Everything you can buy</h1>
        <p className="mt-3 max-w-2xl text-[#3d5158]">
          Three lanes, one cart. Pick a destination or compare ranks first if you are still deciding.
        </p>
        <div className="mt-8">
          <LaneLinks />
        </div>
      </div>
    </div>
  );
}

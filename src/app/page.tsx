import { NebulaDescent } from "@/components/descent/nebula-descent";
import { ProductCard } from "@/components/product-card";
import { RankOrbit } from "@/components/rank-orbit";
import { RecentPurchases } from "@/components/recent-purchases";
import { Reveal } from "@/components/reveal";
import { ServerStatusBar } from "@/components/server-status";
import { ShopDock } from "@/components/shop-dock";
import { productsIn } from "@/lib/catalog";
import { recentSupporters } from "@/lib/orders";
import { readStatus } from "@/lib/status";
import Link from "next/link";

export const metadata = { title: { absolute: "NebulaCraft Store" } };

export default async function HomePage() {
  const status = await readStatus();
  const supporters = await recentSupporters(12);
  const stardust = productsIn("stardust");
  const keys = productsIn("keys");

  return (
    <div>
      <NebulaDescent status={status} />
      <div className="descent-exit" aria-hidden="true" />
      <div className="border-b border-[#12343c]/8 bg-[#fff9f0]/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <ServerStatusBar status={status} />
          <p className="text-sm text-[#5c6d73]">
            {status.state === "online"
              ? `${status.online} player${status.online === 1 ? "" : "s"} on Java & Bedrock right now.`
              : "Java & Bedrock · jump to a lane below, or scroll the store."}
          </p>
        </div>
        <ShopDock />
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-10">
        <Reveal>
          <RecentPurchases supporters={supporters} />
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <RankOrbit />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6">
        <Reveal>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="kicker">Premium currency</p>
              <h2 className="mt-2 font-display text-4xl">Stardust packs</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#3d5158]">
                Cosmetics, the exchange, and in-game /claimshop chunks. Gold stays on the server — this store sells
                Stardust.
              </p>
            </div>
            <Link href="/store/stardust" className="text-sm font-semibold underline">
              All packs
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stardust.map((product, index) => (
            <Reveal key={product.id} delay={index * 0.05}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <Reveal>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="kicker">Paid crates</p>
              <h2 className="mt-2 font-display text-4xl">Keys for /warp crates</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#3d5158]">
                Comet through Empyrean. Vote, Seasonal, and Ascendant keys stay earned in game.
              </p>
            </div>
            <Link href="/store/keys" className="text-sm font-semibold underline">
              All keys
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {keys.map((product, index) => (
            <Reveal key={product.id} delay={index * 0.05}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4">
        <Reveal>
          <div className="overflow-hidden rounded-[2rem] border border-[#12343c]/10 bg-[linear-gradient(135deg,#fff8ee,#e8faf7)] px-6 py-10 sm:px-10">
            <p className="kicker">Stuck?</p>
            <h2 className="mt-2 font-display text-4xl">Package not in your inventory yet?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#3d5158]">
              Check the username, wait a minute for the plugin poll, then join. Ranks and Stardust can arrive offline.
              Crate keys wait until that player is online. Extra claim chunks are only sold in game with Stardust.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/support" className="btn btn-orange">
                Get help
              </Link>
              <Link href="/store/stardust" className="btn btn-teal">
                Buy Stardust
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

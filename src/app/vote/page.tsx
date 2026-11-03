import { ShopDock } from "@/components/shop-dock";
import { VOTE_SITES } from "@/lib/vote-sites";
import Link from "next/link";

export const metadata = { title: "Vote" };

export default function VotePage() {
  return (
    <div>
      <div className="border-b border-[#12343c]/8 bg-[#fff9f0]/85">
        <ShopDock />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="kicker">Free rewards</p>
        <h1 className="mt-2 font-display text-5xl">Vote for NebulaCraft</h1>
        <p className="mt-3 max-w-2xl text-[#3d5158]">
          Vote on each site once a day, then claim your vote key in game. Listing links are placeholders for now —
          they&apos;ll be swapped for the real pages when the server is listed.
        </p>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2">
          {VOTE_SITES.map((site, index) => {
            const ready = Boolean(site.href && site.href !== "#" && !site.placeholder);
            return (
              <li key={site.id} className="vote-card">
                <div className="flex items-start justify-between gap-3">
                  <span className="vote-index">{String(index + 1).padStart(2, "0")}</span>
                  {site.placeholder ? <span className="vote-badge">Link soon</span> : null}
                </div>
                <h2 className="mt-4 font-display text-2xl text-[#14242b]">{site.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#3d5158]">{site.blurb}</p>
                {ready ? (
                  <a href={site.href} target="_blank" rel="noreferrer" className="btn btn-orange mt-5">
                    Vote on {site.name}
                  </a>
                ) : (
                  <button type="button" className="btn btn-ghost mt-5 cursor-not-allowed opacity-60" disabled>
                    Vote link coming soon
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <p className="mt-8 text-sm text-[#5c6d73]">
          Already voted? Head in-game for the vote crate. Need packages instead?{" "}
          <Link href="/store/keys" className="font-semibold underline">
            Browse crate keys
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

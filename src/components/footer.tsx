import { CopyAddress } from "@/components/copy-address";
import { CATEGORIES } from "@/lib/catalog";
import { discordUrl, serverAddress, supportEmail } from "@/lib/config";
import Link from "next/link";

export function Footer() {
  const address = serverAddress();
  const discord = discordUrl();
  const email = supportEmail();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-[#12343c]/10 bg-[#0d2429] text-[#f6f0e4]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl">NebulaCraft</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-[#d5e4e2]">
            A self-hosted plaza store for the Nebula server — ranks, Stardust, and crate keys delivered to the username
            you type. Extra claim chunks stay in the in-game /claimshop.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-[#5eead4]">STORE</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link href={category.href}>{category.title}</Link>
              </li>
            ))}
            <li>
              <Link href="/ranks">Compare ranks</Link>
            </li>
            <li>
              <Link href="/vote">Vote</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-[#5eead4]">PLAY</p>
          <div className="mt-3 text-sm">
            {address ? (
              <>
                <CopyAddress address={address} light />
                <p className="mt-2 text-[#d5e4e2]">Open for Java Edition and Bedrock Edition.</p>
              </>
            ) : (
              <p>The play address will be posted here.</p>
            )}
          </div>
          <ul className="mt-4 grid gap-2 text-sm">
            <li>
              <Link href="/support">Support</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            {discord ? (
              <li>
                <a href={discord}>Discord</a>
              </li>
            ) : null}
            {email ? (
              <li>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-[#b7c9c6]">
        © {year} NebulaCraft. Not affiliated with Mojang or Microsoft.
      </p>
    </footer>
  );
}

"use client";

import { CATEGORIES } from "@/lib/catalog";
import { useCart } from "@/components/cart-provider";
import { CurrencyToggle } from "@/components/currency-toggle";
import { PlayerHead } from "@/components/player-head";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Header() {
  const { username, player, count, ensureUsername, changeUsername } = useCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === "/";
  const cartLabel = count === 0 ? "Empty cart" : count === 1 ? "1 item" : `${count} items`;

  return (
    <header className={`site-header sticky top-0 z-40 text-[#f6f0e4] ${onHome ? "site-header-home" : ""}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg tracking-tight" onClick={() => setOpen(false)}>
          <Mark />
          NebulaCraft
        </Link>
        <nav className="ml-4 hidden items-center gap-1 text-sm md:flex">
          {CATEGORIES.map((category) => (
            <Link key={category.id} href={category.href} className="nav-pill">
              {category.title}
            </Link>
          ))}
          <Link href="/ranks" className="nav-pill">
            Compare
          </Link>
          <Link href="/vote" className="nav-pill">
            Vote
          </Link>
          <Link href="/support" className="nav-pill">
            Support
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <CurrencyToggle />
          </div>
          <div className="inline-flex max-w-[16.5rem] items-center rounded-full border border-white/15 bg-[#0d2429]/55 py-1 pr-1.5 pl-1.5 text-left">
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full py-0.5 pr-2 pl-0.5 transition hover:bg-white/10"
              aria-label={username ? `Change delivery name (${username})` : "Set Minecraft username"}
              onClick={() => void (username ? changeUsername() : ensureUsername())}
            >
              {player ? (
                <PlayerHead player={player} size={30} rounded="md" className="ring-1 ring-[#5eead4]/35" />
              ) : (
                <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md bg-white/10 text-[10px] font-bold text-[#9eb0ab]">
                  ?
                </span>
              )}
            </button>
            <Link
              href="/cart"
              className="flex min-w-0 flex-1 items-center gap-2 pr-0.5 transition hover:opacity-90"
              aria-label={count === 1 ? "Cart, 1 item" : `Cart, ${count} items`}
            >
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-semibold text-[#f6f0e4]">
                  {username ? `${username}'s Cart` : "Cart"}
                </span>
                <span className="block text-[10px] font-bold tracking-[0.12em] text-[#5eead4] uppercase">{cartLabel}</span>
              </span>
              <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border border-[#5eead4]/55 bg-[#12343c] px-1.5 text-xs font-bold text-[#f6f0e4]">
                {count}
              </span>
            </Link>
          </div>

          <button
            className="btn btn-ghost border-white/20 px-3 text-[#f6f0e4] md:hidden"
            type="button"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>
        </div>
      </div>
      {open ? (
        <nav className="grid gap-1 border-t border-white/10 bg-[#0d2429]/95 px-4 py-3 text-sm md:hidden">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="rounded-xl px-2 py-2 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              {category.title}
            </Link>
          ))}
          <Link href="/ranks" className="rounded-xl px-2 py-2 hover:bg-white/5" onClick={() => setOpen(false)}>
            Compare ranks
          </Link>
          <Link href="/vote" className="rounded-xl px-2 py-2 hover:bg-white/5" onClick={() => setOpen(false)}>
            Vote
          </Link>
          <Link href="/support" className="rounded-xl px-2 py-2 hover:bg-white/5" onClick={() => setOpen(false)}>
            Support
          </Link>
          <button
            className="flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5"
            type="button"
            onClick={() => {
              setOpen(false);
              void (username ? changeUsername() : ensureUsername());
            }}
          >
            {player ? <PlayerHead player={player} size={28} /> : null}
            <span>{username ? `Delivering to ${username}` : "Set username"}</span>
          </button>
          <div className="px-2 py-2">
            <CurrencyToggle />
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function Mark() {
  return (
    <Image
      src="/art/nebulacraft-icon.png"
      alt=""
      width={28}
      height={28}
      className="h-7 w-7 rounded-lg"
      aria-hidden="true"
      priority
    />
  );
}

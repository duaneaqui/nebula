"use client";

import { AddToCart } from "@/components/add-to-cart";
import { PriceTag } from "@/components/price-tag";
import { RANK_STYLE, rankProduct } from "@/lib/catalog";
import { COMPARE_PERKS, COMPARE_RANKS, featuredCompareRank, type CompareCell } from "@/lib/rank-perks";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function RankTable() {
  const featured = featuredCompareRank();

  return (
    <div className="rank-board overflow-x-auto rounded-[1.5rem]">
      <table className="w-full min-w-[920px] border-collapse text-sm">
        <caption className="sr-only">Paid rank comparison for Voyager through Singularity</caption>
        <thead>
          <tr>
            <th className="rank-board-perk-head sticky left-0 z-10 px-4 py-5 text-left text-xs font-bold tracking-[0.16em] text-[#7fdad2] uppercase">
              Perk
            </th>
            {COMPARE_RANKS.map((rank) => {
              const style = RANK_STYLE[rank];
              const product = rankProduct(rank);
              return (
                <th
                  key={rank}
                  className={`px-3 py-5 text-center ${rank === featured ? "rank-board-featured" : ""}`}
                >
                  <span className="rank-badge" style={{ color: style.color, borderColor: `${style.color}99` }}>
                    {style.mark ? `${style.mark} ` : ""}
                    {style.label}
                  </span>
                  {product ? (
                    <span className="mt-2 block text-[#d7ebe8]">
                      <PriceTag priceCents={product.priceCents} compareAtCents={product.compareAtCents} size="sm" />
                    </span>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {COMPARE_PERKS.map((perk) => (
            <tr key={perk.id} className="rank-board-row">
              <th className="sticky left-0 z-10 px-4 py-3 text-left font-medium">
                <PerkLabel label={perk.label} tip={perk.tip} />
              </th>
              {COMPARE_RANKS.map((rank) => (
                <td key={rank} className={`px-3 py-3 text-center ${rank === featured ? "rank-board-featured" : ""}`}>
                  <CellMark cell={perk.cells[rank]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="sticky left-0 z-10 px-4 py-4" />
            {COMPARE_RANKS.map((rank) => {
              const product = rankProduct(rank);
              return (
                <td key={rank} className={`px-3 py-4 text-center ${rank === featured ? "rank-board-featured" : ""}`}>
                  {product ? (
                    <AddToCart productId={product.id} maxQuantity={1} singular label="Add to cart" compact />
                  ) : null}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PerkLabel({ label, tip }: { label: string; tip: string }) {
  const tipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 10;
    const estimatedHeight = 120;
    const placeAbove = rect.bottom + gap + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - 12 - Math.min(288, window.innerWidth * 0.7));
    setCoords({
      top: placeAbove ? rect.top - gap : rect.bottom + gap,
      left,
      placeAbove,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    const onReposition = () => place();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, place]);

  return (
    <span className="inline-flex max-w-[16rem] items-start gap-2 text-[#eef7f5]">
      <button
        ref={triggerRef}
        type="button"
        className="perk-tip-icon mt-0.5 cursor-help"
        aria-label={`About ${label}`}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onMouseEnter={() => {
          place();
          setOpen(true);
        }}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => {
          place();
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onClick={(event) => {
          event.preventDefault();
          place();
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        ?
      </button>
      <span>{label}</span>
      {open && coords
        ? createPortal(
            <span
              id={tipId}
              role="tooltip"
              className="perk-tip-bubble perk-tip-bubble-portal"
              style={{
                top: coords.top,
                left: coords.left,
                transform: coords.placeAbove ? "translateY(-100%)" : undefined,
              }}
            >
              {tip}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

function CellMark({ cell }: { cell: CompareCell }) {
  if (typeof cell === "string") {
    return <span className="font-semibold text-[#f4faf8]">{cell}</span>;
  }
  if (cell) {
    return (
      <span className="rank-yes" aria-label="Included">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
          <path
            d="M7.5 12.4 10.4 15.2 16.5 8.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span className="rank-no" aria-label="Not included">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.14" />
        <path d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

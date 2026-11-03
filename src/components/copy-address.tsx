"use client";

import { useState } from "react";

export function CopyAddress({ address, light = false }: { address: string; light?: boolean }) {
  const [label, setLabel] = useState(address);

  return (
    <button
      type="button"
      className={light ? "text-left text-[#f6f0e4]" : "rounded-full bg-white/80 px-4 py-2 text-left font-semibold"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(address);
          setLabel("Copied");
          window.setTimeout(() => setLabel(address), 1400);
        } catch {
          setLabel(address);
        }
      }}
    >
      {label}
      <span className="mt-1 block text-xs font-normal opacity-70">Click to copy</span>
    </button>
  );
}

"use client";

import { playerHeadUrl, type SkinPlayer } from "@/lib/skin";
import { useState } from "react";

type Props = {
  player: SkinPlayer;
  size?: number;
  className?: string;
  rounded?: "full" | "md";
};

export function PlayerHead({ player, size = 32, className = "", rounded = "full" }: Props) {
  const [failed, setFailed] = useState(false);
  const radius = rounded === "full" ? "rounded-full" : "rounded-md";
  const src = failed ? `https://mc-heads.net/avatar/MHF_Steve/${size}` : playerHeadUrl(player, size);

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      decoding="async"
      className={`${radius} bg-[#0d2429] object-cover ${className}`}
      style={{ imageRendering: "pixelated", width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

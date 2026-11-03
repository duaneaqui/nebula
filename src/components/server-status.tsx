import { CopyAddress } from "@/components/copy-address";
import type { ServerStatus } from "@/lib/status";

export function ServerStatusBar({ status, tone = "light" }: { status: ServerStatus; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const online = status.state === "online";
  const dot =
    status.state === "online" ? "bg-[#2dd4bf]" : status.state === "offline" ? "bg-[#ff7a32]" : "bg-[#9eb0ab]";
  const label =
    status.state === "online"
      ? "Online"
      : status.state === "offline"
        ? "Offline"
        : status.state === "unknown"
          ? "Status unavailable"
          : status.address
            ? "Checking status"
            : "Play address coming soon";

  return (
    <div
      className={
        dark
          ? "flex flex-wrap items-center gap-3 rounded-2xl border border-white/15 bg-[#0d2429]/65 px-3 py-2 text-sm text-[#e8f7f3] backdrop-blur"
          : "flex flex-wrap items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 text-sm shadow-sm"
      }
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      {online ? (
        <span className="inline-flex items-baseline gap-1.5">
          <span className="font-display text-2xl leading-none tabular-nums text-[#0f766e]">{status.online}</span>
          <span className={dark ? "text-[#9ee6dc]" : "text-[#5c6d73]"}>
            / {status.max || "—"} players
          </span>
        </span>
      ) : (
        <span>{label}</span>
      )}
      {status.address ? (
        <>
          <span className={dark ? "text-white/20" : "text-[#12343c]/15"} aria-hidden="true">
            |
          </span>
          <CopyAddress address={status.address} light={dark} />
          <span
            className={
              dark
                ? "rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#9ee6dc] uppercase"
                : "rounded-full bg-[#12343c]/08 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#12343c] uppercase"
            }
          >
            Java & Bedrock
          </span>
        </>
      ) : null}
    </div>
  );
}

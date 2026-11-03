import "server-only";

import { serverAddress } from "@/lib/config";

export type ServerStatus = {
  state: "online" | "offline" | "unknown" | "unconfigured";
  address: string;
  online: number;
  max: number;
};

let cache: { at: number; value: ServerStatus } | null = null;

export async function readStatus(): Promise<ServerStatus> {
  const address = serverAddress();
  const host = process.env.MC_STATUS_HOST?.trim() ?? "";
  if (!host) return { state: "unconfigured", address, online: 0, max: 0 };
  if (!/^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(host)) {
    return { state: "unknown", address, online: 0, max: 0 };
  }
  if (cache && Date.now() - cache.at < 30_000) return { ...cache.value, address };

  try {
    const response = await fetch(`https://api.mcsrvstat.us/3/${host}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(String(response.status));
    const body = (await response.json()) as {
      online?: boolean;
      players?: { online?: number; max?: number };
    };
    const value: ServerStatus = body.online
      ? {
          state: "online",
          address,
          online: body.players?.online ?? 0,
          max: body.players?.max ?? 0,
        }
      : { state: "offline", address, online: 0, max: 0 };
    cache = { at: Date.now(), value };
    return value;
  } catch {
    return { state: "unknown", address, online: 0, max: 0 };
  }
}

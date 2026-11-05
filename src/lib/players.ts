import "server-only";

const JAVA_NAME = /^[A-Za-z0-9_]{3,16}$/;
const BEDROCK_NAME = /^\.[A-Za-z0-9_]{2,15}$/;

export type ResolvedPlayer = {
  username: string;
  uuid: string | null;
  bedrock: boolean;
  /** True when Mojang has this exact Java account. */
  premium: boolean;
  /** True when mcsrvstat currently lists this name on NebulaCraft. */
  seenOnServer: boolean;
};

export class PlayerLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlayerLookupError";
  }
}

export async function resolvePlayer(raw: string): Promise<ResolvedPlayer> {
  const name = raw.trim();

  if (BEDROCK_NAME.test(name)) {
    const seenOnServer = await seenOnLiveServer(name);
    return { username: name, uuid: null, bedrock: true, premium: false, seenOnServer };
  }

  if (!JAVA_NAME.test(name)) {
    throw new PlayerLookupError(
      "Use a Java username (3–16 letters/numbers/_), or a Bedrock name with the Floodgate dot, like .Alex.",
    );
  }

  const liveName = await matchLiveServerName(name);
  const premium = await lookupMojang(name);

  if (premium) {
    return {
      username: premium.name,
      uuid: premium.id,
      bedrock: false,
      premium: true,
      seenOnServer: liveName ? equalsIgnoreCase(liveName, premium.name) : false,
    };
  }

  // Offline / cracked Java — NebulaCraft runs online-mode=false.
  // Prefer casing from the live player sample when the name is online.
  return {
    username: liveName ?? name,
    uuid: null,
    bedrock: false,
    premium: false,
    seenOnServer: Boolean(liveName),
  };
}

async function lookupMojang(name: string): Promise<{ name: string; id: string } | null> {
  let response: Response;
  try {
    response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Mojang outage must not block cracked / offline purchases.
    return null;
  }

  if (response.status === 404 || response.status === 204) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as { name?: string; id?: string };
  if (!body.name || !body.id || !JAVA_NAME.test(body.name)) {
    return null;
  }

  return { name: body.name, id: body.id };
}

/** Case-insensitive match against mcsrvstat's current player sample (best-effort). */
async function matchLiveServerName(name: string): Promise<string | null> {
  const list = await livePlayerSample();
  if (!list.length) return null;
  const hit = list.find((entry) => equalsIgnoreCase(entry, name));
  return hit ?? null;
}

async function seenOnLiveServer(name: string): Promise<boolean> {
  const list = await livePlayerSample();
  return list.some((entry) => equalsIgnoreCase(entry, name));
}

let sampleCache: { at: number; names: string[] } | null = null;

async function livePlayerSample(): Promise<string[]> {
  const host = process.env.MC_STATUS_HOST?.trim() ?? "";
  if (!host || !/^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(host)) return [];
  if (sampleCache && Date.now() - sampleCache.at < 20_000) return sampleCache.names;

  try {
    const response = await fetch(`https://api.mcsrvstat.us/3/${host}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];
    const body = (await response.json()) as {
      online?: boolean;
      players?: { list?: string[] | Record<string, string> };
    };
    if (!body.online) {
      sampleCache = { at: Date.now(), names: [] };
      return [];
    }

    const raw = body.players?.list;
    const names = Array.isArray(raw)
      ? raw.filter((n): n is string => typeof n === "string" && n.length > 0)
      : raw && typeof raw === "object"
        ? Object.values(raw).filter((n): n is string => typeof n === "string" && n.length > 0)
        : [];

    sampleCache = { at: Date.now(), names };
    return names;
  } catch {
    return sampleCache?.names ?? [];
  }
}

function equalsIgnoreCase(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;
}

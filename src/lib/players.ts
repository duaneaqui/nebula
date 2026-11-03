import "server-only";

const JAVA_NAME = /^[A-Za-z0-9_]{3,16}$/;
const BEDROCK_NAME = /^\.[A-Za-z0-9_]{2,15}$/;

export type ResolvedPlayer = {
  username: string;
  uuid: string | null;
  bedrock: boolean;
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
    return { username: name, uuid: null, bedrock: true };
  }

  if (!JAVA_NAME.test(name)) {
    throw new PlayerLookupError(
      "Use a Java username, or a Bedrock name with the Floodgate dot, like .Alex.",
    );
  }

  let response: Response;
  try {
    response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new PlayerLookupError("Mojang lookup failed. Try again in a moment.");
  }

  if (response.status === 404 || response.status === 204) {
    throw new PlayerLookupError("No Java account uses that username.");
  }

  if (!response.ok) {
    throw new PlayerLookupError("Mojang lookup failed. Try again in a moment.");
  }

  const body = (await response.json()) as { name?: string; id?: string };
  if (!body.name || !body.id || !JAVA_NAME.test(body.name)) {
    throw new PlayerLookupError("Mojang returned an unexpected username.");
  }

  return { username: body.name, uuid: body.id, bedrock: false };
}

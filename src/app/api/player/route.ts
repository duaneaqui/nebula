import { clientKey, tooManyRequests } from "@/lib/guard";
import { PlayerLookupError, resolvePlayer } from "@/lib/players";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (tooManyRequests(`player:${clientKey(request)}`, 20, 60_000)) {
    return Response.json({ error: "Too many username checks. Wait a minute." }, { status: 429 });
  }

  const name = new URL(request.url).searchParams.get("name") ?? "";
  try {
    const player = await resolvePlayer(name);
    return Response.json(player);
  } catch (error) {
    const message = error instanceof PlayerLookupError ? error.message : "Could not check that username.";
    return Response.json({ error: message }, { status: 400 });
  }
}

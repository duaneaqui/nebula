import { pluginAuthorized } from "@/lib/guard";
import { applyCommandResults, nextCommands } from "@/lib/orders";

export const runtime = "nodejs";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function denied() {
  const secret = process.env.STORE_PLUGIN_SECRET ?? "";
  if (secret.length < 24 || secret === "change-me") {
    return Response.json({ error: "Store plugin secret is not configured." }, { status: 503 });
  }
  return Response.json({ error: "Unauthorized." }, { status: 401 });
}

export async function GET(request: Request) {
  if (!pluginAuthorized(request)) return denied();
  return Response.json({ commands: await nextCommands(25) });
}

export async function POST(request: Request) {
  if (!pluginAuthorized(request)) return denied();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  const results = body && typeof body === "object" && "results" in body ? body.results : undefined;
  if (!Array.isArray(results) || results.length > 100) {
    return Response.json({ error: "Expected a results array." }, { status: 400 });
  }

  const parsed: { id: string; status: "executed" | "deferred" | "failed"; detail?: string }[] = [];
  for (const entry of results) {
    if (!entry || typeof entry !== "object") return Response.json({ error: "Invalid result." }, { status: 400 });
    const id = "id" in entry ? entry.id : undefined;
    const status = "status" in entry ? entry.status : undefined;
    const detail = "detail" in entry ? entry.detail : undefined;
    if (typeof id !== "string" || !ID.test(id)) return Response.json({ error: "Invalid command id." }, { status: 400 });
    if (status !== "executed" && status !== "deferred" && status !== "failed") {
      return Response.json({ error: "Invalid command status." }, { status: 400 });
    }
    parsed.push({ id, status, detail: typeof detail === "string" ? detail : undefined });
  }

  await applyCommandResults(parsed);
  return Response.json({ ok: true });
}

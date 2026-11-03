import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), ".env.local");
if (existsSync(file)) {
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1);
  }
}

function clean(value) {
  if (!value) return "";
  let next = value.trim();
  if ((next.startsWith('"') && next.endsWith('"')) || (next.startsWith("'") && next.endsWith("'"))) {
    next = next.slice(1, -1);
  }
  return next;
}

const url = clean(process.env.DATABASE_URL) || clean(process.env.POSTGRES_URL);
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = neon(url);
await sql`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    paid_at TEXT,
    email TEXT NOT NULL,
    username TEXT NOT NULL,
    uuid TEXT,
    bedrock BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL,
    total_cents INTEGER NOT NULL,
    stripe_session_id TEXT,
    payment_provider TEXT,
    provider_session_id TEXT,
    items_json TEXT NOT NULL
  )
`;
await sql`
  CREATE TABLE IF NOT EXISTS commands (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    command TEXT NOT NULL,
    player TEXT NOT NULL,
    require_online BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    detail TEXT,
    not_before TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;
await sql`CREATE INDEX IF NOT EXISTS commands_queue ON commands (status, not_before)`;
const rows = await sql`SELECT COUNT(*)::int AS n FROM orders`;
console.log("neon ok, orders=", rows[0].n);

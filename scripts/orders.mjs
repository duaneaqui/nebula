import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
if (!url) {
  console.error("Set DATABASE_URL (Neon) in .env.local first.");
  process.exit(1);
}

const sql = neon(url);
const orders = await sql`
  SELECT id, status, username, total_cents, created_at
  FROM orders
  ORDER BY created_at DESC
  LIMIT 20
`;
const commands = await sql`
  SELECT id, order_id, status, attempts, command
  FROM commands
  ORDER BY created_at DESC
  LIMIT 40
`;

console.log("Orders");
console.table(orders);
console.log("Commands");
console.table(commands);

/**
 * Create a one-time percent-off voucher in Neon.
 *
 *   node --env-file=.env.local scripts/create-voucher.mjs 25
 *   node --env-file=.env.local scripts/create-voucher.mjs 50 WELCOME50 "Launch gift"
 */
import { neon } from "@neondatabase/serverless";
import { randomBytes } from "node:crypto";

function clean(value) {
  if (!value) return "";
  let next = String(value).trim();
  if ((next.startsWith('"') && next.endsWith('"')) || (next.startsWith("'") && next.endsWith("'"))) {
    next = next.slice(1, -1).trim();
  }
  return next;
}

const percent = Number(process.argv[2]);
const codeArg = process.argv[3];
const note = process.argv[4] ?? "";

if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
  console.error("Usage: node --env-file=.env.local scripts/create-voucher.mjs <1-100> [CODE] [note]");
  process.exit(1);
}

const url =
  clean(process.env.DATABASE_URL) ||
  clean(process.env.POSTGRES_URL) ||
  clean(process.env.POSTGRES_URL_NON_POOLING);
if (!url) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const sql = neon(url);
const code = (codeArg || `NEBULA-${randomBytes(4).toString("hex")}`).trim().toUpperCase();
const createdAt = new Date().toISOString();

await sql`
  CREATE TABLE IF NOT EXISTS vouchers (
    code TEXT PRIMARY KEY,
    percent_off INTEGER NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    reserved_order_id TEXT,
    reserved_at TEXT,
    redeemed_at TEXT,
    redeemed_order_id TEXT
  )
`;

await sql`
  INSERT INTO vouchers (code, percent_off, note, created_at)
  VALUES (${code}, ${percent}, ${note || null}, ${createdAt})
`;

console.log(`Created ${percent}% voucher: ${code}`);
console.log("Give this code to one player. It works once.");

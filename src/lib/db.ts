import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

const globalForDb = globalThis as unknown as {
  nebulaSql?: Sql;
  nebulaSchemaReady?: Promise<void>;
};

function cleanEnv(value: string | undefined) {
  if (!value) return "";
  let next = value.trim();
  if (
    (next.startsWith('"') && next.endsWith('"')) ||
    (next.startsWith("'") && next.endsWith("'"))
  ) {
    next = next.slice(1, -1).trim();
  }
  return next;
}

function databaseUrl() {
  return (
    cleanEnv(process.env.DATABASE_URL) ||
    cleanEnv(process.env.POSTGRES_URL) ||
    cleanEnv(process.env.POSTGRES_URL_NON_POOLING) ||
    ""
  );
}

/** Lazy Neon client — safe at build time until the first query runs. */
export function sql(): Sql {
  if (!globalForDb.nebulaSql) {
    const url = databaseUrl();
    if (!url) {
      throw new Error("DATABASE_URL is not set. Connect Neon (Vercel Marketplace) or add it to .env.local.");
    }
    globalForDb.nebulaSql = neon(url);
  }
  return globalForDb.nebulaSql;
}

export async function ensureSchema() {
  if (!globalForDb.nebulaSchemaReady) {
    globalForDb.nebulaSchemaReady = (async () => {
      const db = sql();
      await db`
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
      await db`
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
      await db`CREATE INDEX IF NOT EXISTS commands_queue ON commands (status, not_before)`;
      await db`CREATE INDEX IF NOT EXISTS orders_provider_session ON orders (provider_session_id)`;
      await db`CREATE INDEX IF NOT EXISTS orders_stripe_session ON orders (stripe_session_id)`;
    })();
  }
  await globalForDb.nebulaSchemaReady;
}

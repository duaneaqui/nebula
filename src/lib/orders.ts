import "server-only";

import { getProduct, type Product } from "@/lib/catalog";
import { ensureSchema, sql } from "@/lib/db";
import { expandCommands } from "@/lib/deliveries";

export type StoredItem = {
  productId: string;
  name: string;
  quantity: number;
  unitCents: number;
  lineCents: number;
};

type OrderRow = {
  id: string;
  created_at: string;
  paid_at: string | null;
  email: string;
  username: string;
  uuid: string | null;
  bedrock: boolean;
  status: string;
  total_cents: number;
  subtotal_cents: number | null;
  discount_cents: number | null;
  voucher_code: string | null;
  receipt_sent_at: string | null;
  stripe_session_id: string | null;
  payment_provider: string | null;
  provider_session_id: string | null;
  items_json: string;
};

export type QuoteLine = {
  product: Product;
  quantity: number;
  unitCents: number;
  lineCents: number;
};

export function quoteCart(rawItems: unknown): { ok: true; lines: QuoteLine[]; totalCents: number } | { ok: false; error: string } {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 12) {
    return { ok: false, error: "Your cart is empty." };
  }

  const merged = new Map<string, number>();
  for (const entry of rawItems) {
    if (!entry || typeof entry !== "object") return { ok: false, error: "Cart data is invalid." };
    const productId = "productId" in entry ? entry.productId : undefined;
    const quantity = "quantity" in entry ? entry.quantity : undefined;
    if (typeof productId !== "string" || typeof quantity !== "number" || !Number.isInteger(quantity)) {
      return { ok: false, error: "Cart data is invalid." };
    }
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }

  const lines: QuoteLine[] = [];
  for (const [productId, quantity] of merged) {
    const product = getProduct(productId);
    if (!product) return { ok: false, error: "A package in your cart is no longer sold." };
    if (quantity < 1 || quantity > product.maxQuantity) {
      return { ok: false, error: `Quantity for ${product.name} is not allowed.` };
    }
    lines.push({
      product,
      quantity,
      unitCents: product.priceCents,
      lineCents: product.priceCents * quantity,
    });
  }

  if (lines.filter((line) => line.product.delivery.type === "rank").length > 1) {
    return { ok: false, error: "Only one rank can be purchased at a time." };
  }

  const totalCents = lines.reduce((sum, line) => sum + line.lineCents, 0);
  if (totalCents < 50 || totalCents > 1_000_000) {
    return { ok: false, error: "Order total is out of range." };
  }

  return { ok: true, lines, totalCents };
}

export function assertQuoteDeliverable(lines: QuoteLine[], player: string) {
  for (const line of lines) {
    expandCommands(line.product, line.quantity, player);
  }
}

export async function createPendingOrder(input: {
  email: string;
  username: string;
  uuid: string | null;
  bedrock: boolean;
  lines: QuoteLine[];
  subtotalCents: number;
  discountCents?: number;
  totalCents: number;
  voucherCode?: string | null;
}) {
  await ensureSchema();
  const id = crypto.randomUUID();
  const items: StoredItem[] = input.lines.map((line) => ({
    productId: line.product.id,
    name: line.product.name,
    quantity: line.quantity,
    unitCents: line.unitCents,
    lineCents: line.lineCents,
  }));
  const createdAt = new Date().toISOString();
  const discountCents = Math.max(0, input.discountCents ?? 0);
  const voucherCode = input.voucherCode?.trim() || null;

  await sql()`
    INSERT INTO orders (
      id, created_at, paid_at, email, username, uuid, bedrock, status,
      total_cents, subtotal_cents, discount_cents, voucher_code, stripe_session_id, items_json
    ) VALUES (
      ${id}, ${createdAt}, NULL, ${input.email}, ${input.username}, ${input.uuid}, ${input.bedrock},
      'pending', ${input.totalCents}, ${input.subtotalCents}, ${discountCents}, ${voucherCode},
      NULL, ${JSON.stringify(items)}
    )
  `;

  return id;
}

export async function attachStripeSession(orderId: string, sessionId: string) {
  await attachProviderSession(orderId, "stripe", sessionId);
}

export async function attachProviderSession(orderId: string, provider: string, sessionId: string) {
  await ensureSchema();
  if (provider === "stripe") {
    await sql()`
      UPDATE orders
      SET payment_provider = ${provider},
          provider_session_id = ${sessionId},
          stripe_session_id = ${sessionId}
      WHERE id = ${orderId}
    `;
    return;
  }
  await sql()`
    UPDATE orders
    SET payment_provider = ${provider},
        provider_session_id = ${sessionId}
    WHERE id = ${orderId}
  `;
}

export async function deletePendingOrder(orderId: string) {
  await ensureSchema();
  const { releaseVoucherReservation } = await import("@/lib/vouchers");
  await releaseVoucherReservation(orderId);
  await sql()`DELETE FROM orders WHERE id = ${orderId} AND status = 'pending'`;
}

export async function markPaid(orderId: string) {
  await ensureSchema();
  const db = sql();

  const existing = (await db`SELECT * FROM orders WHERE id = ${orderId}`) as OrderRow[];
  const order = existing[0];
  if (!order) return { ok: false as const, reason: "missing" as const };
  if (order.status !== "pending") return { ok: true as const, already: true };

  const items = JSON.parse(order.items_json) as StoredItem[];
  const expanded: { command: string; requireOnline: boolean }[] = [];
  for (const item of items) {
    const product = getProduct(item.productId);
    if (!product) throw new Error(`Missing product ${item.productId} while delivering ${orderId}.`);
    expanded.push(...expandCommands(product, item.quantity, order.username));
  }

  const now = new Date().toISOString();
  const claimed = (await db`
    UPDATE orders
    SET status = 'paid', paid_at = ${now}
    WHERE id = ${orderId} AND status = 'pending'
    RETURNING id
  `) as { id: string }[];

  if (claimed.length === 0) return { ok: true as const, already: true };

  for (const [position, entry] of expanded.entries()) {
    await db`
      INSERT INTO commands (
        id, order_id, position, command, player, require_online, status, attempts, detail, not_before, created_at, updated_at
      ) VALUES (
        ${crypto.randomUUID()}, ${orderId}, ${position}, ${entry.command}, ${order.username},
        ${entry.requireOnline}, 'queued', 0, NULL, NULL, ${now}, ${now}
      )
    `;
  }

  const { redeemVoucherForOrder } = await import("@/lib/vouchers");
  await redeemVoucherForOrder(orderId, order.voucher_code);

  void sendReceiptForOrder(order).catch((error) => {
    console.error("Receipt email failed", orderId, error);
  });

  return { ok: true as const, already: false };
}

async function sendReceiptForOrder(order: OrderRow) {
  const { sendPurchaseReceipt } = await import("@/lib/mail");
  const items = JSON.parse(order.items_json) as StoredItem[];
  const subtotalCents = Number(order.subtotal_cents ?? order.total_cents);
  const discountCents = Number(order.discount_cents ?? 0);
  const result = await sendPurchaseReceipt({
    id: order.id,
    email: order.email,
    username: order.username,
    totalCents: Number(order.total_cents),
    subtotalCents,
    discountCents,
    voucherCode: order.voucher_code,
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      lineCents: item.lineCents,
    })),
  });
  if (!result.ok) return;
  const sentAt = new Date().toISOString();
  await sql()`UPDATE orders SET receipt_sent_at = ${sentAt} WHERE id = ${order.id} AND receipt_sent_at IS NULL`;
}

export type QueueCommand = {
  id: string;
  command: string;
  player: string;
  requireOnline: boolean;
};

export async function nextCommands(limit = 25): Promise<QueueCommand[]> {
  await ensureSchema();
  const now = new Date().toISOString();
  const rows = (await sql()`
    SELECT c.id, c.command, c.player, c.require_online
    FROM commands c
    JOIN orders o ON o.id = c.order_id
    WHERE o.status IN ('paid', 'problem')
      AND c.status IN ('queued', 'deferred')
      AND (c.not_before IS NULL OR c.not_before <= ${now})
    ORDER BY c.created_at ASC, c.position ASC
    LIMIT ${limit}
  `) as { id: string; command: string; player: string; require_online: boolean }[];

  return rows.map((row) => ({
    id: row.id,
    command: row.command,
    player: row.player,
    requireOnline: Boolean(row.require_online),
  }));
}

export async function applyCommandResults(
  results: { id: string; status: "executed" | "deferred" | "failed"; detail?: string }[],
) {
  await ensureSchema();
  const db = sql();
  const now = new Date().toISOString();
  const later = new Date(Date.now() + 30_000).toISOString();
  const orderIds = new Set<string>();

  for (const result of results) {
    const rows = (await db`
      SELECT order_id, attempts FROM commands WHERE id = ${result.id}
    `) as { order_id: string; attempts: number }[];
    const row = rows[0];
    if (!row) continue;
    orderIds.add(row.order_id);
    const detail = (result.detail ?? "").slice(0, 200);

    if (result.status === "executed") {
      await db`
        UPDATE commands SET status = 'executed', detail = NULL, updated_at = ${now}
        WHERE id = ${result.id}
      `;
    } else if (result.status === "deferred") {
      await db`
        UPDATE commands
        SET status = 'deferred', detail = ${detail || "Player is offline."}, updated_at = ${now}
        WHERE id = ${result.id}
      `;
    } else {
      const attempts = Number(row.attempts) + 1;
      if (attempts >= 5) {
        await db`
          UPDATE commands
          SET status = 'failed', attempts = ${attempts}, detail = ${detail || "Command failed."}, updated_at = ${now}
          WHERE id = ${result.id}
        `;
      } else {
        await db`
          UPDATE commands
          SET status = 'queued', attempts = ${attempts}, detail = ${detail || "Command failed."},
              not_before = ${later}, updated_at = ${now}
          WHERE id = ${result.id}
        `;
      }
    }
  }

  for (const orderId of orderIds) await refreshOrderStatus(orderId, now);
}

async function refreshOrderStatus(orderId: string, now: string) {
  const counts = (await sql()`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'executed' THEN 1 ELSE 0 END), 0) AS executed,
      COALESCE(SUM(CASE WHEN status IN ('queued', 'deferred') THEN 1 ELSE 0 END), 0) AS open,
      COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failed
    FROM commands WHERE order_id = ${orderId}
  `) as { executed: string | number; open: string | number; failed: string | number }[];

  const row = counts[0] ?? { executed: 0, open: 0, failed: 0 };
  const executed = Number(row.executed ?? 0);
  const open = Number(row.open ?? 0);
  const failed = Number(row.failed ?? 0);
  let status = "paid";
  if (failed > 0 && open === 0) status = "problem";
  else if (open === 0 && failed === 0 && executed > 0) status = "fulfilled";

  await sql()`
    UPDATE orders
    SET status = ${status}, paid_at = COALESCE(paid_at, ${now})
    WHERE id = ${orderId} AND status IN ('paid', 'problem', 'fulfilled')
  `;
}

export async function publicOrder(id: string) {
  await ensureSchema();
  const orders = (await sql()`SELECT * FROM orders WHERE id = ${id}`) as OrderRow[];
  const order = orders[0];
  if (!order) return null;

  const commands = (await sql()`SELECT status FROM commands WHERE order_id = ${id}`) as { status: string }[];
  const items = JSON.parse(order.items_json) as StoredItem[];

  return {
    id: order.id,
    status: order.status,
    username: order.username,
    totalCents: Number(order.total_cents),
    subtotalCents: Number(order.subtotal_cents ?? order.total_cents),
    discountCents: Number(order.discount_cents ?? 0),
    voucherCode: order.voucher_code,
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      lineCents: item.lineCents,
    })),
    delivery: {
      done: commands.filter((command) => command.status === "executed").length,
      waiting: commands.filter((command) => command.status === "queued").length,
      waitingOnline: commands.filter((command) => command.status === "deferred").length,
      failed: commands.filter((command) => command.status === "failed").length,
    },
  };
}

export async function recentSupporters(limit = 12) {
  try {
    await ensureSchema();
    const rows = (await sql()`
      SELECT username, items_json, created_at, paid_at
      FROM orders
      WHERE status IN ('paid', 'fulfilled', 'problem')
      ORDER BY COALESCE(paid_at, created_at) DESC
      LIMIT ${Math.max(limit * 3, 24)}
    `) as { username: string; items_json: string; created_at: string; paid_at: string | null }[];

    const seen = new Set<string>();
    const out: { username: string; summary: string; at: string }[] = [];
    for (const row of rows) {
      const key = row.username.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const items = JSON.parse(row.items_json) as StoredItem[];
      const first = items[0]?.name ?? "Package";
      const extra = items.length > 1 ? ` +${items.length - 1}` : "";
      out.push({
        username: row.username,
        summary: `${first}${extra}`,
        at: row.paid_at ?? row.created_at,
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

export async function findOrderIdBySession(sessionId: string) {
  await ensureSchema();
  const rows = (await sql()`
    SELECT id FROM orders
    WHERE provider_session_id = ${sessionId} OR stripe_session_id = ${sessionId}
    LIMIT 1
  `) as { id: string }[];
  return rows[0]?.id;
}

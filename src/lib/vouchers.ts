import "server-only";

import { ensureSchema, sql } from "@/lib/db";

export type VoucherInfo = {
  code: string;
  percentOff: number;
  note: string | null;
};

function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function discountFromSubtotal(subtotalCents: number, percentOff: number) {
  const percent = Math.min(100, Math.max(1, Math.floor(percentOff)));
  const discountCents = Math.min(subtotalCents, Math.floor((subtotalCents * percent) / 100));
  const chargeCents = Math.max(0, subtotalCents - discountCents);
  return { percentOff: percent, discountCents, chargeCents };
}

export async function peekVoucher(rawCode: string): Promise<
  { ok: true; voucher: VoucherInfo } | { ok: false; error: string }
> {
  const code = normalizeCode(rawCode);
  if (!code || code.length < 4 || code.length > 32) {
    return { ok: false, error: "Enter a valid voucher code." };
  }

  await ensureSchema();
  const rows = (await sql()`
    SELECT code, percent_off, note, redeemed_at, reserved_order_id, reserved_at
    FROM vouchers WHERE code = ${code}
  `) as {
    code: string;
    percent_off: number;
    note: string | null;
    redeemed_at: string | null;
    reserved_order_id: string | null;
    reserved_at: string | null;
  }[];

  const row = rows[0];
  if (!row) return { ok: false, error: "That voucher code is not valid." };
  if (row.redeemed_at) return { ok: false, error: "That voucher has already been used." };

  if (row.reserved_order_id && row.reserved_at) {
    const ageMs = Date.now() - Date.parse(row.reserved_at);
    if (Number.isFinite(ageMs) && ageMs < 45 * 60_000) {
      return { ok: false, error: "That voucher is reserved by another checkout. Try again shortly." };
    }
  }

  const percentOff = Number(row.percent_off);
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
    return { ok: false, error: "That voucher is misconfigured." };
  }

  return {
    ok: true,
    voucher: { code: row.code, percentOff, note: row.note },
  };
}

/** Lock a one-time voucher onto a pending order so two checkouts cannot both use it. */
export async function reserveVoucher(rawCode: string, orderId: string) {
  const peeked = await peekVoucher(rawCode);
  if (!peeked.ok) return peeked;

  const now = new Date().toISOString();
  const staleBefore = new Date(Date.now() - 45 * 60_000).toISOString();
  const updated = (await sql()`
    UPDATE vouchers
    SET reserved_order_id = ${orderId}, reserved_at = ${now}
    WHERE code = ${peeked.voucher.code}
      AND redeemed_at IS NULL
      AND (
        reserved_order_id IS NULL
        OR reserved_at IS NULL
        OR reserved_at < ${staleBefore}
        OR reserved_order_id = ${orderId}
      )
    RETURNING code, percent_off, note
  `) as { code: string; percent_off: number; note: string | null }[];

  if (!updated[0]) {
    return { ok: false as const, error: "That voucher was just taken. Try another code." };
  }

  return {
    ok: true as const,
    voucher: {
      code: updated[0].code,
      percentOff: Number(updated[0].percent_off),
      note: updated[0].note,
    },
  };
}

export async function releaseVoucherReservation(orderId: string) {
  await ensureSchema();
  await sql()`
    UPDATE vouchers
    SET reserved_order_id = NULL, reserved_at = NULL
    WHERE reserved_order_id = ${orderId} AND redeemed_at IS NULL
  `;
}

export async function redeemVoucherForOrder(orderId: string, code: string | null) {
  if (!code) return;
  await ensureSchema();
  const now = new Date().toISOString();
  await sql()`
    UPDATE vouchers
    SET redeemed_at = ${now},
        redeemed_order_id = ${orderId},
        reserved_order_id = NULL,
        reserved_at = NULL
    WHERE code = ${code}
      AND redeemed_at IS NULL
      AND (reserved_order_id IS NULL OR reserved_order_id = ${orderId})
  `;
}

export async function createVoucher(input: { code?: string; percentOff: number; note?: string }) {
  const percentOff = Math.floor(input.percentOff);
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
    throw new Error("percentOff must be an integer from 1 to 100.");
  }
  const code = normalizeCode(input.code || `NEBULA-${crypto.randomUUID().slice(0, 8)}`);
  if (code.length < 4 || code.length > 32) throw new Error("Code must be 4–32 characters.");

  await ensureSchema();
  const createdAt = new Date().toISOString();
  try {
    await sql()`
      INSERT INTO vouchers (code, percent_off, note, created_at)
      VALUES (${code}, ${percentOff}, ${input.note?.trim() || null}, ${createdAt})
    `;
  } catch {
    throw new Error("Could not create voucher (code may already exist).");
  }
  return { code, percentOff };
}

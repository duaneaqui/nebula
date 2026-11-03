import { clientKey, tooManyRequests } from "@/lib/guard";
import { quoteCart } from "@/lib/orders";
import { discountFromSubtotal, peekVoucher } from "@/lib/vouchers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (tooManyRequests(`voucher:${clientKey(request)}`, 20, 60_000)) {
    return Response.json({ error: "Too many voucher checks. Wait a minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const code = "code" in body && typeof body.code === "string" ? body.code : "";
  const items = "items" in body ? body.items : undefined;
  const peeked = await peekVoucher(code);
  if (!peeked.ok) return Response.json({ error: peeked.error }, { status: 400 });

  const quote = quoteCart(items);
  if (!quote.ok) return Response.json({ error: quote.error }, { status: 400 });

  const priced = discountFromSubtotal(quote.totalCents, peeked.voucher.percentOff);
  return Response.json({
    code: peeked.voucher.code,
    percentOff: peeked.voucher.percentOff,
    subtotalCents: quote.totalCents,
    discountCents: priced.discountCents,
    totalCents: priced.chargeCents,
  });
}

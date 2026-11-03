import { paymentMethods } from "@/lib/config";
import { clientKey, requestOrigin, tooManyRequests } from "@/lib/guard";
import {
  assertQuoteDeliverable,
  attachProviderSession,
  createPendingOrder,
  deletePendingOrder,
  markPaid,
  quoteCart,
} from "@/lib/orders";
import { createPaymongoQrCheckout } from "@/lib/paymongo";
import { createPaypalOrder } from "@/lib/paypal";
import { PlayerLookupError, resolvePlayer } from "@/lib/players";
import { getStripe } from "@/lib/stripe";
import { discountFromSubtotal, reserveVoucher } from "@/lib/vouchers";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const METHODS = new Set(["test", "qrph", "paypal", "stripe"]);

export async function POST(request: Request) {
  if (tooManyRequests(`checkout:${clientKey(request)}`, 8, 60_000)) {
    return Response.json({ error: "Too many checkout attempts. Wait a minute." }, { status: 429 });
  }

  const available = paymentMethods();
  if (!available.test && !available.qrph && !available.paypal && !available.stripe) {
    return Response.json(
      { error: "Payments are not switched on yet. Add PayMongo and/or PayPal keys, or enable test checkout locally." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") return Response.json({ error: "Checkout data is invalid." }, { status: 400 });

  const email = "email" in body ? body.email : undefined;
  const username = "username" in body ? body.username : undefined;
  const items = "items" in body ? body.items : undefined;
  const acceptedTerms = "acceptedTerms" in body ? body.acceptedTerms : undefined;
  const method = "method" in body && typeof body.method === "string" ? body.method : undefined;
  const voucherCodeRaw =
    "voucherCode" in body && typeof body.voucherCode === "string" ? body.voucherCode : "";
  const paypalCurrency =
    "paypalCurrency" in body && (body.paypalCurrency === "USD" || body.paypalCurrency === "PHP")
      ? body.paypalCurrency
      : "USD";

  if (typeof method !== "string" || !METHODS.has(method)) {
    return Response.json({ error: "Pick a payment method." }, { status: 400 });
  }
  if (method === "test" && !available.test) {
    return Response.json({ error: "Test checkout is not enabled." }, { status: 400 });
  }
  if (method === "qrph" && !available.qrph) {
    return Response.json({ error: "QR Ph is not configured." }, { status: 400 });
  }
  if (method === "paypal" && !available.paypal) {
    return Response.json({ error: "PayPal is not configured." }, { status: 400 });
  }
  if (method === "stripe" && !available.stripe) {
    return Response.json({ error: "Stripe is not configured." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL.test(email) || email.length > 120) {
    return Response.json({ error: "Enter a valid email for the receipt." }, { status: 400 });
  }
  if (typeof username !== "string") {
    return Response.json({ error: "Enter the Minecraft username that should receive this order." }, { status: 400 });
  }
  if (acceptedTerms !== true) {
    return Response.json({ error: "Confirm the delivery terms before paying." }, { status: 400 });
  }

  const quote = quoteCart(items);
  if (!quote.ok) return Response.json({ error: quote.error }, { status: 400 });

  let player;
  try {
    player = await resolvePlayer(username);
  } catch (error) {
    const message = error instanceof PlayerLookupError ? error.message : "Could not check that username.";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    assertQuoteDeliverable(quote.lines, player.username);
  } catch {
    return Response.json({ error: "This cart can't be delivered. Remove a package and try again." }, { status: 400 });
  }

  let discountCents = 0;
  let chargeCents = quote.totalCents;
  let voucherCode: string | null = null;

  const orderId = await createPendingOrder({
    email: email.trim(),
    username: player.username,
    uuid: player.uuid,
    bedrock: player.bedrock,
    lines: quote.lines,
    subtotalCents: quote.totalCents,
    discountCents: 0,
    totalCents: quote.totalCents,
    voucherCode: null,
  });

  if (voucherCodeRaw.trim()) {
    const reserved = await reserveVoucher(voucherCodeRaw, orderId);
    if (!reserved.ok) {
      await deletePendingOrder(orderId);
      return Response.json({ error: reserved.error }, { status: 400 });
    }
    const priced = discountFromSubtotal(quote.totalCents, reserved.voucher.percentOff);
    discountCents = priced.discountCents;
    chargeCents = priced.chargeCents;
    voucherCode = reserved.voucher.code;

    // Persist discounted totals on the pending order.
    const { sql } = await import("@/lib/db");
    await sql()`
      UPDATE orders
      SET discount_cents = ${discountCents},
          total_cents = ${chargeCents},
          voucher_code = ${voucherCode}
      WHERE id = ${orderId}
    `;
  }

  if (chargeCents > 0 && chargeCents < 50) {
    await deletePendingOrder(orderId);
    return Response.json(
      { error: "After the voucher, the total is too small to charge. Use a different code or cart." },
      { status: 400 },
    );
  }

  const origin = requestOrigin(request);
  const successUrl = `${origin}/checkout/success?order=${orderId}`;
  const cancelUrl = `${origin}/checkout/cancel?order=${orderId}`;

  // 100% voucher — deliver without a payment provider.
  if (chargeCents === 0) {
    await attachProviderSession(orderId, "voucher", `voucher_${orderId}`);
    await markPaid(orderId);
    return Response.json({ url: successUrl });
  }

  if (method === "test") {
    await attachProviderSession(orderId, "test", `test_${orderId}`);
    await markPaid(orderId);
    return Response.json({ url: successUrl });
  }

  if (method === "qrph") {
    try {
      const session = await createPaymongoQrCheckout({
        orderId,
        email: email.trim(),
        lines: quote.lines.map((line) => ({
          name: line.product.name,
          quantity: line.quantity,
          unitUsdCents: line.unitCents,
        })),
        chargeUsdCents: chargeCents,
        successUrl,
        cancelUrl,
      });
      await attachProviderSession(orderId, "paymongo", session.sessionId);
      return Response.json({ url: session.checkoutUrl });
    } catch (error) {
      await deletePendingOrder(orderId);
      console.error(error);
      return Response.json({ error: "Could not start QR Ph checkout." }, { status: 502 });
    }
  }

  if (method === "paypal") {
    try {
      const session = await createPaypalOrder({
        orderId,
        currency: paypalCurrency,
        lines: quote.lines.map((line) => ({
          name: line.product.name,
          quantity: line.quantity,
          unitUsdCents: line.unitCents,
        })),
        discountUsdCents: discountCents,
        returnUrl: `${origin}/api/paypal/capture?order=${orderId}`,
        cancelUrl,
      });
      await attachProviderSession(orderId, "paypal", session.paypalOrderId);
      return Response.json({ url: session.approveUrl });
    } catch (error) {
      await deletePendingOrder(orderId);
      console.error(error);
      return Response.json({ error: "Could not start PayPal checkout." }, { status: 502 });
    }
  }

  const stripe = getStripe();
  if (!stripe) {
    await deletePendingOrder(orderId);
    return Response.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email.trim(),
      client_reference_id: orderId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderId,
        username: player.username,
        voucherCode: voucherCode ?? "",
      },
      line_items:
        discountCents > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: chargeCents,
                  product_data: {
                    name: "NebulaCraft order",
                    description: voucherCode
                      ? `Voucher ${voucherCode} applied`
                      : "NebulaCraft digital delivery",
                  },
                },
              },
            ]
          : quote.lines.map((line) => ({
              quantity: line.quantity,
              price_data: {
                currency: "usd",
                unit_amount: line.unitCents,
                product_data: {
                  name: line.product.name,
                  description: "NebulaCraft digital delivery",
                },
              },
            })),
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    await attachProviderSession(orderId, "stripe", session.id);
    return Response.json({ url: session.url });
  } catch (error) {
    await deletePendingOrder(orderId);
    console.error(error);
    return Response.json({ error: "Could not start card checkout." }, { status: 502 });
  }
}

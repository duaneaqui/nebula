import "server-only";

import crypto from "node:crypto";
import { usdCentsToPhpCentavos } from "@/lib/currency";

export type PaymongoLine = {
  name: string;
  quantity: number;
  unitUsdCents: number;
};

export function paymongoConfigured() {
  return Boolean(process.env.PAYMONGO_SECRET_KEY?.trim());
}

function authHeader() {
  const key = process.env.PAYMONGO_SECRET_KEY?.trim();
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is missing.");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export async function createPaymongoQrCheckout(input: {
  orderId: string;
  email: string;
  lines: PaymongoLine[];
  successUrl: string;
  cancelUrl: string;
}) {
  const line_items = input.lines.map((line) => ({
    name: line.name.slice(0, 100),
    quantity: line.quantity,
    amount: usdCentsToPhpCentavos(line.unitUsdCents),
    currency: "PHP",
    description: "NebulaCraft digital delivery",
  }));

  const response = await fetch("https://api.paymongo.com/v2/checkout_sessions", {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items,
          payment_method_types: ["qrph"],
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          description: `NebulaCraft order ${input.orderId}`,
          reference_number: input.orderId,
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          metadata: {
            orderId: input.orderId,
            email: input.email,
          },
        },
      },
    }),
  });

  const body = (await response.json()) as {
    data?: { id?: string; attributes?: { checkout_url?: string } };
    errors?: { detail?: string }[];
  };

  if (!response.ok || !body.data?.id || !body.data.attributes?.checkout_url) {
    const detail = body.errors?.[0]?.detail ?? `PayMongo HTTP ${response.status}`;
    throw new Error(detail);
  }

  return { sessionId: body.data.id, checkoutUrl: body.data.attributes.checkout_url };
}

export function verifyPaymongoSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key.trim(), rest.join("=").trim()];
    }),
  ) as { t?: string; te?: string; li?: string };

  if (!parts.t) return false;
  const live = process.env.PAYMONGO_SECRET_KEY?.startsWith("sk_live_");
  const provided = live ? parts.li : parts.te;
  if (!provided) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

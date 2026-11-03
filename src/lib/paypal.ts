import "server-only";

import { usdCentsToPhpCentavos } from "@/lib/currency";

export function paypalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim());
}

function paypalBaseUrl() {
  const mode = (process.env.PAYPAL_MODE ?? "sandbox").trim().toLowerCase();
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function paypalAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new Error("PayPal credentials are missing.");

  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const body = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description ?? `PayPal token HTTP ${response.status}`);
  }
  return body.access_token;
}

export type PaypalLine = {
  name: string;
  quantity: number;
  unitUsdCents: number;
};

export async function createPaypalOrder(input: {
  orderId: string;
  currency: "USD" | "PHP";
  lines: PaypalLine[];
  returnUrl: string;
  cancelUrl: string;
}) {
  const token = await paypalAccessToken();
  const currency = input.currency;

  const items = input.lines.map((line) => {
    const unitMinor = currency === "USD" ? line.unitUsdCents : usdCentsToPhpCentavos(line.unitUsdCents);
    const unit = (unitMinor / 100).toFixed(2);
    return {
      name: line.name.slice(0, 127),
      quantity: String(line.quantity),
      unit_amount: { currency_code: currency, value: unit },
      category: "DIGITAL_GOODS" as const,
    };
  });

  const itemTotal = items
    .reduce((sum, item) => sum + Number(item.unit_amount.value) * Number(item.quantity), 0)
    .toFixed(2);

  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.orderId,
          custom_id: input.orderId,
          description: "NebulaCraft store",
          amount: {
            currency_code: currency,
            value: itemTotal,
            breakdown: {
              item_total: { currency_code: currency, value: itemTotal },
            },
          },
          items,
        },
      ],
      application_context: {
        brand_name: "NebulaCraft",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  });

  const body = (await response.json()) as {
    id?: string;
    links?: { rel?: string; href?: string }[];
    message?: string;
    details?: { description?: string }[];
  };

  if (!response.ok || !body.id) {
    throw new Error(body.details?.[0]?.description ?? body.message ?? `PayPal create HTTP ${response.status}`);
  }

  const approve = body.links?.find((link) => link.rel === "approve")?.href;
  if (!approve) throw new Error("PayPal did not return an approve URL.");

  return { paypalOrderId: body.id, approveUrl: approve };
}

export async function capturePaypalOrder(paypalOrderId: string) {
  const token = await paypalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });

  const body = (await response.json()) as {
    id?: string;
    status?: string;
    purchase_units?: { custom_id?: string; reference_id?: string }[];
    message?: string;
  };

  if (!response.ok) {
    throw new Error(body.message ?? `PayPal capture HTTP ${response.status}`);
  }

  const orderId = body.purchase_units?.[0]?.custom_id ?? body.purchase_units?.[0]?.reference_id ?? null;
  const paid = body.status === "COMPLETED";
  return { paid, orderId, paypalOrderId: body.id ?? paypalOrderId };
}

import "server-only";

import { formatMoney } from "@/lib/money";
import { supportEmail } from "@/lib/config";

export type ReceiptOrder = {
  id: string;
  email: string;
  username: string;
  totalCents: number;
  subtotalCents: number;
  discountCents: number;
  voucherCode: string | null;
  items: { name: string; quantity: number; lineCents: number }[];
};

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress() {
  return (
    process.env.RECEIPT_FROM_EMAIL?.trim() ||
    "NebulaCraft Store <onboarding@resend.dev>"
  );
}

export async function sendPurchaseReceipt(order: ReceiptOrder) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false as const, reason: "not_configured" as const };

  const support = supportEmail();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://nebulacraft-store.vercel.app";
  const orderUrl = `${site.replace(/\/$/, "")}/checkout/success?order=${order.id}`;

  const rows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5ebe9;">${escapeHtml(item.name)} × ${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5ebe9;text-align:right;">${formatMoney(item.lineCents)}</td>
        </tr>`,
    )
    .join("");

  const discountRow =
    order.discountCents > 0
      ? `<tr>
          <td style="padding:8px 0;">Voucher${order.voucherCode ? ` (${escapeHtml(order.voucherCode)})` : ""}</td>
          <td style="padding:8px 0;text-align:right;">−${formatMoney(order.discountCents)}</td>
        </tr>`
      : "";

  const html = `
    <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#14242b;max-width:560px;margin:0 auto;">
      <h1 style="font-size:28px;margin:0 0 8px;">Thanks for supporting NebulaCraft</h1>
      <p style="color:#3d5158;line-height:1.6;margin:0 0 20px;">
        Your payment cleared. Packages queue to <strong>${escapeHtml(order.username)}</strong> on the server.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows}
        ${
          order.discountCents > 0
            ? `<tr>
                <td style="padding:8px 0;">Subtotal</td>
                <td style="padding:8px 0;text-align:right;">${formatMoney(order.subtotalCents)}</td>
              </tr>${discountRow}`
            : ""
        }
        <tr>
          <td style="padding:12px 0;font-weight:700;font-size:16px;">Paid</td>
          <td style="padding:12px 0;font-weight:700;font-size:16px;text-align:right;">${formatMoney(order.totalCents)}</td>
        </tr>
      </table>
      <p style="color:#3d5158;line-height:1.6;margin:20px 0;">
        Order id: <code>${escapeHtml(order.id)}</code><br/>
        <a href="${escapeHtml(orderUrl)}">View order status</a>
      </p>
      <p style="color:#5c6d73;font-size:13px;line-height:1.5;">
        Questions? Email <a href="mailto:${escapeHtml(support)}">${escapeHtml(support)}</a>
        with this order id.
      </p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [order.email],
      subject: `NebulaCraft receipt · ${order.username}`,
      html,
      text: [
        "Thanks for supporting NebulaCraft.",
        `Delivering to ${order.username}.`,
        ...order.items.map((item) => `- ${item.name} × ${item.quantity}: ${formatMoney(item.lineCents)}`),
        order.discountCents > 0 ? `Discount: −${formatMoney(order.discountCents)}` : null,
        `Paid: ${formatMoney(order.totalCents)}`,
        `Order id: ${order.id}`,
        orderUrl,
      ]
        .filter(Boolean)
        .join("\n"),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend receipt failed", response.status, detail.slice(0, 300));
    return { ok: false as const, reason: "send_failed" as const };
  }

  return { ok: true as const };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

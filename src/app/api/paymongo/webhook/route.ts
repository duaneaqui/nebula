import { findOrderIdBySession, markPaid } from "@/lib/orders";
import { verifyPaymongoSignature } from "@/lib/paymongo";

export const runtime = "nodejs";

type SessionLike = {
  id?: string;
  attributes?: {
    reference_number?: string;
    metadata?: { orderId?: string };
    payments?: { attributes?: { status?: string } }[];
  };
};

function extractPaidSession(payload: unknown): SessionLike | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (!data || typeof data !== "object") return null;
  const outer = data as Record<string, unknown>;

  // Shape A: { data: { type: "checkout_session.payment.paid", data: { id, attributes } } }
  if (outer.type === "checkout_session.payment.paid" && outer.data && typeof outer.data === "object") {
    return outer.data as SessionLike;
  }

  // Shape B: { data: { attributes: { type: "checkout_session.payment.paid", data: session } } }
  const attributes = outer.attributes;
  if (attributes && typeof attributes === "object") {
    const attrs = attributes as Record<string, unknown>;
    if (attrs.type === "checkout_session.payment.paid" && attrs.data && typeof attrs.data === "object") {
      return attrs.data as SessionLike;
    }
  }

  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paymongo-signature");

  if (!verifyPaymongoSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const session = extractPaidSession(payload);
  if (!session) return Response.json({ ok: true, ignored: true });

  const payments = session.attributes?.payments;
  if (Array.isArray(payments) && payments.length > 0) {
    const paid = payments.some((payment) => payment.attributes?.status === "paid");
    if (!paid) return Response.json({ ok: true, ignored: true });
  }

  const orderId =
    session.attributes?.reference_number ||
    session.attributes?.metadata?.orderId ||
    (session.id ? await findOrderIdBySession(session.id) : null);

  if (!orderId) return Response.json({ ok: true, missing: true });

  try {
    await markPaid(orderId);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Fulfillment failed." }, { status: 500 });
  }

  return Response.json({ ok: true });
}

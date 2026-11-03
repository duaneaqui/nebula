import { publicOrder } from "@/lib/orders";

export const runtime = "nodejs";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!ID.test(id)) return Response.json({ error: "Unknown order." }, { status: 404 });
  const order = await publicOrder(id);
  if (!order) return Response.json({ error: "Unknown order." }, { status: 404 });
  return Response.json(order);
}

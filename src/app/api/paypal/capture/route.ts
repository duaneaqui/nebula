import { findOrderIdBySession, markPaid } from "@/lib/orders";
import { capturePaypalOrder } from "@/lib/paypal";
import { requestOrigin } from "@/lib/guard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderHint = url.searchParams.get("order");
  const token = url.searchParams.get("token");
  const origin = requestOrigin(request);

  if (!token) {
    return Response.redirect(`${origin}/checkout/cancel${orderHint ? `?order=${orderHint}` : ""}`);
  }

  try {
    const result = await capturePaypalOrder(token);
    const orderId = result.orderId || orderHint || (await findOrderIdBySession(token));
    if (!result.paid || !orderId) {
      return Response.redirect(`${origin}/checkout/cancel${orderHint ? `?order=${orderHint}` : ""}`);
    }
    await markPaid(orderId);
    return Response.redirect(`${origin}/checkout/success?order=${orderId}`);
  } catch (error) {
    console.error(error);
    return Response.redirect(`${origin}/checkout/cancel${orderHint ? `?order=${orderHint}` : ""}`);
  }
}

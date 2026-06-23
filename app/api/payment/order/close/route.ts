import { jsonError, readJson } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { closeOrder } from "@/lib/payment/server";

/**
 * POST /api/payment/order/close — close an unpaid membership-renewal order.
 * Body: `{ order_no }`. Requires a session.
 */
export async function POST(request: Request) {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await readJson<Record<string, unknown>>(request);
  const orderNo = typeof body?.order_no === "string" ? body.order_no.trim() : "";
  if (!orderNo) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await closeOrder(orderNo, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

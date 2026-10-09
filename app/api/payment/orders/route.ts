import { jsonError, unauthorizedResponse } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { listOrders } from "@/lib/payment/server";

/**
 * GET /api/payment/orders?limit=… — the signed-in user's membership-renewal
 * order history. Requires a session.
 */
export async function GET(request: Request) {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const limitParam = new URL(request.url).searchParams.get("limit");
  const limit = limitParam && Number.isFinite(Number(limitParam)) ? Number(limitParam) : undefined;

  const result = await listOrders(token, limit);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

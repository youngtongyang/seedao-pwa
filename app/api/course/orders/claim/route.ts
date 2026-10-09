import { jsonError, readJson, unauthorizedResponse } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { claimCourseOrder } from "@/lib/course/server";

/**
 * POST /api/course/orders/claim — 认领无主订单（JWT 必填）。
 * Body: { order_no, order_token }
 */
export async function POST(request: Request) {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const body = (await readJson<Record<string, unknown>>(request)) ?? {};
  const orderNo = typeof body.order_no === "string" ? body.order_no.trim() : "";
  const orderToken = typeof body.order_token === "string" ? body.order_token.trim() : "";
  if (!orderNo || !orderToken) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await claimCourseOrder({ order_no: orderNo, order_token: orderToken }, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

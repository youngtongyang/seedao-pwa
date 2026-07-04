import { jsonError, readJson } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { closeCourseOrder } from "@/lib/course/server";

/**
 * POST /api/course/orders/[order_no]/close — 关闭未支付订单。
 * Body: { order_token? } 用于无主订单；JWT 自动从 cookie 读取。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ order_no: string }> },
) {
  const { order_no: orderNo } = await params;
  if (!orderNo) return Response.json({ error: "invalid_param" }, { status: 400 });

  const token = (await getToken()) ?? undefined;
  const body = (await readJson<Record<string, unknown>>(request)) ?? {};
  const orderToken =
    typeof body.order_token === "string" ? body.order_token.trim() || undefined : undefined;

  const result = await closeCourseOrder(orderNo, token, orderToken);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

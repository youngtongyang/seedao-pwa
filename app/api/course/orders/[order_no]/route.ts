import { jsonError } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { queryCourseOrder } from "@/lib/course/server";

/**
 * GET /api/course/orders/[order_no] — 查询课程订单。
 * ?token=<order_token> 用于无主订单查询；JWT 自动从 cookie 读取。
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ order_no: string }> },
) {
  const { order_no: orderNo } = await params;
  if (!orderNo) return Response.json({ error: "invalid_param" }, { status: 400 });

  const token = (await getToken()) ?? undefined;
  const url = new URL(request.url);
  const orderToken = url.searchParams.get("token")?.trim() || undefined;

  const result = await queryCourseOrder(orderNo, token, orderToken);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

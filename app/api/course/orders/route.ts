import { jsonError, readJson, unauthorizedResponse } from "@/lib/api/http";
import { parseReturnTo } from "@/lib/auth/return-to-server";
import { getToken } from "@/lib/auth/session";
import { createCourseOrder, listCourseOrders } from "@/lib/course/server";
import { parsePayChannel } from "@/lib/payment/types";

/**
 * GET /api/course/orders?status=…&limit=… — 我的课程订单列表。需要 Session；
 * 无主订单（order_token）在 claim 之前不出现在列表中。
 * 后端待建（`GET /v1/courses/orders`），当前仅 mock 可用。
 */
export async function GET(request: Request) {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const sp = new URL(request.url).searchParams;
  const limitParam = sp.get("limit");
  const result = await listCourseOrders(token, {
    status: sp.get("status")?.trim() || undefined,
    limit: limitParam && Number.isFinite(Number(limitParam)) ? Number(limitParam) : undefined,
  });

  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

/**
 * POST /api/course/orders — 创建课程订单。
 * Body: { course_id, sku_id, channel_code?, apply_member_discount?, pay_channel? }
 * apply_member_discount=true 时需登录（JWT）。
 */
export async function POST(request: Request) {
  const token = (await getToken()) ?? undefined;
  const body = (await readJson<Record<string, unknown>>(request)) ?? {};

  const courseId = typeof body.course_id === "string" ? body.course_id.trim() : "";
  const skuId = typeof body.sku_id === "string" ? body.sku_id.trim() : "";
  if (!courseId || !skuId) return Response.json({ error: "invalid_param" }, { status: 400 });

  const applyMember = body.apply_member_discount === true;
  if (applyMember && !token) {
    return unauthorizedResponse("course_member_login_required");
  }

  const result = await createCourseOrder(
    {
      course_id: courseId,
      sku_id: skuId,
      channel_code: typeof body.channel_code === "string" ? body.channel_code.trim() : undefined,
      apply_member_discount: applyMember,
      pay_channel: parsePayChannel(body.pay_channel),
      return_to: parseReturnTo(body),
    },
    token,
  );

  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

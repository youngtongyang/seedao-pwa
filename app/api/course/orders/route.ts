import { jsonError, readJson } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { createCourseOrder } from "@/lib/course/server";
import type { PayChannel } from "@/lib/course/types";

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
    return Response.json({ error: "course_member_login_required" }, { status: 401 });
  }

  const result = await createCourseOrder(
    {
      course_id: courseId,
      sku_id: skuId,
      channel_code: typeof body.channel_code === "string" ? body.channel_code.trim() : undefined,
      apply_member_discount: applyMember,
      pay_channel:
        body.pay_channel === "wechat_native" || body.pay_channel === "wechat_h5"
          ? (body.pay_channel as PayChannel)
          : undefined,
    },
    token,
  );

  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

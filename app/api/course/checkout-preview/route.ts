import { jsonError, readJson } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { previewCheckout } from "@/lib/course/server";

/**
 * POST /api/course/checkout-preview — 课程价格试算。
 * Body: { course_id, sku_id, channel_code?, apply_member_discount? }
 * Token 可选 — 登录后 apply_member_discount=true 时生效。
 */
export async function POST(request: Request) {
  const token = (await getToken()) ?? undefined;
  const body = (await readJson<Record<string, unknown>>(request)) ?? {};

  const courseId = typeof body.course_id === "string" ? body.course_id.trim() : "";
  const skuId = typeof body.sku_id === "string" ? body.sku_id.trim() : "";
  if (!courseId || !skuId) return Response.json({ error: "invalid_param" }, { status: 400 });

  // 有 JWT 就请求会员折扣，由后端根据实际会员状态决定是否生效
  const applyMemberDiscount = !!token || body.apply_member_discount === true;

  const result = await previewCheckout(
    {
      course_id: courseId,
      sku_id: skuId,
      channel_code: typeof body.channel_code === "string" ? body.channel_code.trim() : undefined,
      apply_member_discount: applyMemberDiscount,
    },
    token,
  );

  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

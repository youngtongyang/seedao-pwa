import { jsonError, readJson } from "@/lib/api/http";
import { userProfile } from "@/lib/api/server";
import { getToken } from "@/lib/auth/session";
import { previewCheckout } from "@/lib/course/server";
import { qualifiesForMemberDiscount } from "@/lib/membership";

/**
 * POST /api/course/checkout-preview — 课程价格试算。
 * Body: { course_id, sku_id, channel_code?, apply_member_discount? }
 * Member discount only when membership_tier === full (准会员走原价).
 */
export async function POST(request: Request) {
  const token = (await getToken()) ?? undefined;
  const body = (await readJson<Record<string, unknown>>(request)) ?? {};

  const courseId = typeof body.course_id === "string" ? body.course_id.trim() : "";
  const skuId = typeof body.sku_id === "string" ? body.sku_id.trim() : "";
  if (!courseId || !skuId) return Response.json({ error: "invalid_param" }, { status: 400 });

  let applyMemberDiscount = body.apply_member_discount === true;
  if (token) {
    const profile = await userProfile(token);
    applyMemberDiscount =
      profile.ok && qualifiesForMemberDiscount(profile.data.membership_tier);
  }

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

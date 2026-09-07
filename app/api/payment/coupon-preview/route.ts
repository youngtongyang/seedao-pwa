import { jsonError, readJson } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { previewCoupon } from "@/lib/payment/server";
import type { CouponPreviewInput } from "@/lib/payment/types";

/**
 * POST /api/payment/coupon-preview — membership list / payable amount.
 * Auth optional (backend may allow anonymous preview); forwards session when present.
 */
export async function POST(request: Request) {
  const token = (await getToken()) ?? undefined;
  const body = (await readJson<Record<string, unknown>>(request)) ?? {};
  const input: CouponPreviewInput = {
    product_type: "membership_renew",
  };
  if (typeof body.days === "number" && Number.isFinite(body.days)) input.days = body.days;
  if (typeof body.coupon_code === "string" && body.coupon_code.trim()) {
    input.coupon_code = body.coupon_code.trim();
  }

  const result = await previewCoupon(input, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

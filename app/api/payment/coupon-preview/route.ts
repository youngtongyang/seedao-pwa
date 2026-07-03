import { jsonError, readJson } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { previewCoupon } from "@/lib/payment/server";

/**
 * POST /api/payment/coupon-preview — trial-run a coupon code against the backend.
 * Body: `{ coupon_code }` (product_type defaults to `membership_renew`).
 *
 * Token is optional — passed through when the user is signed in; omitted
 * otherwise. The backend may accept anonymous preview or return 401 depending
 * on configuration.
 */
export async function POST(request: Request) {
  const token = (await getToken()) ?? undefined;

  const body = (await readJson<Record<string, unknown>>(request)) ?? {};
  const couponCode = typeof body.coupon_code === "string" ? body.coupon_code.trim() : "";
  if (!couponCode) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await previewCoupon(
    { product_type: "membership_renew", coupon_code: couponCode },
    token,
  );

  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

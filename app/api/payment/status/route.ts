import { jsonError } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { queryOrder } from "@/lib/payment/server";

/**
 * GET /api/payment/status?order_no=… — poll a membership-renewal order.
 *
 * The client polls this until `status` flips to `paid`. The backend records
 * WeChat's `TRANSACTION.SUCCESS` notify (with the query API as a fallback), maps
 * `trade_state` for us, and once paid returns the new `membership_expires_at`.
 * The user is already signed in (the session was minted at registration), so no
 * cookie is set here.
 */
export async function GET(request: Request) {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const orderNo = new URL(request.url).searchParams.get("order_no")?.trim() ?? "";
  if (!orderNo) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await queryOrder(orderNo, token);
  if (!result.ok) return jsonError(result);

  // Pass the order through verbatim — status + (once paid) membership_expires_at,
  // and code_url/h5_url while pending so a refreshed page can keep paying.
  return Response.json(result.data);
}

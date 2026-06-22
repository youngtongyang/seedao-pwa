import { jsonError } from "@/lib/api/http";
import { setSession } from "@/lib/auth/session";
import { queryOrder } from "@/lib/payment/server";

/**
 * GET /api/payment/status?out_trade_no=… — poll a WeChat Native order.
 *
 * The client polls this until `status` flips to `paid`. The status is read back
 * automatically: the backend records WeChat's `TRANSACTION.SUCCESS` notify (with
 * the query-order API as a fallback) and maps `trade_state` for us. On the first
 * `paid` read the backend also returns the freshly-minted session, so we
 * establish the cookie here — making the redirect to `/profile` land the user
 * already signed in. Setting the cookie on a polled GET is idempotent.
 */
export async function GET(request: Request) {
  const outTradeNo = new URL(request.url).searchParams.get("out_trade_no")?.trim() ?? "";
  if (!outTradeNo) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await queryOrder(outTradeNo);
  if (!result.ok) return jsonError(result);

  const { status, trade_state, token, token_exp, user } = result.data;
  if (status === "paid" && token) await setSession(token, token_exp);

  return Response.json({ out_trade_no: outTradeNo, status, trade_state, user });
}

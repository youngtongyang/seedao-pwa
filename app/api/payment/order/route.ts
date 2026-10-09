import { jsonError, readJson, unauthorizedResponse } from "@/lib/api/http";
import { parseReturnTo } from "@/lib/auth/return-to-server";
import { getToken } from "@/lib/auth/session";
import { createOrder } from "@/lib/payment/server";
import type { CreateOrderInput } from "@/lib/payment/types";
import { parsePayChannel } from "@/lib/payment/types";

/**
 * POST /api/payment/order — open a WeChat membership-renewal order for the
 * signed-in user. Body: `{ days?, pay_channel? }` (both optional; the backend
 * defaults to 365 days / `wechat_native`).
 *
 * Requires a session — registration mints one, and payment renews *that* user's
 * membership. Returns the `PaymentOrder` (Native `code_url` to draw a QR, or H5
 * `h5_url` to redirect).
 */
export async function POST(request: Request) {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const body = (await readJson<Record<string, unknown>>(request)) ?? {};
  const input: CreateOrderInput = {};
  if (typeof body.days === "number" && Number.isFinite(body.days)) input.days = body.days;
  const payChannel = parsePayChannel(body.pay_channel);
  if (payChannel) input.pay_channel = payChannel;
  const returnTo = parseReturnTo(body);
  if (returnTo) input.return_to = returnTo;

  const result = await createOrder(input, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

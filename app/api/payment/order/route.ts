import { jsonError, readJson } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { createOrder } from "@/lib/payment/server";
import type { CreateOrderInput, PayChannel } from "@/lib/payment/types";

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
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await readJson<Record<string, unknown>>(request)) ?? {};
  const input: CreateOrderInput = {};
  if (typeof body.days === "number" && Number.isFinite(body.days)) input.days = body.days;
  if (body.pay_channel === "wechat_native" || body.pay_channel === "wechat_h5") {
    input.pay_channel = body.pay_channel as PayChannel;
  }

  const result = await createOrder(input, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

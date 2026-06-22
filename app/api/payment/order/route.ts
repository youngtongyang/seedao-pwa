import { jsonError, readJson } from "@/lib/api/http";
import { createOrder } from "@/lib/payment/server";

/**
 * POST /api/payment/order — open a WeChat Native order for a reserved SeeDAO
 * name. Body: `{ sns_name }` (must already include the `.seedao` suffix).
 *
 * Returns the `PaymentOrder` (including the QR to display). No session yet — the
 * account is minted only once payment is confirmed (see `/api/payment/status`).
 */
export async function POST(request: Request) {
  const body = await readJson<Record<string, unknown>>(request);
  const snsName = typeof body?.sns_name === "string" ? body.sns_name.trim().toLowerCase() : "";
  if (!snsName) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await createOrder(snsName);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

import { jsonError } from "@/lib/api/http";
import { getMembershipFee } from "@/lib/membership/server";

/**
 * GET /api/membership/fee — annual membership list price.
 * Forwards to `GET /v1/membership/fee` (anonymous). Amounts are integer 分.
 */
export async function GET() {
  const result = await getMembershipFee();
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

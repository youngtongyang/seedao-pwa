import { jsonError, unauthorizedResponse } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { getProposalPermissions } from "@/lib/proposals/server";

/** GET /api/governance/proposal-permissions — 当前用户可创建的提案类型 */
export async function GET() {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const result = await getProposalPermissions(token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

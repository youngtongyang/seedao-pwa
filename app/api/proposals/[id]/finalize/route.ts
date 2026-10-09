import { jsonError, unauthorizedResponse } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { finalizeProposal } from "@/lib/proposals/server";

/** POST /api/proposals/[id]/finalize — 投票结束后结票 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await finalizeProposal(id, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

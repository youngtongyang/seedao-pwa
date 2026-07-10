import { jsonError } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { getMyVote } from "@/lib/proposals/server";

/** GET /api/proposals/[id]/votes/me — 当前用户对该提案的投票 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await getMyVote(id, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

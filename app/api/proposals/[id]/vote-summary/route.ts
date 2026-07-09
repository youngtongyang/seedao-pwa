import { jsonError } from "@/lib/api/http";
import { getVoteSummary } from "@/lib/proposals/server";

/** GET /api/proposals/[id]/vote-summary — 投票计票摘要 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await getVoteSummary(id);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

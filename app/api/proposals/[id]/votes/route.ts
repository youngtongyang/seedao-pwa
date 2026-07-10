import { jsonError, readJson } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { castVote, listVotes } from "@/lib/proposals/server";
import type { CastVoteInput } from "@/lib/proposals/types";

/**
 * GET /api/proposals/[id]/votes — 投票列表
 * POST /api/proposals/[id]/votes — 投票（需登录）
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return Response.json({ error: "invalid_param" }, { status: 400 });

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit")
    ? Number(url.searchParams.get("limit"))
    : undefined;

  const result = await listVotes(id, limit);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return Response.json({ error: "invalid_param" }, { status: 400 });

  const body = await readJson<CastVoteInput>(request);
  if (!body?.vote_result?.trim()) {
    return Response.json({ error: "invalid_param" }, { status: 400 });
  }

  const result = await castVote(id, body, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

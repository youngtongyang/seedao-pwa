import { jsonError, readJson, unauthorizedResponse } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { getProposalSynced, updateProposal } from "@/lib/proposals/server";
import type { UpdateProposalInput } from "@/lib/proposals/types";

/**
 * GET /api/proposals/[id] — 提案详情（含生命周期同步）
 * PATCH /api/proposals/[id] — 修改草稿（需登录）
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return Response.json({ error: "invalid_param" }, { status: 400 });

  const url = new URL(request.url);
  const token = (await getToken()) ?? undefined;
  const result = await getProposalSynced(id, {
    include_votes: url.searchParams.get("include_votes") === "true",
    include_comments: url.searchParams.get("include_comments") === "true",
  }, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return Response.json({ error: "invalid_param" }, { status: 400 });

  const body = await readJson<UpdateProposalInput>(request);
  if (!body) return Response.json({ error: "invalid_param" }, { status: 400 });
  const result = await updateProposal(id, body, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

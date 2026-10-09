import { jsonError, readJson, unauthorizedResponse } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { createProposal, listProposals } from "@/lib/proposals/server";
import type { CreateProposalInput, ListProposalsQuery } from "@/lib/proposals/types";

/**
 * GET /api/proposals — 分页提案列表
 * POST /api/proposals — 创建提案草稿（需登录）
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q: ListProposalsQuery = {
    limit: url.searchParams.get("limit")
      ? Number(url.searchParams.get("limit"))
      : undefined,
    before_id: url.searchParams.get("before_id")
      ? Number(url.searchParams.get("before_id"))
      : undefined,
    type: url.searchParams.get("type") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    sip: url.searchParams.get("sip") ?? undefined,
    keyword: url.searchParams.get("keyword") ?? undefined,
  };

  const result = await listProposals(q);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

export async function POST(request: Request) {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const body = await readJson<CreateProposalInput>(request);
  if (!body?.title?.trim() || !body.type) {
    return Response.json({ error: "invalid_param" }, { status: 400 });
  }

  const result = await createProposal(body, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

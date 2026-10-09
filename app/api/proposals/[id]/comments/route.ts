import { jsonError, readJson, unauthorizedResponse } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { createComment, listComments } from "@/lib/proposals/server";
import type { CreateCommentInput } from "@/lib/proposals/types";

/**
 * GET /api/proposals/[id]/comments — 评论列表
 * POST /api/proposals/[id]/comments — 发表评论（需登录）
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

  const result = await listComments(id, limit);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return Response.json({ error: "invalid_param" }, { status: 400 });

  const body = await readJson<CreateCommentInput>(request);
  if (!body?.content?.trim()) {
    return Response.json({ error: "invalid_param" }, { status: 400 });
  }

  const result = await createComment(id, body, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

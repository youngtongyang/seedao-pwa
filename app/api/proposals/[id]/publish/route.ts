import { jsonError, readJson } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { publishProposal } from "@/lib/proposals/server";
import type { PublishProposalInput } from "@/lib/proposals/types";

/** POST /api/proposals/[id]/publish — 发布提案进入公示期 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return Response.json({ error: "invalid_param" }, { status: 400 });

  const body = (await readJson<PublishProposalInput>(request)) ?? ({} as PublishProposalInput);
  const result = await publishProposal(id, body, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

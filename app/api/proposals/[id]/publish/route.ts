import { jsonError, readJson, unauthorizedResponse } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { publishProposal } from "@/lib/proposals/server";
import type { PublishProposalInput } from "@/lib/proposals/types";

/** POST /api/proposals/[id]/publish — publish a draft (hall types skip publicity). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return Response.json({ error: "invalid_param" }, { status: 400 });

  const body = (await readJson<PublishProposalInput>(request)) ?? ({} as PublishProposalInput);
  const result = await publishProposal(id, body, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

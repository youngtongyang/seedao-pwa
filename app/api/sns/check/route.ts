import { jsonError } from "@/lib/api/http";
import { snsCheck } from "@/lib/api/server";

/** GET /api/sns/check?sns_name=alice.seedao — availability + reason. No auth. */
export async function GET(request: Request) {
  const snsName = new URL(request.url).searchParams.get("sns_name")?.trim() ?? "";
  if (!snsName) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await snsCheck(snsName);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

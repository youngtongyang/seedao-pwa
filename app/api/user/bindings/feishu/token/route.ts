import { jsonError, readJson } from "@/lib/api/http";
import { bindFeishuToken } from "@/lib/api/server";
import { getToken } from "@/lib/auth/session";

/**
 * POST /api/user/bindings/feishu/token — claim a 土地神 `bind_token` onto the
 * current SeeDAO session (path A: Feishu → website).
 */
export async function POST(request: Request) {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await readJson<Record<string, unknown>>(request)) ?? {};
  const bindToken = typeof body.bind_token === "string" ? body.bind_token.trim() : "";
  if (!bindToken) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await bindFeishuToken({ bind_token: bindToken }, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

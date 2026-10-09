import { jsonError, unauthorizedResponse } from "@/lib/api/http";
import { createFeishuChallenge } from "@/lib/api/server";
import { getToken } from "@/lib/auth/session";

/**
 * POST /api/user/bindings/feishu/challenge — mint a short bind_code for the
 * website → Feishu path (user tells 土地神 `绑定 {code}`).
 */
export async function POST() {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const result = await createFeishuChallenge(token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

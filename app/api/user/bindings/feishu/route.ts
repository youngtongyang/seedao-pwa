import { jsonError, unauthorizedResponse } from "@/lib/api/http";
import { unbindFeishu } from "@/lib/api/server";
import { getToken } from "@/lib/auth/session";

/**
 * DELETE /api/user/bindings/feishu — soft-unbind Feishu from the current user.
 */
export async function DELETE() {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const result = await unbindFeishu(token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

import { jsonError } from "@/lib/api/http";
import { listBindings } from "@/lib/api/server";
import { getToken } from "@/lib/auth/session";

/**
 * GET /api/user/bindings — third-party account binding status for the signed-in user.
 */
export async function GET() {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const result = await listBindings(token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

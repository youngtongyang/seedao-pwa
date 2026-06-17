import { jsonError } from "@/lib/api/http";
import { userProfile } from "@/lib/api/server";
import { getToken } from "@/lib/auth/session";

/** GET /api/profile — the signed-in user's read-only profile. Requires session. */
export async function GET() {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const result = await userProfile(token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

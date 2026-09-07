import { jsonError } from "@/lib/api/http";
import { submitApplication } from "@/lib/api/server";
import { getToken } from "@/lib/auth/session";
import { isMembershipActive } from "@/lib/membership";

/**
 * POST /api/profile/application/submit — mark the membership application as submitted.
 */
export async function POST() {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const result = await submitApplication(token);
  if (!result.ok) return jsonError(result);

  if (!isMembershipActive(result.data.membership_expires_at)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  return Response.json(result.data);
}

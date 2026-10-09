import { jsonError, unauthorizedResponse } from "@/lib/api/http";
import { userProfile } from "@/lib/api/server";
import { getToken } from "@/lib/auth/session";
import { isMembershipActive } from "@/lib/membership";

/**
 * GET /api/profile — the signed-in user's read-only profile.
 *
 * Requires an active **paid member**, not merely a session: a registered-but-
 * unpaid user holds a valid `seedao.session` token (issued at register so they
 * can pay) but must not read profile data yet. We gate on the backend's
 * `membership_expires_at` — the source of truth — rather than the client-
 * readable `seedao.authed` cookie, which a caller could forge.
 */
export async function GET() {
  const token = await getToken();
  if (!token) return unauthorizedResponse();

  const result = await userProfile(token);
  if (!result.ok) return jsonError(result);

  if (!isMembershipActive(result.data.membership_expires_at)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  return Response.json(result.data);
}

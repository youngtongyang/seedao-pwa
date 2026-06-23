import { userCount } from "@/lib/api/server";
import { MEMBER_BASE } from "@/lib/mock/stats";

/**
 * GET /api/stats/members — total active members = seed base + live user count.
 *
 * The seed base (`MEMBER_BASE`) covers early members never written to the user
 * table. If the backend count is unavailable we still return the base, so the
 * hero always shows a sensible number rather than failing.
 */
export async function GET() {
  const result = await userCount();
  const count = MEMBER_BASE + (result.ok ? result.data.total_user_count : 0);
  return Response.json({ count });
}

import { userCount } from "@/lib/api/server";

/**
 * GET /api/stats/members — total members shown on the homepage.
 *
 * The number comes straight from the backend (`/v1/stats/user-count`), which
 * already does the accounting (on-chain SNS holders + registered users). On a
 * backend failure we return 0 and let the hero handle the fallback.
 */
export async function GET() {
  const result = await userCount();
  const count = result.ok ? result.data.total_user_count : 0;
  return Response.json({ count });
}

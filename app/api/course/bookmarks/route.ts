import { jsonError } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { listBookmarks } from "@/lib/course/server";

/**
 * GET /api/course/bookmarks — 我的课程收藏。需要 Session（注册即可，无需会员）。
 * 后端待建（`GET /v1/courses/bookmarks`），当前仅 mock 可用。
 */
export async function GET() {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const result = await listBookmarks(token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

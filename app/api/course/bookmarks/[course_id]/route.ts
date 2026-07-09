import { jsonError } from "@/lib/api/http";
import { getToken } from "@/lib/auth/session";
import { addBookmark, removeBookmark } from "@/lib/course/server";

type Ctx = { params: Promise<{ course_id: string }> };

/**
 * PUT /api/course/bookmarks/{course_id} — 收藏课程（幂等，重复 PUT 返回 200）。
 * 需要 Session。后端待建（`PUT /v1/courses/bookmarks/:course_id`）。
 */
export async function PUT(_request: Request, { params }: Ctx) {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const courseId = (await params).course_id?.trim();
  if (!courseId) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await addBookmark(courseId, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

/**
 * DELETE /api/course/bookmarks/{course_id} — 取消收藏（幂等，删除不存在的也返回 200）。
 * 需要 Session。后端待建（`DELETE /v1/courses/bookmarks/:course_id`）。
 */
export async function DELETE(_request: Request, { params }: Ctx) {
  const token = await getToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

  const courseId = (await params).course_id?.trim();
  if (!courseId) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await removeBookmark(courseId, token);
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

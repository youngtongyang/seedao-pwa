import { jsonError } from "@/lib/api/http";
import { health } from "@/lib/api/server";

/** GET /api/health — proxy the backend liveness probe. */
export async function GET() {
  const result = await health();
  if (!result.ok) return jsonError(result);
  return Response.json(result.data);
}

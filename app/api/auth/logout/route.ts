import { clearSession } from "@/lib/auth/session";

/** POST /api/auth/logout — clear the session and the readable hint cookie. */
export async function POST() {
  await clearSession();
  return Response.json({ ok: true });
}

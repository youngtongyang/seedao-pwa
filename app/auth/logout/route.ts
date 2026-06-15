import { cookies } from "next/headers";

/** POST /auth/logout — clear the session and related cookies. */
export async function POST() {
  const store = await cookies();
  store.delete("seedao.session");
  store.delete("seedao.profile");
  store.delete("seedao.authed");
  return Response.json({ ok: true });
}

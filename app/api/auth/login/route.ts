import { jsonError, readJson } from "@/lib/api/http";
import { login } from "@/lib/api/server";
import { setSession } from "@/lib/auth/session";
import { isMembershipActive } from "@/lib/membership";

/** POST /api/auth/login — existing user logs in with phone + OTP. */
export async function POST(request: Request) {
  const body = await readJson<{ phone?: unknown; code?: unknown }>(request);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!phone || !code) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await login({ phone, code });
  if (!result.ok) return jsonError(result);

  // Only an active member is "logged in". A registered-but-unpaid user still
  // gets the session token (so they can complete payment), but no `authed` flag,
  // so they can't reach the profile until they pay.
  const member = isMembershipActive(result.data.user.membership_expires_at);
  await setSession(result.data.token, result.data.token_exp, member);
  return Response.json({ ok: true, user: result.data.user, member });
}

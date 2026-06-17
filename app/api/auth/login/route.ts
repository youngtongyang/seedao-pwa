import { jsonError, readJson } from "@/lib/api/http";
import { login } from "@/lib/api/server";
import { setSession } from "@/lib/auth/session";

/** POST /api/auth/login — existing user logs in with phone + OTP. */
export async function POST(request: Request) {
  const body = await readJson<{ phone?: unknown; code?: unknown }>(request);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!phone || !code) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await login({ phone, code });
  if (!result.ok) return jsonError(result);

  await setSession(result.data.token, result.data.token_exp);
  return Response.json({ ok: true, user: result.data.user });
}

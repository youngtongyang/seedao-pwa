import { cookies } from "next/headers";
import { verifyCode } from "@/lib/auth/server";

const SESSION_COOKIE = "seedao.session";

/** POST /auth/verify — verify phone + OTP, then establish a session. */
export async function POST(request: Request) {
  let phone = "";
  let code = "";
  try {
    const body = (await request.json()) as { phone?: unknown; code?: unknown };
    phone = typeof body.phone === "string" ? body.phone.trim() : "";
    code = typeof body.code === "string" ? body.code.trim() : "";
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const outcome = await verifyCode(phone, code);
  if (!outcome.ok)
    return Response.json({ error: outcome.error }, { status: outcome.status });

  const store = await cookies();
  store.set(SESSION_COOKIE, outcome.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return Response.json({ ok: true });
}

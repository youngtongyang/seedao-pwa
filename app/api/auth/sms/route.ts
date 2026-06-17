import { jsonError, readJson } from "@/lib/api/http";
import { smsSend } from "@/lib/api/server";

/** POST /api/auth/sms — request an OTP for a phone number. */
export async function POST(request: Request) {
  const body = await readJson<{ phone?: unknown }>(request);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  if (!phone) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await smsSend(phone);
  if (!result.ok) return jsonError(result);
  return Response.json({ ok: true, retry_after: result.data.retry_after });
}

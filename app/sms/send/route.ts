import { sendCode } from "@/lib/auth/server";

/** POST /sms/send — request an OTP for a phone number. */
export async function POST(request: Request) {
  let phone = "";
  try {
    const body = (await request.json()) as { phone?: unknown };
    phone = typeof body.phone === "string" ? body.phone.trim() : "";
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const outcome = await sendCode(phone);
  if (!outcome.ok)
    return Response.json({ error: outcome.error }, { status: outcome.status });

  return Response.json({ ok: true });
}

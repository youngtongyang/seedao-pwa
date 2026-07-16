import { jsonError } from "@/lib/api/http";
import { checkPhoneForRegister } from "@/lib/api/server";

/** GET /api/auth/phone-check?phone=… — register preflight; does not send SMS. */
export async function GET(request: Request) {
  const phone = new URL(request.url).searchParams.get("phone")?.trim() ?? "";
  if (!phone) return Response.json({ error: "invalid_param" }, { status: 400 });

  const result = await checkPhoneForRegister(phone);
  if (!result.ok) return jsonError(result);
  return Response.json({ ok: true, phone: result.data.phone, registered: result.data.registered });
}

import { jsonError, readJson } from "@/lib/api/http";
import { register } from "@/lib/api/server";
import type { RegisterRequest } from "@/lib/api/types";
import { setSession } from "@/lib/auth/session";
import { isMembershipActive } from "@/lib/membership";

/**
 * POST /api/auth/register — create a new account.
 *
 * `register_type: "new_sns"`      → mint a fresh `{name}.seedao` (needs `sns_name`).
 * `register_type: "existing_sns"` → claim an on-chain name proven by a wallet
 *                                    SIWE signature (needs wallet/domain/message/signature).
 */
export async function POST(request: Request) {
  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return Response.json({ error: "invalid_param" }, { status: 400 });

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!phone || !code) return Response.json({ error: "invalid_param" }, { status: 400 });

  let req: RegisterRequest;
  if (body.register_type === "new_sns") {
    const snsName = typeof body.sns_name === "string" ? body.sns_name.trim().toLowerCase() : "";
    if (!snsName) return Response.json({ error: "invalid_param" }, { status: 400 });
    req = { phone, code, register_type: "new_sns", sns_name: snsName };
  } else if (body.register_type === "existing_sns") {
    const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string) : "");
    const wallet = str("wallet");
    const message = str("message");
    const signature = str("signature");
    if (!wallet || !message || !signature)
      return Response.json({ error: "invalid_param" }, { status: 400 });
    req = {
      phone,
      code,
      register_type: "existing_sns",
      wallet,
      wallet_type: str("wallet_type") || "EOA",
      domain: str("domain"),
      message,
      signature,
    };
  } else {
    return Response.json({ error: "invalid_param" }, { status: 400 });
  }

  const result = await register(req);
  if (!result.ok) return jsonError(result);

  // Always hold the JWT (needed to pay), but only mark "logged in" if this
  // account is already an active member (e.g. an on-chain claim the backend
  // grants membership to). A fresh new_sns user must pay first.
  const member = isMembershipActive(result.data.user.membership_expires_at);
  await setSession(result.data.token, result.data.token_exp, member);
  return Response.json({ ok: true, user: result.data.user });
}

import { isValidCode, isValidPhone } from "./phone";

/**
 * Server-side phone-OTP backend seam, used by the `/sms/send` and `/auth/verify`
 * Route Handlers.
 *
 * Set `SEEDAO_API_BASE` to forward to the real backend. When it is unset (local
 * dev), a mock fallback lets the full login flow be exercised end-to-end:
 * `sendCode` no-ops and `verifyCode` accepts any well-formed 6-digit code.
 */
const REMOTE = process.env.SEEDAO_API_BASE?.replace(/\/$/, "");

export type SendOutcome = { ok: true } | { ok: false; status: number; error: string };
export type VerifyOutcome =
  | { ok: true; token: string }
  | { ok: false; status: number; error: string };

export async function sendCode(phone: string): Promise<SendOutcome> {
  if (!isValidPhone(phone)) return { ok: false, status: 400, error: "invalid_phone" };

  if (!REMOTE) return { ok: true }; // dev/mock: no SMS is actually sent

  try {
    const res = await fetch(`${REMOTE}/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) return { ok: false, status: 502, error: "upstream_error" };
    return { ok: true };
  } catch {
    return { ok: false, status: 502, error: "upstream_unreachable" };
  }
}

export async function verifyCode(
  phone: string,
  code: string,
): Promise<VerifyOutcome> {
  if (!isValidPhone(phone) || !isValidCode(code))
    return { ok: false, status: 400, error: "invalid_input" };

  if (!REMOTE) return { ok: true, token: "mock-session" }; // dev/mock: accept any 6-digit code

  try {
    const res = await fetch(`${REMOTE}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = (await res.json().catch(() => ({}))) as { token?: unknown };
    if (!res.ok || typeof data.token !== "string")
      return { ok: false, status: 401, error: "verify_failed" };
    return { ok: true, token: data.token };
  } catch {
    return { ok: false, status: 502, error: "upstream_unreachable" };
  }
}

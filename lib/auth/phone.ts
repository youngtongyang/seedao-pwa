/**
 * Phone + OTP auth seam.
 *
 * Pure validators here are shared by the client form and the server route
 * handlers. The `requestSmsCode` / `verifyPhoneCode` helpers are the client
 * entry points — they call our own Route Handlers (`/sms/send`, `/auth/verify`),
 * which in turn forward to the real backend (see those route files). Swapping in
 * a real backend therefore never touches the components.
 */

/** Mainland China mobile numbers: 11 digits starting 13–19. */
export const CN_PHONE_RE = /^1[3-9]\d{9}$/;

/** OTP codes are 6 digits. */
export const OTP_CODE_RE = /^\d{6}$/;

export function isValidPhone(phone: string): boolean {
  return CN_PHONE_RE.test(phone.trim());
}

export function isValidCode(code: string): boolean {
  return OTP_CODE_RE.test(code.trim());
}

export type SmsSendResult = { ok: boolean; error?: string };
export type VerifyResult = { ok: boolean; error?: string };

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { res, data };
}

/** Ask the backend to send an OTP to `phone`. */
export async function requestSmsCode(phone: string): Promise<SmsSendResult> {
  try {
    const { res, data } = await postJson("/sms/send", { phone });
    return { ok: res.ok, error: typeof data.error === "string" ? data.error : undefined };
  } catch {
    return { ok: false };
  }
}

/** Verify `phone` + `code`. On success the server sets the session cookie. */
export async function verifyPhoneCode(
  phone: string,
  code: string,
): Promise<VerifyResult> {
  try {
    const { res, data } = await postJson("/auth/verify", { phone, code });
    return { ok: res.ok, error: typeof data.error === "string" ? data.error : undefined };
  } catch {
    return { ok: false };
  }
}

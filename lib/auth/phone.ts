/**
 * Client entry points for phone-based auth.
 *
 * Pure validators here are shared by the login form. The network helpers call
 * our own BFF route handlers (`/api/auth/*`), which forward to the backend and
 * own the session cookie — so swapping backends never touches components.
 *
 * On failure they surface the backend's stable error key (see `ApiErrorKey`)
 * so the UI can localize it.
 */
import type { AuthUser } from "@/lib/api/types";

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

export type SmsResult = { ok: true } | { ok: false; error?: string };
export type AuthOutcome = { ok: true; user: AuthUser } | { ok: false; error?: string };

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { res, data };
}

function errorOf(data: Record<string, unknown>): string | undefined {
  return typeof data.error === "string" ? data.error : undefined;
}

/** Ask the backend to send an OTP to `phone`. */
export async function requestSmsCode(phone: string): Promise<SmsResult> {
  try {
    const { res, data } = await postJson("/api/auth/sms", { phone });
    return res.ok ? { ok: true } : { ok: false, error: errorOf(data) };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

/**
 * Register preflight: can this phone still register?
 * Does not send SMS. `phone_exists` means already registered.
 */
export async function checkPhoneForRegister(phone: string): Promise<SmsResult> {
  try {
    const res = await fetch(`/api/auth/phone-check?phone=${encodeURIComponent(phone.trim())}`, {
      method: "GET",
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return res.ok ? { ok: true } : { ok: false, error: errorOf(data) };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

/** Log an existing user in with phone + OTP. */
export async function loginWithCode(phone: string, code: string): Promise<AuthOutcome> {
  return submitAuth("/api/auth/login", { phone, code });
}

/** Register a brand-new user, minting `{snsName}` (must already include `.seedao`). */
export async function registerNewSns(
  phone: string,
  code: string,
  snsName: string,
): Promise<AuthOutcome> {
  return submitAuth("/api/auth/register", {
    phone,
    code,
    register_type: "new_sns",
    sns_name: snsName,
  });
}

export type ExistingSnsRegistration = {
  phone: string;
  code: string;
  wallet: string;
  walletType?: string;
  domain: string;
  message: string;
  signature: string;
};

/** Register a user who proved ownership of an on-chain SNS via a wallet signature. */
export async function registerExistingSns(input: ExistingSnsRegistration): Promise<AuthOutcome> {
  return submitAuth("/api/auth/register", {
    phone: input.phone,
    code: input.code,
    register_type: "existing_sns",
    wallet: input.wallet,
    wallet_type: input.walletType ?? "EOA",
    domain: input.domain,
    message: input.message,
    signature: input.signature,
  });
}

async function submitAuth(url: string, body: unknown): Promise<AuthOutcome> {
  try {
    const { res, data } = await postJson(url, body);
    if (!res.ok) return { ok: false, error: errorOf(data) };
    return { ok: true, user: data.user as AuthUser };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

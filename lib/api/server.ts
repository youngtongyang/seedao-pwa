import "server-only";

import { API_BASE, USE_MOCK, apiUrl } from "./config";
import {
  type ApiEnvelope,
  type ApiErrorKey,
  type AuthResult,
  ErrCode,
  type LoginRequest,
  type ProfileResult,
  type RegisterRequest,
  type SendSmsResult,
  type SnsCheckReason,
  type SnsCheckResult,
  type UserCountResult,
  type VerifySnsRequest,
  type VerifySnsResult,
  type WalletNonceRequest,
  type WalletNonceResult,
} from "./types";

/**
 * Server-only typed client for the SeeDAO API. Route handlers call the named
 * wrappers below; nothing here is importable from client components (the
 * `server-only` guard enforces it), so the bearer token never leaks to the bundle.
 *
 * Every call unwraps the `{code,message,data}` envelope into a discriminated
 * `ApiResult`. A `SEEDAO_USE_MOCK=1` branch returns canned data so the whole UI
 * is exercisable locally without real SMS or network access.
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: ApiErrorKey;
      /** HTTP status from the upstream (or a synthesized one). */
      status: number;
      /** Backend business code, when the envelope was parsed. */
      code?: number;
      message?: string;
    };

/** Map a backend business code to a stable client error key. */
function errorKeyForCode(code: number): ApiErrorKey {
  switch (code) {
    case ErrCode.INVALID_PARAM:
      return "invalid_param";
    case ErrCode.INVALID_SMS_CODE:
      return "invalid_code";
    case ErrCode.SNS_UNAVAILABLE:
      return "sns_unavailable";
    case ErrCode.WALLET_VERIFY_FAILED:
      return "wallet_verify_failed";
    case ErrCode.WALLET_NO_SNS:
      return "wallet_no_sns";
    case ErrCode.PHONE_ALREADY_EXISTS:
      return "phone_exists";
    case ErrCode.UNAUTHORIZED:
      return "unauthorized";
    case ErrCode.TOO_MANY_REQUESTS:
      return "rate_limited";
    case ErrCode.INTERNAL:
      return "internal";
    default:
      return "unknown_error";
  }
}

/**
 * Normalize a phone to E.164, which the backend requires (`^\+[1-9]\d{6,14}$`).
 * The UI collects an 11-digit mainland-China national number; prepend `+86`.
 * Numbers already in `+…` form pass through unchanged.
 */
function toE164(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  return `+86${trimmed.replace(/\D/g, "")}`;
}

type CallOptions = {
  method?: "GET" | "POST";
  query?: Record<string, string | undefined>;
  body?: unknown;
  /** Bearer token for authenticated endpoints. */
  token?: string;
};

async function call<T>(path: string, opts: CallOptions = {}): Promise<ApiResult<T>> {
  const { method = "GET", query, body, token } = opts;

  let url = apiUrl(path);
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v !== undefined) qs.set(k, v);
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "upstream_unreachable", status: 502 };
  }

  let env: ApiEnvelope<T> | null = null;
  try {
    env = (await res.json()) as ApiEnvelope<T>;
  } catch {
    env = null;
  }

  if (env && typeof env.code === "number") {
    if (env.code === ErrCode.OK) return { ok: true, data: env.data as T };
    return {
      ok: false,
      error: errorKeyForCode(env.code),
      status: res.status,
      code: env.code,
      message: env.message,
    };
  }

  // No parseable envelope — fall back to HTTP status.
  return {
    ok: false,
    error: res.status === 401 ? "unauthorized" : "upstream_unreachable",
    status: res.status || 502,
  };
}

// ── Named endpoint wrappers ───────────────────────────────────────────────────

export function smsSend(phone: string): Promise<ApiResult<SendSmsResult>> {
  if (USE_MOCK) return mock.smsSend();
  return call<SendSmsResult>("/auth/sms/send", { method: "POST", body: { phone: toE164(phone) } });
}

export function login(req: LoginRequest): Promise<ApiResult<AuthResult>> {
  if (USE_MOCK) return mock.login();
  return call<AuthResult>("/auth/login", { method: "POST", body: { ...req, phone: toE164(req.phone) } });
}

export function register(req: RegisterRequest): Promise<ApiResult<AuthResult>> {
  if (USE_MOCK) return mock.register(req);
  return call<AuthResult>("/auth/register", { method: "POST", body: { ...req, phone: toE164(req.phone) } });
}

export function snsCheck(snsName: string): Promise<ApiResult<SnsCheckResult>> {
  if (USE_MOCK) return mock.snsCheck(snsName);
  return call<SnsCheckResult>("/sns/check", { query: { sns_name: snsName } });
}

export function walletNonce(req: WalletNonceRequest): Promise<ApiResult<WalletNonceResult>> {
  if (USE_MOCK) return mock.walletNonce(req);
  return call<WalletNonceResult>("/wallet/nonce", { method: "POST", body: req });
}

export function walletVerifySns(req: VerifySnsRequest): Promise<ApiResult<VerifySnsResult>> {
  if (USE_MOCK) return mock.walletVerifySns(req);
  return call<VerifySnsResult>("/wallet/verify-sns", { method: "POST", body: req });
}

export function userProfile(token: string): Promise<ApiResult<ProfileResult>> {
  if (USE_MOCK) return mock.userProfile();
  return call<ProfileResult>("/user/profile", { token });
}

/** Live count of registered users. Public; the hero adds the seed base on top. */
export function userCount(): Promise<ApiResult<UserCountResult>> {
  if (USE_MOCK) return mock.userCount();
  return call<UserCountResult>("/stats/users");
}

export async function health(): Promise<ApiResult<{ status: string }>> {
  if (USE_MOCK) return { ok: true, data: { status: "ok" } };
  // /health sits at the root, outside the /v1 prefix, so it bypasses apiUrl().
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    const env = (await res.json().catch(() => null)) as ApiEnvelope<{ status: string }> | null;
    if (env && env.code === ErrCode.OK) return { ok: true, data: env.data as { status: string } };
    return { ok: false, error: "upstream_unreachable", status: res.status || 502 };
  } catch {
    return { ok: false, error: "upstream_unreachable", status: 502 };
  }
}

// ── Mock branch (SEEDAO_USE_MOCK=1) ───────────────────────────────────────────

const TAKEN_REGISTRY = new Set(["baiyu.seedao", "tanghan.seedao", "seedao.seedao"]);
const SNS_RE = /^[a-z0-9_]{3,20}\.seedao$/;

function mockAuthResult(snsName: string, source: string): AuthResult {
  return {
    token: "mock-session",
    token_exp: 4102444800, // 2100-01-01
    user: { id: 1001, sns_name: snsName, register_source: source },
  };
}

const mock = {
  smsSend(): Promise<ApiResult<SendSmsResult>> {
    return Promise.resolve({ ok: true, data: { retry_after: 60 } });
  },
  login(): Promise<ApiResult<AuthResult>> {
    return Promise.resolve({ ok: true, data: mockAuthResult("demo.seedao", "new_sns") });
  },
  register(req: RegisterRequest): Promise<ApiResult<AuthResult>> {
    const name = req.register_type === "new_sns" ? req.sns_name : "tanghan.seedao";
    return Promise.resolve({ ok: true, data: mockAuthResult(name, req.register_type) });
  },
  snsCheck(snsName: string): Promise<ApiResult<SnsCheckResult>> {
    const name = snsName.trim().toLowerCase();
    let reason: SnsCheckReason | undefined;
    if (!SNS_RE.test(name)) reason = "invalid_format";
    else if (TAKEN_REGISTRY.has(name)) reason = "taken_in_registry";
    return Promise.resolve({
      ok: true,
      data: { sns_name: name, available: reason === undefined, reason },
    });
  },
  walletNonce(req: WalletNonceRequest): Promise<ApiResult<WalletNonceResult>> {
    const nonce = "mocknonce0000";
    const message = `${req.domain} wants you to sign in with your Ethereum account:\n${req.wallet}\n\nNonce: ${nonce}`;
    return Promise.resolve({
      ok: true,
      data: { nonce, message, expires_at: 4102444800 },
    });
  },
  walletVerifySns(req: VerifySnsRequest): Promise<ApiResult<VerifySnsResult>> {
    return Promise.resolve({
      ok: true,
      data: { wallet: req.wallet.toLowerCase(), sns_name: "tanghan.seedao", claimable: true },
    });
  },
  userProfile(): Promise<ApiResult<ProfileResult>> {
    return Promise.resolve({
      ok: true,
      data: {
        id: 1001,
        sns_name: "demo.seedao",
        phone: "+86138****8000",
        register_source: "new_sns",
        avatar: "",
        bio: "",
        created_at: "2026-06-15T08:00:00Z",
      },
    });
  },
  userCount(): Promise<ApiResult<UserCountResult>> {
    return Promise.resolve({ ok: true, data: { count: 248 } });
  },
};

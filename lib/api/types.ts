/**
 * Wire types for the SeeDAO API server (`https://api.seedao.xyz`, all routes
 * under `/v1`). These mirror the Go DTOs 1:1 so they are the single place to
 * change when the backend contract changes — see `seedao-api-server`
 * `internal/service/*` and `internal/pkg/response`.
 *
 * Field names are snake_case to match the JSON the backend emits verbatim; we
 * keep them as-is rather than camel-casing so there is exactly one shape to
 * reason about end to end.
 */

/** Uniform response envelope returned by every endpoint. */
export type ApiEnvelope<T> = {
  code: number;
  message: string;
  detail?: string;
  data?: T;
};

/** Backend error codes (see `internal/pkg/errcode`). `0` is success. */
export const ErrCode = {
  OK: 0,
  INVALID_PARAM: 40001,
  INVALID_SMS_CODE: 40002,
  SNS_UNAVAILABLE: 40003,
  WALLET_VERIFY_FAILED: 40004,
  WALLET_NO_SNS: 40005,
  PHONE_ALREADY_EXISTS: 40006,
  /** Payment order not found, or not owned by the caller. */
  PAYMENT_ORDER_NOT_FOUND: 40007,
  /** Payment order is in a state that forbids the requested action. */
  PAYMENT_ORDER_INVALID_STATE: 40008,
  /** Login attempted with a phone that has no account yet. */
  PHONE_NOT_REGISTERED: 40009,
  /** Course not found. */
  COURSE_NOT_FOUND: 40014,
  /** Course SKU is not on sale. */
  COURSE_SKU_NOT_ON_SALE: 40015,
  /** Member discount requires login. */
  COURSE_MEMBER_LOGIN_REQUIRED: 40016,
  /** Order token missing for anonymous order query. */
  COURSE_ORDER_TOKEN_REQUIRED: 40017,
  /** Order token invalid. */
  COURSE_ORDER_TOKEN_INVALID: 40018,
  /** Order already claimed by another user. */
  COURSE_ORDER_ALREADY_CLAIMED: 40019,
  /** Vote not found for this proposal (user has not voted yet). */
  PROPOSAL_VOTE_NOT_FOUND: 40027,
  /** Proposal status does not allow this action (e.g. comment on draft). */
  PROPOSAL_STATUS_INVALID: 40022,
  /** Feishu binding not found for this user. */
  FEISHU_NOT_BOUND: 40040,
  /** Current user already has an active Feishu binding. */
  FEISHU_ALREADY_BOUND: 40041,
  /** This Feishu open_id is bound to another SeeDAO user. */
  FEISHU_OPEN_ID_TAKEN: 40042,
  /** bind_token / bind_code missing, invalid, or expired. */
  FEISHU_BIND_CREDENTIAL_INVALID: 40043,
  UNAUTHORIZED: 40100,
  TOO_MANY_REQUESTS: 42901,
  INTERNAL: 50000,
} as const;

export type ErrCodeValue = (typeof ErrCode)[keyof typeof ErrCode];

/**
 * Stable, transport-agnostic error keys handed to the client so the UI can
 * localize without hard-coding numeric codes. `unknown_error` is the fallback.
 */
export type ApiErrorKey =
  | "invalid_param"
  | "invalid_code"
  | "sns_unavailable"
  | "wallet_verify_failed"
  | "wallet_no_sns"
  | "phone_exists"
  | "phone_not_registered"
  | "payment_order_not_found"
  | "payment_order_invalid_state"
  | "course_not_found"
  | "course_sku_not_on_sale"
  | "course_member_login_required"
  | "feishu_not_bound"
  | "feishu_already_bound"
  | "feishu_open_id_taken"
  | "feishu_bind_credential_invalid"
  | "unauthorized"
  | "rate_limited"
  | "internal"
  | "upstream_unreachable"
  | "unknown_error";

// ── Auth ────────────────────────────────────────────────────────────────────

export type RegisterSource = "new_sns" | "existing_sns";

/** Membership tier after payment / review (API preview). */
export type MembershipTier = "none" | "pending" | "full";

/** Membership application workflow status. */
export type ApplicationStatus = "not_submitted" | "under_review" | "approved";

export type AuthUser = {
  id: number;
  sns_name: string;
  register_source: RegisterSource | string;
  /**
   * Membership expiry (RFC3339 UTC, e.g. `2027-06-15T08:00:00Z`), or null when
   * the user has never held membership. Added in API v2.5.
   */
  membership_expires_at?: string | null;
  membership_tier?: MembershipTier | string | null;
  application_status?: ApplicationStatus | string | null;
  application_submitted_at?: string | null;
  application_form_url?: string | null;
};

/** Returned by both login and register. */
export type AuthResult = {
  token: string;
  token_exp: number;
  user: AuthUser;
};

export type SendSmsRequest = { phone: string };
export type SendSmsResult = { retry_after: number };

export type LoginRequest = { phone: string; code: string };

export type RegisterNewSnsRequest = {
  phone: string;
  code: string;
  register_type: "new_sns";
  sns_name: string;
};

export type RegisterExistingSnsRequest = {
  phone: string;
  code: string;
  register_type: "existing_sns";
  wallet: string;
  wallet_type: string;
  domain: string;
  message: string;
  signature: string;
};

export type RegisterRequest = RegisterNewSnsRequest | RegisterExistingSnsRequest;

// ── SNS ─────────────────────────────────────────────────────────────────────

/** Why a name is unavailable (see `internal/pkg/snsutil`). */
export type SnsCheckReason =
  | "invalid_format"
  | "taken_in_app"
  | "taken_in_registry"
  | "reserved_word";

export type SnsCheckResult = {
  sns_name: string;
  available: boolean;
  reason?: SnsCheckReason;
};

/** Reverse lookup: wallet address → registered SNS (`GET /v1/sns/by-wallet`). */
export type SnsByWalletResult = {
  wallet: string;
  sns_name: string;
};

// ── Wallet (SIWE) ─────────────────────────────────────────────────────────────

export type WalletNonceRequest = { wallet: string; domain: string };

export type WalletNonceResult = {
  nonce: string;
  /** The full SIWE message the wallet must sign, built server-side. */
  message: string;
  expires_at: number;
};

export type VerifySnsRequest = {
  wallet: string;
  wallet_type: string;
  domain: string;
  message: string;
  signature: string;
};

export type VerifySnsResult = {
  wallet: string;
  sns_name: string;
  claimable: boolean;
};

// ── Stats ─────────────────────────────────────────────────────────────────────

/** Live count of registered users (`GET /v1/stats/user-count`). Public, no auth. */
export type UserCountResult = { total_user_count: number };

// ── Profile ───────────────────────────────────────────────────────────────────

/** Read-only profile (`GET /v1/user/profile`). Phone is masked server-side. */
export type ProfileResult = {
  id: number;
  sns_name: string;
  phone: string;
  register_source: RegisterSource | string;
  avatar: string;
  bio: string;
  /**
   * Membership expiry (RFC3339 UTC), or null when the user has never held
   * membership. Added in API v2.5.
   */
  membership_expires_at?: string | null;
  membership_tier?: MembershipTier | string | null;
  application_status?: ApplicationStatus | string | null;
  application_submitted_at?: string | null;
  /** External form URL; omit / empty → do not render a link. */
  application_form_url?: string | null;
  /** RFC3339 UTC, e.g. `2026-06-15T08:00:00Z`. */
  created_at: string;
};

/** `POST /v1/user/application/submit` — mark application as submitted. */
export type ApplicationSubmitResult = ProfileResult;

// ── OAuth / Feishu bindings ───────────────────────────────────────────────────

export type OAuthProvider = "feishu";

export type FeishuBindSource = "bot_token" | "bot_code" | string;

/** One provider row from `GET /v1/user/bindings`. */
export type BindingItem = {
  provider: OAuthProvider | string;
  bound: boolean;
  display_name?: string;
  bound_at?: string;
  bind_source?: FeishuBindSource;
};

export type BindingListResult = {
  items: BindingItem[];
};

/** Shared shape for bind / unbind Feishu responses. */
export type FeishuBindResult = {
  provider: OAuthProvider | string;
  bound: boolean;
  display_name?: string;
  bind_source?: FeishuBindSource;
};

export type FeishuChallengeResult = {
  bind_code: string;
  expires_in: number;
  instruction: string;
};

export type BindFeishuTokenRequest = {
  bind_token: string;
};

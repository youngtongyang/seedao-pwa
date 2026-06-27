import type { CouponPreviewResult, CreateOrderInput, PayChannel, PaymentOrder, PaymentStatus } from "./types";

/**
 * Client entry points for the membership-renewal payment flow. These call our
 * own BFF routes (`/api/payment/*`), which attach the session token and forward
 * to the backend — so the JWT never touches the client and swapping payment
 * backends never touches components.
 *
 * The caller must already be signed in (registration mints the session); these
 * renew *their* membership.
 */

export type CreateOrderOutcome =
  | { ok: true; order: PaymentOrder }
  | { ok: false; error?: string };

/** Status the client acts on; `membershipExpiresAt` is present once `paid`. */
export type PollOutcome =
  | { ok: true; status: PaymentStatus; membershipExpiresAt?: string | null }
  | { ok: false; error?: string };

function errorOf(data: Record<string, unknown>): string | undefined {
  return typeof data.error === "string" ? data.error : undefined;
}

/**
 * Pick the WeChat pay channel. We always use `wechat_native` and render its
 * `code_url` as a QR — on desktop it's scanned with a phone, and on a phone it's
 * long-pressed ("识别图中二维码") to pay in WeChat on the same device.
 *
 * We deliberately do *not* use `wechat_h5` for phones: order creation with
 * `pay_channel: "wechat_h5"` fails against the backend (H5 pay isn't enabled for
 * the merchant), which surfaced as "couldn't start the payment" on mobile/PWA
 * while desktop's native order worked. Routing phones through native too makes
 * the create request identical to the one desktop already succeeds with. The H5
 * path in `join-flow` is left intact, so re-enabling it is just this one line
 * once the backend supports H5 orders.
 */
export function pickPayChannel(): PayChannel {
  return "wechat_native";
}

/**
 * The H5 flow redirects out to WeChat, so we stash the open order in
 * sessionStorage (same-tab, auto-cleared) to resume polling when WeChat sends
 * the user back to our origin.
 */
const PENDING_KEY = "seedao.pending_pay";
export type PendingOrder = { order_no: string; sns_name: string };

export function savePendingOrder(orderNo: string, snsName: string): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ order_no: orderNo, sns_name: snsName }));
  } catch {
    /* storage unavailable — resume just won't kick in */
  }
}

export function readPendingOrder(): PendingOrder | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PendingOrder>;
    if (p && typeof p.order_no === "string") {
      return { order_no: p.order_no, sns_name: typeof p.sns_name === "string" ? p.sns_name : "" };
    }
  } catch {
    /* malformed — treat as no pending order */
  }
  return null;
}

export function clearPendingOrder(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/** Open a WeChat renewal order; returns the QR (`code_url`) / redirect (`h5_url`) to show. */
export async function createPaymentOrder(input: CreateOrderInput = {}): Promise<CreateOrderOutcome> {
  try {
    const res = await fetch("/api/payment/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data) };
    return { ok: true, order: data as unknown as PaymentOrder };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

/**
 * Poll one order by its `order_no`. The backend records WeChat's notify (with the
 * query API as a fallback) and maps the state for us; once `paid` it returns the
 * new `membership_expires_at`.
 */
export async function pollPaymentStatus(orderNo: string): Promise<PollOutcome> {
  try {
    const res = await fetch(`/api/payment/status?order_no=${encodeURIComponent(orderNo)}`, {
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data) };
    return {
      ok: true,
      status: data.status as PaymentStatus,
      membershipExpiresAt: data.membership_expires_at as string | null | undefined,
    };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

export type CouponPreviewOutcome =
  | { ok: true; data: CouponPreviewResult }
  | { ok: false; error?: string };

const COUPON_PREVIEW_URL = "https://api.seedao.xyz/v1/payments/coupons/preview";

/**
 * 优惠券码试算 — 直调后端，不走 BFF 代理。
 * JWT 可选：登录用户通过 credentials: 'include' 自动带 cookie。
 */
export async function previewCouponCode(
  couponCode: string,
): Promise<CouponPreviewOutcome> {
  try {
    const res = await fetch(COUPON_PREVIEW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coupon_code: couponCode }),
      credentials: "include",
    });
    const env = (await res.json().catch(() => ({}))) as { code?: number; data?: CouponPreviewResult };
    if (env.code === 0 && env.data) {
      return { ok: true, data: env.data };
    }
    return { ok: false, error: "invalid_param" };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

/** Close an unpaid order (e.g. when the user backs out or the code expired). */
export async function closePaymentOrder(orderNo: string): Promise<{ ok: boolean }> {
  try {
    const res = await fetch("/api/payment/order/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_no: orderNo }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

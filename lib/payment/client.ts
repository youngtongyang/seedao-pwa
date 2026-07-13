import type { CreateOrderInput, H5PayChannel, PayChannel, PaymentOrder, PaymentStatus } from "./types";
import { isH5PayChannel } from "./types";

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

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Temporary UI flags — flip to re-expose hidden pay methods.
 * Mobile: Alipay H5 only (WeChat H5 hidden). Desktop: WeChat Native only.
 */
export const PAY_CHANNEL_UI = {
  wechatH5OnMobile: false,
  alipayOnDesktop: false,
} as const;

/** Default pay channel for the current device. */
export function defaultPayChannel(): PayChannel {
  if (typeof navigator === "undefined") return "wechat_native";
  return isMobileDevice() ? "alipay_h5" : "wechat_native";
}

/** Channels to show on the pay picker; one entry → callers may skip the picker. */
export function availablePayChannels(mobile = isMobileDevice()): PayChannel[] {
  if (mobile) {
    const channels: PayChannel[] = [];
    if (PAY_CHANNEL_UI.wechatH5OnMobile) channels.push("wechat_h5");
    channels.push("alipay_h5");
    return channels;
  }
  const channels: PayChannel[] = ["wechat_native"];
  if (PAY_CHANNEL_UI.alipayOnDesktop) channels.push("alipay_h5");
  return channels;
}

/** Course checkout: WeChat only (Native QR on desktop, H5 redirect on mobile). */
export function courseDefaultPayChannel(): PayChannel {
  if (typeof navigator === "undefined") return "wechat_native";
  return isMobileDevice() ? "wechat_h5" : "wechat_native";
}

export function courseAvailablePayChannels(mobile = isMobileDevice()): PayChannel[] {
  return [mobile ? "wechat_h5" : "wechat_native"];
}

/**
 * @deprecated Use {@link defaultPayChannel} — kept for any legacy call sites.
 */
export function pickPayChannel(): PayChannel {
  return defaultPayChannel();
}

export { isH5PayChannel };
export type { H5PayChannel };

/** Open an H5 pay page in a new context; fall back to same-tab navigation if blocked. */
export function openPaymentRedirect(url: string): void {
  const win = window.open(url, "_blank");
  if (!win) window.location.href = url;
}

/**
 * Same-tab navigation to the H5 pay URL. Use right after async order creation
 * (a deferred window.open would be popup-blocked). The return_url should land
 * on `/pay/return` or `/?join=1#membership` so sessionStorage resume kicks in.
 */
export function navigateToPayment(url: string): void {
  window.location.href = url;
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
 * Find the caller's still-live renewal order, if any — the basis for resuming a
 * payment when the local trail is gone (an H5 payer whose WeChat return landed in
 * a different browser context loses the stashed `order_no`, but the session
 * cookie still identifies them). We take the order whose `expired_at` is still in
 * the future: only the current in-flight order qualifies, so a `paid` one here
 * means "just paid, go to profile" and a `pending` one means "keep paying" —
 * while old paid renewals from past years are excluded, so we never create a
 * duplicate order or falsely report an already-paid membership.
 */
export async function findInFlightOrder(): Promise<
  { ok: true; order: PaymentOrder | null } | { ok: false; error?: string }
> {
  try {
    const res = await fetch("/api/payment/orders?limit=5", { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { orders?: unknown };
    if (!res.ok) return { ok: false, error: errorOf(data as Record<string, unknown>) };
    const orders = Array.isArray(data.orders) ? (data.orders as PaymentOrder[]) : [];
    const now = Date.now();
    const live = orders
      .filter((o): o is PaymentOrder & { expired_at: string } => {
        return typeof o.expired_at === "string" && Date.parse(o.expired_at) > now;
      })
      .sort((a, b) => Date.parse(b.expired_at) - Date.parse(a.expired_at));
    return { ok: true, order: live[0] ?? null };
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

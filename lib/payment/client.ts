import type { CreateOrderInput, PayChannel, PaymentOrder, PaymentStatus } from "./types";

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
 * Pick the WeChat sub-channel by device: phones get `wechat_h5` (redirect into
 * the WeChat app, since scanning your own screen doesn't work), desktops get
 * `wechat_native` (a QR to scan with a second device). Mirrors the test-doc
 * snippet. Defaults to native off the client (SSR).
 */
export function pickPayChannel(): PayChannel {
  if (typeof navigator === "undefined") return "wechat_native";
  return /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "wechat_h5" : "wechat_native";
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

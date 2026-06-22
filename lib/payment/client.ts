import type { AuthUser } from "@/lib/api/types";
import type { PaymentOrder, PaymentStatus } from "./types";

/**
 * Client entry points for the membership payment flow. These call our own BFF
 * routes (`/api/payment/*`), which forward to the backend and own the session
 * cookie — so swapping payment backends never touches components.
 */

export type CreateOrderOutcome =
  | { ok: true; order: PaymentOrder }
  | { ok: false; error?: string };

/** Status the client acts on; `user` is present only once `paid`. */
export type PollOutcome =
  | { ok: true; status: PaymentStatus; user?: AuthUser }
  | { ok: false; error?: string };

function errorOf(data: Record<string, unknown>): string | undefined {
  return typeof data.error === "string" ? data.error : undefined;
}

/** Reserve `snsName` and open a WeChat Native order; returns the QR to show. */
export async function createPaymentOrder(snsName: string): Promise<CreateOrderOutcome> {
  try {
    const res = await fetch("/api/payment/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sns_name: snsName }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data) };
    return { ok: true, order: data as unknown as PaymentOrder };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

/**
 * Poll one order by its `out_trade_no`. When the backend reports `paid` it has
 * already established the session cookie on this response, so the caller only
 * needs to redirect.
 */
export async function pollPaymentStatus(outTradeNo: string): Promise<PollOutcome> {
  try {
    const res = await fetch(`/api/payment/status?out_trade_no=${encodeURIComponent(outTradeNo)}`, {
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data) };
    return { ok: true, status: data.status as PaymentStatus, user: data.user as AuthUser | undefined };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

import type { CheckoutPreviewInput, CheckoutPreviewResult, CourseOrder, CourseOrderStatus, CreateCourseOrderInput } from "./types";

export type PreviewOutcome =
  | { ok: true; data: CheckoutPreviewResult }
  | { ok: false; error?: string };

export type OrderOutcome =
  | { ok: true; data: CourseOrder }
  | { ok: false; error?: string };

export type StatusOutcome =
  | { ok: true; data: CourseOrderStatus }
  | { ok: false; error?: string };

function errorOf(data: Record<string, unknown>): string | undefined {
  return typeof data.error === "string" ? data.error : undefined;
}

/** 课程价格试算 — BFF → 后端 /v1/courses/checkout/preview */
export async function previewCheckout(input: CheckoutPreviewInput): Promise<PreviewOutcome> {
  try {
    const res = await fetch("/api/course/checkout-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data) };
    return { ok: true, data: data as unknown as CheckoutPreviewResult };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

/** 创建课程订单 — BFF → 后端 /v1/courses/orders */
export async function createCourseOrder(input: CreateCourseOrderInput): Promise<OrderOutcome> {
  try {
    const res = await fetch("/api/course/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data) };
    const order = data as unknown as CourseOrder;
    // order_token 只出现一次，持久化到 sessionStorage
    if (order.order_token) saveOrderToken(order.order_no, order.order_token);
    return { ok: true, data: order };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

/** 查询课程订单 — JWT 或 order_token */
export async function queryCourseOrder(orderNo: string, orderToken?: string): Promise<StatusOutcome> {
  try {
    const token = orderToken ?? readOrderToken(orderNo);
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    const res = await fetch(`/api/course/orders/${encodeURIComponent(orderNo)}?${params}`, {
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data) };
    return { ok: true, data: data as unknown as CourseOrderStatus };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

/** 关闭未支付课程订单 — JWT 或 order_token；用户取消支付时尽力而为地调用 */
export async function closeCourseOrder(orderNo: string, orderToken?: string): Promise<StatusOutcome> {
  try {
    const token = orderToken ?? readOrderToken(orderNo);
    const res = await fetch(`/api/course/orders/${encodeURIComponent(orderNo)}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(token ? { order_token: token } : {}),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data) };
    return { ok: true, data: data as unknown as CourseOrderStatus };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

/** 认领无主订单 — 登录后绑定到当前账号 */
export async function claimCourseOrder(orderNo: string, orderToken: string): Promise<StatusOutcome> {
  try {
    const res = await fetch("/api/course/orders/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_no: orderNo, order_token: orderToken }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data) };
    return { ok: true, data: data as unknown as CourseOrderStatus };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

// ── order_token 本地持久化 ────────────────────────────────────────────────────

const TOKEN_PREFIX = "seedao.course_token.";

function saveOrderToken(orderNo: string, token: string): void {
  try { sessionStorage.setItem(`${TOKEN_PREFIX}${orderNo}`, token); } catch { /* ignore */ }
}

function readOrderToken(orderNo: string): string | undefined {
  try { return sessionStorage.getItem(`${TOKEN_PREFIX}${orderNo}`) ?? undefined; } catch { return undefined; }
}

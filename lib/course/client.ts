import { apiFetch } from "@/lib/auth/api-fetch";
import type {
  BookmarkListResult,
  BookmarkMutationResult,
  CheckoutPreviewInput,
  CheckoutPreviewResult,
  CourseOrder,
  CourseOrderListResult,
  CourseOrderStatus,
  CreateCourseOrderInput,
} from "./types";

export type PreviewOutcome =
  | { ok: true; data: CheckoutPreviewResult }
  | { ok: false; error?: string };

export type OrderOutcome =
  | { ok: true; data: CourseOrder }
  | { ok: false; error?: string };

export type StatusOutcome =
  | { ok: true; data: CourseOrderStatus }
  | { ok: false; error?: string };

// 失败分支带 HTTP status：httpOnly 会话 Cookie 客户端不可读，
// 调用方只能靠「先请求、看是否 401」来区分未登录与其他失败
export type BookmarkListOutcome =
  | { ok: true; data: BookmarkListResult }
  | { ok: false; error?: string; status?: number };

export type BookmarkMutationOutcome =
  | { ok: true; data: BookmarkMutationResult }
  | { ok: false; error?: string; status?: number };

export type OrderListOutcome =
  | { ok: true; data: CourseOrderListResult }
  | { ok: false; error?: string; status?: number };

function errorOf(data: Record<string, unknown>): string | undefined {
  return typeof data.error === "string" ? data.error : undefined;
}

/** 课程价格试算 — BFF → 后端 /v1/courses/checkout/preview */
export async function previewCheckout(input: CheckoutPreviewInput): Promise<PreviewOutcome> {
  try {
    const res = await apiFetch("/api/course/checkout-preview", {
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
    const res = await apiFetch("/api/course/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data) };
    const order = data as unknown as CourseOrder;
    // order_token 只出现一次，持久化到 sessionStorage
    if (order.order_token) saveOrderToken(order.order_no, order.order_token);
    // 记录课程 → 订单号映射，供报名态兜底（匿名订单 claim 前不在列表中）
    saveCourseOrderNo(input.course_id, order.order_no);
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
    const res = await apiFetch(`/api/course/orders/${encodeURIComponent(orderNo)}?${params}`, {
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
    const res = await apiFetch(`/api/course/orders/${encodeURIComponent(orderNo)}/close`, {
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
    const res = await apiFetch("/api/course/orders/claim", {
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

// ── 收藏（后端待建 · 当前仅 mock 可用）────────────────────────────────────────

/** 我的收藏 — 401 表示当前浏览器没有会话（未注册/未登录） */
export async function listBookmarks(): Promise<BookmarkListOutcome> {
  try {
    const res = await apiFetch("/api/course/bookmarks", { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data), status: res.status };
    return { ok: true, data: data as unknown as BookmarkListResult };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

/** 收藏课程（幂等） */
export async function addBookmark(courseId: string): Promise<BookmarkMutationOutcome> {
  try {
    const res = await apiFetch(`/api/course/bookmarks/${encodeURIComponent(courseId)}`, {
      method: "PUT",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data), status: res.status };
    return { ok: true, data: data as unknown as BookmarkMutationResult };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

/** 取消收藏（幂等） */
export async function removeBookmark(courseId: string): Promise<BookmarkMutationOutcome> {
  try {
    const res = await apiFetch(`/api/course/bookmarks/${encodeURIComponent(courseId)}`, {
      method: "DELETE",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data), status: res.status };
    return { ok: true, data: data as unknown as BookmarkMutationResult };
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }
}

// ── 我的课程订单列表（后端待建 · 当前仅 mock 可用）─────────────────────────────

/** 我的课程订单 — 无主订单 claim 后才出现；401 表示没有会话 */
export async function listCourseOrders(): Promise<OrderListOutcome> {
  try {
    const res = await apiFetch("/api/course/orders", { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: errorOf(data), status: res.status };
    return { ok: true, data: data as unknown as CourseOrderListResult };
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

// ── 课程 → 订单号映射（会话内报名态兜底）──────────────────────────────────────

const ORDER_NO_PREFIX = "seedao.course_order.";

function saveCourseOrderNo(courseId: string, orderNo: string): void {
  try { sessionStorage.setItem(`${ORDER_NO_PREFIX}${courseId}`, orderNo); } catch { /* ignore */ }
}

/** 本标签页会话内最近一次为该课程创建的订单号 */
export function readCourseOrderNo(courseId: string): string | undefined {
  try { return sessionStorage.getItem(`${ORDER_NO_PREFIX}${courseId}`) ?? undefined; } catch { return undefined; }
}

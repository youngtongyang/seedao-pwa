import "server-only";

import { type ApiResult, call } from "@/lib/api/server";
import { USE_MOCK } from "@/lib/api/config";
import {
  appendMockOrder,
  readMockBookmarks,
  readMockOrders,
  updateMockOrder,
  writeMockBookmarks,
  type MockOrderRec,
} from "./mock-state";
import type {
  BookmarkListResult,
  BookmarkMutationResult,
  CheckoutPreviewInput,
  CheckoutPreviewResult,
  ClaimOrderInput,
  CourseOrder,
  CourseOrderListItem,
  CourseOrderListResult,
  CourseOrderStatus,
  CreateCourseOrderInput,
} from "./types";
import { isH5PayChannel } from "@/lib/payment/types";

/** `POST /v1/courses/checkout/preview` — 课程价格试算，JWT 可选。 */
export function previewCheckout(
  input: CheckoutPreviewInput,
  token?: string,
): Promise<ApiResult<CheckoutPreviewResult>> {
  if (USE_MOCK) return mock.previewCheckout(input, token);
  return call<CheckoutPreviewResult>("/courses/checkout/preview", {
    method: "POST",
    token,
    body: input,
  });
}

/** `POST /v1/courses/orders` — 创建课程订单，JWT 条件必填。 */
export function createCourseOrder(
  input: CreateCourseOrderInput,
  token?: string,
): Promise<ApiResult<CourseOrder>> {
  if (USE_MOCK) return mock.createCourseOrder(input, token);
  return call<CourseOrder>("/courses/orders", {
    method: "POST",
    token,
    body: input,
  });
}

/** `GET /v1/courses/orders/:order_no` — 查询课程订单。JWT 或 order_token。 */
export function queryCourseOrder(
  orderNo: string,
  token?: string,
  orderToken?: string,
): Promise<ApiResult<CourseOrderStatus>> {
  if (USE_MOCK) return mock.queryCourseOrder(orderNo);
  return call<CourseOrderStatus>(`/courses/orders/${encodeURIComponent(orderNo)}`, {
    token,
    query: orderToken ? { token: orderToken } : undefined,
  });
}

/** `POST /v1/courses/orders/:order_no/close` — 关闭未支付订单。 */
export function closeCourseOrder(
  orderNo: string,
  token?: string,
  orderToken?: string,
): Promise<ApiResult<CourseOrderStatus>> {
  if (USE_MOCK) return mock.closeCourseOrder(orderNo);
  return call<CourseOrderStatus>(`/courses/orders/${encodeURIComponent(orderNo)}/close`, {
    method: "POST",
    token,
    body: orderToken ? { order_token: orderToken } : undefined,
  });
}

/** `POST /v1/courses/orders/claim` — 认领无主订单，JWT 必填。 */
export function claimCourseOrder(
  input: ClaimOrderInput,
  token: string,
): Promise<ApiResult<CourseOrderStatus>> {
  if (USE_MOCK) return mock.claimCourseOrder(input);
  return call<CourseOrderStatus>("/courses/orders/claim", {
    method: "POST",
    token,
    body: input,
  });
}

// ── 收藏与订单列表（后端待建 · 规格见 docs/api-reference.md；当前仅 mock 可用）──

/** `GET /v1/courses/bookmarks` — 我的收藏，JWT 必填。 */
export function listBookmarks(token: string): Promise<ApiResult<BookmarkListResult>> {
  if (USE_MOCK) return mock.listBookmarks();
  return call<BookmarkListResult>("/courses/bookmarks", { token });
}

/** `PUT /v1/courses/bookmarks/:course_id` — 收藏（幂等），JWT 必填。 */
export function addBookmark(
  courseId: string,
  token: string,
): Promise<ApiResult<BookmarkMutationResult>> {
  if (USE_MOCK) return mock.addBookmark(courseId);
  return call<BookmarkMutationResult>(`/courses/bookmarks/${encodeURIComponent(courseId)}`, {
    method: "PUT",
    token,
  });
}

/** `DELETE /v1/courses/bookmarks/:course_id` — 取消收藏（幂等），JWT 必填。 */
export function removeBookmark(
  courseId: string,
  token: string,
): Promise<ApiResult<BookmarkMutationResult>> {
  if (USE_MOCK) return mock.removeBookmark(courseId);
  return call<BookmarkMutationResult>(`/courses/bookmarks/${encodeURIComponent(courseId)}`, {
    method: "DELETE",
    token,
  });
}

/** `GET /v1/courses/orders` — 我的课程订单列表，JWT 必填；无主订单 claim 后才出现。 */
export function listCourseOrders(
  token: string,
  opts?: { status?: string; limit?: number },
): Promise<ApiResult<CourseOrderListResult>> {
  if (USE_MOCK) return mock.listCourseOrders(opts);
  return call<CourseOrderListResult>("/courses/orders", {
    token,
    query: {
      status: opts?.status,
      limit: opts?.limit !== undefined ? String(opts.limit) : undefined,
    },
  });
}

// ── Mock ───────────────────────────────────────────────────────────────────────

const MOCK_COURSE_ID = "course_2026_spring";
const MOCK_ORIGINAL_CENTS = 59900; // ¥599
const MOCK_EARLY_BIRD_CENTS = 30000; // ¥300 off → ¥299
const MOCK_CHANNEL_CENTS = 2000; // ¥20 off (channel code deduction)
const MOCK_MEMBER_CENTS = 5980; // 299 * 0.2 ≈ 59.80 → round to 5980分
const PAY_AFTER_MS = 6000;

const mock = {
  previewCheckout(
    input: CheckoutPreviewInput,
    token?: string,
  ): Promise<ApiResult<CheckoutPreviewResult>> {
    if (input.course_id !== MOCK_COURSE_ID) {
      return Promise.resolve({ ok: false, error: "course_not_found", status: 404, code: 40014 });
    }

    const hasChannel = !!input.channel_code?.trim();
    const discounts: CheckoutPreviewResult["discounts"] = [
      { type: "early_bird", label: "早鸟价", amount: MOCK_EARLY_BIRD_CENTS, applied: true },
    ];
    let final = MOCK_ORIGINAL_CENTS - MOCK_EARLY_BIRD_CENTS;

    if (hasChannel) {
      discounts.push({
        type: "channel",
        label: `渠道 ${input.channel_code}`,
        amount: MOCK_CHANNEL_CENTS,
        applied: true,
      });
      final -= MOCK_CHANNEL_CENTS;
    }

    const memberPrice = final - MOCK_MEMBER_CENTS > 0 ? final - MOCK_MEMBER_CENTS : 0;
    const isMember = !!token; // mock: 有 token 即视为会员

    return Promise.resolve({
      ok: true,
      data: {
        course_id: input.course_id,
        sku_id: input.sku_id,
        original_amount: MOCK_ORIGINAL_CENTS,
        discounts,
        final_amount: isMember && input.apply_member_discount ? memberPrice : final,
        amount_if_member: memberPrice,
        member_discount: {
          amount: MOCK_MEMBER_CENTS,
          applied: isMember && !!input.apply_member_discount,
          requires_login: !isMember,
          hint: isMember ? "" : "会员价更优惠，登录后可享",
        },
        currency: "CNY",
      },
    });
  },

  async createCourseOrder(
    input: CreateCourseOrderInput,
    token?: string,
  ): Promise<ApiResult<CourseOrder>> {
    const orderNo = `C${Date.now()}mock`;
    const amount =
      MOCK_ORIGINAL_CENTS - MOCK_EARLY_BIRD_CENTS - (input.channel_code ? MOCK_CHANNEL_CENTS : 0);
    // 记入 Cookie：带 JWT 创建的订单立即归属当前用户，无主订单待 claim
    await appendMockOrder({
      n: orderNo,
      c: input.course_id,
      s: input.sku_id,
      a: amount,
      o: !!token,
    });
    const channel = input.pay_channel ?? "wechat_native";
    const order: CourseOrder = {
      order_no: orderNo,
      order_token: `ot_mock_${orderNo}`,
      product_type: "course_purchase",
      course_id: input.course_id,
      sku_id: input.sku_id,
      original_amount: MOCK_ORIGINAL_CENTS,
      discount_amount: MOCK_EARLY_BIRD_CENTS + (input.channel_code ? MOCK_CHANNEL_CENTS : 0),
      amount,
      status: "pending",
      expired_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
    if (isH5PayChannel(channel)) {
      if (channel === "alipay_h5") order.pay_url = `https://openapi.alipay.com/MOCK/${orderNo}`;
      else order.h5_url = `https://wx.tenpay.com/MOCK/${orderNo}`;
    } else {
      order.code_url = `weixin://wxpay/bizpayurl?pr=MOCK${orderNo}`;
    }
    return { ok: true, data: order };
  },

  async queryCourseOrder(orderNo: string): Promise<ApiResult<CourseOrderStatus>> {
    const rec = (await readMockOrders()).find((r) => r.n === orderNo);
    const status = mockOrderStatus(orderNo, rec);
    const paid = status === "paid";
    return {
      ok: true,
      data: {
        order_no: orderNo,
        status,
        amount: rec?.a ?? MOCK_ORIGINAL_CENTS - MOCK_EARLY_BIRD_CENTS,
        paid_at: paid ? new Date().toISOString() : undefined,
        enrollment_status: paid ? "active" : undefined,
        course_id: rec?.c ?? MOCK_COURSE_ID,
      },
    };
  },

  async closeCourseOrder(orderNo: string): Promise<ApiResult<CourseOrderStatus>> {
    const rec = (await readMockOrders()).find((r) => r.n === orderNo);
    // 已支付订单不可关闭；支付前关闭要落进 Cookie，否则 6 秒后会被推导成已支付
    if (mockOrderStatus(orderNo, rec) !== "paid") {
      await updateMockOrder(orderNo, { x: true });
    }
    return { ok: true, data: { order_no: orderNo, status: "closed", amount: rec?.a ?? 0 } };
  },

  async claimCourseOrder(input: ClaimOrderInput): Promise<ApiResult<CourseOrderStatus>> {
    await updateMockOrder(input.order_no, { o: true });
    const rec = (await readMockOrders()).find((r) => r.n === input.order_no);
    const status = mockOrderStatus(input.order_no, rec);
    return {
      ok: true,
      data: {
        order_no: input.order_no,
        status,
        amount: rec?.a ?? 0,
        enrollment_status: status === "paid" ? "active" : undefined,
        course_id: rec?.c,
      },
    };
  },

  async listBookmarks(): Promise<ApiResult<BookmarkListResult>> {
    const items = await readMockBookmarks();
    return {
      ok: true,
      data: { bookmarks: items.map((i) => ({ course_id: i.c, created_at: i.t })) },
    };
  },

  async addBookmark(courseId: string): Promise<ApiResult<BookmarkMutationResult>> {
    const items = await readMockBookmarks();
    let rec = items.find((i) => i.c === courseId);
    if (!rec) {
      rec = { c: courseId, t: new Date().toISOString() };
      items.push(rec);
      await writeMockBookmarks(items);
    }
    return { ok: true, data: { course_id: courseId, bookmarked: true, created_at: rec.t } };
  },

  async removeBookmark(courseId: string): Promise<ApiResult<BookmarkMutationResult>> {
    const items = await readMockBookmarks();
    const next = items.filter((i) => i.c !== courseId);
    if (next.length !== items.length) await writeMockBookmarks(next);
    return { ok: true, data: { course_id: courseId, bookmarked: false } };
  },

  async listCourseOrders(opts?: {
    status?: string;
    limit?: number;
  }): Promise<ApiResult<CourseOrderListResult>> {
    // 只列出已归属的订单；无主订单 claim 后才可见
    const recs = (await readMockOrders()).filter((r) => r.o);
    let orders: CourseOrderListItem[] = recs
      .map((r) => {
        const createdMs = Number(r.n.match(/(\d{13})/)?.[1] ?? 0);
        const status = mockOrderStatus(r.n, r);
        const paid = status === "paid";
        return {
          order_no: r.n,
          product_type: "course_purchase" as const,
          course_id: r.c,
          sku_id: r.s,
          amount: r.a,
          currency: "CNY",
          status,
          enrollment_status: paid ? "active" : null,
          paid_at: paid ? new Date(createdMs + PAY_AFTER_MS).toISOString() : undefined,
          created_at: createdMs ? new Date(createdMs).toISOString() : undefined,
        };
      })
      .reverse(); // 新订单在前
    if (opts?.status) orders = orders.filter((o) => o.status === opts.status);
    if (opts?.limit !== undefined) orders = orders.slice(0, opts.limit);
    return { ok: true, data: { orders } };
  },
};

/** 与既有 mock 约定一致：状态由 order_no 内嵌时间戳推导；关闭标记优先。 */
function mockOrderStatus(orderNo: string, rec?: MockOrderRec): "pending" | "paid" | "closed" {
  if (rec?.x) return "closed";
  const elapsed = Date.now() - Number(orderNo.match(/(\d{13})/)?.[1] ?? 0);
  return elapsed > PAY_AFTER_MS ? "paid" : "pending";
}

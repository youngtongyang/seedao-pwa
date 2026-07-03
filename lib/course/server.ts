import "server-only";

import { type ApiResult, call } from "@/lib/api/server";
import { USE_MOCK } from "@/lib/api/config";
import type {
  CheckoutPreviewInput,
  CheckoutPreviewResult,
  ClaimOrderInput,
  CourseOrder,
  CourseOrderStatus,
  CreateCourseOrderInput,
} from "./types";

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
  if (USE_MOCK) return mock.createCourseOrder(input);
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

  createCourseOrder(input: CreateCourseOrderInput): Promise<ApiResult<CourseOrder>> {
    const orderNo = `C${Date.now()}mock`;
    return Promise.resolve({
      ok: true,
      data: {
        order_no: orderNo,
        order_token: `ot_mock_${orderNo}`,
        product_type: "course_purchase",
        course_id: input.course_id,
        sku_id: input.sku_id,
        original_amount: MOCK_ORIGINAL_CENTS,
        discount_amount: MOCK_EARLY_BIRD_CENTS + (input.channel_code ? MOCK_CHANNEL_CENTS : 0),
        amount: MOCK_ORIGINAL_CENTS - MOCK_EARLY_BIRD_CENTS - (input.channel_code ? MOCK_CHANNEL_CENTS : 0),
        status: "pending",
        code_url: `weixin://wxpay/bizpayurl?pr=MOCK${orderNo}`,
        expired_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
    });
  },

  queryCourseOrder(orderNo: string): Promise<ApiResult<CourseOrderStatus>> {
    const elapsed = Date.now() - Number(orderNo.match(/(\d{13})/)?.[1] ?? 0);
    const paid = elapsed > PAY_AFTER_MS;
    return Promise.resolve({
      ok: true,
      data: {
        order_no: orderNo,
        status: paid ? "paid" : "pending",
        amount: MOCK_ORIGINAL_CENTS - MOCK_EARLY_BIRD_CENTS,
        paid_at: paid ? new Date().toISOString() : undefined,
        enrollment_status: paid ? "active" : undefined,
      },
    });
  },

  closeCourseOrder(_orderNo: string): Promise<ApiResult<CourseOrderStatus>> {
    return Promise.resolve({ ok: true, data: { order_no: _orderNo, status: "closed", amount: 0 } });
  },

  claimCourseOrder(input: ClaimOrderInput): Promise<ApiResult<CourseOrderStatus>> {
    return Promise.resolve({
      ok: true,
      data: { order_no: input.order_no, status: "pending", amount: 0 },
    });
  },
};

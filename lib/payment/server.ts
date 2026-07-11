import "server-only";

import { type ApiResult, call } from "@/lib/api/server";
import { USE_MOCK } from "@/lib/api/config";
import type {
  CreateOrderInput,
  OrderListResult,
  OrderStatusResult,
  PayChannel,
  PaymentOrder,
  PaymentStatus,
} from "./types";
import { isH5PayChannel } from "./types";

/**
 * Server-only client for the membership-renewal payment endpoints (API v2.5).
 * The BFF route handlers (`/api/payment/*`) call these; nothing here reaches the
 * client bundle (`server-only` guard).
 *
 * Every endpoint is JWT-authenticated: the caller must already have a session
 * (registration is free and mints one), and payment renews *their* membership.
 * These wrappers talk to the **SeeDAO backend** under `/v1/payments/*`; the
 * backend owns the WeChat merchant key + APIv3 key and performs all of WeChat's
 * request signing and notify decryption. The frontend only renders `code_url`
 * (Native, → QR via `components/shared/qr-code.tsx`) or redirects to `h5_url`.
 *
 * `USE_MOCK` (the same switch the auth client uses) drives an in-process
 * simulation so the whole flow is exercisable locally without WeChat.
 */

/** `POST /v1/payments/orders` — open a renewal order. */
export function createOrder(input: CreateOrderInput, token: string): Promise<ApiResult<PaymentOrder>> {
  if (USE_MOCK) return mock.createOrder(input);
  const body: Record<string, unknown> = {
    product_type: input.product_type ?? "membership_renew",
    days: input.days,
    pay_channel: input.pay_channel,
  };
  if (input.coupon_code) body.coupon_code = input.coupon_code;
  if (input.return_to) body.return_to = input.return_to;
  return call<PaymentOrder>("/payments/orders", { method: "POST", token, body });
}

/** `GET /v1/payments/orders?limit=…` — the caller's order history. */
export function listOrders(token: string, limit?: number): Promise<ApiResult<OrderListResult>> {
  if (USE_MOCK) return mock.listOrders();
  return call<OrderListResult>("/payments/orders", {
    token,
    query: { limit: limit !== undefined ? String(limit) : undefined },
  });
}

/** `GET /v1/payments/orders/:order_no` — poll one order (frontend polls until paid). */
export function queryOrder(orderNo: string, token: string): Promise<ApiResult<OrderStatusResult>> {
  if (USE_MOCK) return mock.queryOrder(orderNo);
  return call<OrderStatusResult>(`/payments/orders/${encodeURIComponent(orderNo)}`, { token });
}

/** `POST /v1/payments/orders/:order_no/close` — close an unpaid order. */
export function closeOrder(orderNo: string, token: string): Promise<ApiResult<OrderStatusResult>> {
  if (USE_MOCK) return mock.closeOrder(orderNo);
  return call<OrderStatusResult>(`/payments/orders/${encodeURIComponent(orderNo)}/close`, {
    method: "POST",
    token,
  });
}

/**
 * `POST /v1/payments/dev/simulate-pay` — mark an order paid without WeChat.
 * Backend only honors this when `wechat_pay.dev_mode` is true; in prod it 404s.
 */
export function simulatePay(orderNo: string, token: string): Promise<ApiResult<OrderStatusResult>> {
  if (USE_MOCK) return mock.simulatePay(orderNo);
  return call<OrderStatusResult>("/payments/dev/simulate-pay", {
    method: "POST",
    token,
    body: { order_no: orderNo },
  });
}

// ── Mock branch (SEEDAO_USE_MOCK=1) ───────────────────────────────────────────

/**
 * Route handlers don't share memory across requests, so the mock encodes the
 * creation time, renewal length and channel into `order_no` and derives status
 * from elapsed wall-clock — `pending` for a few seconds (the user scanning),
 * then `paid`. `membership_expires_at` is computed as now + `days`.
 */
// Matches the displayed ¥35 price (`lib/mock/membership`). NB: the real backend
// default is 9900 分 (¥99); the charged amount is server-side config
// (`wechat_pay.membership_price_fen`), not anything the frontend sends.
const MEMBERSHIP_FEE_CENTS = 3500;
const PAY_AFTER_MS = 6000; // simulated time-to-scan-and-pay
const EXPIRE_AFTER_MS = 5 * 60 * 1000; // simulated order expiry
const DEFAULT_DAYS = 365;

type ParsedOrder = { createdAt: number; days: number; channel: PayChannel };

function mockChannelCode(channel: PayChannel): string {
  if (channel === "wechat_h5") return "h";
  if (channel === "alipay_h5") return "a";
  return "n";
}

function mockChannelFromCode(code: string): PayChannel {
  if (code === "h") return "wechat_h5";
  if (code === "a") return "alipay_h5";
  return "wechat_native";
}

function mockOrderNo(createdAt: number, days: number, channel: PayChannel): string {
  return `wxmock_${createdAt}_${days}_${mockChannelCode(channel)}`;
}

function parseOrderNo(orderNo: string): ParsedOrder | null {
  const m = /^wxmock_(\d+)_(\d+)_([nha])$/.exec(orderNo);
  if (!m) return null;
  return {
    createdAt: Number(m[1]),
    days: Number(m[2]),
    channel: mockChannelFromCode(m[3]),
  };
}

function isoFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

/** Build the order object shared by create + query (channel-appropriate links). */
function mockOrder(orderNo: string, p: ParsedOrder, status: PaymentStatus): PaymentOrder {
  const order: PaymentOrder = {
    order_no: orderNo,
    product_type: "membership_renew",
    product_days: p.days,
    pay_channel: p.channel,
    status,
    amount: MEMBERSHIP_FEE_CENTS,
    currency: "CNY",
    expired_at: new Date(p.createdAt + EXPIRE_AFTER_MS).toISOString(),
  };
  // Pay links are still returned while pending so a refreshed page keeps paying.
  if (status === "pending") {
    if (isH5PayChannel(p.channel)) {
      order.h5_url =
        p.channel === "alipay_h5"
          ? `https://openapi.alipay.com/MOCK/${orderNo}`
          : `https://wx.tenpay.com/MOCK/${orderNo}`;
    } else order.code_url = `weixin://wxpay/bizpayurl?pr=MOCK${orderNo}`;
  }
  return order;
}

const mock = {
  createOrder(input: CreateOrderInput): Promise<ApiResult<PaymentOrder>> {
    const now = Date.now();
    const p: ParsedOrder = {
      createdAt: now,
      days: input.days ?? DEFAULT_DAYS,
      channel: input.pay_channel ?? "wechat_native",
    };
    const orderNo = mockOrderNo(p.createdAt, p.days, p.channel);
    return Promise.resolve({ ok: true, data: mockOrder(orderNo, p, "pending") });
  },
  queryOrder(orderNo: string): Promise<ApiResult<OrderStatusResult>> {
    const p = parseOrderNo(orderNo);
    if (!p) return Promise.resolve({ ok: false, error: "payment_order_not_found", status: 404 });

    const elapsed = Date.now() - p.createdAt;
    let status: PaymentStatus;
    if (elapsed >= EXPIRE_AFTER_MS) status = "closed";
    else if (elapsed >= PAY_AFTER_MS) status = "paid";
    else status = "pending";

    const data: OrderStatusResult = mockOrder(orderNo, p, status);
    if (status === "paid") {
      data.membership_expires_at = isoFromNow(p.days * 24 * 60 * 60 * 1000);
      data.paid_at = new Date().toISOString();
      data.wx_transaction_id = `4200mock${p.createdAt}`;
    }
    return Promise.resolve({ ok: true, data });
  },
  listOrders(): Promise<ApiResult<OrderListResult>> {
    return Promise.resolve({ ok: true, data: { orders: [] } });
  },
  closeOrder(orderNo: string): Promise<ApiResult<OrderStatusResult>> {
    const p = parseOrderNo(orderNo);
    if (!p) return Promise.resolve({ ok: false, error: "payment_order_not_found", status: 404 });
    return Promise.resolve({ ok: true, data: mockOrder(orderNo, p, "closed") });
  },
  simulatePay(orderNo: string): Promise<ApiResult<OrderStatusResult>> {
    const p = parseOrderNo(orderNo);
    if (!p) return Promise.resolve({ ok: false, error: "payment_order_not_found", status: 404 });
    return Promise.resolve({
      ok: true,
      data: {
        ...mockOrder(orderNo, p, "paid"),
        membership_expires_at: isoFromNow(p.days * 24 * 60 * 60 * 1000),
        paid_at: new Date().toISOString(),
        wx_transaction_id: `4200mock${p.createdAt}`,
      },
    });
  },
};

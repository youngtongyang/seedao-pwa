/**
 * Wire types for the **membership-renewal** payment flow (API v2.5).
 *
 * Unlike a one-off purchase, every payment endpoint here is JWT-authenticated and
 * renews membership for the *already-registered* caller — the backend owns the
 * WeChat merchant keys and does all of WeChat's request signing / notify
 * decryption. The frontend only ever sees the documented envelope fields.
 *
 *   Create:  POST /v1/payments/orders
 *            body { product_type, days?, pay_channel? }
 *            → Native: { order_no, amount, code_url, expired_at, … }  (code_url → QR)
 *              H5:     { order_no, amount, h5_url, expired_at, … }     (redirect)
 *   List:    GET  /v1/payments/orders?limit=…
 *   Query:   GET  /v1/payments/orders/:order_no
 *            → pending: keeps code_url/h5_url · paid: + membership_expires_at, paid_at, wx_transaction_id
 *   Close:   POST /v1/payments/orders/:order_no/close
 *   Notify:  POST /v1/payments/wechat/notify       (WeChat → backend; not our concern)
 *
 * Field names stay snake_case to match the JSON the backend emits, like
 * `@/lib/api/types`. `amount` is an integer in **分 (cents)** (top-level, not an
 * object), with `currency` alongside it.
 */

/** Payment sub-channels the backend supports. */
export type PayChannel = "wechat_native" | "wechat_h5" | "alipay_h5";

/** H5 redirect channels — backend returns `h5_url` instead of `code_url`. */
export type H5PayChannel = "wechat_h5" | "alipay_h5";

export function parsePayChannel(value: unknown): PayChannel | undefined {
  if (value === "wechat_native" || value === "wechat_h5" || value === "alipay_h5") {
    return value;
  }
  return undefined;
}

export function isH5PayChannel(channel: PayChannel): channel is H5PayChannel {
  return channel === "wechat_h5" || channel === "alipay_h5";
}

/** The only product today; kept as a string union so adding SKUs is one edit. */
export type ProductType = "membership_renew";

/**
 * Order lifecycle as the backend reports it. `paid` is the terminal success
 * state (membership extended); `closed` covers expired / closed / failed orders
 * that are no longer payable and need a fresh one.
 */
export type PaymentStatus = "pending" | "paid" | "closed";

/** Body for `POST /v1/payments/orders`. All fields optional — see defaults. */
export type CreateOrderInput = {
  /** Defaults to `membership_renew`. */
  product_type?: ProductType;
  /** Days of membership to add; defaults to `365` server-side (request field). */
  days?: number;
  /** Defaults to `wechat_native`. */
  pay_channel?: PayChannel;
  /** Optional coupon code; validated server-side against the coupons table. */
  coupon_code?: string;
};

/**
 * Created order — what we need to start the payment. For `wechat_native` the
 * backend returns `code_url` (a `weixin://…` string we render to a QR); for
 * `wechat_h5` / `alipay_h5` it returns `h5_url` (a page to redirect to). The frontend never
 * sends the amount — it's set server-side from `wechat_pay.membership_price_fen`.
 */
export type PaymentOrder = {
  /** Merchant order number; the id used to query / close this order. */
  order_no: string;
  product_type: string;
  /** Membership days the order grants (response field; the request sends `days`). */
  product_days?: number;
  pay_channel: PayChannel;
  status: PaymentStatus;
  /** Order amount in **分 (cents)** — e.g. `9900` is ¥99. */
  amount: number;
  /** ISO 4217 currency, e.g. `"CNY"`. */
  currency?: string;
  /** Native: raw `weixin://wxpay/bizpayurl?pr=…`, rendered to a QR client-side. Also returned while `pending`. */
  code_url?: string;
  /** H5: redirect target (WeChat). Also returned while `pending`. */
  h5_url?: string;
  /** H5: redirect target (Alipay). Backend may use this instead of `h5_url`. */
  pay_url?: string;
  /** RFC3339 UTC instant the order/code expires. */
  expired_at?: string;
};

/** Resolve the browser redirect URL for an H5 order (WeChat `h5_url` or Alipay `pay_url`). */
export function paymentRedirectUrl(order: { h5_url?: string; pay_url?: string }): string | undefined {
  return order.h5_url ?? order.pay_url;
}

/**
 * Result of querying an order — the order plus, once `paid`, the new
 * `membership_expires_at`, `paid_at` and `wx_transaction_id`. While `pending` it
 * still carries `code_url`/`h5_url` so a refreshed page can keep paying.
 */
export type OrderStatusResult = PaymentOrder & {
  /** RFC3339 UTC; present once the order is `paid`. */
  membership_expires_at?: string | null;
  /** RFC3339 UTC payment instant; present once `paid`. */
  paid_at?: string;
  /** WeChat transaction id; present once `paid`. */
  wx_transaction_id?: string;
};

/** A row in the order list (`GET /v1/payments/orders?limit=…`). */
export type OrderListItem = PaymentOrder & {
  /** RFC3339 UTC creation time, when the backend includes it. */
  created_at?: string;
};

/**
 * `GET /v1/payments/orders` response. The exact envelope shape isn't pinned down
 * in the test doc, so `orders` is kept tolerant; the UI doesn't depend on it yet.
 */
export type OrderListResult = {
  orders: OrderListItem[];
};

/**
 * Wire types for the membership payment flow — WeChat Pay v3 **Native**, direct
 * merchant (直连商户). Field names and shapes follow the official v3 docs so the
 * SeeDAO backend can pass WeChat's data through with minimal translation:
 *
 *   Create:  POST https://api.mch.weixin.qq.com/v3/pay/transactions/native
 *            body { appid, mchid, description, out_trade_no, notify_url,
 *                   amount: { total (分/cents), currency: "CNY" } }
 *            → response { code_url }                       (docs 4012714902)
 *   Query:   GET  /v3/pay/transactions/out-trade-no/{out_trade_no}?mchid=…
 *            → { trade_state, transaction_id, amount, … }  (docs 4012526919)
 *   Notify:  WeChat POSTs `event_type:"TRANSACTION.SUCCESS"` with an
 *            AEAD_AES_256_GCM-encrypted `resource`                (docs 4012071382)
 *
 * `code_url` is a `weixin://wxpay/bizpayurl?pr=…` **string**, not an image — the
 * frontend renders it into a scannable QR (see `components/shared/qr-code.tsx`),
 * so the backend only passes the raw string through. All of WeChat's signing
 * (request) and decryption/signature-verification (notify) happen on the
 * backend, which owns the merchant private key + APIv3 key — never in this
 * frontend.
 *
 * Types stay snake_case to match the JSON the backend emits, like `@/lib/api/types`.
 */
import type { AuthUser } from "@/lib/api/types";

/**
 * The subset of WeChat's `trade_state` the UI acts on. The backend maps:
 *   SUCCESS                    → "paid"
 *   NOTPAY | USERPAYING        → "pending"
 *   CLOSED | REVOKED | PAYERROR → "closed"  (code no longer payable; regenerate)
 */
export type PaymentStatus = "pending" | "paid" | "closed";

/** WeChat amount object — `total` is an integer in **分 (cents)**. */
export type PaymentAmount = {
  total: number;
  currency: string;
};

/** Created by the Native order placement — what we need to draw the QR. */
export type PaymentOrder = {
  /** Our merchant order number = WeChat `out_trade_no` (≤32 chars). */
  out_trade_no: string;
  sns_name: string;
  amount: PaymentAmount;
  /** Raw WeChat Native `code_url` (`weixin://wxpay/bizpayurl?pr=…`), rendered to a QR client-side. */
  code_url: string;
  /** Unix seconds; mirrors WeChat's `time_expire` for the code. */
  expire_at: number;
};

/**
 * Result of polling the order. `status` is mapped from WeChat `trade_state`
 * (also passed through verbatim for logging). When first `paid`, the backend
 * has minted the account for the reserved name and returns the session.
 */
export type PaymentStatusResult = {
  out_trade_no: string;
  status: PaymentStatus;
  /** WeChat `trade_state` verbatim (SUCCESS/NOTPAY/…), for logging/debug. */
  trade_state?: string;
  transaction_id?: string;
  /** Present only once paid: the session to establish before redirecting. */
  token?: string;
  token_exp?: number;
  user?: AuthUser;
};

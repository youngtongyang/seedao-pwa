import "server-only";

import type { ApiResult } from "@/lib/api/server";
import { USE_MOCK } from "@/lib/api/config";
import type { PaymentOrder, PaymentStatus, PaymentStatusResult } from "./types";

/**
 * Server-only client for WeChat Pay v3 Native membership orders. The BFF route
 * handlers (`/api/payment/*`) call these wrappers; nothing here reaches the
 * client bundle (`server-only` guard).
 *
 * These wrappers talk to the **SeeDAO backend** (`/v1/payment/*`), not to WeChat
 * directly — the backend owns the merchant private key + APIv3 key and is the
 * only place that may do WeChat's request signing and notify decryption. The
 * backend, in turn, performs the real WeChat v3 calls (direct merchant):
 *
 *   1. Create — `POST https://api.mch.weixin.qq.com/v3/pay/transactions/native`
 *      Authorization: `WECHATPAY2-SHA256-RSA2048` (RSA-SHA256 over
 *      `method\nurl\ntimestamp\nnonce\nbody\n`, signed with the merchant key).
 *      body { appid, mchid, description, out_trade_no, notify_url,
 *             amount: { total: <分>, currency: "CNY" } } → { code_url }.
 *      The backend passes `code_url` straight through; the frontend renders the
 *      QR (see `components/shared/qr-code.tsx`).
 *
 *   2. Notify — WeChat POSTs to the backend's `notify_url` with
 *      `event_type: "TRANSACTION.SUCCESS"` and an AEAD_AES_256_GCM-encrypted
 *      `resource` (decrypt with the APIv3 key; nonce + associated_data from the
 *      resource). The backend verifies the `Wechatpay-Signature` header against
 *      the WeChat platform certificate, then marks the order paid and mints the
 *      account for the reserved `sns_name`.
 *
 *   3. Query — fallback to
 *      `GET /v3/pay/transactions/out-trade-no/{out_trade_no}?mchid=…`; map
 *      `trade_state` (SUCCESS / NOTPAY / USERPAYING / CLOSED / REVOKED /
 *      PAYERROR) onto our `PaymentStatus`.
 *
 * Until that backend lands, `USE_MOCK` (the same switch the auth client uses)
 * drives an in-process simulation so the whole flow is exercisable locally.
 */

// The real branch is intentionally a thin stub — wire it to `call()` from
// `@/lib/api/server` once the backend endpoints exist.

export async function createOrder(snsName: string): Promise<ApiResult<PaymentOrder>> {
  if (USE_MOCK) return mock.createOrder(snsName);
  // Real: return call<PaymentOrder>("/payment/wechat/native", { method: "POST", body: { sns_name: snsName } });
  return { ok: false, error: "upstream_unreachable", status: 502 };
}

export async function queryOrder(outTradeNo: string): Promise<ApiResult<PaymentStatusResult>> {
  if (USE_MOCK) return mock.queryOrder(outTradeNo);
  // Real: return call<PaymentStatusResult>(`/payment/order/${encodeURIComponent(outTradeNo)}`);
  return { ok: false, error: "upstream_unreachable", status: 502 };
}

// ── Mock branch (SEEDAO_USE_MOCK=1) ───────────────────────────────────────────

/**
 * The mock encodes the reserved name and a creation timestamp into `out_trade_no`
 * so status can be derived statelessly (route handlers don't share memory across
 * requests). It returns WeChat's real `trade_state` strings — `NOTPAY` until a
 * few seconds pass, then `SUCCESS` — standing in for the user scanning the code
 * and WeChat firing the `TRANSACTION.SUCCESS` notify.
 */
const MEMBERSHIP_FEE_CENTS = 36500; // ¥365.00, WeChat amount is in 分
const PAY_AFTER_MS = 6000; // simulated time-to-scan-and-pay
const EXPIRE_AFTER_MS = 5 * 60 * 1000; // simulated `time_expire`

function mockOutTradeNo(snsName: string, createdAt: number): string {
  // `wxmock_<createdAt>_<base64url(sns_name)>` — stays within WeChat's 32-char
  // limit for realistic names.
  const name = Buffer.from(snsName).toString("base64url");
  return `wxmock_${createdAt}_${name}`;
}

function parseOutTradeNo(outTradeNo: string): { snsName: string; createdAt: number } | null {
  const m = /^wxmock_(\d+)_([A-Za-z0-9_-]+)$/.exec(outTradeNo);
  if (!m) return null;
  try {
    return { createdAt: Number(m[1]), snsName: Buffer.from(m[2], "base64url").toString("utf8") };
  } catch {
    return null;
  }
}

/** Map a WeChat `trade_state` onto the UI's `PaymentStatus`. */
function mapTradeState(tradeState: string): PaymentStatus {
  switch (tradeState) {
    case "SUCCESS":
      return "paid";
    case "NOTPAY":
    case "USERPAYING":
      return "pending";
    default: // CLOSED, REVOKED, PAYERROR
      return "closed";
  }
}

const mock = {
  createOrder(snsName: string): Promise<ApiResult<PaymentOrder>> {
    const now = Date.now();
    const outTradeNo = mockOutTradeNo(snsName, now);
    return Promise.resolve({
      ok: true,
      data: {
        out_trade_no: outTradeNo,
        sns_name: snsName,
        amount: { total: MEMBERSHIP_FEE_CENTS, currency: "CNY" },
        // A realistic-looking `weixin://` code_url; the real backend gets this
        // from WeChat. The frontend renders it into a QR, so the mock value
        // encodes into a genuine (if non-functional) QR too.
        code_url: `weixin://wxpay/bizpayurl?pr=MOCK${outTradeNo}`,
        expire_at: Math.floor((now + EXPIRE_AFTER_MS) / 1000),
      },
    });
  },
  queryOrder(outTradeNo: string): Promise<ApiResult<PaymentStatusResult>> {
    const parsed = parseOutTradeNo(outTradeNo);
    if (!parsed) return Promise.resolve({ ok: false, error: "invalid_param", status: 400 });

    const elapsed = Date.now() - parsed.createdAt;
    let tradeState: string;
    if (elapsed >= EXPIRE_AFTER_MS) tradeState = "CLOSED";
    else if (elapsed >= PAY_AFTER_MS) tradeState = "SUCCESS";
    else tradeState = "NOTPAY";

    const status = mapTradeState(tradeState);
    const base: PaymentStatusResult = { out_trade_no: outTradeNo, status, trade_state: tradeState };
    if (status === "paid") {
      return Promise.resolve({
        ok: true,
        data: {
          ...base,
          transaction_id: `4200mock${parsed.createdAt}`,
          token: "mock-session",
          token_exp: 4102444800, // 2100-01-01
          user: { id: 1001, sns_name: parsed.snsName, register_source: "new_sns" },
        },
      });
    }
    return Promise.resolve({ ok: true, data: base });
  },
};

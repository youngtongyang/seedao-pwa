# BFF API reference · 接口参考

> The app's own HTTP surface — the **BFF route handlers** under `app/api/*`. These
> are what client code calls; each one proxies the SeeDAO backend
> (`api.seedao.xyz/v1`) server-side. For the upstream contract and wire types see
> [`lib/api/types.ts`](../lib/api/types.ts), [`lib/payment/types.ts`](../lib/payment/types.ts),
> and [`seedao-api-integration.md`](seedao-api-integration.md).
>
> 本文档描述应用自身的 HTTP 接口 —— `app/api/*` 下的 **BFF 路由处理器**。客户端代码
> 调用的是它们；每个路由在服务端代理 SeeDAO 后端。上游契约与 wire 类型见上方链接。

---

## Conventions · 通用约定

- **Auth model · 认证模型.** "Session" = the httpOnly `seedao.session` JWT cookie,
  set at register/login. Routes marked **Session** return `401 {"error":"unauthorized"}`
  without it. "Logged in" (the readable `seedao.authed` cookie) means an **active
  paid member** — see [`ARCHITECTURE.md`](../ARCHITECTURE.md#auth-and-what-logged-in-means).
- **Success shape · 成功响应.** The BFF does **not** re-wrap the backend envelope
  uniformly — each route returns the concrete shape documented below (some
  `{ ok: true, … }`, some the raw resource).
- **Error shape · 错误响应.** Failures return `{ "error": <ApiErrorKey>, "message"?: string }`
  with an HTTP status (400 / 401 / 404 / 429 / 5xx). The `ApiErrorKey` union and
  the backend code → key mapping live in
  [`lib/api/types.ts`](../lib/api/types.ts) / [`lib/api/server.ts`](../lib/api/server.ts).
- **Mock mode · 模拟模式.** With `SEEDAO_USE_MOCK=1`, every route returns canned
  data and any 6-digit OTP works — no real SMS or network. Payment status flips
  `pending → paid` after ~6s.
- **Phone format · 手机号.** The UI collects an 11-digit mainland number; the BFF
  normalizes to E.164 (`+86…`) via `toE164()` before calling the backend.

### Error keys · 错误码

| `error` key | HTTP | Meaning · 含义 |
| --- | --- | --- |
| `invalid_param` | 400 | Missing/invalid input · 参数缺失或非法 |
| `invalid_code` | 400 | Wrong/expired OTP · 验证码错误或过期 |
| `sns_unavailable` | 400 | SNS name taken/invalid · 名称已占用或非法 |
| `wallet_verify_failed` | 400 | Bad signature · 签名验证失败 |
| `wallet_no_sns` | 400 | Wallet holds no claimable SNS · 钱包无可领取 SNS |
| `phone_exists` | 400 | Phone already registered · 手机号已注册 |
| `phone_not_registered` | 400 | Login with an unregistered phone · 登录时手机号未注册 |
| `payment_order_not_found` | 404 | Order not found / not owned · 订单不存在或非本人 |
| `payment_order_invalid_state` | 400 | Action not allowed in current state · 当前状态不允许该操作 |
| `unauthorized` | 401 | No/invalid session · 无有效会话 |
| `rate_limited` | 429 | Too many requests · 请求过于频繁 |
| `internal` / `upstream_unreachable` / `unknown_error` | 5xx | Backend error · 后端错误 |

---

## Route summary · 路由总览

| Method | Path | Auth | Purpose · 用途 |
| --- | --- | --- | --- |
| POST | `/api/auth/sms` | — | Request an OTP · 请求验证码 |
| POST | `/api/auth/login` | — | Login with phone + OTP · 手机号 + 验证码登录 |
| POST | `/api/auth/register` | — | Register (new or on-chain SNS) · 注册 |
| POST | `/api/auth/logout` | — | Clear session · 退出登录 |
| GET | `/api/sns/check` | — | SNS name availability · 名称可用性 |
| POST | `/api/wallet/nonce` | — | Issue a SIWE nonce + message · 签发 SIWE nonce |
| POST | `/api/wallet/verify-sns` | — | Verify signature, preview SNS · 验签并预览可领名称 |
| GET | `/api/profile` | Member | Signed-in user's profile · 当前用户资料 |
| POST | `/api/payment/order` | Session | Open a renewal order · 开会员续费单 |
| GET | `/api/payment/status` | Session | Poll one order · 轮询订单状态 |
| GET | `/api/payment/orders` | Session | Order history · 订单历史 |
| POST | `/api/payment/order/close` | Session | Close an unpaid order · 关闭未支付订单 |
| POST | `/api/payment/simulate-pay` | Session | Dev: mark paid (dev_mode only) · 开发模拟支付 |
| GET | `/api/course/bookmarks` | Session | My course bookmarks · 我的课程收藏 ⚠️ backend TBD |
| PUT | `/api/course/bookmarks/{course_id}` | Session | Bookmark a course (idempotent) · 收藏课程 ⚠️ backend TBD |
| DELETE | `/api/course/bookmarks/{course_id}` | Session | Remove a bookmark (idempotent) · 取消收藏 ⚠️ backend TBD |
| GET | `/api/course/orders` | Session | My course orders · 我的课程订单列表 ⚠️ backend TBD |
| GET | `/api/stats/members` | — | Total member count · 会员总数 |
| GET | `/api/health` | — | Backend liveness probe · 健康检查 |

---

## Auth · 认证

### `POST /api/auth/sms`
Request an OTP for a phone number. · 为手机号请求短信验证码.

- **Auth:** none
- **Body:** `{ "phone": string }` — 11-digit mainland number.
- **200:** `{ "ok": true, "retry_after": number }` — seconds until a resend is allowed.
- **Errors:** `invalid_param`, `rate_limited`.
- Source: [`app/api/auth/sms/route.ts`](../app/api/auth/sms/route.ts)

### `POST /api/auth/login`
Existing user logs in with phone + OTP. Sets `seedao.session`; sets
`seedao.authed` only if the account is an active member.
已注册用户用手机号 + 验证码登录。写入会话 Cookie；仅会员写入登录态 Cookie.

- **Auth:** none
- **Body:** `{ "phone": string, "code": string }`
- **200:** `{ "ok": true, "user": AuthUser, "member": boolean }`
  - `AuthUser` = `{ id, sns_name, register_source, membership_expires_at? }`
  - `member` — `true` when `membership_expires_at` is in the future.
- **Errors:** `invalid_param`, `invalid_code`, `phone_not_registered`, `rate_limited`.
- Source: [`app/api/auth/login/route.ts`](../app/api/auth/login/route.ts)

### `POST /api/auth/register`
Create an account. Two modes by `register_type`. Always sets `seedao.session`
(needed to pay); a fresh `new_sns` user is registered but **not** logged in until
they pay. 创建账户，两种模式；总是写入会话 Cookie，`new_sns` 新用户付费后才算登录.

- **Auth:** none
- **Body — `new_sns`:**
  `{ "phone", "code", "register_type": "new_sns", "sns_name": string }`
- **Body — `existing_sns`** (claim an on-chain name via wallet signature):
  `{ "phone", "code", "register_type": "existing_sns", "wallet", "wallet_type"?, "domain", "message", "signature" }`
  — `wallet_type` defaults to `"EOA"`. Needs a **fresh** nonce/signature (the
  preview in `verify-sns` consumed the previous one).
- **200:** `{ "ok": true, "user": AuthUser }`
- **Errors:** `invalid_param`, `invalid_code`, `sns_unavailable`, `phone_exists`,
  `wallet_verify_failed`, `wallet_no_sns`, `rate_limited`.
- Source: [`app/api/auth/register/route.ts`](../app/api/auth/register/route.ts)

### `POST /api/auth/logout`
Clear `seedao.session` and `seedao.authed`. · 清除会话与登录态 Cookie.

- **Auth:** none (idempotent) · **Body:** none
- **200:** `{ "ok": true }`
- Source: [`app/api/auth/logout/route.ts`](../app/api/auth/logout/route.ts)

---

## SNS · 名称

### `GET /api/sns/check`
Live availability of a `*.seedao` name (used as you type in Join).
实时校验 `*.seedao` 名称可用性（加入流程中边输入边校验）.

- **Auth:** none
- **Query:** `sns_name` (e.g. `alice.seedao`)
- **200:** `{ "sns_name": string, "available": boolean, "reason"?: SnsCheckReason }`
  - `reason` ∈ `invalid_format` | `taken_in_app` | `taken_in_registry` | `reserved_word`
- **Errors:** `invalid_param`.
- Source: [`app/api/sns/check/route.ts`](../app/api/sns/check/route.ts)

---

## Wallet (SIWE) · 钱包

> The nonce is **single-use, ~45s TTL**, consumed by both `verify-sns` and
> `register existing_sns` — so the wallet signs twice. See the "double sign"
> sequence diagram in [`ARCHITECTURE.md`](../ARCHITECTURE.md#diagrams--架构图).
> nonce 一次性、约 45 秒有效，`verify-sns` 与 `register` 各消耗一次，钱包签名两次.

### `POST /api/wallet/nonce`
Issue a SIWE nonce and the full message the wallet must sign.
签发 SIWE nonce 及待签名的完整消息.

- **Auth:** none
- **Body:** `{ "wallet": string, "domain": string }`
- **200:** `{ "nonce": string, "message": string, "expires_at": number }`
  — `message` is built server-side; sign it with `personal_sign`.
- **Errors:** `invalid_param`, `rate_limited`.
- Source: [`app/api/wallet/nonce/route.ts`](../app/api/wallet/nonce/route.ts)

### `POST /api/wallet/verify-sns`
Verify a signature and **preview** the on-chain SNS name it can claim. Consumes
the nonce. 验签并预览该钱包可领取的链上名称；消耗 nonce.

- **Auth:** none
- **Body:** `{ "wallet", "wallet_type"?, "domain", "message", "signature" }`
  — `wallet_type` defaults to `"EOA"`.
- **200:** `{ "wallet": string, "sns_name": string, "claimable": boolean }`
- **Errors:** `invalid_param`, `wallet_verify_failed`, `wallet_no_sns`.
- Source: [`app/api/wallet/verify-sns/route.ts`](../app/api/wallet/verify-sns/route.ts)

---

## Profile · 资料

### `GET /api/profile`
The signed-in user's read-only profile (phone masked server-side).
当前用户的只读资料（手机号在服务端脱敏）.

- **Auth:** **Active member required** — a session token alone is not enough
  (`401 unauthorized` with no session; `403 forbidden` for a registered-but-unpaid user).
- **Query / Body:** none
- **200:** `ProfileResult` =
  `{ id, sns_name, phone, register_source, avatar, bio, membership_expires_at?, created_at }`
  — timestamps are RFC3339 UTC.
- **Errors:** `unauthorized`, `forbidden`, `internal`.
- Source: [`app/api/profile/route.ts`](../app/api/profile/route.ts)

---

## Payment (membership renewal) · 会员续费支付

> All payment routes require a **Session** and act on the caller's own
> membership. Amount/price are **server-side config** — the frontend never sends
> an amount. Wire types: [`lib/payment/types.ts`](../lib/payment/types.ts).
> 全部支付路由需会话，作用于调用者自身会员；金额由服务端配置，前端不传金额.

### `POST /api/payment/order`
Open a WeChat membership-renewal order. · 开一笔微信会员续费订单.

- **Auth:** Session
- **Body:** `{ "days"?: number, "pay_channel"?: "wechat_native" | "wechat_h5" }`
  — both optional; backend defaults to 365 days / `wechat_native`.
- **200:** `PaymentOrder` =
  `{ order_no, product_type, product_days?, pay_channel, status, amount, currency?, code_url?, h5_url?, expired_at? }`
  - **Native** → `code_url` (`weixin://…`, render to a QR client-side).
  - **H5** → `h5_url` (redirect target).
  - `amount` is an integer in **分 / cents** (e.g. `9900` = ¥99).
- **Errors:** `unauthorized`, `invalid_param`, `internal`.
- Source: [`app/api/payment/order/route.ts`](../app/api/payment/order/route.ts)

### `GET /api/payment/status`
Poll one order until `status` flips to `paid`. On `paid`, the BFF sets
`seedao.authed` (promotes the session to logged-in member).
轮询订单直至 `paid`；支付成功时 BFF 写入登录态 Cookie.

- **Auth:** Session
- **Query:** `order_no`
- **200:** `OrderStatusResult` = `PaymentOrder` plus, once `paid`:
  `{ membership_expires_at?, paid_at?, wx_transaction_id? }`. `status` ∈
  `pending | paid | closed`.
- **Errors:** `unauthorized`, `invalid_param`, `payment_order_not_found`.
- Source: [`app/api/payment/status/route.ts`](../app/api/payment/status/route.ts)

### `GET /api/payment/orders`
The caller's renewal-order history. · 调用者的续费订单历史.

- **Auth:** Session
- **Query:** `limit`? (number)
- **200:** `{ "orders": OrderListItem[] }` — each item is a `PaymentOrder` plus
  `created_at?`.
- **Errors:** `unauthorized`, `internal`.
- Source: [`app/api/payment/orders/route.ts`](../app/api/payment/orders/route.ts)

### `POST /api/payment/order/close`
Close an unpaid order. · 关闭一笔未支付订单.

- **Auth:** Session
- **Body:** `{ "order_no": string }`
- **200:** `OrderStatusResult` (now `status: "closed"`).
- **Errors:** `unauthorized`, `invalid_param`, `payment_order_not_found`,
  `payment_order_invalid_state`.
- Source: [`app/api/payment/order/close/route.ts`](../app/api/payment/order/close/route.ts)

### `POST /api/payment/simulate-pay`
**Dev helper** — mark an order paid without WeChat. The backend honors it only
when `wechat_pay.dev_mode` is true (404 in prod).
开发辅助：跳过微信直接标记支付成功，仅 `dev_mode` 下生效（生产返回 404）.

- **Auth:** Session
- **Body:** `{ "order_no": string }`
- **200:** `OrderStatusResult` (now `status: "paid"`).
- **Errors:** `unauthorized`, `invalid_param`, `payment_order_not_found`.
- Source: [`app/api/payment/simulate-pay/route.ts`](../app/api/payment/simulate-pay/route.ts)

---

## Course bookmarks & my course orders · 课程收藏与订单列表

> ⚠️ **Backend TBD — mock-only today.** These routes specify the intended
> backend contract (`/v1/courses/bookmarks*`, `GET /v1/courses/orders`) but no
> real endpoints exist yet; they only work with `SEEDAO_USE_MOCK=1`. Mock state
> persists in httpOnly cookies `seedao.mock.bookmarks` /
> `seedao.mock.course_orders` (clear cookies to reset; order status still flips
> `pending → paid` after ~6 s). Wire types:
> [`lib/course/types.ts`](../lib/course/types.ts).
> 后端待建，当前仅 mock 可用；mock 状态存于上述 httpOnly Cookie，清 Cookie 即重置.
>
> Bookmarks require a **Session** (registered user) but NOT membership — saving
> a course for later happens before paying. The course-purchase routes
> themselves (`/api/course/checkout-preview`, `POST /api/course/orders`, …) are
> live against the real backend; see `lib/course/`.
> 收藏需要会话（注册即可），不要求会员；课程购买路由本身已对接真实后端.

### `GET /api/course/bookmarks`
The caller's bookmarked courses. · 调用者收藏的课程.

- **Auth:** Session
- **200:** `{ "bookmarks": [{ "course_id": string, "created_at": string }] }`
- **Errors:** `unauthorized`.
- Source: [`app/api/course/bookmarks/route.ts`](../app/api/course/bookmarks/route.ts)

### `PUT /api/course/bookmarks/{course_id}`
Bookmark a course. **Idempotent** — re-PUT of an existing bookmark returns 200
(safe under optimistic-UI retries). · 收藏课程，幂等.

- **Auth:** Session
- **200:** `{ "course_id": string, "bookmarked": true, "created_at": string }`
- **Errors:** `unauthorized`, `invalid_param`, `course_not_found` (real backend
  will validate the id; the mock accepts any non-empty id).
- Source: [`app/api/course/bookmarks/[course_id]/route.ts`](../app/api/course/bookmarks/%5Bcourse_id%5D/route.ts)

### `DELETE /api/course/bookmarks/{course_id}`
Remove a bookmark. **Idempotent** — deleting an absent bookmark returns 200.
取消收藏，幂等.

- **Auth:** Session
- **200:** `{ "course_id": string, "bookmarked": false }`
- **Errors:** `unauthorized`, `invalid_param`.
- Source: [`app/api/course/bookmarks/[course_id]/route.ts`](../app/api/course/bookmarks/%5Bcourse_id%5D/route.ts)

### `GET /api/course/orders`
The caller's course-purchase orders. Ownerless (anonymous `order_token`) orders
do **not** appear until claimed via `POST /api/course/orders/claim`.
调用者的课程订单列表；无主订单 claim 之前不出现.

- **Auth:** Session
- **Query:** `status`? (`pending | paid | closed`), `limit`? (number)
- **200:** `{ "orders": CourseOrderListItem[] }` =
  `{ order_no, product_type: "course_purchase", course_id, sku_id, amount, currency?, status, enrollment_status?, paid_at?, created_at? }`
  — `enrollment_status` is `"active"` once paid + fulfilled.
- **Errors:** `unauthorized`, `internal`.
- Source: [`app/api/course/orders/route.ts`](../app/api/course/orders/route.ts)

---

## Stats & ops · 统计与运维

### `GET /api/stats/members`
Total member count shown on the homepage hero. Returns `0` on backend failure
(the hero handles the fallback). 首页展示的会员总数；后端失败时返回 0.

- **Auth:** none · **Query/Body:** none
- **200:** `{ "count": number }`
- Source: [`app/api/stats/members/route.ts`](../app/api/stats/members/route.ts)

### `GET /api/health`
Proxy the backend liveness probe. Wired but not surfaced in the UI — for
ops/monitoring. 代理后端健康检查；已接好但未在 UI 暴露，供运维使用.

- **Auth:** none · **Query/Body:** none
- **200:** `{ "status": string }`
- **Errors:** `upstream_unreachable`.
- Source: [`app/api/health/route.ts`](../app/api/health/route.ts)

---

## Quick checks · 快速验证

```bash
# Through the app's BFF (dev server) · 经应用 BFF（开发服务器）
SEEDAO_API_BASE=https://api.seedao.xyz npm run dev
curl localhost:3000/api/health
curl "localhost:3000/api/sns/check?sns_name=baiyu.seedao"
curl localhost:3000/api/profile        # 401 {"error":"unauthorized"} without a session

# Mock mode · 模拟模式（无需短信/网络）
SEEDAO_USE_MOCK=1 npm run dev          # any 6-digit OTP logs in / registers
```

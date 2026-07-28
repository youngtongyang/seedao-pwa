# SeeDAO API integration

How this app talks to `seedao-api-server` (`https://api.seedao.xyz`, routes under `/v1`,
envelope `{code,message,detail?,data?}`, JWT bearer auth), and what's wired vs. not.

## Architecture (BFF)

```
component → client helper (lib/) → Next route handler (app/api/*) → typed client (lib/api/server.ts) → api.seedao.xyz/v1/*
```

- The backend JWT is stored in an httpOnly cookie (`seedao.session`) set by the login/register
  routes; a readable `seedao.authed` hint cookie drives `useAuthed()`. The token never reaches client JS.
- **Wire types** live once in `lib/api/types.ts` (snake_case, mirroring the Go DTOs). Change them there.
- **Config**: `SEEDAO_API_BASE` (default `https://api.seedao.xyz`), and `SEEDAO_USE_MOCK=1` to exercise
  the whole flow locally without real SMS/network (`lib/api/config.ts`, mock branch in `lib/api/server.ts`).
- Wallet (SIWE) connect/sign uses wagmi with **injected connectors only (EIP-6963)** — no
  WalletConnect, so there is no `projectId` to configure (`lib/wallet/config.ts`). The wallet
  stack loads lazily, only inside the login page's on-chain SNS tab.

## Endpoint coverage

Every backend endpoint now has a BFF route. Usage by a user-facing feature:

| Backend | BFF route | Driven by UI |
|---|---|---|
| `GET /health` | `/api/health` | **No** — ops/monitoring only |
| `POST /v1/auth/sms/send` | `/api/auth/sms` | Yes — Login + Join |
| `POST /v1/auth/login` | `/api/auth/login` | Yes — Login tab |
| `POST /v1/auth/register` (`new_sns`) | `/api/auth/register` | Yes — Join → "Create a name" |
| `POST /v1/auth/register` (`existing_sns`) | `/api/auth/register` | Yes — Join → "I have an on-chain SNS" |
| `GET /v1/sns/check` | `/api/sns/check` | Yes — live availability in Join |
| `POST /v1/wallet/nonce` | `/api/wallet/nonce` | Yes — wallet flow |
| `POST /v1/wallet/verify-sns` | `/api/wallet/verify-sns` | Yes — wallet ownership preview |
| `GET /v1/user/profile` | `/api/profile` | Yes — Profile page |
| `GET /v1/user/bindings` | `/api/user/bindings` | Yes — Profile Feishu status |
| `POST /v1/user/bindings/feishu/token` | `/api/user/bindings/feishu/token` | Yes — `/profile/bind` (土地神 link) |
| `POST /v1/user/bindings/feishu/challenge` | `/api/user/bindings/feishu/challenge` | Yes — Profile todo (官网 → 飞书) |
| `DELETE /v1/user/bindings/feishu` | `/api/user/bindings/feishu` | Yes — Profile unbind |
| `POST /v1/payments/orders` | `/api/payment/order` | Yes — Join → WeChat Pay |
| `GET /v1/payments/orders/:order_no` | `/api/payment/status` | Yes — poll until paid |
| `GET /v1/payments/orders` | `/api/payment/orders` | Yes — order history |
| `POST /v1/payments/orders/:order_no/close` | `/api/payment/order/close` | Yes — cancel unpaid order |
| `POST /v1/payments/dev/simulate-pay` | `/api/payment/simulate-pay` | Dev-only (`dev_mode`) |
| `GET /v1/stats/user-count` | `/api/stats/members` | Yes — homepage hero count |
| `GET /v1/proposals` | `/api/proposals` | Yes — proposal list |
| `POST /v1/proposals` | `/api/proposals` | Yes — create draft |
| `GET /v1/proposals/:id` | `/api/proposals/[id]` | Yes — proposal detail |
| `PATCH /v1/proposals/:id` | `/api/proposals/[id]` | Yes — update draft |
| `POST /v1/proposals/:id/publish` | `/api/proposals/[id]/publish` | Yes — submit proposal |
| `POST /v1/proposals/:id/close` | `/api/proposals/[id]/close` | Yes — withdraw draft |
| `POST /v1/proposals/:id/finalize` | `/api/proposals/[id]/finalize` | Yes — finalize vote |
| `GET /v1/proposals/:id/vote-summary` | `/api/proposals/[id]/vote-summary` | Yes — vote tally |
| `GET/POST /v1/proposals/:id/votes` | `/api/proposals/[id]/votes` | Yes — vote list / cast |
| `GET /v1/proposals/:id/votes/me` | `/api/proposals/[id]/votes/me` | Yes — my vote |
| `GET/POST /v1/proposals/:id/comments` | `/api/proposals/[id]/comments` | Yes — comments |

### Proposals wire notes

- Default mode uses the real backend (`https://api.seedao.xyz`). Set `SEEDAO_USE_MOCK=1` for local mock data.
- `content` is UTF-8 bytes (`integer[]`). The UI packs `{ background, body, remarks, vote_type, vote_options }` as JSON inside `content` because the create/patch swagger only exposes `content` + `title`.
- `type` on create is mapped to backend values (e.g. `node_assembly` → `node_consensus_standard`).
- Status/type strings from the backend are normalized in `lib/proposals/normalize.ts`.

### Wallet flow caveat
The wallet **nonce is single-use (45s TTL)** and consumed by *both* `verify-sns` and
`register existing_sns`. The UI therefore signs **twice**: once to preview the claimable name, once to
register. A backend change (let `register` accept a short-lived "verified" token, or skip the preview)
could collapse this to one signature.

## (A) Backend endpoints with no UI feature

- **`GET /health`** — wired as `/api/health` but not surfaced anywhere. Candidate use: a service-status
  indicator, or a CI/uptime probe.

## (B) Frontend capabilities with NO backend endpoint — agreed next features

Two features to build next; each needs a new backend endpoint:

1. **Profile editing (avatar / bio).** `GET /v1/user/profile` is read-only and the SNS name is fixed at
   registration, so the profile UI is now read-only. Letting members set an avatar or bio needs e.g.
   `PATCH /v1/user/profile { avatar?, bio? }`.
2. **Reputation system.** The profile shows a "coming soon" reputation card with no data source. Needs
   reputation/points/badges endpoints.

**Note (2026-06):** membership/payment was later *re-introduced* as a real flow — WeChat Pay
membership renewal (`lib/payment/*`, `app/api/payment/*`, `/v1/payments/*`), now live and wired into
the home Join flow. Earlier revisions of this doc described it as dropped; that is no longer accurate.

Still out of scope: personal-agent backend persistence (the onboarding game stays client-only via
`localStorage`), and Feishu social login (replaced by phone + SMS and wallet SIWE).

## Local verification

```bash
# Real backend (read-only checks, no SMS):
curl https://api.seedao.xyz/health
curl "https://api.seedao.xyz/v1/sns/check?sns_name=baiyu.seedao"   # taken_in_registry

# Through the app's BFF (dev server):
SEEDAO_API_BASE=https://api.seedao.xyz npm run dev
curl localhost:3000/api/health
curl "localhost:3000/api/sns/check?sns_name=baiyu.seedao"
curl localhost:3000/api/profile          # 401 {"error":"unauthorized"} without a session

# Mock mode (full UI, no SMS): set SEEDAO_USE_MOCK=1 — any 6-digit code logs in / registers.
npx tsc --noEmit && npm run lint && npm run build
```

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
- Wallet (SIWE) connect/sign uses wagmi + RainbowKit (`NEXT_PUBLIC_WC_PROJECT_ID` for WalletConnect).

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

Dropped from scope (and their dead mocks removed from the repo): membership/payment (`lib/payment/*`),
personal-agent backend persistence (the onboarding game stays client-only via `localStorage`), and
Feishu social login (`lib/auth/{index,mock,types}.ts`).

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

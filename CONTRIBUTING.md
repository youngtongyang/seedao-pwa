# Contributing · 贡献指南

Thanks for helping build SEEDAO! This guide gets you running locally and covers
the few project-specific conventions that aren't obvious from the code.
感谢参与 SEEDAO 的建设！本指南帮你跑起本地环境，并讲清几条从代码里不易看出的项目约定。

By participating you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).
参与即表示你同意遵守我们的[行为准则](CODE_OF_CONDUCT.md)。

[中文](#中文) · [English](#english)

---

## Quick start · 快速开始

**Prerequisites · 前置要求:** Node.js **20+** and npm. (Next.js 16 + React 19.)

```bash
npm install

# Dev server with mock backend — any 6-digit OTP works, no SMS/network needed.
# 开发服务器（模拟后端）：任意 6 位验证码即可登录/注册，无需短信或网络。
SEEDAO_USE_MOCK=1 npm run dev          # http://localhost:3000

# Dev server against the real backend · 连接真实后端：
SEEDAO_API_BASE=https://api.seedao.xyz npm run dev
```

**Before every PR, run the full verification suite · 提交 PR 前请运行完整校验：**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

### Environment variables · 环境变量

| Variable | Default | Purpose · 用途 |
| --- | --- | --- |
| `SEEDAO_API_BASE` | `https://api.seedao.xyz` | Backend host (no trailing slash) · 后端地址 |
| `SEEDAO_USE_MOCK` | unset | `1` → in-process mock, no SMS/network · 进程内模拟 |
| `NODE_ENV` | — | `production` makes cookies `Secure` · 生产环境 Cookie 加 `Secure` |

`.env*` files are gitignored — never commit secrets. · `.env*` 已被忽略，切勿提交密钥。

---

## 中文

### 改动前必读

> ⚠️ **这不是你熟悉的 Next.js。** 项目使用真实的 Next.js 16，部分约定与旧版本不同
> （见 `AGENTS.md`）。改动框架相关代码前，请先阅读
> `node_modules/next/dist/docs/` 中对应的指南。
>
> 先读 [`ARCHITECTURE.md`](ARCHITECTURE.md)——它解释了下面这些约定背后的「为什么」。

### 必须遵守的项目约定

1. **按设备分流渲染，而非响应式 CSS。** 桌面端与移动端是两套独立组件树。新增带 UI
   的功能时，通常要在 `components/layout/desktop/`（或 `components/home/desktop-*`）
   **和** 对应的 `mobile` 两侧都实现，并通过
   `<Responsive desktop mobile>`（`components/layout/responsive.tsx`）分流。不要用
   CSS 断点去让一套 DOM 同时适配两端。

2. **绝不从客户端直接访问 SeeDAO 后端。** 一律走 BFF：
   `客户端 helper（lib/*/client.ts）→ 路由处理器（app/api/*）→ 仅服务端类型化客户端
   （lib/api/server.ts）`。后端 JWT 存于 httpOnly Cookie，**永不**进入客户端 JS。
   任何会接触 token 或后端密钥的代码，文件顶部必须有 `import "server-only"`。

3. **Wire 类型只在一处定义。** `lib/api/types.ts` 与 `lib/payment/types.ts`，字段保持
   snake_case 以对齐后端 Go DTO。改后端契约只改这里，不要在组件里另立类型。

4. **文案走 i18n，不要硬编码。** UI 文案加到 `lib/i18n/messages.ts`：先加 `zh`
   （唯一真源），再在 `en` 补同名键——`en` 按 `zh` 的结构做类型校验，缺键会编译报错。
   组件用 `useT()`。富内容（卡片、步骤等）放 `lib/mock/*`，类型为
   `Localized<T> = { zh, en }`，用 `useLocalized()` 取值。

5. **「登录」= 活跃付费会员。** 判定唯一来源是 `lib/membership.ts` 的
   `isMembershipActive()`；登录态由可读 Cookie `seedao.authed` 表示（仅会员持有）。
   注册但未付费的用户有会话但**未登录**。涉及门禁/登录态时请沿用这一语义。

### 代码风格

- TypeScript **strict**；不要用 `any` 逃逸类型，用具体类型或 `unknown` + 收窄。
- 通过 ESLint：`npm run lint`（`eslint-config-next` + TS 规则）。
- 样式用 Tailwind v4 工具类 + 设计 Token（`app/globals.css`），不要写裸色值或廉价渐变。
- 组件用 `components/ui/` 下的 shadcn 风格基础组件，不要重复造轮子。
- 注释解释**为什么**，与现有文件的密度和风格保持一致。

### 提交与 PR

- 从 `main` 切分支（如 `feat/...`、`fix/...`）。
- 建议用约定式提交（Conventional Commits）：`feat:`、`fix:`、`docs:`、`refactor:`、
  `chore:`。
- 一个 PR 只做一件事，保持可审查的小颗粒度。
- 提交前务必通过：`npx tsc --noEmit && npm run lint && npm run build`。
- 填写 PR 模板，说明改动动机、影响范围；带 UI 改动请附桌面与移动两端截图。

---

## English

### Read before you change anything

> ⚠️ **This is not the Next.js you know.** The project targets real Next.js 16;
> some conventions differ from older versions (see `AGENTS.md`). Read the
> relevant guide under `node_modules/next/dist/docs/` before changing
> framework-level code.
>
> Start with [`ARCHITECTURE.md`](ARCHITECTURE.md) — it explains the *why* behind
> the conventions below.

### Conventions you must follow

1. **Device-split rendering, not responsive CSS.** Desktop and mobile are two
   separate component trees. A UI feature usually has to be implemented on **both**
   the `components/layout/desktop/` (or `components/home/desktop-*`) side **and**
   the matching `mobile` side, branched through `<Responsive desktop mobile>`
   (`components/layout/responsive.tsx`). Don't reach for CSS breakpoints to adapt
   one DOM to both.

2. **Never call the SeeDAO backend from the client.** Always go through the BFF:
   `client helper (lib/*/client.ts) → route handler (app/api/*) → server-only
   typed client (lib/api/server.ts)`. The backend JWT lives in an httpOnly cookie
   and **never** reaches client JS. Any code that touches the token or backend
   secrets must have `import "server-only"` at the top of the file.

3. **Wire types are defined once.** `lib/api/types.ts` and
   `lib/payment/types.ts`, snake_case to mirror the backend Go DTOs. Change the
   backend contract there — don't re-declare shapes inside components.

4. **Copy goes through i18n — no hardcoded strings.** Add UI copy to
   `lib/i18n/messages.ts`: add the key to `zh` (source of truth) first, then to
   `en` — `en` is type-checked against `zh`'s shape, so a missing key fails to
   compile. Read it with `useT()`. Rich content (cards, steps…) goes in
   `lib/mock/*` typed `Localized<T> = { zh, en }`, resolved with `useLocalized()`.

5. **"Logged in" = active paid member.** The single source of truth is
   `isMembershipActive()` in `lib/membership.ts`; login state is the readable
   `seedao.authed` cookie (members only). A registered-but-unpaid user has a
   session but is **not** logged in. Preserve this semantics around gating.

### Code style

- TypeScript **strict**; don't escape the type system with `any` — use concrete
  types or `unknown` + narrowing.
- Pass ESLint: `npm run lint` (`eslint-config-next` + TS rules).
- Style with Tailwind v4 utilities + design tokens (`app/globals.css`); no raw
  color values or cheap gradients.
- Reuse the shadcn-style primitives in `components/ui/` rather than reinventing.
- Comments explain **why**; match the density and voice of the surrounding file.

### Commits & PRs

- Branch from `main` (e.g. `feat/...`, `fix/...`).
- Conventional Commits are encouraged: `feat:`, `fix:`, `docs:`, `refactor:`,
  `chore:`.
- Keep each PR focused on one thing and reviewable.
- Pass `npx tsc --noEmit && npm run lint && npm run build` before opening it.
- Fill in the PR template; for UI changes, attach **both** desktop and mobile
  screenshots.

---

## Reporting issues · 报告问题

Use the issue templates under [`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE).
For security vulnerabilities, please **do not** open a public issue — contact a
maintainer privately. 报告安全漏洞请勿公开提 issue，请私下联系维护者。

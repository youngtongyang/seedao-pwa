# SEEDAO · 共在 · 涌现 · 逍遥

> 一个让人**认识自己、认识彼此**，与 AI 共学共建的社区 PWA。
> A community PWA to **know yourself, know each other**, and co-learn & co-build with AI.

> 本仓库是 SeeDAO 2.0 PWA 的公开代码快照，便于阅读与本地开发。生产环境的部署与运维文档不在本仓库中。
> This is a public source snapshot of the SeeDAO 2.0 PWA for reading and local development. Production deployment and operations docs are not included.

[中文](#中文) · [English](#english)

---

## 📚 文档 · Documentation

| 文档 · Doc | 说明 · Description |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 系统架构与核心模式 · System architecture & core patterns |
| [docs/api-reference.md](docs/api-reference.md) | BFF 接口参考 · BFF API reference |
| [docs/seedao-api-integration.md](docs/seedao-api-integration.md) | 后端集成现状 · Backend integration status |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 贡献指南 · How to contribute |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | 行为准则 · Code of conduct |
| [LICENSE](LICENSE) | Apache-2.0 |

---

## 中文

SEEDAO 是一个聚焦「关系」的社区。我们相信，比起为了金钱而学习与建造，关系的生长更值得珍视。这个仓库是它的落地页 / 渐进式 Web 应用（PWA）。

### ✨ 核心功能

| 功能 | 说明 | 主要代码路径 |
| --- | --- | --- |
| 1. 社区介绍（首页） | 首页整体体验：英雄区标语「共在 · 涌现 · 逍遥」、实时成员计数、社区卡片轮播等 | `app/page.tsx`、`components/home/`、`components/sections/hero/`、`components/sections/community/`、`lib/mock/community.ts` |
| 2. 会员与支付 | 会员权益 + 微信扫码 / H5 会员续费支付（真实，经 BFF 接入 SeeDAO 后端） | `components/sections/membership/`、`lib/payment/`、`app/api/payment/` |
| 3. 个人主页 | 会员专属只读资料：手机号脱敏、会员到期、新手待办清单、声望占位 | `app/profile/`、`components/sections/profile/`、`lib/profile/`、`app/api/profile/` |
| 4. 课程 | 社区课程主场：项目列表（`/program`）+ 课程详情（`/program/[slug]`）、首页展示位、收藏与报名状态（个人主页「我的项目」） | `app/program/`、`components/sections/program/`、`components/sections/programs/`、`lib/course/`、`app/api/course/`、`lib/mock/programs.ts` |

### 🎨 设计系统

- **「紫罗兰 × 暖琥珀」语义化 Token**：白底浅色模式，优雅克制，无廉价渐变。（`app/globals.css`）
- **浅色 / 深色主题**：基于 `next-themes`，无闪烁。（`components/theme/`）
- **自托管字体**：Geist + Noto Sans SC，通过 `next/font` 构建期自托管，不实时拉取。
- **微交互**：`framer-motion` 驱动的入场、翻牌、进度与庆祝动效。
- **UI 组件**：shadcn 风格基础组件。（`components/ui/`）

### 🏗 系统架构

- **桌面 / 移动双套组件系统**：不依赖响应式 CSS，按设备各自渲染最佳布局与交互（服务端依据 UA 预判，客户端按视口自校正）。（`lib/device/`、`components/layout/`、`components/layout/responsive.tsx`）
- **中文优先、中英双语**：一键切换，文案集中管理，类型安全。（`lib/i18n/`、`components/i18n/`）
- **BFF 数据通路与会话**：浏览器仅经 `app/api/*` 路由访问 SeeDAO 后端；手机号 + 短信验证码登录、钱包（SIWE，注入式 / EIP-6963）领取链上 SNS。（`lib/api/`、`lib/auth/`、`lib/account/`）
- **PWA**：Web App Manifest、Service Worker（离线外壳 + 推送）、iOS 安装提示、安全响应头。（`app/manifest.ts`、`public/sw.js`、`components/pwa/`、`next.config.ts`）

> 更多架构细节见 [ARCHITECTURE.md](ARCHITECTURE.md)。

### 🧱 技术栈

Next.js 16（App Router）· React 19 · TypeScript · Tailwind CSS v4 · shadcn 风格组件 · Radix UI · framer-motion · lucide-react · next-themes

### 🚀 本地开发

```bash
npm install
npm run dev      # 开发：http://localhost:3000
npm run build    # 生产构建
npm start        # 运行生产版本
```

### 📁 目录结构

```
app/                 路由、根布局、Providers、manifest
components/
  ui/                shadcn 风格基础组件
  layout/            桌面 / 移动端布局
  sections/          各功能区块（hero / community / membership / profile / program / onboarding / login / rules / cta）
  home/              首页
  brand/ theme/ i18n/ help/ pwa/ shared/
lib/
  i18n/              字典与 Provider
  device/            设备检测
  account/           账户状态
  api/ auth/         BFF 传输、wire 类型、会话
  payment/ profile/ course/  各功能的客户端 helper 与类型
  mock/              双语内容数据
public/              图标、Service Worker、二维码
```

---

## English

SEEDAO is a community centered on **relationships**. We believe the growth of relationships matters more than learning or building merely for money. This repository is its landing page / Progressive Web App.

### ✨ Core Features

| Feature | Notes | Key paths |
| --- | --- | --- |
| 1. Community intro (home) | The whole homepage experience: hero slogan "Coexist · Emerge · Roam Free", live member count, community card carousel, etc. | `app/page.tsx`, `components/home/`, `components/sections/hero/`, `components/sections/community/`, `lib/mock/community.ts` |
| 2. Membership & Payment | Benefits + WeChat QR / H5 renewal payment (real, wired to the SeeDAO backend via a BFF) | `components/sections/membership/`, `lib/payment/`, `app/api/payment/` |
| 3. Profile | Member-only read-only profile: masked phone, membership expiry, onboarding checklist, reputation placeholder | `app/profile/`, `components/sections/profile/`, `lib/profile/`, `app/api/profile/` |
| 4. Course | Home for community courses: programs index (`/program`) + course detail (`/program/[slug]`), homepage showcase, bookmark & enrollment status (profile "My programs") | `app/program/`, `components/sections/program/`, `components/sections/programs/`, `lib/course/`, `app/api/course/`, `lib/mock/programs.ts` |

### 🎨 Design System

- **Semantic "Violet × Warm Amber" tokens** — white light mode, elegant and restrained, no cheap gradients. (`app/globals.css`)
- **Light / dark themes** — via `next-themes`, no flash. (`components/theme/`)
- **Self-hosted fonts** — Geist + Noto Sans SC, self-hosted at build time via `next/font` (no live fetching).
- **Micro-interactions** — entrance, card-flip, progress and celebration animations with `framer-motion`.
- **UI components** — shadcn-style primitives. (`components/ui/`)

### 🏗 System Architecture

- **Separate desktop & mobile component systems** — not responsive CSS; each device renders its own best layout & interactions (server guesses from UA, client self-corrects to viewport). (`lib/device/`, `components/layout/`, `components/layout/responsive.tsx`)
- **Chinese-first, bilingual (zh/en)** — one-tap switch, centralized & type-safe copy. (`lib/i18n/`, `components/i18n/`)
- **BFF data path & session** — the browser reaches the SeeDAO backend only through `app/api/*` routes; phone + SMS OTP login, wallet (SIWE, injected / EIP-6963) to claim an on-chain SNS. (`lib/api/`, `lib/auth/`, `lib/account/`)
- **PWA** — Web App Manifest, Service Worker (offline shell + push), iOS install prompt, security headers. (`app/manifest.ts`, `public/sw.js`, `components/pwa/`, `next.config.ts`)

> See [ARCHITECTURE.md](ARCHITECTURE.md) for more architectural detail.

### 🧱 Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn-style components · Radix UI · framer-motion · lucide-react · next-themes

### 🚀 Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm start
```

### 📁 Structure

```
app/                 routes, root layout, providers, manifest
components/
  ui/                shadcn-style primitives
  layout/            desktop & mobile shells and nav
  sections/          feature sections (hero / community / membership / profile / program / onboarding / login / rules / cta)
  home/              desktop & mobile homepage
  brand/ theme/ i18n/ help/ pwa/ shared/
lib/
  i18n/              dictionaries & provider
  device/            device detection
  account/           account state
  api/ auth/         BFF transport, wire types, session
  payment/ profile/ course/  per-feature client helpers and types
  mock/              bilingual content data
public/              icons, service worker, QR codes
```

---

## License · 许可证

Licensed under the [Apache License 2.0](LICENSE). · 本项目以 [Apache-2.0](LICENSE) 许可证开源。

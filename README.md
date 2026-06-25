# SEEDAO · 共在 · 涌现 · 逍遥

> 一个让人**认识自己、认识彼此**，与 AI 共学共建的社区 PWA。
> A community PWA to **know yourself, know each other**, and co-learn & co-build with AI.

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

### ✨ 特性一览

- **中文优先、中英双语**：一键切换，文案集中管理，类型安全。
- **桌面 / 移动双套组件系统**：不依赖响应式 CSS，按设备各自渲染最佳布局与交互（服务端依据 UA 预判，客户端按视口自校正）。
- **浅色 / 深色主题**：基于 `next-themes`，无闪烁。
- **设计系统**：「紫罗兰 × 暖琥珀」语义化 Token，白底浅色模式，优雅克制，无廉价渐变。
- **自托管字体**：Geist + Noto Sans SC，通过 `next/font` 构建期自托管，不实时拉取。
- **微交互**：`framer-motion` 驱动的入场、翻牌、进度与庆祝动效。
- **真实支付 / 登录**：手机号 + 短信验证码登录、钱包（SIWE，注入式 / EIP-6963）领取链上 SNS，以及微信扫码 / H5 会员续费支付；经 BFF 接入 SeeDAO 后端。
- **PWA**：Web App Manifest、Service Worker（离线外壳 + 推送）、iOS 安装提示、安全响应头。

### 🧱 技术栈

Next.js 16（App Router）· React 19 · TypeScript · Tailwind CSS v4 · shadcn 风格组件 · Radix UI · framer-motion · lucide-react · next-themes

### 🚀 本地开发

```bash
npm install
npm run dev      # 开发：http://localhost:3000
npm run build    # 生产构建
npm start        # 运行生产版本
```

> 注：本项目使用的是真实的 Next.js 16，部分约定与旧版本不同；改动框架相关代码前请参考 `node_modules/next/dist/docs/`。

### 🗂 功能 → 代码路径对照表

| 功能 | 说明 | 主要代码路径 |
| --- | --- | --- |
| 1. 英雄区 Hero | 醒目标语「共在 · 涌现 · 逍遥」与号召 | `components/sections/hero/` |
| 2. 会员与支付 | 会员权益 + 微信扫码 / H5 续费支付（真实，经 BFF） | `components/sections/membership/`、`lib/payment/`、`app/api/payment/` |
| 3. 社区介绍 | 可翻面的交互特性卡片（非静态展示） | `components/sections/community/`、`lib/mock/community.ts` |
| 4. 新手引导 | 游戏化教程：领取个人智能体，逐步验证 | `app/onboarding/`、`components/sections/onboarding/`、`lib/mock/onboarding.ts` |
| 5. 帮助 | 一键可达的悬浮按钮 + 精美微信二维码 | `components/help/`、`public/qr/wechat-help.svg` |
| 设计系统 / Token | 调色板、字体、暗色变体 | `app/globals.css` |
| 双语 i18n | 字典、Provider、语言切换 | `lib/i18n/`、`components/i18n/` |
| 设备系统 | UA 预判 + 视口自校正 + 选择器 | `lib/device/`、`components/layout/responsive.tsx` |
| 桌面 / 移动外壳 | 头部、底部导航、页脚、菜单 | `components/layout/desktop/`、`components/layout/mobile/` |
| 主题切换 | 浅色 / 深色 | `components/theme/` |
| 账户状态 | 会员 / 登录 | `lib/account/` |
| UI 组件 | shadcn 风格基础组件 | `components/ui/` |
| PWA | Manifest、SW、安装提示、响应头 | `app/manifest.ts`、`public/sw.js`、`components/pwa/`、`next.config.ts` |

### 📁 目录结构

```
app/                 路由、根布局、Providers、manifest
components/
  ui/                shadcn 风格基础组件
  layout/            桌面 / 移动外壳与导航
  sections/          各功能区块（hero / membership / community / rules / docs / onboarding / login / cta）
  home/              首页桌面 / 移动组合
  brand/ theme/ i18n/ help/ pwa/ shared/
lib/
  i18n/              字典与 Provider
  device/            设备检测
  account/           账户状态
  api/ payment/ auth/  BFF 客户端、wire 类型、会话
  mock/              双语内容数据
public/              图标、Service Worker、二维码
```

---

## English

SEEDAO is a community centered on **relationships**. We believe the growth of relationships matters more than learning or building merely for money. This repository is its landing page / Progressive Web App.

### ✨ Highlights

- **Chinese-first, bilingual (zh/en)** — one-tap switch, centralized & type-safe copy.
- **Separate desktop & mobile component systems** — not responsive CSS; each device renders its own best layout & interactions (server guesses from UA, client self-corrects to viewport).
- **Light / dark themes** via `next-themes`, no flash.
- **Design system** — semantic "Violet × Warm Amber" tokens, white light mode, elegant and restrained, no cheap gradients.
- **Self-hosted fonts** — Geist + Noto Sans SC, self-hosted at build time via `next/font` (no live fetching).
- **Micro-interactions** — entrance, card-flip, progress and celebration animations with `framer-motion`.
- **Real payment / login** — phone + SMS OTP login, wallet (SIWE, injected / EIP-6963) to claim an on-chain SNS, and WeChat QR / H5 membership-renewal payment; wired to the SeeDAO backend through a BFF.
- **PWA** — Web App Manifest, Service Worker (offline shell + push), iOS install prompt, security headers.

### 🧱 Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn-style components · Radix UI · framer-motion · lucide-react · next-themes

### 🚀 Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm start
```

> Note: this project targets the real Next.js 16; some conventions differ from older versions. See `node_modules/next/dist/docs/` before changing framework code.

### 🗂 Feature → Code Path

| Feature | Notes | Key paths |
| --- | --- | --- |
| 1. Hero | Eye-catching slogan "Coexist · Emerge · Roam Free" + CTAs | `components/sections/hero/` |
| 2. Membership & Payment | Benefits + WeChat QR / H5 renewal payment (real, via BFF) | `components/sections/membership/`, `lib/payment/`, `app/api/payment/` |
| 3. Community intro | Interactive flip cards (not static content) | `components/sections/community/`, `lib/mock/community.ts` |
| 4. Onboarding | Gamified tutorial to claim a personal agent, step verification | `app/onboarding/`, `components/sections/onboarding/`, `lib/mock/onboarding.ts` |
| 5. Help | One-click floating button + beautiful WeChat QR | `components/help/`, `public/qr/wechat-help.svg` |
| Design system / tokens | Palette, fonts, dark variant | `app/globals.css` |
| Bilingual i18n | Dictionaries, provider, switcher | `lib/i18n/`, `components/i18n/` |
| Device system | UA guess + viewport self-correct + selector | `lib/device/`, `components/layout/responsive.tsx` |
| Desktop / mobile shells | Header, bottom nav, footer, menu | `components/layout/desktop/`, `components/layout/mobile/` |
| Theme toggle | Light / dark | `components/theme/` |
| Account state | Member / login / agent persistence | `lib/account/` |
| UI components | shadcn-style primitives | `components/ui/` |
| PWA | Manifest, SW, install prompt, headers | `app/manifest.ts`, `public/sw.js`, `components/pwa/`, `next.config.ts` |

### 📁 Structure

```
app/                 routes, root layout, providers, manifest
components/
  ui/                shadcn-style primitives
  layout/            desktop & mobile shells and nav
  sections/          feature sections (hero / membership / community / rules / docs / onboarding / login / cta)
  home/              desktop & mobile home composition
  brand/ theme/ i18n/ help/ pwa/ shared/
lib/
  i18n/              dictionaries & provider
  device/            device detection
  account/           account state
  api/ payment/ auth/  BFF clients, wire types, session
  mock/              bilingual content data
public/              icons, service worker, QR codes
```

---

## License · 许可证

Licensed under the [Apache License 2.0](LICENSE). · 本项目以 [Apache-2.0](LICENSE) 许可证开源。

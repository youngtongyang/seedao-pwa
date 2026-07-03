import {
  BarChart3,
  Globe,
  PackageSearch,
  UsersRound,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Localized } from "@/lib/i18n/config";

/** AI 跨境共学项目配置 */

export const crossBorderProject = {
  /** 用于路由的 slug */
  slug: "cross-border",
  /** 报名表单外链（暂定占位） */
  registrationFormUrl: "https://seedao2049.feishu.cn/share/base/form/shrcnExampleCrossBorder",
} as const;

export const crossBorderPricing = {
  /** 原价（单位：元，仅用于展示划线） */
  basePrice: 399,
  /** 早鸟价（单位：元，实际计算起点） */
  earlyBirdPrice: 299,
  /** SEEDAO 会员折扣（8折 = 0.8） */
  memberDiscountRate: 0.8,
  /** 有效优惠码减免金额（元） */
  promoCodeDeduction: 20,
  /** 显示用的货币符号 */
  currency: "¥",
} as const;

export type ProjectBenefit = {
  id: string;
  icon: LucideIcon;
  title: Localized;
  desc: Localized;
};

export const projectBenefits: ProjectBenefit[] = [
  {
    id: "ai-tools",
    icon: Zap,
    title: { zh: "AI 选品实操", en: "AI Product Selection" },
    desc: {
      zh: "用 ChatGPT / Claude 等 AI 工具完成市场调研、竞品分析与选品决策。",
      en: "Use ChatGPT, Claude and other AI tools for market research, competitor analysis, and product selection.",
    },
  },
  {
    id: "platform",
    icon: Globe,
    title: { zh: "跨境平台实战", en: "Cross-Border Platforms" },
    desc: {
      zh: "从 Amazon、TikTok Shop 到 Temu，多平台实操与策略拆解。",
      en: "Hands-on practice across Amazon, TikTok Shop, Temu, and more with strategy breakdowns.",
    },
  },
  {
    id: "supply-chain",
    icon: PackageSearch,
    title: { zh: "供应链对接", en: "Supply Chain Connect" },
    desc: {
      zh: "对接优质工厂与物流渠道，从选品到履约一站式打通。",
      en: "Connect with quality factories and logistics — from sourcing to fulfillment in one chain.",
    },
  },
  {
    id: "data-driven",
    icon: BarChart3,
    title: { zh: "数据驱动增长", en: "Data-Driven Growth" },
    desc: {
      zh: "用 AI 分析销售数据与用户行为，制定增长策略与广告优化方案。",
      en: "Analyze sales data and user behavior with AI to craft growth strategies and optimize ads.",
    },
  },
  {
    id: "mentorship",
    icon: Video,
    title: { zh: "导师直播课", en: "Live Mentorship" },
    desc: {
      zh: "每周一次行业专家直播，案例拆解 + 实时答疑，避开踩坑弯路。",
      en: "Weekly live sessions with industry experts — case studies and real-time Q&A to avoid common pitfalls.",
    },
  },
  {
    id: "community",
    icon: UsersRound,
    title: { zh: "共学社群", en: "Co-Learning Community" },
    desc: {
      zh: "与同阶段卖家组队共学，互相监督、资源互换、抱团出海。",
      en: "Team up with peers at the same stage — mutual accountability, resource sharing, and collective growth.",
    },
  },
];

export const projectIntro = {
  title: { zh: "AI 跨境电商共学计划", en: "AI Cross-Border E-Commerce Program" },
  eyebrow: { zh: "AI × 出海", en: "AI × Global" },
  headline: {
    zh: "用 AI 的力量，把你的产品卖到全世界",
    en: "Leverage AI to sell your products worldwide",
  },
  subhead: {
    zh: "系统学习 AI 选品、跨境运营、供应链管理，与百位卖家共同出海。",
    en: "Systematically learn AI product selection, cross-border operations, and supply chain management alongside hundreds of sellers.",
  },
  stats: {
    duration: { zh: "4 周", en: "4 weeks" },
    sessions: { zh: "9 节课", en: "9 sessions" },
  },
} as const;

/** 有效优惠码及其减免金额（元） */
export const VALID_PROMO_CODES: Record<string, number> = {
  AI2025: 20,
  CROSS20: 20,
  SEEDAO20: 20,
  CROSSBORDER: 20,
};

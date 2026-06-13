import {
  BookOpen,
  Compass,
  LifeBuoy,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";
import type { Localized } from "@/lib/i18n/config";

export type DocType = "guide" | "handbook" | "note" | "faq";

export type DocBlock =
  | { kind: "heading"; text: Localized }
  | { kind: "paragraph"; text: Localized }
  | { kind: "list"; items: Localized[] }
  | { kind: "callout"; tone: "info" | "tip" | "warn"; text: Localized };

export type DocCategory = {
  id: string;
  icon: LucideIcon;
  name: Localized;
};

export type Doc = {
  id: string;
  categoryId: string;
  type: DocType;
  title: Localized;
  summary: Localized;
  readingTime: number;
  updated: string;
  blocks: DocBlock[];
};

export const docTypeLabels: Record<DocType, Localized> = {
  guide: { zh: "指南", en: "Guide" },
  handbook: { zh: "手册", en: "Handbook" },
  note: { zh: "记录", en: "Note" },
  faq: { zh: "问答", en: "FAQ" },
};

export const docCategories: DocCategory[] = [
  { id: "start", icon: Compass, name: { zh: "新手入门", en: "Getting started" } },
  { id: "guides", icon: BookOpen, name: { zh: "使用指南", en: "Guides" } },
  { id: "handbook", icon: NotebookPen, name: { zh: "社区手册", en: "Handbook" } },
  { id: "faq", icon: LifeBuoy, name: { zh: "常见问答", en: "FAQ" } },
];

export const docs: Doc[] = [
  {
    id: "welcome",
    categoryId: "start",
    type: "guide",
    title: { zh: "欢迎来到 SEEDAO", en: "Welcome to SEEDAO" },
    summary: {
      zh: "用三分钟了解我们是谁、在做什么，以及你可以如何参与。",
      en: "A three-minute intro to who we are, what we do, and how you can take part.",
    },
    readingTime: 3,
    updated: "2026-05-20",
    blocks: [
      {
        kind: "paragraph",
        text: {
          zh: "SEEDAO 是一个关于「关系」的社区。我们相信，认识自己、认识彼此，比单纯地学习与建造更重要。",
          en: "SEEDAO is a community about relationships. We believe knowing yourself and each other matters more than learning or building alone.",
        },
      },
      { kind: "heading", text: { zh: "你可以做什么", en: "What you can do" } },
      {
        kind: "list",
        items: [
          { zh: "领取并养成你的个人智能体", en: "Claim and nurture your personal agent" },
          { zh: "加入共学小组，和伙伴一起成长", en: "Join a co-learning circle" },
          { zh: "参与线上线下的共创活动", en: "Take part in co-creation gatherings" },
        ],
      },
      {
        kind: "callout",
        tone: "tip",
        text: {
          zh: "建议先完成「新手上路」，领取属于你的智能体。",
          en: "Tip: start with onboarding to claim your own agent first.",
        },
      },
    ],
  },
  {
    id: "first-agent",
    categoryId: "start",
    type: "guide",
    title: { zh: "如何领取你的个人智能体", en: "How to claim your personal agent" },
    summary: {
      zh: "一步步带你完成智能体的创建与第一次对话。",
      en: "A step-by-step walk through creating your agent and its first chat.",
    },
    readingTime: 4,
    updated: "2026-05-28",
    blocks: [
      {
        kind: "paragraph",
        text: {
          zh: "领取智能体不需要任何技术背景。跟着「新手上路」的引导，几分钟即可完成。",
          en: "Claiming an agent needs no technical background. Follow onboarding and you'll finish in minutes.",
        },
      },
      { kind: "heading", text: { zh: "大致流程", en: "The flow" } },
      {
        kind: "list",
        items: [
          { zh: "给智能体起名字、选性格", en: "Name it and choose a personality" },
          { zh: "告诉它你的兴趣", en: "Tell it your interests" },
          { zh: "和它打个招呼，开始对话", en: "Say hi and start chatting" },
        ],
      },
    ],
  },
  {
    id: "feishu-login",
    categoryId: "guides",
    type: "guide",
    title: { zh: "用飞书登录会员空间", en: "Log in to the member space with Feishu" },
    summary: {
      zh: "成为会员后，如何使用飞书账号登录。",
      en: "How to log in with Feishu once you're a member.",
    },
    readingTime: 2,
    updated: "2026-06-01",
    blocks: [
      {
        kind: "paragraph",
        text: {
          zh: "飞书登录仅向已付费会员开放。完成支付后，点击「用飞书登录」即可。",
          en: "Feishu login is for paid members. After paying, tap “Log in with Feishu”.",
        },
      },
      {
        kind: "callout",
        tone: "info",
        text: {
          zh: "首次登录会跳转飞书授权页面，授权后自动返回。",
          en: "First login redirects to Feishu's authorization page, then returns automatically.",
        },
      },
    ],
  },
  {
    id: "covenant",
    categoryId: "handbook",
    type: "handbook",
    title: { zh: "社区公约详解", en: "The covenant, explained" },
    summary: {
      zh: "我们如何共处的五条约定，以及它们背后的精神。",
      en: "The five promises of how we live together, and the spirit behind them.",
    },
    readingTime: 5,
    updated: "2026-04-30",
    blocks: [
      {
        kind: "paragraph",
        text: {
          zh: "公约不是规章，而是我们彼此的约定。它的目的不是约束，而是守护信任。",
          en: "The covenant isn't a rulebook — it's a mutual promise. Its purpose isn't to restrict, but to protect trust.",
        },
      },
      {
        kind: "list",
        items: [
          { zh: "真诚共在", en: "Be genuinely present" },
          { zh: "尊重差异", en: "Respect differences" },
          { zh: "共创而非索取", en: "Contribute, don't just take" },
          { zh: "善用 AI", en: "Use AI with care" },
          { zh: "守护隐私与边界", en: "Protect privacy & boundaries" },
        ],
      },
    ],
  },
  {
    id: "gatherings",
    categoryId: "handbook",
    type: "note",
    title: { zh: "共创活动是怎么发生的", en: "How gatherings happen" },
    summary: {
      zh: "从一个想法到一次相聚，记录我们的活动文化。",
      en: "From an idea to a meetup — notes on our gathering culture.",
    },
    readingTime: 4,
    updated: "2026-05-10",
    blocks: [
      {
        kind: "paragraph",
        text: {
          zh: "任何成员都可以发起活动。我们鼓励小而真诚的相聚，而非追求规模。",
          en: "Any member can host. We encourage small, sincere gatherings over chasing scale.",
        },
      },
      {
        kind: "callout",
        tone: "tip",
        text: {
          zh: "第一次发起？找社区小助手，我们会帮你一起准备。",
          en: "First time hosting? Reach the community helper — we'll prep it together.",
        },
      },
    ],
  },
  {
    id: "faq-refund",
    categoryId: "faq",
    type: "faq",
    title: { zh: "会员可以退款吗？", en: "Can I get a refund?" },
    summary: {
      zh: "关于会员、支付与退款的常见问题。",
      en: "Common questions about membership, payment, and refunds.",
    },
    readingTime: 2,
    updated: "2026-06-05",
    blocks: [
      {
        kind: "paragraph",
        text: {
          zh: "可以。加入后 7 天内如果觉得不合适，联系小助手即可全额退款。",
          en: "Yes. Within 7 days of joining, contact the helper for a full refund if it's not a fit.",
        },
      },
      {
        kind: "callout",
        tone: "warn",
        text: {
          zh: "当前页面为演示支付，不会产生真实扣款。",
          en: "This page uses mock payment — no real charge is made.",
        },
      },
    ],
  },
];

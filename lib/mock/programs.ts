import { ShoppingCart, type LucideIcon } from "lucide-react";
import type { Localized } from "@/lib/i18n/config";

export type Accent = "violet" | "amber";

/** 项目所处阶段，驱动列表卡片上的状态徽标。 */
export type ProgramStatus = "enrolling" | "upcoming" | "ended";

/**
 * 课程表条目。`date`/`title`/`content` 暂为中文单语：课程本身以中文授课，
 * 排期属于中文受众内容；未来若开设英文课程，将字段切换为 `Localized` 即可
 * （渲染处已无字符串解析依赖 —— 月份分组走 `month` 字段）。
 */
export type ScheduleItem = {
  id: string;
  /** 数字月份，用于移动端按月分组 */
  month: number;
  date: string; // "7.11 周六"
  time: string; // "20:00-21:30"
  title: string;
  content: string;
  instructor: string;
  /** 店主夜话/夜聊/结营等非教学环节 */
  isEvent?: boolean;
};

export type ProgramInstructor = {
  name: string;
  title: Localized;
  avatar: string;
  bio: Localized;
  highlight: Localized;
  /** 讲师资历标签（展示为小圆角 chips） */
  tags: Localized[];
};

export type Program = {
  /** `/program/[slug]` 的 URL 段 */
  slug: string;
  /** 课程 ID（与后端 courses 表一致） */
  courseId: string;
  /** 票种 ID（与后端 course_skus 表一致） */
  skuId: string;
  /** 报名表单外链 */
  registrationFormUrl: string;
  status: ProgramStatus;

  // ── 卡片字段（项目列表 + 首页展示位）──
  icon: LucideIcon;
  accent: Accent;
  title: Localized;
  tagline: Localized;
  summary: Localized;

  // ── 统计 ──
  durationDays: number;
  lessonCount: number;
  /** 短日期标签，兼作移动端课程表副标题，如 "7.11 开营 — 8.9 结营" */
  dateRange: Localized;

  // ── 详情页字段 ──
  hero: {
    eyebrow: Localized;
    headline: Localized;
    subtitle: Localized;
  };
  /** 桌面端课程表副标题（完整表述） */
  scheduleSubtitle: Localized;

  instructor: ProgramInstructor;
  schedule: ScheduleItem[];
};

export const programs: Program[] = [
  {
    slug: "ecommerce",
    courseId: "course_2026_spring",
    skuId: "standard",
    registrationFormUrl:
      "https://seedao2049.feishu.cn/share/base/form/shrcnExampleProgram",
    status: "enrolling",

    icon: ShoppingCart,
    accent: "amber",
    title: {
      zh: "30天做跨境电商，发展AI第二副业",
      en: "30-Day Cross-Border E-Commerce — Build Your AI Side Hustle",
    },
    tagline: {
      zh: "把 AI 变成你的第二双手",
      en: "Turn AI into your second pair of hands",
    },
    summary: {
      zh: "从零开始做跨境电商。不囤货、不交保证金，用 AI 跑通选品→上架→出单全流程。",
      en: "Start cross-border e-commerce from zero. No inventory, no deposit — run the full pipeline from product selection to sales with AI.",
    },

    durationDays: 30,
    lessonCount: 9,
    dateRange: {
      zh: "7.11 开营 — 8.9 结营",
      en: "Jul 11 kickoff — Aug 9 closing",
    },

    hero: {
      eyebrow: { zh: "SeeDAO AI 共学课", en: "SeeDAO AI Co-Learning" },
      headline: {
        zh: "30天，把 AI 变成你的第二双手",
        en: "30 days to turn AI into your second pair of hands",
      },
      subtitle: {
        zh: "从零开始做跨境电商。不囤货、不交保证金，用 AI 跑通选品→上架→出单全流程。",
        en: "Start cross-border e-commerce from zero. No inventory, no deposit — run the full pipeline from product selection to sales with AI.",
      },
    },
    scheduleSubtitle: {
      zh: "7 月 11 日开营 — 8 月 9 日结营，全程 30 天",
      en: "Kickoff July 11, closing August 9 — 30 days end to end",
    },

    instructor: {
      name: "Jack",
      title: {
        zh: "跨境电商独立创业者 · Ozon 平台店铺主理人",
        en: "Independent Cross-Border Entrepreneur · Ozon Store Owner",
      },
      avatar: "/poster.png",
      bio: {
        zh: "资深前端工程师，十余年开发经验，曾任职于盛大、360。远程独立开发者，AI 实践者。零跨境背景下场，Ozon 店铺月营收 40–50 万卢布、利润率 20%+，日均投入仅 2–3 小时。独立跑通一整套从选品到发货的跨境运营流程——没有团队、没有囤货、没有保证金。",
        en: "Senior frontend engineer with 10+ years of experience at Shanda and 360. Remote independent developer and AI practitioner. Built an Ozon store from zero cross-border background — monthly revenue 400-500K RUB at 20%+ margin, with just 2-3 hours daily. Independently ran the full pipeline from selection to fulfillment — no team, no inventory, no deposit.",
      },
      highlight: {
        zh: "零跨境背景下场，Ozon 店铺月营收 40–50 万卢布，利润率 20%+",
        en: "Zero background → Ozon store 400-500K RUB/month at 20%+ margin",
      },
      tags: [
        { zh: "10+ 年开发经验", en: "10+ years in software" },
        { zh: "远程独立开发者", en: "Remote indie developer" },
      ],
    },

    schedule: [
      {
        id: "s1",
        month: 7,
        date: "7.11 周六",
        time: "20:00-21:30",
        title: "开营仪式 · 第一课：跨境电商是什么？AI能帮你做什么？",
        content: "作业：查国内外产品差价（淘宝 vs Ozon）",
        instructor: "Jack",
      },
      {
        id: "s2",
        month: 7,
        date: "7.14 周二",
        time: "20:00-21:30",
        title: "第二课：选品——找到值得测的产品",
        content: "",
        instructor: "Jack",
      },
      {
        id: "s3",
        month: 7,
        date: "7.16 周四",
        time: "20:00-21:30",
        title: `第三课：上架——把你的产品"摆上货架"`,
        content: "",
        instructor: "Jack",
      },
      {
        id: "s4",
        month: 7,
        date: "7.19 周日",
        time: "20:00-21:30",
        title: "店主夜话",
        content: "",
        instructor: "",
        isEvent: true,
      },
      {
        id: "s5",
        month: 7,
        date: "7.21 周二",
        time: "20:00-21:30",
        title: "第四课：产品图片——用AI生成主图和场景图",
        content: "",
        instructor: "Jack",
      },
      {
        id: "s6",
        month: 7,
        date: "7.23 周四",
        time: "20:00-21:30",
        title: "第五课：产品视频——AI翻译配音 + 图片转视频",
        content: "",
        instructor: "Jack",
      },
      {
        id: "s7",
        month: 7,
        date: "7.26 周日",
        time: "20:00-21:30",
        title: "店主夜话",
        content: "",
        instructor: "",
        isEvent: true,
      },
      {
        id: "s8",
        month: 7,
        date: "7.28 周二",
        time: "20:00-21:30",
        title: "第六课：后台数据 + AI分析——测品决策",
        content: "",
        instructor: "Jack",
      },
      {
        id: "s9",
        month: 7,
        date: "7.30 周四",
        time: "20:00-21:00",
        title: "第七课：发货——测品成功后才发货",
        content: "",
        instructor: "Jack",
      },
      {
        id: "s10",
        month: 8,
        date: "8.2 周日",
        time: "20:00-21:00",
        title: "夜聊分享",
        content: "",
        instructor: "",
        isEvent: true,
      },
      {
        id: "s11",
        month: 8,
        date: "8.4 周二",
        time: "20:00-21:30",
        title: "第八课：平台活动——测品成功后放大销量",
        content: "",
        instructor: "Jack",
      },
      {
        id: "s12",
        month: 8,
        date: "8.6 周四",
        time: "20:00-21:00",
        title: "第九课：运营综合——广告、评价、客服",
        content: "",
        instructor: "Jack",
      },
      {
        id: "s13",
        month: 8,
        date: "8.8 周六",
        time: "20:00-21:00",
        title: "结营 Party",
        content: "",
        instructor: "发起团队",
        isEvent: true,
      },
    ],
  },
];

export function getProgram(slug: string): Program | undefined {
  return programs.find((p) => p.slug === slug);
}

const statusOrder: Record<ProgramStatus, number> = {
  enrolling: 0,
  upcoming: 1,
  ended: 2,
};

/** 列表展示顺序：报名中 → 即将开始 → 已结束 */
export function listPrograms(): Program[] {
  return [...programs].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
}

export function getProgramByCourseId(courseId: string): Program | undefined {
  return programs.find((p) => p.courseId === courseId);
}

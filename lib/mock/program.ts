/** 活动付费项目配置 */

export const projectIntro = {
  title: { zh: "30天做跨境电商，发展AI第二副业", en: "30-Day Cross-Border E-Commerce" },
  subhead: {
    zh: "从零开始做跨境电商。不囤货、不交保证金，用 AI 跑通选品→上架→出单全流程。",
    en: "Start cross-border e-commerce from zero. No inventory, no deposit.",
  },
} as const;

export const programProject = {
  /** 报名表单外链（暂定占位） */
  registrationFormUrl: "https://seedao2049.feishu.cn/share/base/form/shrcnExampleProgram",
  /** 课程 ID（与后端 courses 表一致） */
  courseId: "course_2026_spring",
  /** 票种 ID（与后端 course_skus 表一致） */
  skuId: "standard",
} as const;

export const programPricing = {
  /** 原价（单位：元，仅用于展示划线） */
  basePrice: 599,
  /** 早鸟价（单位：元，实际计算起点），7/12 前有效 */
  earlyBirdPrice: 299,
  /** SEEDAO 会员折扣（8折 = 0.8） */
  memberDiscountRate: 0.8,
  /** 有效优惠码减免金额（元） */
  promoCodeDeduction: 20,
  /** 显示用的货币符号 */
  currency: "¥",
} as const;

export type ScheduleItem = {
  id: string;
  date: string;      // "7.11 周六"
  time: string;      // "20:00-21:30"
  title: string;     // 中文课程标题
  content: string;   // 中文作业/备注
  instructor: string;
  isEvent?: boolean; // 店主夜话/夜聊/结营等非教学环节
};

/** 课程表（30 天，9 节课 + 穿插活动） */
export const schedule: ScheduleItem[] = [
  {
    id: "s1",
    date: "7.25 周五",
    time: "20:00-21:00",
    title: "开营仪式",
    content: "跨境电商是什么？AI能帮你做什么？",
    instructor: "Jack",
  },
  {
    id: "s2",
    date: "7.28 周一",
    time: "20:00-21:30",
    title: "选品——找到值得测的产品",
    content: "",
    instructor: "Jack",
  },
  {
    id: "s3",
    date: "7.30 周三",
    time: "20:00-21:30",
    title: `上架——把你的产品"摆上货架"`,
    content: "",
    instructor: "Jack",
  },
  {
    id: "s4",
    date: "8.2 周日",
    time: "20:00-21:30",
    title: "店主夜话：在社区中做电商",
    content: "",
    instructor: "",
    isEvent: true,
  },
  {
    id: "s5",
    date: "8.4 周二",
    time: "20:00-21:30",
    title: "产品图片——用AI生成主图和场景图",
    content: "",
    instructor: "Jack",
  },
  {
    id: "s6",
    date: "8.6 周四",
    time: "20:00-21:30",
    title: "产品视频——AI翻译配音 + 图片转视频",
    content: "",
    instructor: "Jack",
  },
  {
    id: "s7",
    date: "8.9 周日",
    time: "20:00-21:30",
    title: "店主夜话：AI Generate这件事",
    content: "",
    instructor: "",
    isEvent: true,
  },
  {
    id: "s8",
    date: "8.11 周二",
    time: "20:00-21:30",
    title: "后台数据 + AI分析——测品决策",
    content: "",
    instructor: "Jack",
  },
  {
    id: "s9",
    date: "8.13 周四",
    time: "20:00-21:00",
    title: "发货——测品成功后才发货",
    content: "",
    instructor: "Jack",
  },
  {
    id: "s10",
    date: "8.16 周日",
    time: "20:00-21:00",
    title: "店主夜话：如何当好一名店主？",
    content: "",
    instructor: "",
    isEvent: true,
  },
  {
    id: "s11",
    date: "8.18 周二",
    time: "20:00-21:30",
    title: "平台活动——测品成功后放大销量",
    content: "",
    instructor: "Jack",
  },
  {
    id: "s12",
    date: "8.20 周四",
    time: "20:00-21:00",
    title: "运营综合——广告、评价、客服",
    content: "",
    instructor: "Jack",
  },
  {
    id: "s13",
    date: "8.23 周日",
    time: "20:00-21:00",
    title: "结营 Party",
    content: "",
    instructor: "发起团队",
    isEvent: true,
  },
];

/** 讲师信息 */
export const instructor = {
  name: "Jack",
  title: { zh: "跨境电商独立创业者 · Ozon 平台店铺主理人", en: "Independent Cross-Border Entrepreneur · Ozon Store Owner" },
  avatar: "/poster.webp",
  bio: {
    zh: "资深前端工程师，十余年开发经验，曾任职于盛大、360。远程独立开发者，AI 实践者。零跨境背景下场，Ozon 店铺月营收 40–50 万卢布、利润率 20%+，日均投入仅 2–3 小时。独立跑通一整套从选品到发货的跨境运营流程——没有团队、没有囤货、没有保证金。",
    en: "Senior frontend engineer with 10+ years of experience at Shanda and 360. Remote independent developer and AI practitioner. Built an Ozon store from zero cross-border background — monthly revenue 400-500K RUB at 20%+ margin, with just 2-3 hours daily. Independently ran the full pipeline from selection to fulfillment — no team, no inventory, no deposit.",
  },
  highlight: {
    zh: "零跨境背景下场，Ozon 店铺月营收 40–50 万卢布，利润率 20%+",
    en: "Zero background → Ozon store 400-500K RUB/month at 20%+ margin",
  },
} as const;

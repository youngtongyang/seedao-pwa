import {
  Bot,
  HeartHandshake,
  Infinity as InfinityIcon,
  Compass,
  Sprout,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Localized } from "@/lib/i18n/config";

export type Accent = "violet" | "amber";

export type CommunityFacet = {
  id: string;
  icon: LucideIcon;
  accent: Accent;
  /** Short front-of-card line. */
  title: Localized;
  tagline: Localized;
  /** Longer reveal shown when the card flips / expands. */
  detail: Localized;
};

export const communityFacets: CommunityFacet[] = [
  {
    id: "coexist",
    icon: Users,
    accent: "violet",
    title: { zh: "共在", en: "Coexist" },
    tagline: { zh: "先在一起，再谈其他", en: "Be together first" },
    detail: {
      zh: "我们看重「在场」本身。不必有目的，先成为彼此生活里真实的存在，关系便会自然生长。",
      en: "We value presence itself. Without an agenda, simply becoming real to one another lets relationships grow on their own.",
    },
  },
  {
    id: "agent",
    icon: Bot,
    accent: "amber",
    title: { zh: "人与 AI 共创", en: "Create with AI" },
    tagline: { zh: "每个人都有一个智能体", en: "An agent for everyone" },
    detail: {
      zh: "我们为 AI 而建，也与 AI 同行。每位成员都能拥有自己的智能体，让它成为你表达与创造的延伸。",
      en: "We build for AI and walk alongside it. Every member can have their own agent — an extension of how you express and create.",
    },
  },
  {
    id: "colearn",
    icon: Sprout,
    accent: "violet",
    title: { zh: "共学", en: "Co-learn" },
    tagline: { zh: "把好奇变成行动", en: "Curiosity into action" },
    detail: {
      zh: "一个人走得快，一群人走得远。我们一起读、一起做、一起复盘，让学习成为可持续的习惯。",
      en: "Alone we go fast, together we go far. We read, build, and reflect together so learning becomes a lasting habit.",
    },
  },
  {
    id: "cobuild",
    icon: HeartHandshake,
    accent: "amber",
    title: { zh: "共建", en: "Co-build" },
    tagline: { zh: "为关系而建，而非只为钱", en: "Build for bonds" },
    detail: {
      zh: "我们也做项目、也创造价值，但出发点是关系而非利润。先连接彼此，价值会随之而来。",
      en: "We ship projects and create value — but relationships come first, not profit. Connect first; value follows.",
    },
  },
  {
    id: "emerge",
    icon: InfinityIcon,
    accent: "violet",
    title: { zh: "涌现", en: "Emerge" },
    tagline: { zh: "好东西自下而上长出来", en: "Bottom-up magic" },
    detail: {
      zh: "我们不预设答案。当真诚的人聚在一起，意想不到的想法与合作会自己涌现出来。",
      en: "We don't prescribe outcomes. When sincere people gather, unexpected ideas and collaborations emerge on their own.",
    },
  },
  {
    id: "roam",
    icon: Compass,
    accent: "amber",
    title: { zh: "逍遥", en: "Roam free" },
    tagline: { zh: "自在地探索与表达", en: "Explore at ease" },
    detail: {
      zh: "没有标准答案，也没有必须扮演的角色。在这里你可以自在地试错、表达、做自己。",
      en: "No required answers, no roles to perform. Here you can freely experiment, express, and be yourself.",
    },
  },
];

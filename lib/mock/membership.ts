import {
  Bot,
  CalendarHeart,
  GraduationCap,
  KeyRound,
  MessagesSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Localized } from "@/lib/i18n/config";

export type Benefit = {
  id: string;
  icon: LucideIcon;
  title: Localized;
  desc: Localized;
};

export const membershipPrice = {
  amount: 365,
  currency: "¥",
};

export const benefits: Benefit[] = [
  {
    id: "agent",
    icon: Bot,
    title: { zh: "专属个人智能体", en: "Your own personal agent" },
    desc: {
      zh: "领取并养成一个懂你的 AI 伙伴，陪你思考、记录与成长。",
      en: "Claim and nurture an AI companion that understands you — to think, journal, and grow with.",
    },
  },
  {
    id: "feishu",
    icon: KeyRound,
    title: { zh: "飞书社区空间", en: "Feishu community space" },
    desc: {
      zh: "用飞书一键登录，进入会员专属的协作与交流空间。",
      en: "One-tap Feishu login into the members-only space for collaboration and connection.",
    },
  },
  {
    id: "colearn",
    icon: GraduationCap,
    title: { zh: "共学计划", en: "Co-learning circles" },
    desc: {
      zh: "和伙伴一起读书、拆解、实践，把 AI 真正用起来。",
      en: "Read, unpack, and practice with peers — and actually put AI to work.",
    },
  },
  {
    id: "events",
    icon: CalendarHeart,
    title: { zh: "共创活动", en: "Co-creation gatherings" },
    desc: {
      zh: "线上线下的相遇，认识有趣的人，发起属于你的项目。",
      en: "Online and offline meetups — meet interesting people, start your own project.",
    },
  },
  {
    id: "salon",
    icon: MessagesSquare,
    title: { zh: "深度对话沙龙", en: "Deep-talk salons" },
    desc: {
      zh: "在认真的对话里认识自己，也被他人看见。",
      en: "Know yourself through honest conversation — and be truly seen.",
    },
  },
  {
    id: "early",
    icon: Sparkles,
    title: { zh: "新功能抢先体验", en: "Early access" },
    desc: {
      zh: "第一时间体验社区与 AI 工具的新能力。",
      en: "Be first to try new community features and AI tooling.",
    },
  },
];

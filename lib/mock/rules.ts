import {
  HandHeart,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Localized } from "@/lib/i18n/config";

export type Covenant = {
  id: string;
  icon: LucideIcon;
  /** The short principle. */
  principle: Localized;
  /** Why it matters — the spirit behind it. */
  spirit: Localized;
  /** What it looks like day to day. */
  practice: Localized[];
};

export const covenants: Covenant[] = [
  {
    id: "presence",
    icon: HandHeart,
    principle: { zh: "真诚共在", en: "Be genuinely present" },
    spirit: {
      zh: "我们珍视真实的相遇，而非表演式的活跃。带着真诚出现，就是给社区最好的礼物。",
      en: "We cherish real encounters over performative activity. Showing up sincerely is the best gift you can give.",
    },
    practice: [
      { zh: "用真实的自己交流，不必伪装", en: "Speak as your real self — no masks needed" },
      { zh: "认真倾听，再认真回应", en: "Listen carefully, then respond with care" },
    ],
  },
  {
    id: "respect",
    icon: Users,
    principle: { zh: "尊重差异", en: "Respect differences" },
    spirit: {
      zh: "每个人都来自不同的处境。理解先于评判，让不同成为养分而非隔阂。",
      en: "Everyone comes from a different place. Understanding before judgment turns difference into nourishment.",
    },
    practice: [
      { zh: "对事不对人，就事论事", en: "Address ideas, not people" },
      { zh: "允许他人和自己不一样", en: "Let others be different from you" },
    ],
  },
  {
    id: "contribute",
    icon: Sparkles,
    principle: { zh: "共创而非索取", en: "Contribute, don't just take" },
    spirit: {
      zh: "社区由每个人共同滋养。多分享一点,多托举一点,我们都会因此更丰盛。",
      en: "The community is nourished by everyone. Share a little more, lift others a little more, and we all grow richer.",
    },
    practice: [
      { zh: "把你学到的回馈给社区", en: "Give back what you learn" },
      { zh: "主动托举刚加入的伙伴", en: "Proactively support newcomers" },
    ],
  },
  {
    id: "ai",
    icon: Scale,
    principle: { zh: "善用 AI", en: "Use AI with care" },
    spirit: {
      zh: "AI 是放大善意与创造力的工具。我们用它来连接彼此,而不是制造噪音或伤害。",
      en: "AI amplifies goodwill and creativity. We use it to connect — not to create noise or harm.",
    },
    practice: [
      { zh: "标注由 AI 生成的内容", en: "Label AI-generated content" },
      { zh: "不用 AI 冒充他人或散布不实信息", en: "Never impersonate or spread misinformation" },
    ],
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    principle: { zh: "守护隐私与边界", en: "Protect privacy & boundaries" },
    spirit: {
      zh: "信任是社区的地基。守护好彼此的隐私与边界,我们才能放心地敞开。",
      en: "Trust is the foundation. Guarding each other's privacy and boundaries lets us open up safely.",
    },
    practice: [
      { zh: "未经允许不外传他人信息", en: "Don't share others' info without consent" },
      { zh: "尊重「不」,边界即是关心", en: "Respect a 'no' — boundaries are care" },
    ],
  },
];

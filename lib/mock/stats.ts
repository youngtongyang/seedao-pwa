import type { Localized } from "@/lib/i18n/config";

export type Stat = { value: string; label: Localized };

export const heroStats: Stat[] = [
  { value: "1,200+", label: { zh: "活跃成员", en: "Active members" } },
  { value: "800+", label: { zh: "个人智能体", en: "Personal agents" } },
  { value: "120+", label: { zh: "共创活动", en: "Co-creations" } },
];

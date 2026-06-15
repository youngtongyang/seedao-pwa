import type { Localized } from "@/lib/i18n/config";

export type Stat = { value: string; label: Localized };

export const heroStats: Stat[] = [
  { value: "170+", label: { zh: "活跃成员", en: "Active members" } },
];

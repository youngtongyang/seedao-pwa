import type { Localized } from "@/lib/i18n/config";

export type Stat = { value: string; label: Localized };

export const heroStats: Stat[] = [
  { value: "776", label: { zh: "活跃成员", en: "Active members" } },
];

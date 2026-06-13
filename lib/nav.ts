import {
  BookOpen,
  Compass,
  Home,
  ScrollText,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Messages } from "@/lib/i18n/messages";

type NavKey = keyof Messages["nav"];

export type NavItem = {
  id: string;
  href: string;
  labelKey: NavKey;
  icon: LucideIcon;
};

/** Primary navigation shown in the desktop header. */
export const primaryNav: NavItem[] = [
  { id: "home", href: "/", labelKey: "home", icon: Home },
  { id: "community", href: "/#community", labelKey: "community", icon: Sparkles },
  { id: "rules", href: "/#rules", labelKey: "rules", icon: ScrollText },
  { id: "docs", href: "/docs", labelKey: "docs", icon: BookOpen },
  { id: "onboarding", href: "/onboarding", labelKey: "onboarding", icon: Compass },
];

/** Bottom tab bar for the mobile system. */
export const tabNav: NavItem[] = [
  { id: "home", href: "/", labelKey: "home", icon: Home },
  { id: "docs", href: "/docs", labelKey: "docs", icon: BookOpen },
  { id: "onboarding", href: "/onboarding", labelKey: "onboarding", icon: Compass },
  { id: "login", href: "/login", labelKey: "login", icon: UserRound },
];

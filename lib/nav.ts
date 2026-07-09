import {
  BookOpen,
  Home,
  ScrollText,
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
  /** When true, the link points to an external site and opens in a new tab. */
  external?: boolean;
};

/** External community wiki (Feishu). Docs entries link here directly. */
const DOCS_URL = "https://seedao2049.feishu.cn/wiki/Dgh2w1AJiieOgWk1eKRcWQBenSb";

/** Primary navigation shown in the desktop header. */
export const primaryNav: NavItem[] = [
  { id: "home", href: "/", labelKey: "home", icon: Home },
  { id: "proposals", href: "/proposals", labelKey: "proposals", icon: ScrollText },
  { id: "docs", href: DOCS_URL, labelKey: "docs", icon: BookOpen, external: true },
];

/** Bottom tab bar for the mobile system. */
export const tabNav: NavItem[] = [
  { id: "home", href: "/", labelKey: "home", icon: Home },
  { id: "proposals", href: "/proposals", labelKey: "proposals", icon: ScrollText },
  { id: "docs", href: DOCS_URL, labelKey: "docs", icon: BookOpen, external: true },
  { id: "login", href: "/login", labelKey: "login", icon: UserRound },
];

import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  Home,
  ScrollText,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Messages } from "@/lib/i18n/messages";

type NavKey = keyof Messages["nav"];

export type NavChild = {
  id: string;
  href: string;
  labelKey: NavKey;
  /** Always open in a new tab for service links. */
  external?: boolean;
};

export type NavItem = {
  id: string;
  href: string;
  labelKey: NavKey;
  icon: LucideIcon;
  /** When true, the link points to an external site and opens in a new tab. */
  external?: boolean;
  /** Optional dropdown children (e.g. Services). */
  children?: NavChild[];
};

/** External community wiki (Feishu). Docs entries link here directly. */
const DOCS_URL = "https://seedao2049.feishu.cn/wiki/Dgh2w1AJiieOgWk1eKRcWQBenSb";

/**
 * Service deep-links — replace with final Feishu / wiki URLs before launch.
 * Kept as named constants so ops can update without hunting through JSX.
 */
export const SERVICE_LINKS = {
  groups: "https://seedao2049.feishu.cn/wiki/I9i4wUZ0GiWDkkkOpulcLAQlnSB",
  cityContacts: "https://seedao2049.feishu.cn/wiki/N2W9wifA6iCguZkvL68cMDYgnvc",
  governanceNodes: "https://seedao2049.feishu.cn/wiki/JUZ6wz4gEiZsuCkXfNqc8Yjjnad",
} as const;

/** Primary navigation shown in the desktop header. */
export const primaryNav: NavItem[] = [
  { id: "home", href: "/", labelKey: "home", icon: Home },
  {
    id: "services",
    href: "#",
    labelKey: "services",
    icon: Users,
    children: [
      {
        id: "service-groups",
        href: SERVICE_LINKS.groups,
        labelKey: "serviceGroups",
        external: true,
      },
      {
        id: "service-city",
        href: SERVICE_LINKS.cityContacts,
        labelKey: "serviceCityContacts",
        external: true,
      },
      {
        id: "service-governance",
        href: SERVICE_LINKS.governanceNodes,
        labelKey: "serviceGovernanceNodes",
        external: true,
      },
    ],
  },
  { id: "proposals", href: "/proposals", labelKey: "proposals", icon: ScrollText },
  { id: "program", href: "/program", labelKey: "program", icon: GraduationCap },
  { id: "docs", href: DOCS_URL, labelKey: "docs", icon: BookOpen, external: true },
];

/** Bottom tab bar for the mobile system. */
export const tabNav: NavItem[] = [
  { id: "home", href: "/", labelKey: "home", icon: Home },
  { id: "proposals", href: "/proposals", labelKey: "proposals", icon: ScrollText },
  { id: "program", href: "/program", labelKey: "program", icon: GraduationCap },
  { id: "login", href: "/login", labelKey: "login", icon: UserRound },
];

export { ChevronDown };

import type { ComponentType, SVGProps } from "react";
import type { AdminResource } from "@yompi/shared";
import { CostIcon, DashboardIcon, PermitIcon, StayIcon, TrekIcon } from "../components/icons";

export type ResourceCounts = Record<AdminResource, number>;

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  countKey?: AdminResource;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export interface Crumb {
  label: string;
  href?: string;
}

export const NAV_GROUPS: NavGroup[] = [
  { heading: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: DashboardIcon }] },
  {
    heading: "Trek data",
    items: [
      { href: "/admin/treks", label: "Treks", icon: TrekIcon, countKey: "treks" },
      { href: "/admin/permits", label: "Permits", icon: PermitIcon, countKey: "permits" },
      { href: "/admin/costs", label: "Costs", icon: CostIcon, countKey: "costs" },
      { href: "/admin/stays", label: "Stays", icon: StayIcon, countKey: "stays" },
    ],
  },
];

const SECTION_LABEL: Record<string, string> = {
  treks: "Treks",
  permits: "Permits",
  costs: "Costs",
  stays: "Stays",
};

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function breadcrumbsFor(pathname: string): Crumb[] {
  const [, section, page] = pathname.split("/").filter(Boolean);
  if (!section) return [{ label: "Dashboard" }];

  const crumbs: Crumb[] = [
    { label: "Admin", href: "/admin" },
    { label: SECTION_LABEL[section] ?? section, href: page ? `/admin/${section}` : undefined },
  ];
  if (page) crumbs.push({ label: page === "new" ? "Add new" : "Edit" });

  return crumbs;
}

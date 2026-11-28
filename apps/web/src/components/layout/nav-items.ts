export const NAV_ITEMS = [
  { href: "/", label: "Explore map" },
  { href: "/treks", label: "Treks" },
  { href: "/stays", label: "Stays" },
  { href: "/conditions", label: "Trail conditions" },
];

export const ACCOUNT_ITEM = { href: "/adventures", label: "My adventures" };

export function isNavItemActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

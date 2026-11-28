"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-2 lg:flex">
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "px-4 py-2 text-sm transition-colors hover:bg-surface-muted",
            isNavItemActive(pathname, href) && "bg-primary/30 font-medium",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

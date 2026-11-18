"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Explore map" },
  { href: "/treks", label: "Treks" },
  { href: "/stays", label: "Stays" },
  { href: "/conditions", label: "Trail conditions" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-2 lg:flex">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-4 py-2 text-sm transition-colors hover:bg-surface-muted",
              active && "bg-primary/30 font-medium",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

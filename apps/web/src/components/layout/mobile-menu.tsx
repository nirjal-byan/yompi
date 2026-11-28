"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ACCOUNT_ITEM, NAV_ITEMS, isNavItemActive } from "./nav-items";

const MENU_ID = "mobile-menu";

export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={MENU_ID}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-10 w-10 items-center justify-center border border-border-soft bg-surface text-xl hover:bg-surface-muted"
      >
        <span aria-hidden>{open ? "×" : "☰"}</span>
      </button>

      {open && (
        <nav
          id={MENU_ID}
          aria-label="Menu"
          className="absolute inset-x-0 top-full z-30 border-b border-border bg-background shadow-lg"
        >
          <ul className="flex flex-col px-4 py-2">
            {[...NAV_ITEMS, ACCOUNT_ITEM].map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block px-3 py-3 text-base hover:bg-surface-muted",
                    isNavItemActive(pathname, href) && "bg-primary/30 font-medium",
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

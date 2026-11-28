import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "./brand";
import { MobileMenu } from "./mobile-menu";
import { ACCOUNT_ITEM } from "./nav-items";
import { NavLinks } from "./nav-links";
import { NavbarActions } from "./navbar-actions";

export function Navbar() {
  return (
    <header className="relative border-b border-border-soft bg-background">
      <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6">
        <Brand />

        <Suspense fallback={<div className="hidden lg:block" />}>
          <NavLinks />
        </Suspense>
        <div className="flex items-center gap-2 sm:gap-5">
          <span className="hidden text-xs text-muted lg:inline">NPR ▾</span>
          <Link href={ACCOUNT_ITEM.href} className="hidden text-sm font-medium lg:inline">
            {ACCOUNT_ITEM.label}
          </Link>

          <Suspense fallback={<div className="h-10 w-20 sm:w-28" aria-hidden />}>
            <NavbarActions />
          </Suspense>

          <Suspense fallback={<div className="h-10 w-10 lg:hidden" aria-hidden />}>
            <MobileMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";
import { NavbarActions } from "./navbar-actions";

export function Navbar() {
  return (
    <header className="border-b border-border-soft bg-background">
      <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-6 px-6">
        <Brand />
        {/* usePathname reads the URL at request time, so it streams in behind a boundary. */}
        <Suspense fallback={<div className="hidden lg:block" />}>
          <NavLinks />
        </Suspense>
        <div className="flex items-center gap-5">
          <span className="hidden text-xs text-muted sm:inline">NPR ▾</span>
          <Link href="/adventures" className="hidden text-sm font-medium sm:inline">
            My adventures
          </Link>
          {/* The session is read at request time; the placeholder keeps the bar from jumping. */}
          <Suspense fallback={<div className="h-10 w-28" aria-hidden />}>
            <NavbarActions />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

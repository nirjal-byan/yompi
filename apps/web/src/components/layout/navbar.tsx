import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

export function Navbar() {
  return (
    <header className="border-b border-border-soft bg-background">
      <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-6 px-6">
        <Brand />
        <NavLinks />
        <div className="flex items-center gap-5">
          <span className="hidden text-xs text-muted sm:inline">NPR ▾</span>
          <Link href="/adventures" className="hidden text-sm font-medium sm:inline">
            My adventures
          </Link>
          <ButtonLink href="/treks" className="h-10">
            Plan a trek <span aria-hidden>↗</span>
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

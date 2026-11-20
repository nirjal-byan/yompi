"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentType, type ReactNode, type SVGProps, useEffect, useState } from "react";
import { logout } from "@/features/auth/services/auth-api";
import { cn } from "@/lib/cn";
import { adminApi } from "../services/admin-api";
import { CostIcon, CloseIcon, DashboardIcon, ExternalIcon, MenuIcon, PermitIcon, SignOutIcon, TrekIcon } from "./icons";

type CountKey = "treks" | "permits" | "costs";
type NavItem = { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; count?: CountKey };

const NAV: Array<{ heading: string; items: NavItem[] }> = [
  { heading: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: DashboardIcon }] },
  {
    heading: "Trek data",
    items: [
      { href: "/admin/treks", label: "Treks", icon: TrekIcon, count: "treks" },
      { href: "/admin/permits", label: "Permits", icon: PermitIcon, count: "permits" },
      { href: "/admin/costs", label: "Costs", icon: CostIcon, count: "costs" },
    ],
  },
];

const SECTION_LABEL: Record<string, string> = { treks: "Treks", permits: "Permits", costs: "Costs" };

/** "Admin / Treks / Edit" from the current URL. */
function breadcrumbs(pathname: string): Array<{ label: string; href?: string }> {
  const [, section, third] = pathname.split("/").filter(Boolean);
  const crumbs: Array<{ label: string; href?: string }> = [{ label: "Admin", href: "/admin" }];
  if (!section) return [{ label: "Dashboard" }];
  crumbs.push({ label: SECTION_LABEL[section] ?? section, href: third ? `/admin/${section}` : undefined });
  if (third) crumbs.push({ label: third === "new" ? "Add new" : "Edit" });
  return crumbs;
}

interface SidebarProps {
  pathname: string;
  counts: Record<CountKey, number> | null;
  name: string;
  email: string;
  onNavigate: () => void;
  onSignOut: () => void;
}

function Sidebar({ pathname, counts, name, email, onNavigate, onSignOut }: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" onClick={onNavigate} className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <Image src="/brand/yompi-mark.png" alt="" width={34} height={31} />
        <span className="leading-none">
          <span className="font-display text-3xl lowercase">yompi</span>
          <span className="mt-1 block font-mono text-[9px] tracking-widest text-primary uppercase">Admin panel</span>
        </span>
      </Link>

      <nav aria-label="Admin sections" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6">
        {NAV.map((group) => (
          <div key={group.heading}>
            <p className="mb-2 px-3 font-mono text-[10px] tracking-wider text-background/50 uppercase">{group.heading}</p>
            <ul className="flex flex-col gap-1">
              {group.items.map(({ href, label, icon: ItemIcon, count }) => {
                const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                        active ? "bg-primary font-medium text-foreground" : "text-background/80 hover:bg-white/10 hover:text-background",
                      )}
                    >
                      <ItemIcon />
                      <span className="flex-1">{label}</span>
                      {count && counts && (
                        <span className={cn("px-1.5 font-mono text-[11px]", active ? "bg-foreground/15" : "bg-white/15")}>{counts[count]}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 flex-col gap-1 border-t border-white/10 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-background/80 transition-colors hover:bg-white/10 hover:text-background"
        >
          <ExternalIcon />
          View the site
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 text-left text-sm text-background/80 transition-colors hover:bg-white/10 hover:text-background"
        >
          <SignOutIcon />
          Sign out
        </button>
        <div className="mt-2 flex items-center gap-3 border-t border-white/10 px-3 pt-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary font-semibold text-foreground" aria-hidden>
            {(name || email).charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-[11px] text-background/60">{email}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ name, email, children }: { name: string; email: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Record<CountKey, number> | null>(null);

  // Keep the sidebar counts fresh as you move around (cheap request).
  useEffect(() => {
    let cancelled = false;
    adminApi
      .overview()
      .then((overview) => !cancelled && setCounts(overview.counts))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut() {
    await logout();
    router.replace("/join");
    router.refresh();
  }

  const sidebar = (
    <Sidebar pathname={pathname} counts={counts} name={name} email={email} onNavigate={() => setOpen(false)} onSignOut={signOut} />
  );
  const crumbs = breadcrumbs(pathname);

  return (
    <div className="flex min-h-dvh flex-1 bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 bg-foreground text-background lg:block">{sidebar}</aside>

      {/* Phone drawer */}
      {open && (
        <div className="lg:hidden">
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-foreground/50" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-foreground text-background shadow-xl" aria-label="Menu">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-3 p-1.5 text-background/80 hover:bg-white/10"
            >
              <CloseIcon />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border-soft bg-background/95 px-4 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="border border-border-soft bg-surface p-2 hover:bg-surface-muted lg:hidden"
            >
              <MenuIcon />
            </button>
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-2 text-sm">
                {crumbs.map((crumb, index) => (
                  <li key={crumb.label} className="flex min-w-0 items-center gap-2">
                    {index > 0 && <span className="text-muted" aria-hidden>/</span>}
                    {crumb.href ? (
                      <Link href={crumb.href} className="truncate text-muted hover:text-foreground hover:underline">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="truncate font-medium" aria-current="page">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <Link href="/" className="hidden items-center gap-1.5 text-sm underline sm:inline-flex">
            View site <ExternalIcon width={14} height={14} />
          </Link>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

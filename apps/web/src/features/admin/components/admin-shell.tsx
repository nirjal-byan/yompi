"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { logout } from "@/features/auth/services/auth-api";
import { useResourceCounts } from "../hooks/use-resource-counts";
import { AdminBreadcrumbs } from "./admin-breadcrumbs";
import { AdminSidebar } from "./admin-sidebar";
import { CloseIcon, ExternalIcon, MenuIcon } from "./icons";

interface AdminShellProps {
  name: string;
  email: string;
  children: ReactNode;
}

function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onEscape();
    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, onEscape]);
}

export function AdminShell({ name, email, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const counts = useResourceCounts(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  useEscapeKey(menuOpen, closeMenu);

  async function signOut() {
    await logout();
    router.replace("/join");
    router.refresh();
  }

  const sidebar = (
    <AdminSidebar
      pathname={pathname}
      counts={counts}
      name={name}
      email={email}
      onNavigate={closeMenu}
      onSignOut={signOut}
    />
  );

  return (
    <div className="flex min-h-dvh flex-1 bg-background">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 bg-foreground text-background lg:block">
        {sidebar}
      </aside>

      {menuOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-foreground/50"
            onClick={closeMenu}
          />
          <aside
            className="fixed inset-y-0 left-0 z-40 w-64 bg-foreground text-background shadow-xl"
            aria-label="Menu"
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeMenu}
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
              onClick={() => setMenuOpen(true)}
              className="border border-border-soft bg-surface p-2 hover:bg-surface-muted lg:hidden"
            >
              <MenuIcon />
            </button>
            <AdminBreadcrumbs pathname={pathname} />
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

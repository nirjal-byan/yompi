import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  NAV_GROUPS,
  type NavItem,
  type ResourceCounts,
  isActivePath,
} from "../lib/admin-navigation";
import { ExternalIcon, SignOutIcon } from "./icons";

const FOOTER_LINK_CLASS =
  "flex items-center gap-3 px-3 py-2.5 text-left text-sm text-background/80 transition-colors hover:bg-white/10 hover:text-background";

interface AdminSidebarProps {
  pathname: string;
  counts: ResourceCounts | null;
  name: string;
  email: string;
  onNavigate: () => void;
  onSignOut: () => void;
}

function SidebarBrand({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5"
    >
      <Image src="/brand/yompi-mark.png" alt="" width={34} height={31} />
      <span className="leading-none">
        <span className="font-display text-3xl lowercase">yompi</span>
        <span className="mt-1 block font-mono text-[9px] tracking-widest text-primary uppercase">
          Admin panel
        </span>
      </span>
    </Link>
  );
}

function SidebarLink({
  item,
  active,
  count,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  count?: number;
  onNavigate: () => void;
}) {
  const { href, label, icon: Icon } = item;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-primary font-medium text-foreground"
          : "text-background/80 hover:bg-white/10 hover:text-background",
      )}
    >
      <Icon />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "px-1.5 font-mono text-[11px]",
            active ? "bg-foreground/15" : "bg-white/15",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function SidebarUser({ name, email }: { name: string; email: string }) {
  return (
    <div className="mt-2 flex items-center gap-3 border-t border-white/10 px-3 pt-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary font-semibold text-foreground"
        aria-hidden
      >
        {(name || email).charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="block truncate text-[11px] text-background/60">{email}</span>
      </span>
    </div>
  );
}

export function AdminSidebar({
  pathname,
  counts,
  name,
  email,
  onNavigate,
  onSignOut,
}: AdminSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <SidebarBrand onNavigate={onNavigate} />

      <nav
        aria-label="Admin sections"
        className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="mb-2 px-3 font-mono text-[10px] tracking-wider text-background/50 uppercase">
              {group.heading}
            </p>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarLink
                    item={item}
                    active={isActivePath(pathname, item.href)}
                    count={item.countKey && counts ? counts[item.countKey] : undefined}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 flex-col gap-1 border-t border-white/10 p-3">
        <Link href="/" onClick={onNavigate} className={FOOTER_LINK_CLASS}>
          <ExternalIcon />
          View the site
        </Link>
        <button type="button" onClick={onSignOut} className={FOOTER_LINK_CLASS}>
          <SignOutIcon />
          Sign out
        </button>
        <SidebarUser name={name} email={email} />
      </div>
    </div>
  );
}

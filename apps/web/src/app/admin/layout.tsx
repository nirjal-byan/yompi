import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getCurrentUser } from "@/features/auth/services/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-background px-6">
      {children}
    </main>
  );
}

async function AdminGate({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/join");

  if (!user.isAdmin) {
    return (
      <Centered>
        <div className="flex w-full max-w-md flex-col items-start gap-3 border border-border bg-surface p-8">
          <Image src="/brand/yompi-mark.png" alt="" width={44} height={40} />
          <h1 className="font-display text-3xl font-semibold">This area is private</h1>
          <p className="text-muted">
            You are signed in as {user.email}, which does not have admin access.
          </p>
          <Link href="/" className="underline">
            Back to the site
          </Link>
        </div>
      </Centered>
    );
  }
  return (
    <AdminShell name={user.name} email={user.email}>
      {children}
    </AdminShell>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <Centered>
          <p className="text-muted">Loading…</p>
        </Centered>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

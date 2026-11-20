import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getCurrentUser } from "@/features/auth/services/session";

export const metadata: Metadata = { title: "My adventures" };

async function Adventures() {
  const user = await getCurrentUser();
  if (!user) redirect("/join");

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="font-mono text-[11px] uppercase text-accent">My adventures</p>
      <h1 className="font-display text-4xl font-semibold">Welcome, {user.name}.</h1>
      <p className="text-muted">Signed in as {user.email}. Saved trips will appear here.</p>
      <LogoutButton />
    </div>
  );
}

export default function AdventuresPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-12">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Adventures />
      </Suspense>
    </main>
  );
}

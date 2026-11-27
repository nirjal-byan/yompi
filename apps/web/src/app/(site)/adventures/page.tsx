import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getCurrentUser } from "@/features/auth/services/session";
import { SavedTrekList } from "@/features/saved-treks/components/saved-trek-list";
import { fetchSavedSlugs } from "@/features/saved-treks/services/saved-treks-api";
import { getTreks } from "@/features/treks/services/treks-api";

export const metadata: Metadata = { title: "My adventures" };

async function loadSavedTreks() {
  const cookie = (await cookies()).toString();
  const [slugs, treks] = await Promise.all([fetchSavedSlugs({ headers: { cookie } }), getTreks()]);

  return (slugs ?? []).flatMap((slug) => treks.filter((trek) => trek.slug === slug));
}

async function Adventures() {
  const user = await getCurrentUser();
  if (!user) redirect("/join");

  const savedTreks = await loadSavedTreks().catch(() => null);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="font-mono text-[11px] uppercase text-accent">My adventures</p>
      <h1 className="font-display text-4xl font-semibold">Welcome, {user.name}.</h1>
      <p className="text-muted">Signed in as {user.email}.</p>
      <h2 className="font-display text-2xl font-semibold">Saved treks</h2>
      {savedTreks ? (
        <SavedTrekList treks={savedTreks} />
      ) : (
        <p className="text-muted">Your saved treks could not be loaded right now.</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {user.isAdmin && (
          <ButtonLink href="/admin" variant="dark">
            Open the admin panel
          </ButtonLink>
        )}
        <LogoutButton />
      </div>
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

import type { Metadata } from "next";
import { Suspense } from "react";
import { BreadcrumbTrail } from "@/features/treks/components/breadcrumb-trail";
import { StaysExplorer } from "@/features/stays/components/stays-explorer";
import { getStays } from "@/features/stays/services/stays-api";

export const metadata: Metadata = { title: "Stays" };

async function StayList() {
  const stays = await getStays().catch(() => null);

  if (!stays) return <p className="text-muted">Stays could not be loaded right now.</p>;
  if (stays.length === 0) {
    return (
      <p className="border border-border-soft bg-surface p-6 text-sm text-muted">
        No stays have been added yet. We only list teahouses and lodges that come with a source.
      </p>
    );
  }

  return <StaysExplorer stays={stays} />;
}

export default function StaysPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-6 py-8">
      <BreadcrumbTrail items={[{ label: "Explore Nepal", href: "/" }, { label: "Stays" }]} />
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          Where to rest your legs.
        </h1>
        <p className="text-muted">Teahouses and lodges along each trek, with cited sources.</p>
      </header>
      <Suspense fallback={<p className="text-muted">Loading stays…</p>}>
        <StayList />
      </Suspense>
    </main>
  );
}

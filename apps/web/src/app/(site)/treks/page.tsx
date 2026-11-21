import type { Metadata } from "next";
import { Suspense } from "react";
import { TrekCard } from "@/features/treks/components/trek-card";
import { getTreks } from "@/features/treks/services/treks-api";

export const metadata: Metadata = { title: "Treks" };

async function TrekList() {
  const treks = await getTreks().catch(() => null);

  if (!treks) return <p className="text-muted">Treks could not be loaded right now.</p>;
  if (treks.length === 0) return <p className="text-muted">No treks have been added yet.</p>;

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {treks.map((trek) => (
        <li key={trek.slug}>
          <TrekCard trek={trek} />
        </li>
      ))}
    </ul>
  );
}

export default function TreksPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[11px] text-accent uppercase">Treks</p>
        <h1 className="font-display text-4xl font-semibold">Pick your Himalayan trail</h1>
        <p className="text-muted">Durations, permits and costs all come with a cited source.</p>
      </header>
      <Suspense fallback={<p className="text-muted">Loading treks…</p>}>
        <TrekList />
      </Suspense>
    </main>
  );
}

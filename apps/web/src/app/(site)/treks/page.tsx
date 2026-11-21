import type { Metadata } from "next";
import { Suspense } from "react";
import { TreksOverview } from "@/features/treks/components/treks-overview";
import { getTreks } from "@/features/treks/services/treks-api";

export const metadata: Metadata = { title: "Treks" };

async function TrekList() {
  const treks = await getTreks().catch(() => null);

  if (!treks) return <p className="text-muted">Treks could not be loaded right now.</p>;
  if (treks.length === 0) return <p className="text-muted">No treks have been added yet.</p>;

  return <TreksOverview treks={treks} />;
}

export default function TreksPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
      <Suspense fallback={<p className="text-muted">Loading treks…</p>}>
        <TrekList />
      </Suspense>
    </main>
  );
}

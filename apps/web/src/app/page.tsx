import { Suspense } from "react";
import { ApiStatus } from "@/features/health/components/api-status";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-semibold">YOMPI</h1>
      <p className="text-lg text-zinc-600">Your Himalayan Adventure Buddy</p>
      <Suspense fallback={<p className="text-sm text-zinc-600">API: checking…</p>}>
        <ApiStatus />
      </Suspense>
    </main>
  );
}

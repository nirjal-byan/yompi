import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TrekPlanning } from "@/features/map/components/trek-info";
import { formatDays, formatRoute } from "@/features/treks/lib/format";
import { getTrekInfo, getTreks } from "@/features/treks/services/treks-api";

interface TrekPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = { title: "Trek details" };

async function TrekDetails({ params }: TrekPageProps) {
  const { slug } = await params;
  const treks = await getTreks().catch(() => []);
  const trek = treks.find((candidate) => candidate.slug === slug);
  if (!trek) notFound();

  const info = await getTrekInfo(trek.trailId).catch(() => null);
  const route = formatRoute(trek);

  return (
    <article className="flex max-w-[640px] flex-col gap-3">
      <p className="font-mono text-[11px] text-accent uppercase">{trek.region}</p>
      <h1 className="font-display text-4xl font-semibold">{trek.name}</h1>
      <p className="text-muted">
        {formatDays(trek)}
        {route ? ` · ${route}` : ""}
      </p>
      <TrekPlanning trek={info} loaded />
      <Link href="/" className="text-sm underline">
        See it on the map
      </Link>
    </article>
  );
}

export default function TrekPage(props: TrekPageProps) {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-12">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <TrekDetails {...props} />
      </Suspense>
    </main>
  );
}

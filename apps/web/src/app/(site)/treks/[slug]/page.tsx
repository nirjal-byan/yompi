import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TrekDetail } from "@/features/treks/components/trek-detail";
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

  const info = await getTrekInfo(trek.slug).catch(() => null);

  return <TrekDetail trek={trek} info={info} />;
}

export default function TrekPage(props: TrekPageProps) {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <TrekDetails {...props} />
      </Suspense>
    </main>
  );
}

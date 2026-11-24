import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BreadcrumbTrail } from "@/features/treks/components/breadcrumb-trail";
import { CompareTable } from "@/features/treks/components/compare-table";
import { MIN_COMPARED_TREKS, parseCompareSlugs } from "@/features/treks/lib/compare";
import { getTrekInfo, getTreks } from "@/features/treks/services/treks-api";

export const metadata: Metadata = { title: "Compare trails" };

interface ComparePageProps {
  searchParams: Promise<{ treks?: string }>;
}

async function Comparison({ searchParams }: ComparePageProps) {
  const { treks: param } = await searchParams;
  const all = await getTreks().catch(() => null);
  if (!all) return <p className="text-muted">Treks could not be loaded right now.</p>;

  const slugs = parseCompareSlugs(
    param,
    all.map((trek) => trek.slug),
  );
  if (slugs.length < MIN_COMPARED_TREKS) {
    return (
      <p className="text-muted">
        Pick at least two treks to compare.{" "}
        <Link href="/treks" className="underline">
          Back to treks
        </Link>
      </p>
    );
  }

  const compared = await Promise.all(
    slugs.flatMap((slug) => {
      const summary = all.find((trek) => trek.slug === slug);

      return summary
        ? [
            getTrekInfo(slug).then(
              (info) => ({ summary, info }),
              () => ({ summary, info: null }),
            ),
          ]
        : [];
    }),
  );

  return <CompareTable treks={compared} />;
}

export default function ComparePage(props: ComparePageProps) {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-6 py-8">
      <BreadcrumbTrail
        items={[
          { label: "Explore Nepal", href: "/" },
          { label: "Treks", href: "/treks" },
          { label: "Compare" },
        ]}
      />
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Compare the challenge.</h1>
      <Suspense fallback={<p className="text-muted">Loading comparison…</p>}>
        <Comparison {...props} />
      </Suspense>
    </main>
  );
}

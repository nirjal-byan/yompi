import type { Metadata } from "next";
import { Suspense } from "react";
import { isSampleSource } from "@yompi/shared";
import { SampleDataBanner } from "@/components/ui/sample-data-banner";
import { ConditionsExplorer } from "@/features/conditions/components/conditions-explorer";
import { getConditions } from "@/features/conditions/services/conditions-api";
import { BreadcrumbTrail } from "@/features/treks/components/breadcrumb-trail";

export const metadata: Metadata = { title: "Trail conditions" };

async function ConditionList() {
  const conditions = await getConditions().catch(() => null);

  if (!conditions) return <p className="text-muted">Conditions could not be loaded right now.</p>;
  if (conditions.length === 0) {
    return (
      <p className="border border-border-soft bg-surface p-6 text-sm text-muted">
        No condition reports have been added yet. We only show reports that come with a source and a
        check date.
      </p>
    );
  }

  return (
    <>
      {conditions.some((condition) => isSampleSource(condition.source.url)) && (
        <SampleDataBanner>
          Reports titled &ldquo;Sample&rdquo; are invented examples, not live trail information.
          Never plan a trek or judge safety from them.
        </SampleDataBanner>
      )}
      <ConditionsExplorer conditions={conditions} />
    </>
  );
}

export default function ConditionsPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-6 py-8">
      <BreadcrumbTrail
        items={[{ label: "Explore Nepal", href: "/" }, { label: "Trail conditions" }]}
      />
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Know before you go.</h1>
        <p className="text-muted">
          Weather notes, advisories and trail reports. Anything older than 30 days is marked as
          possibly out of date, so always confirm locally before setting off.
        </p>
      </header>
      <Suspense fallback={<p className="text-muted">Loading reports…</p>}>
        <ConditionList />
      </Suspense>
    </main>
  );
}

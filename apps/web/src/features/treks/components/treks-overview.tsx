import type { TrekSummary } from "@yompi/shared";
import { findTrekImage } from "../lib/trek-image";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { TreksExplorer } from "./treks-explorer";

function imagesBySlug(treks: TrekSummary[]): Record<string, string | null> {
  return Object.fromEntries(treks.map((trek) => [trek.slug, findTrekImage(trek.slug)]));
}

export function TreksOverview({ treks }: { treks: TrekSummary[] }) {
  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbTrail items={[{ label: "Explore Nepal", href: "/" }, { label: "Treks" }]} />
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Find your kind of epic.</h1>
      <TreksExplorer treks={treks} images={imagesBySlug(treks)} />
    </div>
  );
}

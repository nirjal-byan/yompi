import type { TrekPhotoInfo, TrekSummary } from "@yompi/shared";
import { type TrekImage, findTrekImage } from "../lib/trek-image";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { TreksExplorer } from "./treks-explorer";

function imagesBySlug(
  treks: TrekSummary[],
  photos: TrekPhotoInfo[],
): Record<string, TrekImage | null> {
  return Object.fromEntries(treks.map((trek) => [trek.slug, findTrekImage(trek.slug, photos)]));
}

export function TreksOverview({
  treks,
  photos,
}: {
  treks: TrekSummary[];
  photos: TrekPhotoInfo[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbTrail items={[{ label: "Explore Nepal", href: "/" }, { label: "Treks" }]} />
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Find your kind of epic.</h1>
      <TreksExplorer treks={treks} images={imagesBySlug(treks, photos)} />
    </div>
  );
}

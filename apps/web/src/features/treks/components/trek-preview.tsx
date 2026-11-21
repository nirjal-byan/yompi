import type { TrekSummary } from "@yompi/shared";
import { ButtonLink } from "@/components/ui/button";
import { formatDays, formatMetres, formatNpr, formatRoute } from "../lib/format";
import { TrekPhoto } from "./trek-photo";

export const PREVIEW_HEIGHT_CLASS = "lg:h-[380px]";
const MISSING_VALUE = "—";

interface TrekPreviewProps {
  trek: TrekSummary;
  imageSrc: string | null;
}

function PreviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="shrink-0 font-mono text-[10px] text-muted uppercase">{label}</dt>
      <dd className="truncate text-right font-semibold">{value}</dd>
    </div>
  );
}

export function TrekPreview({ trek, imageSrc }: TrekPreviewProps) {
  return (
    <section
      aria-label={`${trek.name} preview`}
      className={`grid gap-4 lg:grid-cols-[1fr_340px] ${PREVIEW_HEIGHT_CLASS}`}
    >
      <TrekPhoto
        src={imageSrc}
        alt={`${trek.name} landscape`}
        caption={`Photo illustration · ${trek.region}`}
        className="h-[240px] lg:h-full"
      />

      <div className="flex min-h-0 flex-col gap-4 overflow-hidden border border-border bg-primary/25 p-6">
        <div>
          <p className="truncate font-mono text-[10px] text-accent uppercase">{trek.region}</p>
          <h2 className="mt-1 line-clamp-2 font-display text-3xl leading-tight font-semibold">
            {trek.name}
          </h2>
        </div>

        <p className="line-clamp-3 min-h-[3.75rem] text-sm text-muted">{trek.notes ?? ""}</p>

        <dl className="flex flex-col gap-2 border-t border-border-soft pt-3">
          <PreviewFact label="Duration" value={formatDays(trek)} />
          <PreviewFact
            label="Highest point"
            value={trek.highestPointM ? formatMetres(trek.highestPointM) : MISSING_VALUE}
          />
          <PreviewFact label="Route" value={formatRoute(trek) ?? MISSING_VALUE} />
          <PreviewFact
            label="From"
            value={
              trek.estimatedCostNpr ? `${formatNpr(trek.estimatedCostNpr)} / person` : MISSING_VALUE
            }
          />
        </dl>

        <ButtonLink href={`/treks/${trek.slug}`} variant="dark" className="mt-auto w-full shrink-0">
          View →
        </ButtonLink>
      </div>
    </section>
  );
}

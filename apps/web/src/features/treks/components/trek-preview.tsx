import type { TrekImage } from "../lib/trek-image";
import type { TrekSummary } from "@yompi/shared";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  ESTIMATE_LABEL,
  formatDays,
  formatEstimate,
  formatMetres,
  formatRoute,
} from "../lib/format";
import { TrekPhoto } from "./trek-photo";

export const PREVIEW_HEIGHT_CLASS = "lg:h-[440px]";
const MISSING_VALUE = "—";

interface TrekPreviewProps {
  trek: TrekSummary;
  image: TrekImage | null;
  comparing: boolean;
  compareFull: boolean;
  onToggleCompare: () => void;
}

function PreviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="shrink-0 font-mono text-[10px] text-muted uppercase">{label}</dt>
      <dd className="truncate text-right font-semibold">{value}</dd>
    </div>
  );
}

export function TrekPreview({
  trek,
  image,
  comparing,
  compareFull,
  onToggleCompare,
}: TrekPreviewProps) {
  return (
    <section
      aria-label={`${trek.name} preview`}
      className={`grid gap-4 lg:grid-cols-[1fr_340px] ${PREVIEW_HEIGHT_CLASS}`}
    >
      <TrekPhoto
        image={image}
        alt={`${trek.name} landscape`}
        caption={`Photo illustration · ${trek.region}`}
        className="h-[240px] lg:h-full"
      />

      <div className="flex min-h-0 flex-col gap-4 overflow-hidden border border-border bg-primary/25 p-6">
        <div>
          <p className="truncate font-mono text-[10px] text-accent uppercase">{trek.region}</p>
          <h2 className="mt-1 line-clamp-2 font-display text-2xl leading-tight font-semibold">
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
            label={trek.costBasis ? ESTIMATE_LABEL[trek.costBasis] : "Estimated cost"}
            value={formatEstimate(trek)?.replace(/^(From|Permits) /, "") ?? MISSING_VALUE}
          />
        </dl>

        <div className="mt-auto grid shrink-0 grid-cols-[1fr_auto] gap-2">
          <ButtonLink href={`/treks/${trek.slug}`} variant="dark">
            View →
          </ButtonLink>
          <Button
            type="button"
            variant="outline"
            onClick={onToggleCompare}
            disabled={!comparing && compareFull}
            aria-pressed={comparing}
          >
            {comparing ? "Added ✓" : "+ Compare"}
          </Button>
        </div>
      </div>
    </section>
  );
}

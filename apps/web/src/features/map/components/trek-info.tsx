import type { TrekInfo } from "@yompi/shared";
import { CostList } from "@/features/treks/components/cost-list";
import { DifficultyPanel } from "@/features/treks/components/difficulty-panel";
import { PermitList } from "@/features/treks/components/permit-list";
import { SourceNote } from "@/features/treks/components/source-note";
import { formatDays } from "@/features/treks/lib/format";

function Heading({ children }: { children: string }) {
  return <p className="font-mono text-[10px] text-muted uppercase">{children}</p>;
}

export function TrekPlanning({ trek, loaded }: { trek: TrekInfo | null; loaded: boolean }) {
  if (!trek) {
    return loaded ? (
      <p className="mt-4 border-l-2 border-border-soft pl-3 text-xs text-muted">
        Duration, permit and cost details aren&apos;t available for this trail yet. We only show
        figures that come with a source.
      </p>
    ) : null;
  }

  const places = [trek.startPlace, trek.endPlace].filter(Boolean);

  return (
    <section
      className="mt-4 flex flex-col gap-4 border-t border-border-soft pt-4"
      aria-label="Trek planning"
    >
      <div>
        <Heading>Typical duration</Heading>
        <p className="text-base font-semibold">{formatDays(trek)}</p>
        {places.length > 0 && <p className="text-xs text-muted">{places.join(" → ")}</p>}
        <SourceNote source={trek.source} />
      </div>

      {trek.difficulty && (
        <div>
          <Heading>Estimated difficulty</Heading>
          <DifficultyPanel difficulty={trek.difficulty} />
        </div>
      )}

      {trek.permits.length > 0 && (
        <div>
          <Heading>Permits and fees</Heading>
          <div className="mt-1">
            <PermitList permits={trek.permits} />
          </div>
        </div>
      )}

      {trek.costs.length > 0 && (
        <div>
          <Heading>Typical costs</Heading>
          <div className="mt-1">
            <CostList costs={trek.costs} />
          </div>
        </div>
      )}

      {trek.permits.length === 0 && trek.costs.length === 0 && (
        <p className="text-xs text-muted">
          No permit or cost figures with a source have been added for this trek yet.
        </p>
      )}
    </section>
  );
}

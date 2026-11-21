import type { TrekSummary } from "@yompi/shared";
import { ButtonLink } from "@/components/ui/button";
import { formatDays, formatMetres, formatRoute } from "../lib/format";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="font-mono text-[10px] text-muted uppercase">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

export function TrekFactsCard({ trek }: { trek: TrekSummary }) {
  const route = formatRoute(trek);

  return (
    <aside className="flex flex-col gap-5 border border-border bg-surface p-6">
      <div>
        <p className="font-mono text-[10px] text-accent uppercase">Your next adventure</p>
        <p className="mt-2 font-display text-3xl leading-tight font-semibold">
          A small step. An enormous view.
        </p>
      </div>
      <dl className="flex flex-col gap-3 border-t border-border-soft pt-4">
        <Fact label="Duration" value={formatDays(trek)} />
        {trek.highestPointM && (
          <Fact label="Highest point" value={formatMetres(trek.highestPointM)} />
        )}
        {route && <Fact label="Route" value={route} />}
      </dl>
      <ButtonLink href="/" variant="primary" className="w-full">
        See it on the map →
      </ButtonLink>
    </aside>
  );
}

import type { StayInfo, StayTier } from "@yompi/shared";
import { SourceNote } from "@/features/treks/components/source-note";
import { formatMetres, formatNpr } from "@/features/treks/lib/format";

export const TIER_LABEL: Record<StayTier, string> = {
  BUDGET: "Budget",
  STANDARD: "Standard",
  COMFORT: "Comfort",
};

export function StayCard({ stay }: { stay: StayInfo }) {
  return (
    <article className="flex h-full flex-col gap-2 border border-border-soft bg-surface p-5">
      <p className="font-mono text-[10px] text-accent uppercase">
        {TIER_LABEL[stay.tier]} · {stay.trekName}
      </p>
      <h3 className="font-display text-2xl font-semibold">{stay.name}</h3>
      <p className="text-sm text-muted">
        {stay.place}
        {stay.elevationM ? ` · ${formatMetres(stay.elevationM)}` : ""}
      </p>
      {stay.notes && <p className="line-clamp-3 text-sm text-muted">{stay.notes}</p>}
      <div className="mt-auto flex flex-col gap-1 pt-3">
        {stay.pricePerNightNpr !== null && (
          <p className="text-sm font-semibold">{formatNpr(stay.pricePerNightNpr)} / night</p>
        )}
        <SourceNote source={stay.source} />
      </div>
    </article>
  );
}

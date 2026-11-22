import type { TrekSummary } from "@yompi/shared";
import { cn } from "@/lib/cn";
import { formatDays, formatMetres, formatNpr, formatRoute } from "../lib/format";

interface TrekCardProps {
  trek: TrekSummary;
  selected: boolean;
  onSelect: () => void;
}

export function TrekCard({ trek, selected, onSelect }: TrekCardProps) {
  const route = formatRoute(trek);
  const facts = [formatDays(trek), trek.highestPointM && formatMetres(trek.highestPointM)];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex h-[230px] w-full flex-col overflow-hidden gap-2 border bg-surface p-5 text-left transition-colors hover:bg-surface-muted",
        selected ? "border-foreground" : "border-border-soft",
      )}
    >
      <span className="font-mono text-[10px] text-accent uppercase">{trek.region}</span>
      <h3 className="line-clamp-2 font-display text-2xl font-semibold">{trek.name}</h3>
      {route && <p className="truncate text-sm text-muted">{route}</p>}
      <p className="mt-auto flex flex-col gap-1 pt-4 text-sm">
        <span className="text-muted">{facts.filter(Boolean).join(" / ")}</span>
        {trek.estimatedCostNpr && (
          <span className="font-semibold">From {formatNpr(trek.estimatedCostNpr)} / person</span>
        )}
      </p>
    </button>
  );
}

import type { TrekSummary } from "@yompi/shared";
import { ButtonLink } from "@/components/ui/button";
import { MAX_COMPARED_TREKS, MIN_COMPARED_TREKS, compareHref } from "../lib/compare";

interface CompareTrayProps {
  treks: TrekSummary[];
  onRemove: (slug: string) => void;
  onClear: () => void;
}

export function CompareTray({ treks, onRemove, onClear }: CompareTrayProps) {
  if (treks.length === 0) return null;

  const ready = treks.length >= MIN_COMPARED_TREKS;

  return (
    <section
      aria-label="Trails to compare"
      className="flex flex-wrap items-center gap-3 border border-border bg-surface px-4 py-3"
    >
      <p className="font-mono text-[10px] text-muted uppercase">
        Compare {treks.length}/{MAX_COMPARED_TREKS}
      </p>
      <ul className="flex flex-wrap gap-2">
        {treks.map((trek) => (
          <li key={trek.slug}>
            <button
              type="button"
              onClick={() => onRemove(trek.slug)}
              aria-label={`Remove ${trek.name} from comparison`}
              className="bg-surface-muted px-3 py-1.5 text-sm hover:bg-border-soft"
            >
              {trek.name} ×
            </button>
          </li>
        ))}
      </ul>
      <div className="ml-auto flex items-center gap-3">
        <button type="button" onClick={onClear} className="text-sm underline">
          Clear
        </button>
        {ready ? (
          <ButtonLink href={compareHref(treks.map((trek) => trek.slug))} variant="dark">
            Compare trails ↗
          </ButtonLink>
        ) : (
          <span className="text-xs text-muted">Pick one more to compare</span>
        )}
      </div>
    </section>
  );
}

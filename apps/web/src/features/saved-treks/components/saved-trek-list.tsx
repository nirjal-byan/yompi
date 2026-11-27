import Link from "next/link";
import type { TrekSummary } from "@yompi/shared";
import { formatDays, formatMetres } from "@/features/treks/lib/format";

export function SavedTrekList({ treks }: { treks: TrekSummary[] }) {
  if (treks.length === 0) {
    return (
      <p className="text-muted">
        You haven&apos;t saved a trek yet.{" "}
        <Link href="/treks" className="underline">
          Find your kind of epic
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {treks.map((trek) => (
        <li key={trek.slug}>
          <Link
            href={`/treks/${trek.slug}`}
            className="flex h-full flex-col gap-2 border border-border-soft bg-surface p-5 hover:bg-surface-muted"
          >
            <span className="font-mono text-[10px] text-accent uppercase">{trek.region}</span>
            <span className="font-display text-2xl font-semibold">{trek.name}</span>
            <span className="mt-auto pt-3 text-sm text-muted">
              {formatDays(trek)}
              {trek.highestPointM ? ` / ${formatMetres(trek.highestPointM)}` : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

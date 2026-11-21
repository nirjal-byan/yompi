import Link from "next/link";
import type { TrekSummary } from "@yompi/shared";
import { Tag } from "@/components/ui/tag";
import { formatDays, formatRoute } from "../lib/format";

export function TrekCard({ trek }: { trek: TrekSummary }) {
  const route = formatRoute(trek);

  return (
    <Link
      href={`/treks/${trek.slug}`}
      className="flex flex-col gap-3 border border-border-soft bg-surface p-5 transition-colors hover:bg-surface-muted"
    >
      <Tag className="self-start">{trek.region}</Tag>
      <h2 className="font-display text-2xl font-semibold">{trek.name}</h2>
      <dl className="flex gap-6 text-sm">
        <div>
          <dt className="font-mono text-[10px] text-muted uppercase">Duration</dt>
          <dd className="font-semibold">{formatDays(trek)}</dd>
        </div>
        {trek.highestPointM && (
          <div>
            <dt className="font-mono text-[10px] text-muted uppercase">Highest point</dt>
            <dd className="font-semibold">{trek.highestPointM.toLocaleString("en-US")} m</dd>
          </div>
        )}
      </dl>
      {route && <p className="text-xs text-muted">{route}</p>}
    </Link>
  );
}

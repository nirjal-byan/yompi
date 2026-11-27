import Link from "next/link";
import type { ConditionInfo } from "@yompi/shared";
import { SourceNote } from "@/features/treks/components/source-note";
import { CATEGORY_LABEL } from "./condition-card";

const MAX_REPORTS = 3;

export function TrekReports({ conditions }: { conditions: ConditionInfo[] }) {
  if (conditions.length === 0) {
    return (
      <p className="text-sm text-muted">
        No reports for this trek yet. Confirm conditions locally before you set off.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border-soft">
        {conditions.slice(0, MAX_REPORTS).map((condition) => (
          <li key={condition.slug} className="flex flex-col gap-1 py-3 first:pt-0">
            <p className="font-mono text-[10px] text-accent uppercase">
              {CATEGORY_LABEL[condition.category]}
              {condition.trekSlug === null ? " · All treks" : ""}
            </p>
            <p className="text-sm font-semibold">{condition.title}</p>
            <p className="text-sm text-muted">{condition.summary}</p>
            <SourceNote source={condition.source} />
          </li>
        ))}
      </ul>
      <Link href="/conditions" className="text-sm underline">
        All trail conditions
      </Link>
    </div>
  );
}

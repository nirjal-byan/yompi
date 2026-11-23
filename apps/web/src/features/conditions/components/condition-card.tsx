import type { ConditionCategory, ConditionInfo } from "@yompi/shared";
import { SourceNote } from "@/features/treks/components/source-note";

export const CATEGORY_LABEL: Record<ConditionCategory, string> = {
  WEATHER: "Weather",
  OFFICIAL_ADVISORY: "Official advisory",
  TRAIL_REPORT: "Trail report",
};

export function ConditionCard({ condition }: { condition: ConditionInfo }) {
  return (
    <article className="flex h-full flex-col gap-2 border border-border-soft bg-surface p-5">
      <p className="font-mono text-[10px] text-accent uppercase">
        {CATEGORY_LABEL[condition.category]} · {condition.trekName ?? "All treks"}
      </p>
      <h3 className="font-display text-2xl font-semibold">{condition.title}</h3>
      <p className="text-sm text-muted">{condition.summary}</p>
      <div className="mt-auto pt-3">
        <SourceNote source={condition.source} />
      </div>
    </article>
  );
}

import type { CostInfo } from "@yompi/shared";
import { COST_UNIT_LABEL } from "@/features/map/constants";
import { formatNpr } from "../lib/format";
import { SourceNote } from "./source-note";

export function CostList({ costs }: { costs: CostInfo[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {costs.map((cost) => (
        <li key={`${cost.category}-${cost.label}`}>
          <p className="text-sm">
            <span className="font-medium">{cost.label}</span>{" "}
            <span className="font-semibold">
              {formatNpr(cost.amountNpr)}{" "}
              <span className="font-normal text-muted">{COST_UNIT_LABEL[cost.unit]}</span>
            </span>
            {!cost.specific && <span className="ml-1 text-[11px] text-muted">(general rate)</span>}
          </p>
          {cost.notes && <p className="text-xs text-muted">{cost.notes}</p>}
          <SourceNote source={cost.source} />
        </li>
      ))}
    </ul>
  );
}

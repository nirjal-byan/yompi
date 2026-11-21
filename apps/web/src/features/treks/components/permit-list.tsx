import type { PermitInfo } from "@yompi/shared";
import { PERMIT_UNIT_LABEL } from "@/features/map/constants";
import { formatNpr } from "../lib/format";
import { SourceNote } from "./source-note";

export function PermitList({ permits }: { permits: PermitInfo[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {permits.map((permit) => (
        <li key={permit.name}>
          <p className="text-sm">
            <span className="font-medium">{permit.name}</span>{" "}
            <span className="font-semibold">
              {formatNpr(permit.amountNpr)}{" "}
              <span className="font-normal text-muted">{PERMIT_UNIT_LABEL[permit.unit]}</span>
            </span>
          </p>
          <p className="text-xs text-muted">
            {permit.authority} · {permit.appliesTo}
            {permit.notes ? ` · ${permit.notes}` : ""}
          </p>
          <SourceNote source={permit.source} />
        </li>
      ))}
    </ul>
  );
}

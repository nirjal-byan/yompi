import Link from "next/link";
import type { TrekInfo, TrekSummary } from "@yompi/shared";
import { formatDays, formatEstimate, formatMetres, formatNpr, formatRoute } from "../lib/format";
import { DifficultyStars } from "./difficulty-panel";

export interface ComparedTrek {
  summary: TrekSummary;
  info: TrekInfo | null;
}

const MISSING_VALUE = "Not available";

interface CompareRow {
  label: string;
  render: (trek: ComparedTrek) => React.ReactNode;
}

const ROWS: CompareRow[] = [
  { label: "Region", render: ({ summary }) => summary.region },
  { label: "Duration", render: ({ summary }) => formatDays(summary) },
  {
    label: "Highest point",
    render: ({ summary }) =>
      summary.highestPointM ? formatMetres(summary.highestPointM) : MISSING_VALUE,
  },
  { label: "Route", render: ({ summary }) => formatRoute(summary) ?? MISSING_VALUE },
  {
    label: "Estimated cost",
    render: ({ summary }) => formatEstimate(summary) ?? MISSING_VALUE,
  },
  {
    label: "Difficulty",
    render: ({ info }) =>
      info?.difficulty ? (
        <span className="flex items-center gap-2">
          <DifficultyStars stars={info.difficulty.stars} />
          <span className="text-xs text-muted">{info.difficulty.stars} of 5</span>
        </span>
      ) : (
        MISSING_VALUE
      ),
  },
  {
    label: "Permits",
    render: ({ info }) =>
      info && info.permits.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {info.permits.map((permit) => (
            <li key={permit.name}>
              {permit.name}: <span className="font-semibold">{formatNpr(permit.amountNpr)}</span>
            </li>
          ))}
        </ul>
      ) : (
        MISSING_VALUE
      ),
  },
];

export function CompareTable({ treks }: { treks: ComparedTrek[] }) {
  return (
    <div className="overflow-x-auto border border-border-soft bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border-soft">
            <td className="w-40 p-4" />
            {treks.map(({ summary }) => (
              <th key={summary.slug} scope="col" className="p-4 align-top">
                <Link
                  href={`/treks/${summary.slug}`}
                  className="font-display text-xl font-semibold hover:underline"
                >
                  {summary.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-b border-border-soft last:border-b-0">
              <th
                scope="row"
                className="p-4 align-top font-mono text-[10px] font-normal text-muted uppercase"
              >
                {row.label}
              </th>
              {treks.map((trek) => (
                <td key={trek.summary.slug} className="p-4 align-top">
                  {row.render(trek)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

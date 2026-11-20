import type { SourceCitation, TrekInfo } from "@yompi/shared";
import { COST_UNIT_LABEL, PERMIT_UNIT_LABEL } from "../constants";

const npr = (amount: number) => `NPR ${amount.toLocaleString("en-US")}`;

/** Every figure links to where it came from and says when it was last checked. */
function Source({ source }: { source: SourceCitation }) {
  return (
    <span className="text-[11px] text-muted">
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">
        {source.name}
      </a>
      , checked {source.verifiedAt}
      {source.stale && <span className="ml-1 bg-primary/30 px-1 text-foreground">may be out of date</span>}
    </span>
  );
}

function Stars({ stars }: { stars: number }) {
  return (
    <span aria-label={`${stars} out of 5`} className="text-lg leading-none tracking-wide">
      {"★".repeat(stars)}
      <span className="text-border-soft">{"★".repeat(5 - stars)}</span>
    </span>
  );
}

function Heading({ children }: { children: string }) {
  return <p className="font-mono text-[10px] text-muted uppercase">{children}</p>;
}

export function TrekPlanning({ trek, loaded }: { trek: TrekInfo | null; loaded: boolean }) {
  if (!trek) {
    return loaded ? (
      <p className="mt-4 border-l-2 border-border-soft pl-3 text-xs text-muted">
        Duration, permit and cost details aren&apos;t available for this trail yet. We only show figures that come with a
        source.
      </p>
    ) : null;
  }

  const days = trek.minDays === trek.maxDays ? `${trek.minDays} days` : `${trek.minDays}–${trek.maxDays} days`;
  const { difficulty } = trek;

  return (
    <section className="mt-4 flex flex-col gap-4 border-t border-border-soft pt-4" aria-label="Trek planning">
      <div>
        <Heading>Typical duration</Heading>
        <p className="text-base font-semibold">{days}</p>
        {(trek.startPlace || trek.endPlace) && (
          <p className="text-xs text-muted">
            {[trek.startPlace, trek.endPlace].filter(Boolean).join(" → ")}
          </p>
        )}
        <Source source={trek.source} />
      </div>

      {difficulty && (
        <div>
          <Heading>Estimated difficulty</Heading>
          <p className="flex items-center gap-2">
            <Stars stars={difficulty.stars} />
            <span className="text-sm text-muted">
              {difficulty.stars} of 5 · {difficulty.points} of {difficulty.maxPoints} points
            </span>
          </p>
          <details className="mt-1 text-sm">
            <summary className="cursor-pointer text-accent underline">Why this rating?</summary>
            <ul className="mt-2 flex flex-col gap-1">
              {difficulty.factors.map((factor) => (
                <li key={factor.label} className="flex justify-between gap-3">
                  <span>
                    <span className="font-medium">{factor.label}:</span> <span className="text-muted">{factor.detail}</span>
                  </span>
                  <span className="font-mono text-xs">+{factor.points}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-muted">{difficulty.caveat}</p>
          </details>
        </div>
      )}

      {trek.permits.length > 0 && (
        <div>
          <Heading>Permits and fees</Heading>
          <ul className="mt-1 flex flex-col gap-2.5">
            {trek.permits.map((permit) => (
              <li key={permit.name}>
                <p className="text-sm">
                  <span className="font-medium">{permit.name}</span>{" "}
                  <span className="font-semibold">
                    {npr(permit.amountNpr)} <span className="font-normal text-muted">{PERMIT_UNIT_LABEL[permit.unit]}</span>
                  </span>
                </p>
                <p className="text-xs text-muted">
                  {permit.authority} · {permit.appliesTo}
                  {permit.notes ? ` · ${permit.notes}` : ""}
                </p>
                <Source source={permit.source} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {trek.costs.length > 0 && (
        <div>
          <Heading>Typical costs</Heading>
          <ul className="mt-1 flex flex-col gap-2.5">
            {trek.costs.map((cost) => (
              <li key={`${cost.category}-${cost.label}`}>
                <p className="text-sm">
                  <span className="font-medium">{cost.label}</span>{" "}
                  <span className="font-semibold">
                    {npr(cost.amountNpr)} <span className="font-normal text-muted">{COST_UNIT_LABEL[cost.unit]}</span>
                  </span>
                  {!cost.specific && <span className="ml-1 text-[11px] text-muted">(general rate)</span>}
                </p>
                {cost.notes && <p className="text-xs text-muted">{cost.notes}</p>}
                <Source source={cost.source} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {trek.permits.length === 0 && trek.costs.length === 0 && (
        <p className="text-xs text-muted">No permit or cost figures with a source have been added for this trek yet.</p>
      )}
    </section>
  );
}

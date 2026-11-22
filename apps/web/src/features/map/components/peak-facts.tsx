import {
  EIGHT_THOUSANDER_SOURCE,
  EIGHT_THOUSANDERS_TOTAL,
  PEAK_FACTS,
} from "../data/eight-thousanders";
import { EVEREST_NAME } from "../lib/engine/constants";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="font-mono text-[10px] text-muted uppercase">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function PeakFactBox({
  name,
  mapElevationM,
}: {
  name: string;
  mapElevationM: number | null;
}) {
  const facts = PEAK_FACTS[name];
  if (!facts) return null;

  const isEverest = name === EVEREST_NAME;
  const heightDiffers = mapElevationM !== null && mapElevationM !== facts.heightM;

  return (
    <section
      aria-label={`${name} facts`}
      className="mt-4 flex flex-col gap-3 border-t border-border-soft pt-4"
    >
      <p className="bg-primary/30 px-2 py-1 font-mono text-[10px] uppercase">
        {isEverest
          ? "Highest mountain on Earth"
          : `One of ${EIGHT_THOUSANDERS_TOTAL} eight-thousanders`}
      </p>
      <dl className="flex flex-col gap-2.5">
        <Fact label="World rank">
          No. {facts.worldRank} of {EIGHT_THOUSANDERS_TOTAL} eight-thousanders
        </Fact>
        <Fact label="Published height">
          {facts.heightM.toLocaleString("en-US")} m
          {heightDiffers && (
            <span className="block text-[11px] text-muted">
              The map data lists {mapElevationM?.toLocaleString("en-US")} m.
            </span>
          )}
        </Fact>
        <Fact label="Location">{facts.borders}</Fact>
        <Fact label="First ascent">
          {facts.firstAscent.date}: {facts.firstAscent.climbers}
        </Fact>
        {facts.firstWinterAscent && (
          <Fact label="First winter ascent">
            {facts.firstWinterAscent.date}: {facts.firstWinterAscent.climbers}
          </Fact>
        )}
      </dl>
      <p className="text-[11px] text-muted">
        Facts from{" "}
        <a
          href={EIGHT_THOUSANDER_SOURCE.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {EIGHT_THOUSANDER_SOURCE.name}
        </a>
        , checked {EIGHT_THOUSANDER_SOURCE.checkedOn}.
      </p>
    </section>
  );
}

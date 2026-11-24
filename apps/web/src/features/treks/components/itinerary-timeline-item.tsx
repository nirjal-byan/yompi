import { cn } from "@/lib/cn";
import { formatMetres, formatNpr } from "../lib/format";
import type { JourneyStep } from "../lib/journey";
import { TIER_LABEL } from "../lib/tiers";
import { SourceNote } from "./source-note";

interface ItineraryTimelineItemProps {
  step: JourneyStep;
  open: boolean;
  active: boolean;
  isLast: boolean;
  onToggle: () => void;
}

function routeText(step: JourneyStep): string {
  return step.fromPlace === step.toPlace ? step.fromPlace : `${step.fromPlace} → ${step.toPlace}`;
}

function Details({ step }: { step: JourneyStep }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border-soft px-4 py-3 text-sm">
      {step.hoursText && (
        <p>
          <span className="font-mono text-[10px] text-muted uppercase">Time</span>{" "}
          <span className="font-semibold">{step.hoursText}</span>
        </p>
      )}

      {step.stays.length > 0 && (
        <div>
          <p className="font-mono text-[10px] text-muted uppercase">Places to stay</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {step.stays.map((stay) => (
              <li key={stay.name}>
                {stay.name}{" "}
                <span className="text-muted">
                  ({TIER_LABEL[stay.tier]}
                  {stay.pricePerNightNpr ? `, ${formatNpr(stay.pricePerNightNpr)} / night` : ""})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step.notes && <p className="text-muted">{step.notes}</p>}
      <SourceNote source={step.source} />
    </div>
  );
}

export function ItineraryTimelineItem({
  step,
  open,
  active,
  isLast,
  onToggle,
}: ItineraryTimelineItemProps) {
  const isTransfer = step.kind === "TRANSFER";
  const panelId = `itinerary-${step.key}`;

  return (
    <li id={panelId} className="relative flex gap-4 scroll-mt-24">
      {!isLast && (
        <span
          className="absolute top-9 bottom-[-0.75rem] left-[17px] w-0.5 bg-border-soft"
          aria-hidden
        />
      )}

      <span
        aria-hidden
        className={cn(
          "z-10 flex h-9 w-9 shrink-0 items-center justify-center border-2 border-foreground font-mono text-xs font-semibold",
          isTransfer ? "bg-surface-muted" : "bg-primary",
          active && "ring-2 ring-accent ring-offset-2 ring-offset-background",
        )}
      >
        {step.dayNumber}
      </span>

      <div
        className={cn(
          "min-w-0 flex-1 border bg-surface transition-colors",
          active ? "border-foreground" : "border-border-soft",
          isTransfer && "border-dashed",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${panelId}-details`}
          className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-surface-muted"
        >
          <span className="flex min-w-0 flex-col gap-1">
            <span className="font-mono text-[10px] text-accent uppercase">
              Day {step.dayNumber}
              {isTransfer ? " · Getting there" : ""}
            </span>
            <span className="font-display text-lg leading-tight font-semibold">{step.title}</span>
            <span className="text-sm text-muted">{routeText(step)}</span>
            {step.overnightPlace && (
              <span className="text-sm">
                <span className="font-mono text-[10px] text-muted uppercase">Sleep</span>{" "}
                <span className="font-semibold">{step.overnightPlace}</span>
                {step.overnightElevationM ? ` · ${formatMetres(step.overnightElevationM)}` : ""}
              </span>
            )}
          </span>
          <span
            aria-hidden
            className={cn(
              "mt-1 shrink-0 text-lg leading-none transition-transform",
              open && "rotate-180",
            )}
          >
            ▾
          </span>
        </button>

        {open && (
          <div id={`${panelId}-details`}>
            <Details step={step} />
          </div>
        )}
      </div>
    </li>
  );
}

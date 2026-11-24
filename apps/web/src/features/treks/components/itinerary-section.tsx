"use client";

import { useMemo, useState } from "react";
import type { ItineraryDayInfo } from "@yompi/shared";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { CITY_TRANSFER, START_CITIES, type StartCity } from "../data/city-transfers";
import { formatMetres, formatNpr } from "../lib/format";
import { buildJourney, gatewayCity, type JourneyStep } from "../lib/journey";
import { TIER_LABEL } from "../lib/tiers";
import { SourceNote } from "./source-note";

const FALLBACK_CITY: StartCity = "KATHMANDU";

function StepCard({ step }: { step: JourneyStep }) {
  const isTransfer = step.kind === "TRANSFER";

  return (
    <li
      className={cn(
        "flex flex-col gap-2 border p-4",
        isTransfer ? "border-border-soft bg-surface-muted" : "border-border-soft bg-surface",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] text-accent uppercase">
          Day {step.dayNumber}
          {isTransfer ? " · Getting there" : ""}
        </p>
        {step.hoursText && <p className="text-xs text-muted">{step.hoursText}</p>}
      </div>

      <h3 className="font-display text-xl font-semibold">{step.title}</h3>
      <p className="text-sm text-muted">
        {step.fromPlace === step.toPlace ? step.fromPlace : `${step.fromPlace} → ${step.toPlace}`}
      </p>

      {step.overnightPlace && (
        <p className="text-sm">
          <span className="font-mono text-[10px] text-muted uppercase">Sleep</span>{" "}
          <span className="font-semibold">{step.overnightPlace}</span>
          {step.overnightElevationM ? ` · ${formatMetres(step.overnightElevationM)}` : ""}
        </p>
      )}

      {step.stays.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-xs text-muted">
          {step.stays.map((stay) => (
            <li key={stay.name}>
              Stay: {stay.name} ({TIER_LABEL[stay.tier]}
              {stay.pricePerNightNpr ? `, ${formatNpr(stay.pricePerNightNpr)} / night` : ""})
            </li>
          ))}
        </ul>
      )}

      {step.notes && <p className="text-xs text-muted">{step.notes}</p>}
      <SourceNote source={step.source} />
    </li>
  );
}

export function ItinerarySection({ days }: { days: ItineraryDayInfo[] }) {
  const [start, setStart] = useState<StartCity>(gatewayCity(days) ?? FALLBACK_CITY);
  const journey = useMemo(() => buildJourney(days, start), [days, start]);
  const transferDays = journey.filter((step) => step.kind === "TRANSFER").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="flex flex-col gap-1 text-sm font-semibold sm:w-64">
          Where are you starting from?
          <Select value={start} onChange={(event) => setStart(event.target.value as StartCity)}>
            {START_CITIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <p className="text-sm text-muted" aria-live="polite">
          {journey.length} days in total
          {transferDays > 0 ? `, including ${transferDays} for getting there and back` : ""}
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {journey.map((step) => (
          <StepCard key={step.key} step={step} />
        ))}
      </ol>

      {transferDays > 0 && (
        <p className="text-xs text-muted">
          Between Kathmandu and Pokhara you can take the{" "}
          {CITY_TRANSFER.options
            .map((option) => `${option.mode.toLowerCase()} (${option.duration})`)
            .join(" or the ")}
          .
        </p>
      )}
    </div>
  );
}

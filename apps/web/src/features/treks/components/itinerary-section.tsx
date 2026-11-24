"use client";

import { useMemo, useState } from "react";
import type { ItineraryDayInfo } from "@yompi/shared";
import { Select } from "@/components/ui/select";
import { CITY_TRANSFER, START_CITIES, type StartCity } from "../data/city-transfers";
import { buildJourney, gatewayCity } from "../lib/journey";
import { ElevationStrip } from "./elevation-strip";
import { ItineraryTimelineItem } from "./itinerary-timeline-item";

const FALLBACK_CITY: StartCity = "KATHMANDU";

function scrollToStep(key: string) {
  document
    .getElementById(`itinerary-${key}`)
    ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

export function ItinerarySection({ days }: { days: ItineraryDayInfo[] }) {
  const [start, setStart] = useState<StartCity>(gatewayCity(days) ?? FALLBACK_CITY);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const journey = useMemo(() => buildJourney(days, start), [days, start]);
  const transferDays = journey.filter((step) => step.kind === "TRANSFER").length;
  const allOpen = journey.length > 0 && journey.every((step) => openKeys.has(step.key));

  function toggle(key: string) {
    setActiveKey(key);
    setOpenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);

      return next;
    });
  }

  function jumpTo(key: string) {
    setActiveKey(key);
    setOpenKeys((current) => new Set(current).add(key));
    requestAnimationFrame(() => scrollToStep(key));
  }

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
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm text-muted" aria-live="polite">
            {journey.length} days in total
            {transferDays > 0 ? `, including ${transferDays} for getting there and back` : ""}
          </p>
          <button
            type="button"
            onClick={() =>
              setOpenKeys(allOpen ? new Set() : new Set(journey.map((step) => step.key)))
            }
            className="text-sm underline"
          >
            {allOpen ? "Collapse all days" : "Expand all days"}
          </button>
        </div>
      </div>

      <ElevationStrip steps={journey} activeKey={activeKey} onSelect={jumpTo} />

      <ol className="flex flex-col gap-3">
        {journey.map((step, index) => (
          <ItineraryTimelineItem
            key={step.key}
            step={step}
            open={openKeys.has(step.key)}
            active={step.key === activeKey}
            isLast={index === journey.length - 1}
            onToggle={() => toggle(step.key)}
          />
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

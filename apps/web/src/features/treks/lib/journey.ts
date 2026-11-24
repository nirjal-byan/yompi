import type { ItineraryDayInfo, ItineraryStay, SourceCitation } from "@yompi/shared";
import { CITY_TRANSFER, START_CITIES, type StartCity } from "../data/city-transfers";

export interface JourneyStep {
  key: string;
  kind: "TRANSFER" | "TREK";
  dayNumber: number;
  title: string;
  fromPlace: string;
  toPlace: string;
  overnightPlace: string | null;
  overnightElevationM: number | null;
  hoursText: string | null;
  notes: string | null;
  stays: ItineraryStay[];
  source: SourceCitation;
}

const normalise = (place: string) => place.trim().toLowerCase();

export function cityFromPlace(place: string): StartCity | null {
  return START_CITIES.find((city) => normalise(city.label) === normalise(place))?.value ?? null;
}

function cityLabel(city: StartCity): string {
  return START_CITIES.find((candidate) => candidate.value === city)?.label ?? city;
}

export function gatewayCity(days: ItineraryDayInfo[]): StartCity | null {
  return days.length ? cityFromPlace(days[0].fromPlace) : null;
}

function transferStep(from: StartCity, to: StartCity, sleepsInDestination: boolean): JourneyStep {
  const options = CITY_TRANSFER.options
    .map((option) => `${option.mode}: ${option.duration}`)
    .join("; ");

  return {
    key: `transfer-${from}-${to}`,
    kind: "TRANSFER",
    dayNumber: 0,
    title: `Travel from ${cityLabel(from)} to ${cityLabel(to)}`,
    fromPlace: cityLabel(from),
    toPlace: cityLabel(to),
    overnightPlace: sleepsInDestination ? cityLabel(to) : null,
    overnightElevationM: null,
    hoursText: null,
    notes: options,
    stays: [],
    source: CITY_TRANSFER.source,
  };
}

function trekStep(day: ItineraryDayInfo): JourneyStep {
  return {
    key: day.slug,
    kind: "TREK",
    dayNumber: 0,
    title: day.title,
    fromPlace: day.fromPlace,
    toPlace: day.toPlace,
    overnightPlace: day.overnightPlace,
    overnightElevationM: day.overnightElevationM,
    hoursText: day.hoursText,
    notes: day.notes,
    stays: day.stays,
    source: day.source,
  };
}

export function buildJourney(days: ItineraryDayInfo[], start: StartCity): JourneyStep[] {
  if (days.length === 0) return [];

  const first = gatewayCity(days);
  const last = cityFromPlace(days[days.length - 1].toPlace);
  const steps: JourneyStep[] = [];

  if (first && first !== start) steps.push(transferStep(start, first, true));
  steps.push(...days.map(trekStep));
  if (last && last !== start) steps.push(transferStep(last, start, false));

  return steps.map((step, index) => ({ ...step, dayNumber: index + 1 }));
}

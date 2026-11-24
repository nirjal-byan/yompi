import { type ItineraryDayInfo, type ItineraryStay, isStale } from "@yompi/shared";

interface ItineraryDayRecord {
  slug: string;
  dayNumber: number;
  title: string;
  fromPlace: string;
  toPlace: string;
  overnightPlace: string | null;
  overnightElevationM: number | null;
  hoursText: string | null;
  notes: string | null;
  sourceName: string;
  sourceUrl: string;
  verifiedAt: Date;
}

interface StayRecord extends ItineraryStay {
  place: string;
}

const normalisePlace = (place: string) => place.trim().toLowerCase();

export function staysForPlace(stays: StayRecord[], place: string | null): ItineraryStay[] {
  if (!place) return [];

  return stays
    .filter((stay) => normalisePlace(stay.place) === normalisePlace(place))
    .map(({ name, tier, pricePerNightNpr }) => ({ name, tier, pricePerNightNpr }));
}

export function toItineraryDayInfo(day: ItineraryDayRecord, stays: StayRecord[]): ItineraryDayInfo {
  return {
    slug: day.slug,
    dayNumber: day.dayNumber,
    title: day.title,
    fromPlace: day.fromPlace,
    toPlace: day.toPlace,
    overnightPlace: day.overnightPlace,
    overnightElevationM: day.overnightElevationM,
    hoursText: day.hoursText,
    notes: day.notes,
    source: {
      name: day.sourceName,
      url: day.sourceUrl,
      verifiedAt: day.verifiedAt.toISOString().slice(0, 10),
      stale: isStale(day.verifiedAt),
    },
    stays: staysForPlace(stays, day.overnightPlace),
  };
}

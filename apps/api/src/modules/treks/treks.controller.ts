import { Controller, Get, Header, NotFoundException, Param } from "@nestjs/common";
import type { ItineraryDayInfo, TrekInfo, TrekSummary } from "@yompi/shared";
import { TreksService } from "./treks.service.js";

@Controller("treks")
export class TreksController {
  constructor(private readonly treks: TreksService) {}

  @Get()
  @Header("Cache-Control", "no-cache")
  list(): Promise<TrekSummary[]> {
    return this.treks.listSummaries();
  }

  @Get(":slug/itinerary")
  @Header("Cache-Control", "no-cache")
  itinerary(@Param("slug") slug: string): Promise<ItineraryDayInfo[]> {
    return this.treks.listItinerary(slug);
  }

  @Get(":slug")
  @Header("Cache-Control", "no-cache")
  async detail(@Param("slug") slug: string): Promise<TrekInfo> {
    const trek = await this.treks.findBySlug(slug);
    if (!trek) throw new NotFoundException("Trek not found");

    return trek;
  }
}

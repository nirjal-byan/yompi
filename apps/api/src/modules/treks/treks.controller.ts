import { Controller, Get, Header } from "@nestjs/common";
import type { TrekSummary } from "@yompi/shared";
import { TreksService } from "./treks.service.js";

@Controller("treks")
export class TreksController {
  constructor(private readonly treks: TreksService) {}

  @Get()
  @Header("Cache-Control", "no-cache")
  list(): Promise<TrekSummary[]> {
    return this.treks.listSummaries();
  }
}

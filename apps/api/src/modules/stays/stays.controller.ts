import { Controller, Get, Header } from "@nestjs/common";
import type { StayInfo } from "@yompi/shared";
import { StaysService } from "./stays.service.js";

@Controller("stays")
export class StaysController {
  constructor(private readonly stays: StaysService) {}

  @Get()
  @Header("Cache-Control", "no-cache")
  list(): Promise<StayInfo[]> {
    return this.stays.list();
  }
}

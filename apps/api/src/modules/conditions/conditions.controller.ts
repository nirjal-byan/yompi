import { Controller, Get, Header } from "@nestjs/common";
import type { ConditionInfo } from "@yompi/shared";
import { ConditionsService } from "./conditions.service.js";

@Controller("conditions")
export class ConditionsController {
  constructor(private readonly conditions: ConditionsService) {}

  @Get()
  @Header("Cache-Control", "no-cache")
  list(): Promise<ConditionInfo[]> {
    return this.conditions.list();
  }
}

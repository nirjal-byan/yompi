import { Module } from "@nestjs/common";
import { TreksService } from "./treks.service.js";

@Module({
  providers: [TreksService],
  exports: [TreksService],
})
export class TreksModule {}

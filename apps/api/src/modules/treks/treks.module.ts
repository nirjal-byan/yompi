import { Module } from "@nestjs/common";
import { TreksController } from "./treks.controller.js";
import { TreksService } from "./treks.service.js";

@Module({
  controllers: [TreksController],
  providers: [TreksService],
  exports: [TreksService],
})
export class TreksModule {}

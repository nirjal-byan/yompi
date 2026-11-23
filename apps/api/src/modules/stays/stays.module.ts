import { Module } from "@nestjs/common";
import { StaysController } from "./stays.controller.js";
import { StaysService } from "./stays.service.js";

@Module({
  controllers: [StaysController],
  providers: [StaysService],
})
export class StaysModule {}

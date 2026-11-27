import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { SavedTreksController } from "./saved-treks.controller.js";
import { SavedTreksService } from "./saved-treks.service.js";

@Module({
  imports: [AuthModule],
  controllers: [SavedTreksController],
  providers: [SavedTreksService],
})
export class SavedTreksModule {}

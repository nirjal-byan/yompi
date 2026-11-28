import { Module } from "@nestjs/common";
import { AdminGuard } from "../../common/guards/admin.guard.js";
import { AuthModule } from "../auth/auth.module.js";
import { PhotoStorage } from "./photo-storage.js";
import { TrekPhotosController } from "./trek-photos.controller.js";
import { TrekPhotosService } from "./trek-photos.service.js";

@Module({
  imports: [AuthModule],
  controllers: [TrekPhotosController],
  providers: [TrekPhotosService, PhotoStorage, AdminGuard],
})
export class TrekPhotosModule {}

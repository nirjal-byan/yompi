import { Module } from "@nestjs/common";
import { TreksModule } from "../treks/treks.module.js";
import { GeoController } from "./geo.controller.js";
import { GeoGeometryRepository } from "./geo-geometry.repository.js";
import { GeoService } from "./geo.service.js";

@Module({
  imports: [TreksModule],
  controllers: [GeoController],
  providers: [GeoService, GeoGeometryRepository],
})
export class GeoModule {}

import { Module } from '@nestjs/common';
import { TreksModule } from '../treks/treks.module.js';
import { GeoController } from './geo.controller.js';
import { GeoService } from './geo.service.js';

@Module({
  imports: [TreksModule],
  controllers: [GeoController],
  providers: [GeoService],
})
export class GeoModule {}

import { BadRequestException, Controller, Get, Header, Query } from '@nestjs/common';
import { GeoKindQuerySchema } from '@yompi/shared';
import { GeoService } from './geo.service.js';

@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  /** GET /geo/features?kind=PEAK,CITY  (omit kind for everything) */
  @Get('features')
  @Header('Cache-Control', 'no-cache')
  async features(@Query('kind') kind?: string) {
    const parsed = GeoKindQuerySchema.safeParse(kind);
    if (!parsed.success) {
      throw new BadRequestException('kind must be a comma separated list of valid feature kinds');
    }
    return this.geo.listFeatures(parsed.data);
  }

  /** Data sources with the licence and attribution text that must be shown with the map. */
  @Get('sources')
  @Header('Cache-Control', 'no-cache')
  sources() {
    return this.geo.listSources();
  }
}

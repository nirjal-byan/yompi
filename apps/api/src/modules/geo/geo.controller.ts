import { BadRequestException, Controller, Get, Header, Param, Query } from '@nestjs/common';
import { FeatureIdSchema, GeoKindQuerySchema } from '@yompi/shared';
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

  /** One feature in detail (trails include their elevation profile and nearby places). */
  @Get('features/:id')
  @Header('Cache-Control', 'no-cache')
  feature(@Param('id') id: string) {
    const parsed = FeatureIdSchema.safeParse(id);
    if (!parsed.success) throw new BadRequestException('id must be a valid feature id');
    return this.geo.getFeatureDetail(parsed.data);
  }

  /** Data sources with the licence and attribution text that must be shown with the map. */
  @Get('sources')
  @Header('Cache-Control', 'no-cache')
  sources() {
    return this.geo.listSources();
  }
}

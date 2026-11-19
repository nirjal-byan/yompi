import { Injectable } from '@nestjs/common';
import { Prisma } from '@yompi/database';
import type {
  GeoFeature,
  GeoFeatureCollection,
  GeoFeatureKind,
  GeoSource,
} from '@yompi/shared';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';

interface FeatureRow {
  id: string;
  kind: GeoFeatureKind;
  name: string;
  nameLocal: string | null;
  elevationM: number | null;
  details: Record<string, unknown> | null;
  geometry: GeoFeature['geometry'];
  sourceKey: string;
  sourceRef: string;
}

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async listSources(): Promise<GeoSource[]> {
    return this.prisma.client.$queryRaw<GeoSource[]>`
      SELECT key, name, url, license, attribution FROM "DataSource" ORDER BY name`;
  }

  /** GeoJSON features (WGS84), optionally filtered by kind. Points keep ~1 m precision; lines are lightly simplified. */
  async listFeatures(kinds: GeoFeatureKind[]): Promise<GeoFeatureCollection> {
    const filter = kinds.length
      ? Prisma.sql`WHERE g.kind::text = ANY(${kinds}::text[])`
      : Prisma.empty;

    const rows = await this.prisma.client.$queryRaw<FeatureRow[]>`
      SELECT g.id, g.kind::text AS kind, g.name, g."nameLocal", g."elevationM", g.properties AS details,
             CASE
               -- Lines are simplified (~11 m tolerance, 4 decimals): invisible on the map, far fewer points.
               WHEN g.kind IN ('TRAIL', 'COUNTRY_BOUNDARY')
                 THEN ST_AsGeoJSON(ST_SimplifyPreserveTopology(g.geometry, 0.0001), 4)::json
               ELSE ST_AsGeoJSON(g.geometry, 5)::json
             END AS geometry,
             s.key AS "sourceKey", g."sourceRef"
      FROM "GeoFeature" g
      JOIN "DataSource" s ON s.id = g."sourceId"
      ${filter}
      ORDER BY g.kind, g.name`;

    const features: GeoFeature[] = rows.map((row) => ({
      type: 'Feature',
      id: row.id,
      geometry: row.geometry,
      properties: {
        kind: row.kind,
        name: row.name,
        nameLocal: row.nameLocal,
        elevationM: row.elevationM,
        details: row.details,
        sourceKey: row.sourceKey,
        sourceRef: row.sourceRef,
      },
    }));

    const used = new Set(features.map((feature) => feature.properties.sourceKey));
    const sources = (await this.listSources()).filter((source) => used.has(source.key));
    return { type: 'FeatureCollection', features, sources };
  }
}

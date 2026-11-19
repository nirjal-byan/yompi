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

  /** GeoJSON features (WGS84), optionally filtered by kind. Coordinates keep ~1 m precision. */
  async listFeatures(kinds: GeoFeatureKind[]): Promise<GeoFeatureCollection> {
    const filter = kinds.length
      ? Prisma.sql`WHERE g.kind::text = ANY(${kinds}::text[])`
      : Prisma.empty;

    const rows = await this.prisma.client.$queryRaw<FeatureRow[]>`
      SELECT g.id, g.kind::text AS kind, g.name, g."nameLocal", g."elevationM",
             ST_AsGeoJSON(g.geometry, 5)::json AS geometry,
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
        sourceKey: row.sourceKey,
        sourceRef: row.sourceRef,
      },
    }));

    const used = new Set(features.map((feature) => feature.properties.sourceKey));
    const sources = (await this.listSources()).filter((source) => used.has(source.key));
    return { type: 'FeatureCollection', features, sources };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@yompi/database';
import type {
  FeatureDetail,
  GeoFeature,
  GeoFeatureCollection,
  GeoFeatureKind,
  GeoSource,
  NearbyFeature,
  TrailProfile,
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
      SELECT g.id, g.kind::text AS kind, g.name, g."nameLocal", g."elevationM", g.properties - 'profile' AS details,
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

    const features = rows.map(toFeature);

    const used = new Set(features.map((feature) => feature.properties.sourceKey));
    const sources = (await this.listSources()).filter((source) => used.has(source.key));
    return { type: 'FeatureCollection', features, sources };
  }

  /**
   * One feature in detail. For trails this adds the elevation profile (kept out of the map payload
   * because it is large) and the passes, gateways, lakes and peaks close to the route, found with
   * PostGIS distance on the real geography (not a flat approximation).
   */
  async getFeatureDetail(id: string): Promise<FeatureDetail> {
    const rows = await this.prisma.client.$queryRaw<FeatureRow[]>`
      SELECT g.id, g.kind::text AS kind, g.name, g."nameLocal", g."elevationM", g.properties AS details,
             ST_AsGeoJSON(ST_SimplifyPreserveTopology(g.geometry, 0.0001), 4)::json AS geometry,
             s.key AS "sourceKey", g."sourceRef"
      FROM "GeoFeature" g
      JOIN "DataSource" s ON s.id = g."sourceId"
      WHERE g.id = ${id}`;
    if (rows.length === 0) throw new NotFoundException('Feature not found');

    const row = rows[0];
    const profile = (row.details?.profile as TrailProfile | undefined) ?? null;
    const { profile: _omitted, ...details } = row.details ?? {};
    const feature = toFeature({ ...row, details: Object.keys(details).length ? details : null });

    const nearby = row.kind === 'TRAIL' ? await this.nearbyTrail(id) : [];
    const sources = (await this.listSources()).filter((source) => source.key === row.sourceKey);
    return { feature, profile, nearby, sources };
  }

  /** Features within a short distance of a trail: passes, gateways and lakes (3 km), peaks (8 km). */
  private async nearbyTrail(trailId: string): Promise<NearbyFeature[]> {
    const rows = await this.prisma.client.$queryRaw<NearbyFeature[]>`
      SELECT o.id, o.kind::text AS kind, o.name, o."elevationM",
             ROUND((ST_Distance(o.geometry::geography, t.geometry::geography) / 1000)::numeric, 1)::float AS "distanceKm"
      FROM "GeoFeature" t
      JOIN "GeoFeature" o ON o.id <> t.id
      WHERE t.id = ${trailId}
        AND o.kind IN ('PASS', 'GATEWAY', 'LAKE', 'PEAK')
        AND ST_DWithin(o.geometry::geography, t.geometry::geography,
                       CASE WHEN o.kind = 'PEAK' THEN 8000 ELSE 3000 END)
      ORDER BY o.kind, ST_Distance(o.geometry::geography, t.geometry::geography)`;

    // Keep the list short: at most 8 per kind.
    const perKind = new Map<string, number>();
    return rows.filter((row) => {
      const count = (perKind.get(row.kind) ?? 0) + 1;
      perKind.set(row.kind, count);
      return count <= 8;
    });
  }
}

function toFeature(row: FeatureRow): GeoFeature {
  return {
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
  };
}

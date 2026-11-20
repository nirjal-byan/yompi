import { Injectable } from "@nestjs/common";
import { Prisma } from "@yompi/database";
import type { GeoFeature, GeoFeatureKind, NearbyFeature } from "@yompi/shared";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";

type Geometry = GeoFeature["geometry"];

const SIMPLIFY_TOLERANCE = 0.0001;
const SIMPLIFIED_KINDS: GeoFeatureKind[] = ["TRAIL", "COUNTRY_BOUNDARY"];
const NEARBY_KINDS: GeoFeatureKind[] = ["PASS", "GATEWAY", "LAKE", "PEAK"];
const PEAK_RADIUS_METRES = 8000;
const DEFAULT_RADIUS_METRES = 3000;
const MAX_NEARBY_PER_KIND = 8;

@Injectable()
export class GeoGeometryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKinds(kinds: GeoFeatureKind[]): Promise<Map<string, Geometry>> {
    const filter = kinds.length
      ? Prisma.sql`WHERE kind::text = ANY(${kinds}::text[])`
      : Prisma.empty;

    const rows = await this.prisma.client.$queryRaw<{ id: string; geometry: Geometry }[]>`
      SELECT id,
             CASE
               WHEN kind::text = ANY(${SIMPLIFIED_KINDS}::text[])
                 THEN ST_AsGeoJSON(ST_SimplifyPreserveTopology(geometry, ${SIMPLIFY_TOLERANCE}), 4)::json
               ELSE ST_AsGeoJSON(geometry, 5)::json
             END AS geometry
      FROM "GeoFeature"
      ${filter}`;

    return new Map(rows.map((row) => [row.id, row.geometry]));
  }

  async findSimplifiedById(id: string): Promise<Geometry | null> {
    const rows = await this.prisma.client.$queryRaw<{ geometry: Geometry }[]>`
      SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(geometry, ${SIMPLIFY_TOLERANCE}), 4)::json AS geometry
      FROM "GeoFeature"
      WHERE id = ${id}`;

    return rows[0]?.geometry ?? null;
  }

  async findNearby(trailId: string): Promise<NearbyFeature[]> {
    const rows = await this.prisma.client.$queryRaw<NearbyFeature[]>`
      SELECT o.id, o.kind::text AS kind, o.name, o."elevationM",
             ROUND((ST_Distance(o.geometry::geography, t.geometry::geography) / 1000)::numeric, 1)::float AS "distanceKm"
      FROM "GeoFeature" t
      JOIN "GeoFeature" o ON o.id <> t.id
      WHERE t.id = ${trailId}
        AND o.kind::text = ANY(${NEARBY_KINDS}::text[])
        AND ST_DWithin(o.geometry::geography, t.geometry::geography,
                       CASE WHEN o.kind::text = 'PEAK' THEN ${PEAK_RADIUS_METRES} ELSE ${DEFAULT_RADIUS_METRES} END)
      ORDER BY o.kind, ST_Distance(o.geometry::geography, t.geometry::geography)`;

    return limitPerKind(rows, MAX_NEARBY_PER_KIND);
  }
}

function limitPerKind(rows: NearbyFeature[], limit: number): NearbyFeature[] {
  const counts = new Map<string, number>();

  return rows.filter((row) => {
    const count = (counts.get(row.kind) ?? 0) + 1;
    counts.set(row.kind, count);

    return count <= limit;
  });
}

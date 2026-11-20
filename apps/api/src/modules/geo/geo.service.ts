import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@yompi/database";
import type {
  FeatureDetail,
  GeoFeature,
  GeoFeatureCollection,
  GeoFeatureKind,
  GeoSource,
  TrailProfile,
} from "@yompi/shared";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";
import { TreksService } from "../treks/treks.service.js";
import { GeoGeometryRepository } from "./geo-geometry.repository.js";

const FEATURE_SELECT = {
  id: true,
  kind: true,
  name: true,
  nameLocal: true,
  elevationM: true,
  properties: true,
  sourceRef: true,
  source: { select: { key: true } },
} satisfies Prisma.GeoFeatureSelect;

type FeatureRecord = Prisma.GeoFeatureGetPayload<{ select: typeof FEATURE_SELECT }>;
type FeatureDetails = Record<string, unknown>;

const HIGH_PASS_MIN_ELEVATION_M = 5000;
const HIGH_PASS_MAX_DISTANCE_KM = 1;

@Injectable()
export class GeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geometry: GeoGeometryRepository,
    private readonly treks: TreksService,
  ) {}

  listSources(): Promise<GeoSource[]> {
    return this.prisma.client.dataSource.findMany({
      select: { key: true, name: true, url: true, license: true, attribution: true },
      orderBy: { name: "asc" },
    });
  }

  async listFeatures(kinds: GeoFeatureKind[]): Promise<GeoFeatureCollection> {
    const [records, geometries] = await Promise.all([
      this.prisma.client.geoFeature.findMany({
        where: kinds.length ? { kind: { in: kinds } } : undefined,
        select: FEATURE_SELECT,
        orderBy: [{ kind: "asc" }, { name: "asc" }],
      }),
      this.geometry.findByKinds(kinds),
    ]);

    const features = records.flatMap((record) => {
      const geometry = geometries.get(record.id);

      return geometry ? [toFeature(record, geometry)] : [];
    });
    const usedKeys = new Set(records.map((record) => record.source.key));
    const sources = (await this.listSources()).filter((source) => usedKeys.has(source.key));

    return { type: "FeatureCollection", features, sources };
  }

  async getFeatureDetail(id: string): Promise<FeatureDetail> {
    const record = await this.prisma.client.geoFeature.findUnique({
      where: { id },
      select: FEATURE_SELECT,
    });
    const geometry = record && (await this.geometry.findSimplifiedById(id));
    if (!record || !geometry) throw new NotFoundException("Feature not found");

    const isTrail = record.kind === "TRAIL";
    const profile = readProfile(record.properties);
    const nearby = isTrail ? await this.geometry.findNearby(id) : [];
    const sources = (await this.listSources()).filter((source) => source.key === record.source.key);
    const trek = isTrail
      ? await this.treks.findByTrailId(id, {
          profileHighestM: profile?.highestM ?? null,
          highPassCount: nearby.filter(
            (feature) =>
              feature.kind === "PASS" &&
              (feature.elevationM ?? 0) >= HIGH_PASS_MIN_ELEVATION_M &&
              feature.distanceKm <= HIGH_PASS_MAX_DISTANCE_KM,
          ).length,
        })
      : null;

    return { feature: toFeature(record, geometry), profile, nearby, sources, trek };
  }
}

function asDetails(properties: Prisma.JsonValue | null): FeatureDetails {
  return properties && typeof properties === "object" && !Array.isArray(properties)
    ? (properties as FeatureDetails)
    : {};
}

function readProfile(properties: Prisma.JsonValue | null): TrailProfile | null {
  return (asDetails(properties).profile as TrailProfile | undefined) ?? null;
}

function withoutProfile(properties: Prisma.JsonValue | null): FeatureDetails | null {
  const { profile: _profile, ...details } = asDetails(properties);

  return Object.keys(details).length ? details : null;
}

function toFeature(record: FeatureRecord, geometry: GeoFeature["geometry"]): GeoFeature {
  return {
    type: "Feature",
    id: record.id,
    geometry,
    properties: {
      kind: record.kind,
      name: record.name,
      nameLocal: record.nameLocal,
      elevationM: record.elevationM,
      details: withoutProfile(record.properties),
      sourceKey: record.source.key,
      sourceRef: record.sourceRef,
    },
  };
}

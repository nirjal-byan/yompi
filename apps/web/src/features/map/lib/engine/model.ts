import type { GeoFeature, GeoFeatureCollection } from "@yompi/shared";
import { type Bounds, SPACE, emptyBounds, extendBounds, project } from "../projection";
import {
  EIGHT_THOUSANDER_ELEVATION_M,
  EVEREST_NAME,
  EVEREST_RADIUS,
  GIANT_PEAK_RADIUS,
  HIGH_PEAK_ELEVATION_M,
} from "./constants";
import type { MapItem, MapLayers, MapModel, Marker, MarkerKind, TrailModel } from "./types";

function projectToScene(coordinates: number[][], ...boundsToExtend: Bounds[]): number[] {
  const points: number[] = [];

  for (const [lon, lat] of coordinates) {
    const { x, y } = project(lon, lat);
    points.push(x * SPACE, y * SPACE);
    for (const bounds of boundsToExtend) extendBounds(bounds, x, y);
  }

  return points;
}

function markerRadius(kind: MarkerKind, elevationM: number, name = ""): number {
  switch (kind) {
    case "PEAK":
      if (name === EVEREST_NAME) return EVEREST_RADIUS;
      if (elevationM >= EIGHT_THOUSANDER_ELEVATION_M) return GIANT_PEAK_RADIUS;

      return elevationM >= HIGH_PEAK_ELEVATION_M ? 9 : 6.5;
    case "CITY":
    case "LAKE":
      return 6;
    default:
      return 5;
  }
}

function buildBoundary(feature: GeoFeature, world: Bounds): number[][] {
  const { type, coordinates } = feature.geometry;
  const polygons =
    type === "Polygon" ? [coordinates as number[][][]] : (coordinates as number[][][][]);

  return polygons.map((polygon) => projectToScene(polygon[0], world));
}

function buildTrail(feature: GeoFeature): TrailModel {
  const bounds = emptyBounds();

  const lines = (feature.geometry.coordinates as number[][][]).map((coordinates) => {
    const lineBounds = emptyBounds();
    const points = projectToScene(coordinates, lineBounds, bounds);
    return { points, bounds: lineBounds };
  });

  return { id: feature.id, feature, lines, bounds };
}

function buildTrailAnchor(trail: TrailModel): Marker | null {
  if (trail.lines.length === 0) return null;

  const longest = trail.lines.reduce((a, b) => (b.points.length > a.points.length ? b : a));
  const middle = Math.floor(longest.points.length / 4) * 2;

  return {
    id: trail.id,
    feature: trail.feature,
    kind: "TRAIL",
    name: trail.feature.properties.name,
    elevationM: 0,
    x: longest.points[middle] / SPACE,
    y: longest.points[middle + 1] / SPACE,
    radius: markerRadius("TRAIL", 0),
    screenX: 0,
    screenY: 0,
  };
}

function buildPlaceMarker(feature: GeoFeature): Marker {
  const { kind, name, elevationM } = feature.properties;
  const [lon, lat] = feature.geometry.coordinates as number[];
  const { x, y } = project(lon, lat);
  const elevation = elevationM ?? 0;

  return {
    id: feature.id,
    feature,
    kind: kind as MarkerKind,
    name,
    elevationM: elevation,
    x,
    y,
    radius: markerRadius(kind as MarkerKind, elevation, name),
    screenX: 0,
    screenY: 0,
  };
}

export function buildMapModel(data: GeoFeatureCollection): MapModel {
  const world = emptyBounds();
  const boundary: number[][] = [];
  const trails: TrailModel[] = [];
  const markers: Marker[] = [];

  for (const feature of data.features) {
    switch (feature.properties.kind) {
      case "COUNTRY_BOUNDARY":
        boundary.push(...buildBoundary(feature, world));
        break;
      case "TRAIL": {
        const trail = buildTrail(feature);
        const anchor = buildTrailAnchor(trail);
        trails.push(trail);
        if (anchor) markers.push(anchor);
        break;
      }
      default:
        markers.push(buildPlaceMarker(feature));
    }
  }

  if (boundary.length === 0) {
    for (const marker of markers) extendBounds(world, marker.x, marker.y);
  }

  markers.sort((a, b) => a.elevationM - b.elevationM);

  return { boundary, trails, markers, world };
}

export function isTrail(item: MapItem): item is TrailModel {
  return "lines" in item;
}

export function findItem(model: MapModel, id: string | null): MapItem | undefined {
  if (!id) return undefined;
  return model.trails.find((trail) => trail.id === id) ?? model.markers.find((m) => m.id === id);
}

export function isOnVisibleLayer(item: MapItem, layers: MapLayers): boolean {
  if (isTrail(item)) return layers.trails;

  switch (item.kind) {
    case "PEAK":
      return layers.peaks;
    case "LAKE":
      return layers.lakes;
    case "PASS":
      return layers.passes;
    case "TRAIL":
      return layers.trails;
    default:
      return layers.places;
  }
}

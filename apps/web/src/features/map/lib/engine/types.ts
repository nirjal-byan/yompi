import type { GeoFeature } from "@yompi/shared";
import type { Bounds } from "../projection";

export interface MapLayers {
  terrain: boolean;
  peaks: boolean;
  lakes: boolean;
  passes: boolean;
  trails: boolean;
  places: boolean;
}

export interface MapCallbacks {
  onSelect(feature: GeoFeature | null): void;
}

export type MarkerKind = "PEAK" | "CITY" | "GATEWAY" | "LAKE" | "PASS" | "TRAIL";

export interface Marker {
  id: string;
  feature: GeoFeature;
  kind: MarkerKind;
  name: string;
  elevationM: number;
  x: number;
  y: number;
  radius: number;
  screenX: number;
  screenY: number;
}

export interface TrailLine {
  points: number[];
  bounds: Bounds;
}

export interface TrailModel {
  id: string;
  feature: GeoFeature;
  lines: TrailLine[];
  bounds: Bounds;
}

export interface MapModel {
  boundary: number[][];
  trails: TrailModel[];
  markers: Marker[];
  world: Bounds;
}

export interface CameraPosition {
  x: number;
  y: number;
  z: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export type MapItem = Marker | TrailModel;

export type FocusCard = "trail" | "place" | "intro";

import { Container, Graphics, Text } from "pixi.js";
import {
  COLORS,
  EIGHT_THOUSANDER_ELEVATION_M,
  EVEREST_NAME,
  GATEWAY_VISIBLE_FROM_ZOOM,
  HIGH_PEAK_ELEVATION_M,
  LABEL_FONT_SIZE,
  LABEL_MARKER_GAP,
  LABEL_PADDING_X,
  LABEL_PADDING_Y,
  LOW_PEAK_LABEL_FROM_ZOOM,
  MARKER_PICK_RADIUS_PX,
  MAX_LABELS,
  PASS_VISIBLE_FROM_ZOOM,
  PRIORITY_PLACES,
} from "./constants";
import { rectsOverlap } from "./math";
import type { CameraPosition, MapLayers, Marker, Rect } from "./types";

export interface MarkerView {
  camera: CameraPosition;
  width: number;
  height: number;
  zoomRatio: number;
  layers: MapLayers;
  selectedId: string | null;
}

const SCREEN_MARGIN_PX = 20;

function isMarkerShown(
  marker: Marker,
  layers: MapLayers,
  zoomRatio: number,
  selected: boolean,
): boolean {
  switch (marker.kind) {
    case "PEAK":
      return layers.peaks;
    case "LAKE":
      return layers.lakes;
    case "TRAIL":
      return layers.trails;
    case "PASS":
      return layers.passes && (zoomRatio >= PASS_VISIBLE_FROM_ZOOM || selected);
    case "GATEWAY":
      return layers.places && (zoomRatio >= GATEWAY_VISIBLE_FROM_ZOOM || selected);
    default:
      return layers.places;
  }
}

function drawOrder(marker: Marker): number {
  switch (marker.kind) {
    case "PEAK":
      return 0;
    case "LAKE":
    case "PASS":
    case "TRAIL":
      return 1;
    case "GATEWAY":
      return 2;
    default:
      return 3;
  }
}

function isHighPeak(marker: Marker): boolean {
  return marker.kind === "PEAK" && marker.elevationM >= HIGH_PEAK_ELEVATION_M;
}

function isGiantPeak(marker: Marker): boolean {
  return marker.kind === "PEAK" && marker.elevationM >= EIGHT_THOUSANDER_ELEVATION_M;
}

function isEverest(marker: Marker): boolean {
  return marker.kind === "PEAK" && marker.name === EVEREST_NAME;
}

function labelRank(marker: Marker, selectedId: string | null, hovered: Marker | null): number {
  if (marker.id === selectedId) return 0;
  if (marker === hovered) return 1;
  if (isEverest(marker)) return 1.5;
  if (isGiantPeak(marker)) return 1.8;
  if (PRIORITY_PLACES.has(marker.name)) return 2;
  if (marker.kind === "CITY") return 3;
  if (isHighPeak(marker)) return 4;
  if (marker.kind === "LAKE" || marker.kind === "TRAIL") return 5;
  if (marker.kind === "GATEWAY" || marker.kind === "PASS") return 6;
  return 7;
}

function labelText(marker: Marker): string {
  if (marker.kind === "CITY") return marker.name.toUpperCase();

  const showsElevation = marker.kind === "PEAK" || marker.kind === "LAKE" || marker.kind === "PASS";
  if (showsElevation && marker.elevationM > 0) {
    const height = `${marker.name} ${marker.elevationM.toLocaleString("en-US")} m`;

    return isEverest(marker) ? `${height} - top of the world` : height;
  }

  return marker.name;
}

function drawPeak(
  graphics: Graphics,
  marker: Marker,
  scale: number,
  outline: { width: number; color: number; join: "round" },
): void {
  const { screenX: x, screenY: y } = marker;
  const size = marker.radius * scale;
  const triangle = [
    x,
    y - size,
    x + size * 1.05,
    y + size * 0.75,
    x - size * 1.05,
    y + size * 0.75,
  ];

  if (isEverest(marker)) {
    graphics
      .circle(x, y + size * 0.1, size * 1.35)
      .fill({ color: COLORS.paper, alpha: 0.9 })
      .stroke({ width: 2, color: COLORS.peakEverest });
    graphics
      .poly(triangle, true)
      .fill({ color: COLORS.peakEverest })
      .stroke({ ...outline, width: 2.5 });
    graphics
      .poly([x, y - size, x + size * 0.38, y - size * 0.35, x - size * 0.38, y - size * 0.35], true)
      .fill({ color: COLORS.snow });
    graphics
      .star(x, y - size * 1.75, 5, size * 0.55, size * 0.25)
      .fill({ color: COLORS.peakEverest })
      .stroke(outline);

    return;
  }

  if (isGiantPeak(marker)) {
    graphics
      .poly(triangle, true)
      .fill({ color: COLORS.peakGiant })
      .stroke({ ...outline, width: 2 });
    graphics
      .poly([x, y - size, x + size * 0.34, y - size * 0.4, x - size * 0.34, y - size * 0.4], true)
      .fill({ color: COLORS.snow });

    return;
  }

  graphics
    .poly(triangle, true)
    .fill({ color: isHighPeak(marker) ? COLORS.peakHigh : COLORS.peak })
    .stroke(outline);
}

function drawMarkerShape(graphics: Graphics, marker: Marker, scale: number): void {
  const { screenX: x, screenY: y } = marker;
  const size = marker.radius * scale;
  const outline = { width: 1.5, color: COLORS.ink, join: "round" } as const;

  switch (marker.kind) {
    case "PEAK":
      drawPeak(graphics, marker, scale, outline);
      break;
    case "LAKE":
      graphics.circle(x, y, size).fill({ color: COLORS.lake }).stroke(outline);
      graphics
        .circle(x - size * 0.3, y - size * 0.3, size * 0.3)
        .fill({ color: COLORS.paper, alpha: 0.85 });
      break;
    case "TRAIL":
      graphics
        .rect(x - size, y - size, size * 2, size * 2)
        .fill({ color: COLORS.trail })
        .stroke(outline);
      break;
    case "PASS":
      graphics
        .poly([x - size, y - size * 0.7, x + size, y - size * 0.7, x, y + size * 0.9], true)
        .fill({ color: COLORS.paper })
        .stroke(outline);
      break;
    default:
      graphics
        .poly([x, y - size, x + size, y, x, y + size, x - size, y], true)
        .fill({ color: marker.kind === "CITY" ? COLORS.ink : COLORS.accent })
        .stroke({ width: 1.25, color: COLORS.paper, join: "round" });
  }
}

export class MarkerLayer {
  private readonly shapes = new Graphics();
  private readonly labelBackground = new Graphics();
  private readonly labelContainer = new Container();
  private readonly labels = new Map<string, Text>();
  private visible: Marker[] = [];
  private hovered: Marker | null = null;

  constructor(
    private readonly markers: Marker[],
    private readonly fontFamily: string,
  ) {}

  attachTo(stage: Container): void {
    stage.addChild(this.shapes, this.labelBackground, this.labelContainer);
  }

  setHovered(marker: Marker | null): boolean {
    if (marker === this.hovered) return false;
    this.hovered = marker;
    return true;
  }

  pick(screenX: number, screenY: number): Marker | null {
    let closest: Marker | null = null;
    let closestDistance = Infinity;

    for (const marker of this.visible) {
      const distance = Math.hypot(marker.screenX - screenX, marker.screenY - screenY);
      const isHit = distance <= marker.radius + MARKER_PICK_RADIUS_PX;
      if (isHit && distance < closestDistance) {
        closest = marker;
        closestDistance = distance;
      }
    }

    return closest;
  }

  draw(view: MarkerView): void {
    this.shapes.clear();
    this.collectVisible(view);
    this.drawShapes(view.selectedId);
    this.drawLabels(view);
  }

  private collectVisible(view: MarkerView): void {
    const { camera, width, height, zoomRatio, layers, selectedId } = view;
    this.visible = [];

    for (const marker of this.markers) {
      const selected = marker.id === selectedId;
      if (!isMarkerShown(marker, layers, zoomRatio, selected)) continue;

      const screenX = (marker.x - camera.x) * camera.z + width / 2;
      const screenY = (marker.y - camera.y) * camera.z + height / 2;
      const isOffScreen =
        screenX < -SCREEN_MARGIN_PX ||
        screenX > width + SCREEN_MARGIN_PX ||
        screenY < -SCREEN_MARGIN_PX ||
        screenY > height + SCREEN_MARGIN_PX;
      if (isOffScreen) continue;

      marker.screenX = screenX;
      marker.screenY = screenY;
      this.visible.push(marker);
    }
  }

  private drawShapes(selectedId: string | null): void {
    const ordered = [...this.visible].sort((a, b) => drawOrder(a) - drawOrder(b));
    for (const marker of ordered) {
      drawMarkerShape(this.shapes, marker, marker === this.hovered ? 1.3 : 1);
    }

    const selected = this.visible.find((marker) => marker.id === selectedId);
    if (!selected) return;

    this.shapes
      .circle(selected.screenX, selected.screenY, selected.radius + 9)
      .stroke({ width: 2.5, color: COLORS.accent });
    drawMarkerShape(this.shapes, selected, 1.15);
  }

  private labelFor(marker: Marker): Text {
    let label = this.labels.get(marker.id);
    if (label) return label;

    label = new Text({
      text: "",
      style: {
        fontFamily: this.fontFamily,
        fontSize: LABEL_FONT_SIZE,
        fill: COLORS.ink,
        letterSpacing: 0.3,
      },
    });
    label.visible = false;
    this.labels.set(marker.id, label);
    this.labelContainer.addChild(label);

    return label;
  }

  private drawLabels(view: MarkerView): void {
    const { width, height, zoomRatio, selectedId } = view;
    this.labelBackground.clear();
    for (const label of this.labels.values()) label.visible = false;

    const candidates = [...this.visible].sort(
      (a, b) =>
        labelRank(a, selectedId, this.hovered) - labelRank(b, selectedId, this.hovered) ||
        b.elevationM - a.elevationM,
    );

    const placed: Rect[] = [];
    const fitsOnScreen = (rect: Rect) =>
      rect.x >= 0 &&
      rect.y >= 0 &&
      rect.x + rect.w <= width &&
      rect.y + rect.h <= height &&
      !placed.some((other) => rectsOverlap(other, rect));

    for (const marker of candidates) {
      if (placed.length >= MAX_LABELS) break;

      const isFocused = marker.id === selectedId || marker === this.hovered;
      const isMinorPeak = marker.kind === "PEAK" && !isHighPeak(marker);
      if (isMinorPeak && zoomRatio < LOW_PEAK_LABEL_FROM_ZOOM && !isFocused) continue;

      const label = this.labelFor(marker);
      const text = labelText(marker);
      if (label.text !== text) label.text = text;

      const boxWidth = label.width + LABEL_PADDING_X * 2;
      const boxHeight = label.height + LABEL_PADDING_Y * 2;
      const gap = marker.radius + LABEL_MARKER_GAP;
      const { screenX: x, screenY: y } = marker;

      const options: Rect[] = [
        { x: x + gap, y: y - boxHeight / 2, w: boxWidth, h: boxHeight },
        { x: x - gap - boxWidth, y: y - boxHeight / 2, w: boxWidth, h: boxHeight },
        { x: x - boxWidth / 2, y: y - gap - boxHeight, w: boxWidth, h: boxHeight },
        { x: x - boxWidth / 2, y: y + gap, w: boxWidth, h: boxHeight },
      ];
      const box = options.find(fitsOnScreen);
      if (!box) continue;

      placed.push(box);
      const selected = marker.id === selectedId;

      this.labelBackground
        .rect(box.x, box.y, box.w, box.h)
        .fill({ color: selected ? COLORS.accent : COLORS.paper })
        .stroke({ width: 1, color: COLORS.ink });
      label.style.fill = selected ? COLORS.paper : COLORS.ink;
      label.position.set(box.x + LABEL_PADDING_X, box.y + LABEL_PADDING_Y);
      label.visible = true;
    }
  }
}

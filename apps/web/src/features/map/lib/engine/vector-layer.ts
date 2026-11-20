import { Container, Graphics } from "pixi.js";
import { SPACE, project } from "../projection";
import {
  COLORS,
  LINE_REDRAW_MAX_RATIO,
  LINE_REDRAW_MIN_RATIO,
  LINE_REDRAW_SETTLED_TOLERANCE,
} from "./constants";
import { thinPoints } from "./math";
import type { MapModel, TrailModel } from "./types";

export interface LineView {
  zoom: number;
  zoomRatio: number;
  terrainOn: boolean;
  trailsOn: boolean;
  selectedId: string | null;
}

const GRATICULE = { west: 76, east: 93, south: 22, north: 33 };

export class VectorLayer {
  private readonly lines = new Graphics();
  private readonly fade = new Graphics();
  private drawnAtZoom = 0;

  constructor(private readonly model: MapModel) {}

  attachTo(scene: Container): void {
    scene.addChild(this.fade, this.lines);
  }

  needsRedraw(zoom: number, settled: boolean): boolean {
    const ratio = this.drawnAtZoom > 0 ? zoom / this.drawnAtZoom : 0;
    const driftedTooFar = ratio < LINE_REDRAW_MIN_RATIO || ratio > LINE_REDRAW_MAX_RATIO;
    const settledOffScale = settled && Math.abs(ratio - 1) > LINE_REDRAW_SETTLED_TOLERANCE;

    return driftedTooFar || settledOffScale;
  }

  drawLines(view: LineView): void {
    const pixel = SPACE / view.zoom;
    this.drawnAtZoom = view.zoom;
    this.lines.clear();

    if (!view.terrainOn) this.drawGraticule(view.zoomRatio, pixel);
    this.drawBoundary(view.terrainOn, pixel);
    if (view.trailsOn) this.drawTrails(view.selectedId, pixel);
  }

  drawFade(terrainOn: boolean): void {
    const { boundary } = this.model;
    this.fade.clear();
    this.fade.visible = terrainOn;
    if (!terrainOn || boundary.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const ring of boundary) {
      for (let i = 0; i < ring.length; i += 2) {
        minX = Math.min(minX, ring[i]);
        maxX = Math.max(maxX, ring[i]);
        minY = Math.min(minY, ring[i + 1]);
        maxY = Math.max(maxY, ring[i + 1]);
      }
    }

    const padding = Math.max(maxX - minX, maxY - minY) * 2;
    this.fade
      .rect(minX - padding, minY - padding, maxX - minX + padding * 2, maxY - minY + padding * 2)
      .fill({ color: COLORS.sea, alpha: 0.6 });

    for (const ring of boundary) this.fade.poly(ring, true).cut();
  }

  private drawGraticule(zoomRatio: number, pixel: number): void {
    const step = zoomRatio < 4 ? 1 : zoomRatio < 12 ? 0.5 : 0.1;
    const west = project(GRATICULE.west, 0).x * SPACE;
    const east = project(GRATICULE.east, 0).x * SPACE;
    const south = project(0, GRATICULE.south).y * SPACE;
    const north = project(0, GRATICULE.north).y * SPACE;

    for (let lon = GRATICULE.west; lon <= GRATICULE.east; lon += step) {
      const x = project(lon, 0).x * SPACE;
      this.lines.moveTo(x, north).lineTo(x, south);
    }
    for (let lat = GRATICULE.south; lat <= GRATICULE.north; lat += step) {
      const y = project(0, lat).y * SPACE;
      this.lines.moveTo(west, y).lineTo(east, y);
    }

    this.lines.stroke({ width: pixel, color: COLORS.grid });
  }

  private drawBoundary(terrainOn: boolean, pixel: number): void {
    for (const ring of this.model.boundary) {
      const outline = this.lines.poly(thinPoints(ring, 1.2 * pixel), true);
      if (!terrainOn) outline.fill({ color: COLORS.land });
      outline.stroke({ width: (terrainOn ? 2 : 1.75) * pixel, color: COLORS.ink, join: "round" });
    }
  }

  private traceTrails(trails: TrailModel[], pixel: number): void {
    for (const trail of trails) {
      for (const line of trail.lines) {
        const points = thinPoints(line.points, 1.5 * pixel);
        this.lines.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) this.lines.lineTo(points[i], points[i + 1]);
      }
    }
  }

  private drawTrails(selectedId: string | null, pixel: number): void {
    const { trails } = this.model;
    const round = { cap: "round", join: "round" } as const;

    this.traceTrails(trails, pixel);
    this.lines.stroke({ width: 5 * pixel, color: COLORS.ink, ...round });
    this.traceTrails(trails, pixel);
    this.lines.stroke({ width: 3 * pixel, color: COLORS.trail, ...round });

    const selected = trails.filter((trail) => trail.id === selectedId);
    if (selected.length === 0) return;

    this.traceTrails(selected, pixel);
    this.lines.stroke({ width: 9 * pixel, color: COLORS.accent, alpha: 0.35, ...round });
    this.traceTrails(selected, pixel);
    this.lines.stroke({ width: 3 * pixel, color: COLORS.trail, ...round });
  }
}

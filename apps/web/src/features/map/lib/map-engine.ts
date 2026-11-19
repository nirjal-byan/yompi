import { Application, Container, Graphics, Text } from "pixi.js";
import type { GeoFeature, GeoFeatureCollection } from "@yompi/shared";
import { type Bounds, SPACE, emptyBounds, extendBounds, project } from "./projection";
import { TerrainLayer } from "./terrain";

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

const COLORS = {
  sea: 0xf1ebdc,
  land: 0xd8e4bf,
  grid: 0xdcd3bd,
  ink: 0x3b2a26,
  paper: 0xfffdf8,
  accent: 0x2f5d3a,
  trail: 0xffb43e,
  peak: 0x8a6a5c,
  peakHigh: 0xffb43e,
  lake: 0x4f9fc6,
};

const HIGH_PEAK_M = 6000;
const MAX_LABELS = 70;
const CLICK_SLOP_PX = 5;
/** Gateways the product calls out explicitly: their labels win collisions. */
const PRIORITY_PLACES = new Set(["Kathmandu", "Pokhara"]);
/** Shifts the fitted view up so the bottom-left intro card does not cover far-western Nepal. */
const FIT_SHIFT_UP_PX = 36;
/** Cap the pixel density: retina screens look almost the same at 1.5x but cost far less GPU. */
const MAX_PIXEL_RATIO = 1.5;
/** Static lines are redrawn when the zoom drifts this far from the zoom they were drawn at. */
const REBASE_MIN = 0.65;
const REBASE_MAX = 1.55;
const TERRAIN_UPDATE_MS = 90;

type PlaceKind = "PEAK" | "CITY" | "GATEWAY" | "LAKE" | "PASS";

interface Marker {
  id: string;
  feature: GeoFeature;
  kind: PlaceKind;
  name: string;
  elevationM: number;
  x: number;
  y: number;
  r: number;
  sx: number;
  sy: number;
}

interface TrailLine {
  /** Scene-space points: x, y, x, y ... */
  pts: number[];
  bounds: Bounds;
}

interface TrailModel {
  id: string;
  feature: GeoFeature;
  lines: TrailLine[];
  bounds: Bounds;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/**
 * Framework-free PixiJS map.
 *
 * Performance design:
 *  - Terrain, the outline and trails live in a "scene" the camera scales and moves on the GPU, so
 *    panning redraws nothing. Lines are rebuilt only when the zoom drifts (keeps widths crisp).
 *  - Markers and labels (a few dozen) are redrawn in screen space only while the camera moves.
 *  - The render loop sleeps when nothing changes, so an idle map costs no CPU or GPU.
 */
export class NepalMapEngine {
  private app = new Application();
  private ready = false;
  private destroyed = false;
  private host!: HTMLElement;
  private callbacks!: MapCallbacks;
  private fontFamily = "monospace";
  private resizeObserver?: ResizeObserver;

  // Scene (camera-transformed): terrain, fade layer, static lines.
  private scene = new Container();
  private fog = new Graphics();
  private vector = new Graphics();
  private terrain!: TerrainLayer;
  // Screen space: markers and labels.
  private markerGfx = new Graphics();
  private labelBg = new Graphics();
  private labelLayer = new Container();
  private labels = new Map<string, Text>();

  private cam = { x: 0, y: 0, z: 1 };
  private target = { x: 0, y: 0, z: 1 };
  private fitZoom = 1;
  private world: Bounds = emptyBounds();
  private w = 0;
  private h = 0;
  private userMoved = false;

  // Render scheduling.
  private raf = 0;
  private lastT = 0;
  private needsDraw = true;
  private vectorDirty = true;
  private fogDirty = true;
  private vectorZoom = 0;
  private terrainDirty = true;
  private lastTerrainUpdate = 0;

  private boundary: number[][] = [];
  private trails: TrailModel[] = [];
  private markers: Marker[] = [];
  private visible: Marker[] = [];
  private layers: MapLayers = { terrain: true, peaks: true, lakes: true, passes: true, trails: true, places: true };
  private selectedId: string | null = null;
  private hover: Marker | null = null;

  private pointers = new Map<number, { x: number; y: number }>();
  private drag = { active: false, moved: 0, lastX: 0, lastY: 0, lastT: 0, vx: 0, vy: 0 };
  private pinchDistance = 0;

  async init(host: HTMLElement, data: GeoFeatureCollection, callbacks: MapCallbacks): Promise<void> {
    this.host = host;
    this.callbacks = callbacks;
    this.parse(data);

    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim();
    if (mono) this.fontFamily = `${mono}, monospace`;
    await document.fonts?.ready;

    await this.app.init({
      resizeTo: host,
      background: COLORS.sea,
      antialias: true,
      autoDensity: true,
      autoStart: false, // we render on demand, see wake()
      resolution: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
    });
    if (this.destroyed) {
      this.app.destroy(true);
      return;
    }
    this.ready = true;

    const canvas = this.app.canvas;
    canvas.style.touchAction = "none";
    canvas.style.display = "block";
    canvas.style.outline = "none";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "application");
    canvas.setAttribute(
      "aria-label",
      "Interactive map of Nepal. Drag to pan, scroll or use plus and minus to zoom, arrow keys to move.",
    );
    host.appendChild(canvas);

    // Terrain tiles are only fetched for Nepal plus a margin (~30 world units, about 1.7 degrees).
    const margin = 30;
    this.terrain = new TerrainLayer(
      { minX: this.world.minX - margin, minY: this.world.minY - margin, maxX: this.world.maxX + margin, maxY: this.world.maxY + margin },
      () => this.invalidate(),
    );
    this.scene.addChild(this.terrain.container, this.fog, this.vector);
    this.app.stage.addChild(this.scene, this.markerGfx, this.labelBg, this.labelLayer);

    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("keydown", this.onKeyDown);
    this.resizeObserver = new ResizeObserver(() => {
      this.app.resize();
      this.invalidate();
    });
    this.resizeObserver.observe(host);

    this.measure();
    this.fitAll(true);
  }

  destroy(): void {
    this.destroyed = true;
    if (!this.ready) return;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    const canvas = this.app.canvas;
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerup", this.onPointerUp);
    canvas.removeEventListener("pointercancel", this.onPointerUp);
    canvas.removeEventListener("pointerleave", this.onPointerLeave);
    canvas.removeEventListener("wheel", this.onWheel);
    canvas.removeEventListener("keydown", this.onKeyDown);
    this.ready = false;
    this.terrain.destroy();
    this.app.destroy(true, { children: true });
  }

  // ---------------------------------------------------------------- public controls

  setLayers(layers: MapLayers): void {
    this.layers = layers;
    const selected = this.findById(this.selectedId);
    if (selected && !this.isFeatureLayerVisible(selected)) this.select(null);
    this.vectorDirty = true;
    this.fogDirty = true;
    this.terrainDirty = true;
    this.invalidate();
  }

  zoomBy(factor: number): void {
    this.userMoved = true;
    this.zoomAt(this.w / 2, this.h / 2, factor);
  }

  fitAll(snap = false): void {
    this.target.x = (this.world.minX + this.world.maxX) / 2;
    this.target.y = (this.world.minY + this.world.maxY) / 2 + FIT_SHIFT_UP_PX / this.fitZoom;
    this.target.z = this.fitZoom;
    if (snap) this.cam = { ...this.target };
    this.invalidate();
  }

  /** Selects a place or trail by id (null clears) and eases the camera towards it. */
  select(id: string | null, focus = true): void {
    this.selectedId = id;
    const found = this.findById(id);
    if (found && focus) {
      this.userMoved = true;
      if ("lines" in found) this.flyToBounds(found.bounds);
      else this.flyToPoint(found.x, found.y, Math.max(this.target.z, this.fitZoom * 2.5));
    }
    this.callbacks.onSelect(found ? found.feature : null);
    this.vectorDirty = true; // a selected trail is highlighted in the static lines
    this.invalidate();
  }

  /** Zooms to the combined extent of all trails whose name passes `match`. */
  focusTrails(match: (name: string) => boolean): void {
    const bounds = emptyBounds();
    for (const trail of this.trails) {
      if (!match(trail.feature.properties.name)) continue;
      extendBounds(bounds, trail.bounds.minX, trail.bounds.minY);
      extendBounds(bounds, trail.bounds.maxX, trail.bounds.maxY);
    }
    if (bounds.minX === Infinity) return;
    this.userMoved = true;
    this.flyToBounds(bounds);
  }

  // ---------------------------------------------------------------- data

  private parse(data: GeoFeatureCollection): void {
    const bounds = emptyBounds();
    for (const feature of data.features) {
      const { kind, name, elevationM } = feature.properties;
      const geometry = feature.geometry;
      if (kind === "COUNTRY_BOUNDARY") {
        const polygons =
          geometry.type === "Polygon"
            ? [geometry.coordinates as number[][][]]
            : (geometry.coordinates as number[][][][]);
        for (const polygon of polygons) {
          const flat: number[] = [];
          for (const [lon, lat] of polygon[0]) {
            const p = project(lon, lat);
            flat.push(p.x * SPACE, p.y * SPACE);
            extendBounds(bounds, p.x, p.y);
          }
          this.boundary.push(flat);
        }
      } else if (kind === "TRAIL") {
        const lines: TrailLine[] = [];
        const trailBounds = emptyBounds();
        for (const line of geometry.coordinates as number[][][]) {
          const pts: number[] = [];
          const lineBounds = emptyBounds();
          for (const [lon, lat] of line) {
            const p = project(lon, lat);
            pts.push(p.x * SPACE, p.y * SPACE);
            extendBounds(lineBounds, p.x, p.y);
            extendBounds(trailBounds, p.x, p.y);
          }
          lines.push({ pts, bounds: lineBounds });
        }
        this.trails.push({ id: feature.id, feature, lines, bounds: trailBounds });
      } else {
        const [lon, lat] = geometry.coordinates as number[];
        const p = project(lon, lat);
        const high = kind === "PEAK" && (elevationM ?? 0) >= HIGH_PEAK_M;
        this.markers.push({
          id: feature.id,
          feature,
          kind: kind as PlaceKind,
          name,
          elevationM: elevationM ?? 0,
          x: p.x,
          y: p.y,
          r: kind === "PEAK" ? (high ? 9 : 6.5) : kind === "CITY" ? 6 : kind === "LAKE" ? 6 : 5,
          sx: 0,
          sy: 0,
        });
        if (this.boundary.length === 0) extendBounds(bounds, p.x, p.y);
      }
    }
    this.world = bounds;
    // Draw low peaks first so high ones sit on top.
    this.markers.sort((a, b) => a.elevationM - b.elevationM);
  }

  private findById(id: string | null): Marker | TrailModel | undefined {
    if (!id) return undefined;
    return this.markers.find((m) => m.id === id) ?? this.trails.find((t) => t.id === id);
  }

  private isFeatureLayerVisible(item: Marker | TrailModel): boolean {
    if ("lines" in item) return this.layers.trails;
    switch (item.kind) {
      case "PEAK": return this.layers.peaks;
      case "LAKE": return this.layers.lakes;
      case "PASS": return this.layers.passes;
      default: return this.layers.places;
    }
  }

  // ---------------------------------------------------------------- camera

  private measure(): void {
    this.w = this.app.screen.width;
    this.h = this.app.screen.height;
    const bw = this.world.maxX - this.world.minX || 1;
    const bh = this.world.maxY - this.world.minY || 1;
    this.fitZoom = Math.max(1e-3, Math.min((this.w - 96) / bw, (this.h - 96) / bh));
    if (!this.userMoved) this.fitAll(true);
    this.clampTarget();
    this.terrainDirty = true;
    this.needsDraw = true;
  }

  private clampTarget(): void {
    const padX = (this.world.maxX - this.world.minX) * 0.15;
    const padY = (this.world.maxY - this.world.minY) * 0.5;
    this.target.z = clamp(this.target.z, this.fitZoom * 0.7, this.fitZoom * 90);
    this.target.x = clamp(this.target.x, this.world.minX - padX, this.world.maxX + padX);
    this.target.y = clamp(this.target.y, this.world.minY - padY, this.world.maxY + padY);
  }

  private zoomAt(sx: number, sy: number, factor: number): void {
    const t = this.target;
    const worldX = t.x + (sx - this.w / 2) / t.z;
    const worldY = t.y + (sy - this.h / 2) / t.z;
    t.z = clamp(t.z * factor, this.fitZoom * 0.7, this.fitZoom * 90);
    t.x = worldX - (sx - this.w / 2) / t.z;
    t.y = worldY - (sy - this.h / 2) / t.z;
    this.clampTarget();
    this.invalidate();
  }

  private flyToPoint(x: number, y: number, zoom: number): void {
    this.target.x = x;
    this.target.y = y;
    this.target.z = zoom;
    this.clampTarget();
    this.invalidate();
  }

  private flyToBounds(b: Bounds): void {
    const bw = Math.max(b.maxX - b.minX, 1e-6);
    const bh = Math.max(b.maxY - b.minY, 1e-6);
    const zoom = Math.min((this.w - 160) / bw, (this.h - 160) / bh);
    this.flyToPoint((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, zoom);
  }

  // ---------------------------------------------------------------- render loop (on demand)

  /** Ask for a redraw. Starts the loop if it was asleep. */
  private invalidate(): void {
    this.needsDraw = true;
    if (this.raf || !this.ready) return;
    this.lastT = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (t: number): void => {
    this.raf = 0;
    if (!this.ready) return;
    const dt = clamp(t - this.lastT, 1, 50);
    this.lastT = t;
    if (this.tick(dt)) this.raf = requestAnimationFrame(this.frame);
  };

  /** Advances the camera and redraws what changed. Returns true while more frames are needed. */
  private tick(dt: number): boolean {
    if (this.w !== this.app.screen.width || this.h !== this.app.screen.height) this.measure();

    // Momentum after a drag is released.
    const d = this.drag;
    let momentum = false;
    if (!d.active && Math.abs(d.vx) + Math.abs(d.vy) > 0.01) {
      this.target.x -= (d.vx * dt) / this.cam.z;
      this.target.y -= (d.vy * dt) / this.cam.z;
      d.vx *= Math.exp(-dt / 260);
      d.vy *= Math.exp(-dt / 260);
      this.clampTarget();
      momentum = true;
    } else if (!d.active) {
      d.vx = 0;
      d.vy = 0;
    }

    // Ease the camera towards the target (zoom in log space so it feels even).
    const k = 1 - Math.exp(-dt / 85);
    const c = this.cam;
    const t = this.target;
    const dz = Math.log(t.z) - Math.log(c.z);
    const easing = Math.abs(t.x - c.x) * c.z > 0.05 || Math.abs(t.y - c.y) * c.z > 0.05 || Math.abs(dz) > 5e-4;
    let camChanged = false;
    if (easing) {
      c.x += (t.x - c.x) * k;
      c.y += (t.y - c.y) * k;
      c.z = Math.exp(Math.log(c.z) + dz * k);
      camChanged = true;
    } else if (c.x !== t.x || c.y !== t.y || c.z !== t.z) {
      c.x = t.x;
      c.y = t.y;
      c.z = t.z;
      camChanged = true;
    }
    const moving = easing || momentum || d.active;

    let more = moving;
    if (camChanged || this.needsDraw || this.vectorDirty || this.terrainDirty) {
      this.needsDraw = false;
      this.applyCamera();

      // Static lines: rebuild only when the zoom has drifted (or on settle, for crisp widths).
      const ratio = this.vectorZoom > 0 ? c.z / this.vectorZoom : 0;
      if (this.vectorDirty || ratio < REBASE_MIN || ratio > REBASE_MAX || (!easing && Math.abs(ratio - 1) > 0.06)) {
        this.drawVector();
        this.vectorDirty = false;
      }
      if (this.fogDirty) {
        this.drawFog();
        this.fogDirty = false;
      }

      // Terrain requests are throttled while moving, and always run once the camera settles.
      if (camChanged || this.terrainDirty) {
        const now = performance.now();
        if (!easing || now - this.lastTerrainUpdate > TERRAIN_UPDATE_MS) {
          this.terrain.update(c, this.w, this.h, this.layers.terrain);
          this.lastTerrainUpdate = now;
          this.terrainDirty = false;
        } else {
          this.terrainDirty = true;
          more = true;
        }
      }

      this.drawMarkers();
      this.app.render();
    }
    return more || this.needsDraw;
  }

  private applyCamera(): void {
    this.scene.pivot.set(this.cam.x * SPACE, this.cam.y * SPACE);
    this.scene.position.set(this.w / 2, this.h / 2);
    this.scene.scale.set(this.cam.z / SPACE);
  }

  // ---------------------------------------------------------------- drawing

  /** Outline, graticule and trails, in scene space. Widths are set for the zoom they are drawn at. */
  private drawVector(): void {
    const g = this.vector;
    g.clear();
    this.vectorZoom = this.cam.z;
    const px = SPACE / this.cam.z; // one screen pixel, in scene units
    const terrainOn = this.layers.terrain;

    if (!terrainOn) {
      // Graticule (lines every N degrees) so empty space still reads as a map.
      const zr = this.cam.z / this.fitZoom;
      const step = zr < 4 ? 1 : zr < 12 ? 0.5 : 0.1;
      const west = project(76, 0).x * SPACE;
      const east = project(93, 0).x * SPACE;
      const south = project(0, 22).y * SPACE;
      const north = project(0, 33).y * SPACE;
      for (let lon = 76; lon <= 93; lon += step) {
        const x = project(lon, 0).x * SPACE;
        g.moveTo(x, north).lineTo(x, south);
      }
      for (let lat = 22; lat <= 33; lat += step) {
        const y = project(0, lat).y * SPACE;
        g.moveTo(west, y).lineTo(east, y);
      }
      g.stroke({ width: px, color: COLORS.grid });
    }

    for (const ring of this.boundary) {
      const pts = this.decimate(ring, 1.2 * px);
      const shape = g.poly(pts, true);
      if (!terrainOn) shape.fill({ color: COLORS.land });
      shape.stroke({ width: (terrainOn ? 2 : 1.75) * px, color: COLORS.ink, join: "round" });
    }

    if (this.layers.trails) this.drawTrails(g, px);
  }

  private decimate(flat: number[], minDistance: number): number[] {
    const out: number[] = [];
    let lastX = Infinity;
    let lastY = Infinity;
    for (let i = 0; i < flat.length; i += 2) {
      if (Math.abs(flat[i] - lastX) + Math.abs(flat[i + 1] - lastY) < minDistance && i < flat.length - 2) continue;
      out.push(flat[i], flat[i + 1]);
      lastX = flat[i];
      lastY = flat[i + 1];
    }
    return out;
  }

  private drawTrails(g: Graphics, px: number): void {
    const path = (only?: (t: TrailModel) => boolean) => {
      for (const trail of this.trails) {
        if (only && !only(trail)) continue;
        for (const line of trail.lines) {
          const pts = this.decimate(line.pts, 1.5 * px);
          g.moveTo(pts[0], pts[1]);
          for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
        }
      }
    };
    const isSelected = (t: TrailModel) => t.id === this.selectedId;
    path();
    g.stroke({ width: 5 * px, color: COLORS.ink, cap: "round", join: "round" });
    path();
    g.stroke({ width: 3 * px, color: COLORS.trail, cap: "round", join: "round" });
    if (this.selectedId && this.trails.some(isSelected)) {
      path(isSelected);
      g.stroke({ width: 9 * px, color: COLORS.accent, alpha: 0.35, cap: "round", join: "round" });
      path(isSelected);
      g.stroke({ width: 3 * px, color: COLORS.trail, cap: "round", join: "round" });
    }
  }

  /** Outside Nepal the terrain is faded so the country stands out. Built once: it never changes with the camera. */
  private drawFog(): void {
    const fog = this.fog;
    fog.clear();
    fog.visible = this.layers.terrain;
    if (!this.layers.terrain || this.boundary.length === 0) return;

    // The cut-out must lie fully inside the outer shape, so the rectangle is generously larger than Nepal.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ring of this.boundary) {
      for (let i = 0; i < ring.length; i += 2) {
        if (ring[i] < minX) minX = ring[i];
        if (ring[i] > maxX) maxX = ring[i];
        if (ring[i + 1] < minY) minY = ring[i + 1];
        if (ring[i + 1] > maxY) maxY = ring[i + 1];
      }
    }
    const pad = Math.max(maxX - minX, maxY - minY) * 2;
    fog.rect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2).fill({ color: COLORS.sea, alpha: 0.6 });
    for (const ring of this.boundary) fog.poly(ring, true).cut();
  }

  /** Markers and labels, in screen space (a few dozen items). */
  private drawMarkers(): void {
    const { w, h } = this;
    const { x: cx, y: cy, z } = this.cam;
    const zr = z / this.fitZoom;
    const g = this.markerGfx;
    g.clear();

    this.visible = [];
    for (const m of this.markers) {
      const selected = m.id === this.selectedId;
      if (m.kind === "PEAK") {
        if (!this.layers.peaks) continue;
      } else if (m.kind === "LAKE") {
        if (!this.layers.lakes) continue;
      } else if (m.kind === "PASS") {
        if (!this.layers.passes || (zr < 1.8 && !selected)) continue;
      } else {
        if (!this.layers.places) continue;
        if (m.kind === "GATEWAY" && zr < 2.2 && !selected) continue;
      }
      const sx = (m.x - cx) * z + w / 2;
      const sy = (m.y - cy) * z + h / 2;
      if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;
      m.sx = sx;
      m.sy = sy;
      this.visible.push(m);
    }

    // Peaks, then lakes and passes, then gateways, then cities on top; hovered/selected last.
    const order = (m: Marker) => (m.kind === "PEAK" ? 0 : m.kind === "LAKE" || m.kind === "PASS" ? 1 : m.kind === "GATEWAY" ? 2 : 3);
    const ordered = [...this.visible].sort((a, b) => order(a) - order(b));
    for (const m of ordered) this.drawMarker(g, m, m === this.hover ? 1.3 : 1);
    const selected = this.visible.find((m) => m.id === this.selectedId);
    if (selected) {
      g.circle(selected.sx, selected.sy, selected.r + 9).stroke({ width: 2.5, color: COLORS.accent });
      this.drawMarker(g, selected, 1.15);
    }
    this.drawLabels(zr);
  }

  private drawMarker(g: Graphics, m: Marker, scale: number): void {
    const s = m.r * scale;
    const stroke = { width: 1.5, color: COLORS.ink, join: "round" as const };
    if (m.kind === "PEAK") {
      const high = m.elevationM >= HIGH_PEAK_M;
      g.poly([m.sx, m.sy - s, m.sx + s * 1.05, m.sy + s * 0.75, m.sx - s * 1.05, m.sy + s * 0.75], true)
        .fill({ color: high ? COLORS.peakHigh : COLORS.peak })
        .stroke(stroke);
    } else if (m.kind === "LAKE") {
      g.circle(m.sx, m.sy, s).fill({ color: COLORS.lake }).stroke(stroke);
      g.circle(m.sx - s * 0.3, m.sy - s * 0.3, s * 0.3).fill({ color: COLORS.paper, alpha: 0.85 });
    } else if (m.kind === "PASS") {
      // Inverted triangle: a dip between two peaks.
      g.poly([m.sx - s, m.sy - s * 0.7, m.sx + s, m.sy - s * 0.7, m.sx, m.sy + s * 0.9], true)
        .fill({ color: COLORS.paper })
        .stroke(stroke);
    } else {
      g.poly([m.sx, m.sy - s, m.sx + s, m.sy, m.sx, m.sy + s, m.sx - s, m.sy], true)
        .fill({ color: m.kind === "CITY" ? COLORS.ink : COLORS.accent })
        .stroke({ width: 1.25, color: COLORS.paper, join: "round" });
    }
  }

  private labelFor(m: Marker): Text {
    let text = this.labels.get(m.id);
    if (!text) {
      text = new Text({
        text: "",
        style: { fontFamily: this.fontFamily, fontSize: 10.5, fill: COLORS.ink, letterSpacing: 0.3 },
      });
      // Hidden until placed, otherwise it flashes at (0,0) when the label does not fit.
      text.visible = false;
      this.labels.set(m.id, text);
      this.labelLayer.addChild(text);
    }
    return text;
  }

  private labelText(m: Marker): string {
    if (m.kind === "CITY") return m.name.toUpperCase();
    if ((m.kind === "PEAK" || m.kind === "LAKE" || m.kind === "PASS") && m.elevationM > 0) {
      return `${m.name} ${m.elevationM.toLocaleString("en-US")} m`;
    }
    return m.name;
  }

  private drawLabels(zr: number): void {
    const bg = this.labelBg;
    bg.clear();
    for (const text of this.labels.values()) text.visible = false;

    // Importance order: selection, hover, key cities, other cities, high peaks, lakes, the rest.
    const rank = (m: Marker) =>
      m.id === this.selectedId ? 0
      : m === this.hover ? 1
      : PRIORITY_PLACES.has(m.name) ? 2
      : m.kind === "CITY" ? 3
      : m.kind === "PEAK" && m.elevationM >= HIGH_PEAK_M ? 4
      : m.kind === "LAKE" ? 5
      : m.kind === "GATEWAY" || m.kind === "PASS" ? 6
      : 7;
    const candidates = [...this.visible].sort((a, b) => rank(a) - rank(b) || b.elevationM - a.elevationM);
    const placed: Rect[] = [];
    let count = 0;
    for (const m of candidates) {
      if (count >= MAX_LABELS) break;
      if (m.kind === "PEAK" && m.elevationM < HIGH_PEAK_M && zr < 2.5 && m.id !== this.selectedId && m !== this.hover) continue;
      const text = this.labelFor(m);
      const content = this.labelText(m);
      if (text.text !== content) text.text = content;
      const bw = text.width + 12;
      const bh = text.height + 6;
      const fits = (rect: Rect) =>
        rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= this.w && rect.y + rect.h <= this.h && !placed.some((p) => overlaps(p, rect));
      const gap = m.r + 6;
      const options: Rect[] = [
        { x: m.sx + gap, y: m.sy - bh / 2, w: bw, h: bh },
        { x: m.sx - gap - bw, y: m.sy - bh / 2, w: bw, h: bh },
        { x: m.sx - bw / 2, y: m.sy - gap - bh, w: bw, h: bh },
        { x: m.sx - bw / 2, y: m.sy + gap, w: bw, h: bh },
      ];
      const rect = options.find(fits);
      if (!rect) continue;
      placed.push(rect);
      count++;
      const active = m.id === this.selectedId;
      bg.rect(rect.x, rect.y, rect.w, rect.h)
        .fill({ color: active ? COLORS.accent : COLORS.paper })
        .stroke({ width: 1, color: COLORS.ink });
      text.style.fill = active ? COLORS.paper : COLORS.ink;
      text.position.set(rect.x + 6, rect.y + 3);
      text.visible = true;
    }
  }

  // ---------------------------------------------------------------- input

  private pick(sx: number, sy: number): Marker | null {
    let best: Marker | null = null;
    let bestDist = Infinity;
    for (const m of this.visible) {
      const dist = Math.hypot(m.sx - sx, m.sy - sy);
      if (dist <= m.r + 8 && dist < bestDist) {
        best = m;
        bestDist = dist;
      }
    }
    return best;
  }

  private setCursor(): void {
    this.app.canvas.style.cursor = this.drag.active && this.drag.moved > CLICK_SLOP_PX ? "grabbing" : this.hover ? "pointer" : "grab";
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.app.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    this.userMoved = true;
    if (this.pointers.size === 1) {
      this.drag = { active: true, moved: 0, lastX: e.offsetX, lastY: e.offsetY, lastT: e.timeStamp, vx: 0, vy: 0 };
    } else if (this.pointers.size === 2) {
      this.drag.active = false;
      const [a, b] = [...this.pointers.values()];
      this.pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.pointers.has(e.pointerId)) {
      this.updateHover(e.offsetX, e.offsetY);
      return;
    }
    this.pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinchDistance > 0) this.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, distance / this.pinchDistance);
      this.pinchDistance = distance;
      return;
    }
    const d = this.drag;
    if (!d.active) return;
    const dx = e.offsetX - d.lastX;
    const dy = e.offsetY - d.lastY;
    d.moved += Math.abs(dx) + Math.abs(dy);
    if (d.moved > CLICK_SLOP_PX) {
      // Move camera and target together so panning tracks the pointer exactly.
      this.cam.x -= dx / this.cam.z;
      this.cam.y -= dy / this.cam.z;
      this.target.x -= dx / this.cam.z;
      this.target.y -= dy / this.cam.z;
      const dtMs = Math.max(1, e.timeStamp - d.lastT);
      d.vx = d.vx * 0.6 + (dx / dtMs) * 0.4;
      d.vy = d.vy * 0.6 + (dy / dtMs) * 0.4;
      this.hover = null;
      this.terrainDirty = true;
      this.invalidate();
      this.setCursor();
    }
    d.lastX = e.offsetX;
    d.lastY = e.offsetY;
    d.lastT = e.timeStamp;
  };

  private onPointerUp = (e: PointerEvent): void => {
    const wasDragging = this.drag.active;
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0 && wasDragging) {
      if (this.drag.moved <= CLICK_SLOP_PX) {
        this.drag.vx = this.drag.vy = 0;
        const hit = this.pick(e.offsetX, e.offsetY);
        if (hit) this.select(hit.id, true);
        else if (this.selectedId) this.select(null, false);
      } else if (e.timeStamp - this.drag.lastT > 80) {
        this.drag.vx = this.drag.vy = 0;
      }
    }
    this.drag.active = false;
    this.pinchDistance = 0;
    this.updateHover(e.offsetX, e.offsetY);
    this.invalidate(); // let momentum run
  };

  private onPointerLeave = (): void => {
    if (this.hover) {
      this.hover = null;
      this.invalidate();
    }
  };

  private updateHover(sx: number, sy: number): void {
    const hit = this.pick(sx, sy);
    if (hit !== this.hover) {
      this.hover = hit;
      this.invalidate();
    }
    this.setCursor();
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.userMoved = true;
    const delta = e.deltaY * (e.deltaMode === 1 ? 33 : 1);
    this.zoomAt(e.offsetX, e.offsetY, Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0016)));
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    const pan = 120 / this.target.z;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-pan, 0],
      ArrowRight: [pan, 0],
      ArrowUp: [0, -pan],
      ArrowDown: [0, pan],
    };
    if (moves[e.key]) {
      this.target.x += moves[e.key][0];
      this.target.y += moves[e.key][1];
      this.clampTarget();
      this.invalidate();
    } else if (e.key === "+" || e.key === "=") this.zoomBy(1.5);
    else if (e.key === "-") this.zoomBy(1 / 1.5);
    else if (e.key === "0") {
      this.userMoved = false;
      this.fitAll();
    } else if (e.key === "Escape") this.select(null, false);
    else return;
    this.userMoved = true;
    e.preventDefault();
  };
}

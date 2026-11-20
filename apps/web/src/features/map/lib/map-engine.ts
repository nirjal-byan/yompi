import { Application, Container } from "pixi.js";
import type { GeoFeatureCollection } from "@yompi/shared";
import { Camera } from "./engine/camera";
import { ALL_LAYERS_ON } from "./engine/layers";
import {
  COLORS,
  MAX_PIXEL_RATIO,
  TERRAIN_MARGIN_WORLD_UNITS,
  TERRAIN_REFRESH_INTERVAL_MS,
} from "./engine/constants";
import { MapInput, type MapInputHooks } from "./engine/input";
import { clamp } from "./engine/math";
import { MarkerLayer, type MarkerView } from "./engine/marker-layer";
import { buildMapModel, findItem, isOnVisibleLayer, isTrail } from "./engine/model";
import { pickTrail } from "./engine/picking";
import type { MapCallbacks, MapItem, MapLayers, MapModel } from "./engine/types";
import { VectorLayer } from "./engine/vector-layer";
import { SPACE, emptyBounds, extendBounds } from "./projection";
import { TerrainLayer } from "./terrain";

export type { MapCallbacks, MapLayers } from "./engine/types";

const CANVAS_DESCRIPTION =
  "Interactive map of Nepal. Drag to pan, scroll or use plus and minus to zoom, arrow keys to move.";

const MAX_FRAME_MS = 50;

export class NepalMapEngine {
  private readonly app = new Application();
  private readonly scene = new Container();

  private model!: MapModel;
  private camera!: Camera;
  private terrain!: TerrainLayer;
  private vectorLayer!: VectorLayer;
  private markerLayer!: MarkerLayer;
  private input!: MapInput;
  private callbacks!: MapCallbacks;
  private resizeObserver?: ResizeObserver;

  private layers: MapLayers = ALL_LAYERS_ON;
  private selectedId: string | null = null;

  private ready = false;
  private destroyed = false;
  private frameRequest = 0;
  private lastFrameTime = 0;
  private lastTerrainUpdate = 0;
  private needsDraw = true;
  private linesDirty = true;
  private fadeDirty = true;
  private terrainDirty = true;

  async init(
    host: HTMLElement,
    data: GeoFeatureCollection,
    callbacks: MapCallbacks,
  ): Promise<void> {
    this.callbacks = callbacks;
    this.model = buildMapModel(data);
    this.camera = new Camera(this.model.world);

    const fontFamily = await this.loadFontFamily();

    await this.app.init({
      resizeTo: host,
      background: COLORS.sea,
      antialias: true,
      autoDensity: true,
      autoStart: false,
      resolution: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
    });

    if (this.destroyed) {
      this.app.destroy(true);
      return;
    }
    this.ready = true;

    const canvas = this.mountCanvas(host);
    this.buildScene(fontFamily);
    this.input = new MapInput(canvas, this.camera, this.createInputHooks());
    this.watchResize(host);

    this.measure();
    this.camera.fitAll(true);
  }

  destroy(): void {
    this.destroyed = true;
    if (!this.ready) return;

    cancelAnimationFrame(this.frameRequest);
    this.resizeObserver?.disconnect();
    this.input.destroy();
    this.terrain.destroy();
    this.ready = false;
    this.app.destroy(true, { children: true });
  }

  setLayers(layers: MapLayers): void {
    this.layers = layers;

    const selected = findItem(this.model, this.selectedId);
    if (selected && !isOnVisibleLayer(selected, layers)) this.select(null);

    this.linesDirty = true;
    this.fadeDirty = true;
    this.terrainDirty = true;
    this.invalidate();
  }

  zoomBy(factor: number): void {
    this.camera.zoomAtCenter(factor);
    this.invalidate();
  }

  fitAll(snap = false): void {
    this.camera.fitAll(snap);
    this.invalidate();
  }

  select(id: string | null, focus = true): void {
    this.selectedId = id;

    const item = findItem(this.model, id);
    if (item && focus) this.focusOn(item);

    this.callbacks.onSelect(item ? item.feature : null);
    this.linesDirty = true;
    this.invalidate();
  }

  focusTrails(matches: (name: string) => boolean): void {
    const bounds = emptyBounds();

    for (const trail of this.model.trails) {
      if (!matches(trail.feature.properties.name)) continue;
      extendBounds(bounds, trail.bounds.minX, trail.bounds.minY);
      extendBounds(bounds, trail.bounds.maxX, trail.bounds.maxY);
    }
    if (bounds.minX === Infinity) return;

    this.camera.focusBounds(bounds, "intro");
    this.invalidate();
  }

  private async loadFontFamily(): Promise<string> {
    const mono = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-geist-mono")
      .trim();
    await document.fonts?.ready;

    return mono ? `${mono}, monospace` : "monospace";
  }

  private mountCanvas(host: HTMLElement): HTMLCanvasElement {
    const canvas = this.app.canvas;

    canvas.style.touchAction = "none";
    canvas.style.display = "block";
    canvas.style.outline = "none";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "application");
    canvas.setAttribute("aria-label", CANVAS_DESCRIPTION);
    host.appendChild(canvas);

    return canvas;
  }

  private buildScene(fontFamily: string): void {
    const { world } = this.model;
    const margin = TERRAIN_MARGIN_WORLD_UNITS;

    this.terrain = new TerrainLayer(
      {
        minX: world.minX - margin,
        minY: world.minY - margin,
        maxX: world.maxX + margin,
        maxY: world.maxY + margin,
      },
      () => this.invalidate(),
    );
    this.vectorLayer = new VectorLayer(this.model);
    this.markerLayer = new MarkerLayer(this.model.markers, fontFamily);

    this.scene.addChild(this.terrain.container);
    this.vectorLayer.attachTo(this.scene);
    this.app.stage.addChild(this.scene);
    this.markerLayer.attachTo(this.app.stage);
  }

  private watchResize(host: HTMLElement): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.app.resize();
      this.invalidate();
    });
    this.resizeObserver.observe(host);
  }

  private createInputHooks(): MapInputHooks {
    return {
      viewChanged: () => {
        this.terrainDirty = true;
        this.invalidate();
      },
      tap: (x, y) => this.handleTap(x, y),
      hover: (x, y) => this.handleHover(x, y),
      hoverEnd: () => this.handleHoverEnd(),
      resetView: () => {
        this.camera.fitAll();
        this.camera.userMoved = false;
      },
      clearSelection: () => this.select(null, false),
    };
  }

  private handleTap(x: number, y: number): void {
    const { camera, model } = this;
    const trailId = this.layers.trails
      ? pickTrail(model.trails, camera.position, camera.width, camera.height, x, y)
      : null;
    const hitId = this.markerLayer.pick(x, y)?.id ?? trailId;

    if (hitId) this.select(hitId);
    else if (this.selectedId) this.select(null, false);
  }

  private handleHover(x: number, y: number): void {
    const marker = this.markerLayer.pick(x, y);

    if (this.markerLayer.setHovered(marker)) this.invalidate();
    this.input.setHovering(marker !== null);
  }

  private handleHoverEnd(): void {
    if (this.markerLayer.setHovered(null)) this.invalidate();
    this.input.setHovering(false);
  }

  private focusOn(item: MapItem): void {
    if (isTrail(item)) this.camera.focusBounds(item.bounds, "trail");
    else this.camera.focusPlace(item.x, item.y, "place");
  }

  private measure(): void {
    const { width, height } = this.app.screen;

    this.camera.resize(width, height);
    this.terrainDirty = true;
    this.needsDraw = true;
  }

  private invalidate(): void {
    this.needsDraw = true;
    if (this.frameRequest || !this.ready) return;

    this.lastFrameTime = performance.now();
    this.frameRequest = requestAnimationFrame(this.onFrame);
  }

  private onFrame = (time: number): void => {
    this.frameRequest = 0;
    if (!this.ready) return;

    const deltaMs = clamp(time - this.lastFrameTime, 1, MAX_FRAME_MS);
    this.lastFrameTime = time;

    if (this.tick(deltaMs)) this.frameRequest = requestAnimationFrame(this.onFrame);
  };

  private tick(deltaMs: number): boolean {
    const { width, height } = this.app.screen;
    if (this.camera.width !== width || this.camera.height !== height) this.measure();

    const { easing, changed, moving } = this.camera.step(deltaMs);
    let needsMoreFrames = moving;

    const shouldRedraw = changed || this.needsDraw || this.linesDirty || this.terrainDirty;
    if (shouldRedraw) {
      this.needsDraw = false;
      this.applyCameraToScene();
      this.redrawLines(easing);
      this.redrawFade();
      if (this.refreshTerrain(changed, easing)) needsMoreFrames = true;
      this.markerLayer.draw(this.markerView());
      this.app.render();
    }

    return needsMoreFrames || this.needsDraw;
  }

  private applyCameraToScene(): void {
    const { x, y, z } = this.camera.position;

    this.scene.pivot.set(x * SPACE, y * SPACE);
    this.scene.position.set(this.camera.width / 2, this.camera.height / 2);
    this.scene.scale.set(z / SPACE);
  }

  private redrawLines(easing: boolean): void {
    const { camera, vectorLayer } = this;
    if (!this.linesDirty && !vectorLayer.needsRedraw(camera.position.z, !easing)) return;

    vectorLayer.drawLines({
      zoom: camera.position.z,
      zoomRatio: camera.zoomRatio,
      terrainOn: this.layers.terrain,
      trailsOn: this.layers.trails,
      selectedId: this.selectedId,
    });
    this.linesDirty = false;
  }

  private redrawFade(): void {
    if (!this.fadeDirty) return;

    this.vectorLayer.drawFade(this.layers.terrain);
    this.fadeDirty = false;
  }

  private refreshTerrain(cameraChanged: boolean, easing: boolean): boolean {
    if (!cameraChanged && !this.terrainDirty) return false;

    const now = performance.now();
    const throttled = easing && now - this.lastTerrainUpdate <= TERRAIN_REFRESH_INTERVAL_MS;
    if (throttled) {
      this.terrainDirty = true;
      return true;
    }

    const { position, width, height } = this.camera;
    this.terrain.update(position, width, height, this.layers.terrain);
    this.lastTerrainUpdate = now;
    this.terrainDirty = false;

    return false;
  }

  private markerView(): MarkerView {
    const { camera } = this;

    return {
      camera: camera.position,
      width: camera.width,
      height: camera.height,
      zoomRatio: camera.zoomRatio,
      layers: this.layers,
      selectedId: this.selectedId,
    };
  }
}

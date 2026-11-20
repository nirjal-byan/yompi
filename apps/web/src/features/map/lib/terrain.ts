import { Container, Sprite, Texture } from "pixi.js";
import { type Bounds, SPACE, WORLD_SCALE } from "./projection";

const TILE_URL = (z: number, x: number, y: number) =>
  `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
const TILE_PX = 256;
const BASE_ZOOM = 7;
const MAX_ZOOM = 12;
const MAX_CACHED = 160;
const MAX_CONCURRENT = 6;
const RETRY_AFTER_MS = 15_000;

const PREFETCH = 0.25;
const TWO_PI_K = 2 * Math.PI * WORLD_SCALE;

type TileState = "queued" | "loading" | "ready" | "failed";

interface Tile {
  key: string;
  z: number;
  x: number;
  y: number;
  state: TileState;
  lastUsed: number;
  failedAt: number;
  texture?: Texture;
  sprite?: Sprite;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export class TerrainLayer {
  readonly container = new Container();
  private tiles = new Map<string, Tile>();
  private wanted = new Set<string>();
  private queue: Tile[] = [];
  private active = 0;
  private pass = 0;
  private destroyed = false;
  private workers: Worker[] = [];
  private nextWorker = 0;
  private nextRequest = 0;
  private pending = new Map<number, (bitmap: ImageBitmap | null) => void>();

  constructor(
    private readonly extent: Bounds,
    private readonly onTileReady: () => void,
  ) {
    this.container.sortableChildren = true;
    const count = clamp((navigator.hardwareConcurrency || 4) - 2, 2, 3);
    for (let i = 0; i < count; i++) {
      const worker = new Worker(new URL("./terrain.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (event: MessageEvent<{ id: number; bitmap: ImageBitmap | null }>) => {
        this.pending.get(event.data.id)?.(event.data.bitmap);
        this.pending.delete(event.data.id);
      };
      this.workers.push(worker);
    }
  }

  update(cam: { x: number; y: number; z: number }, w: number, h: number, enabled: boolean): void {
    this.container.visible = enabled;
    this.wanted.clear();
    if (!enabled) return;
    this.pass++;

    const halfW = (w / 2 / cam.z) * (1 + PREFETCH * 2);
    const halfH = (h / 2 / cam.z) * (1 + PREFETCH * 2);
    const left = cam.x - halfW;
    const right = cam.x + halfW;
    const top = cam.y - halfH;
    const bottom = cam.y + halfH;

    const detail = clamp(
      Math.round(Math.log2((TWO_PI_K * cam.z) / TILE_PX) + 0.2),
      BASE_ZOOM + 1,
      MAX_ZOOM,
    );
    this.collect(BASE_ZOOM, left, right, top, bottom);
    this.collect(detail, left, right, top, bottom);

    for (const tile of this.tiles.values()) {
      if (!tile.sprite) continue;

      tile.sprite.visible =
        this.wanted.has(tile.key) || this.touches(tile, left, right, top, bottom);
    }
    this.pump();
  }

  destroy(): void {
    this.destroyed = true;
    for (const worker of this.workers) worker.terminate();
    this.workers = [];
    for (const tile of this.tiles.values()) this.dispose(tile);
    this.tiles.clear();
    this.queue = [];
  }

  private touches(tile: Tile, left: number, right: number, top: number, bottom: number): boolean {
    const n = 2 ** tile.z;
    const size = TWO_PI_K / n;
    const x0 = (TWO_PI_K * tile.x) / n - Math.PI * WORLD_SCALE;
    const y0 = Math.PI * WORLD_SCALE * ((2 * tile.y) / n - 1);
    return x0 < right && x0 + size > left && y0 < bottom && y0 + size > top;
  }

  private collect(z: number, left: number, right: number, top: number, bottom: number): void {
    const n = 2 ** z;
    const toTx = (wx: number) => Math.floor(((wx / WORLD_SCALE + Math.PI) / (2 * Math.PI)) * n);
    const toTy = (wy: number) => Math.floor(((wy / (Math.PI * WORLD_SCALE) + 1) / 2) * n);
    const x0 = clamp(toTx(left), 0, n - 1);
    const x1 = clamp(toTx(right), 0, n - 1);
    const y0 = clamp(toTy(top), 0, n - 1);
    const y1 = clamp(toTy(bottom), 0, n - 1);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 150) return;

    const size = TWO_PI_K / n;
    const now = performance.now();
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const wx = (TWO_PI_K * x) / n - Math.PI * WORLD_SCALE;
        const wy = Math.PI * WORLD_SCALE * ((2 * y) / n - 1);
        if (
          wx > this.extent.maxX ||
          wx + size < this.extent.minX ||
          wy > this.extent.maxY ||
          wy + size < this.extent.minY
        )
          continue;

        const key = `${z}/${x}/${y}`;
        this.wanted.add(key);
        let tile = this.tiles.get(key);
        if (!tile) {
          tile = { key, z, x, y, state: "queued", lastUsed: this.pass, failedAt: 0 };
          this.tiles.set(key, tile);
          this.queue.push(tile);
        } else if (tile.state === "failed" && now - tile.failedAt > RETRY_AFTER_MS) {
          tile.state = "queued";
          this.queue.push(tile);
        }
        tile.lastUsed = this.pass;
      }
    }
  }

  private pump(): void {
    this.queue = this.queue.filter((tile) => {
      if (this.wanted.has(tile.key)) return true;
      this.tiles.delete(tile.key);
      return false;
    });
    while (this.active < MAX_CONCURRENT && this.queue.length > 0) {
      let best = 0;
      for (let i = 1; i < this.queue.length; i++)
        if (this.queue[i].z < this.queue[best].z) best = i;
      const [tile] = this.queue.splice(best, 1);
      void this.load(tile);
    }
  }

  private shadeInWorker(tile: Tile): Promise<ImageBitmap | null> {
    const id = this.nextRequest++;
    const worker = this.workers[this.nextWorker++ % this.workers.length];
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      worker.postMessage({ id, url: TILE_URL(tile.z, tile.x, tile.y), z: tile.z, y: tile.y });
    });
  }

  private async load(tile: Tile): Promise<void> {
    tile.state = "loading";
    this.active++;
    try {
      const bitmap = await this.shadeInWorker(tile);
      if (!bitmap) throw new Error("tile failed");
      if (this.destroyed) {
        bitmap.close();
        return;
      }
      const texture = Texture.from(bitmap);
      const n = 2 ** tile.z;
      const size = (TWO_PI_K / n) * SPACE;
      const sprite = new Sprite(texture);

      sprite.position.set(
        ((TWO_PI_K * tile.x) / n - Math.PI * WORLD_SCALE) * SPACE - size * 0.002,
        Math.PI * WORLD_SCALE * ((2 * tile.y) / n - 1) * SPACE - size * 0.002,
      );
      sprite.width = size * 1.004;
      sprite.height = size * 1.004;
      sprite.zIndex = tile.z;
      this.container.addChild(sprite);
      tile.texture = texture;
      tile.sprite = sprite;
      tile.state = "ready";
      this.evict();
      this.onTileReady();
    } catch {
      tile.state = "failed";
      tile.failedAt = performance.now();
    } finally {
      this.active--;
      if (!this.destroyed) this.pump();
    }
  }

  private evict(): void {
    if (this.tiles.size <= MAX_CACHED) return;
    const candidates = [...this.tiles.values()]
      .filter((t) => t.state === "ready" && t.lastUsed < this.pass - 8)
      .sort((a, b) => a.lastUsed - b.lastUsed);
    for (const tile of candidates) {
      if (this.tiles.size <= MAX_CACHED) break;
      this.dispose(tile);
      this.tiles.delete(tile.key);
    }
  }

  private dispose(tile: Tile): void {
    tile.sprite?.destroy();
    tile.texture?.destroy(true);
    tile.sprite = undefined;
    tile.texture = undefined;
  }
}

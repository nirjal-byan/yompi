import type { Bounds } from "../projection";
import {
  CARD_INSET_PX,
  EASING_PIXEL_TOLERANCE,
  EASING_TIME_MS,
  EASING_ZOOM_TOLERANCE,
  FIT_PADDING_PX,
  FOCUS_PADDING_PX,
  INTRO_CARD_CLEARANCE_PX,
  MAX_ZOOM_FACTOR,
  MIN_ZOOM_FACTOR,
  MOMENTUM_DECAY_MS,
  MOMENTUM_MIN_SPEED,
  NARROW_SCREEN_PX,
  PLACE_FOCUS_ZOOM_FACTOR,
} from "./constants";
import { clamp } from "./math";
import type { CameraPosition, FocusCard, Point } from "./types";

export interface CameraStep {
  easing: boolean;
  changed: boolean;
  moving: boolean;
}

export class Camera {
  readonly position: CameraPosition = { x: 0, y: 0, z: 1 };
  readonly target: CameraPosition = { x: 0, y: 0, z: 1 };
  readonly velocity: Point = { x: 0, y: 0 };
  dragging = false;
  userMoved = false;
  fitZoom = 1;
  width = 0;
  height = 0;

  constructor(private readonly world: Bounds) {}

  get zoomRatio(): number {
    return this.position.z / this.fitZoom;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    const worldWidth = this.world.maxX - this.world.minX || 1;
    const worldHeight = this.world.maxY - this.world.minY || 1;
    const fitWidth = (width - FIT_PADDING_PX) / worldWidth;
    const fitHeight = (height - FIT_PADDING_PX) / worldHeight;
    this.fitZoom = Math.max(1e-3, Math.min(fitWidth, fitHeight));

    if (!this.userMoved) this.fitAll(true);
    this.clampTarget();
  }

  fitAll(snap = false): void {
    this.target.x = (this.world.minX + this.world.maxX) / 2;
    this.target.y =
      (this.world.minY + this.world.maxY) / 2 + INTRO_CARD_CLEARANCE_PX / this.fitZoom;
    this.target.z = this.fitZoom;

    if (snap) Object.assign(this.position, this.target);
  }

  zoomAt(screenX: number, screenY: number, factor: number): void {
    const target = this.target;
    const worldX = target.x + (screenX - this.width / 2) / target.z;
    const worldY = target.y + (screenY - this.height / 2) / target.z;

    target.z = this.clampZoom(target.z * factor);
    target.x = worldX - (screenX - this.width / 2) / target.z;
    target.y = worldY - (screenY - this.height / 2) / target.z;

    this.userMoved = true;
    this.clampTarget();
  }

  zoomAtCenter(factor: number): void {
    this.zoomAt(this.width / 2, this.height / 2, factor);
  }

  panByPixels(dx: number, dy: number): void {
    const zoom = this.position.z;
    this.position.x -= dx / zoom;
    this.position.y -= dy / zoom;
    this.target.x -= dx / zoom;
    this.target.y -= dy / zoom;
    this.userMoved = true;
  }

  nudge(worldDx: number, worldDy: number): void {
    this.target.x += worldDx;
    this.target.y += worldDy;
    this.userMoved = true;
    this.clampTarget();
  }

  focusPlace(x: number, y: number, card: FocusCard): void {
    const zoom = Math.max(this.target.z, this.fitZoom * PLACE_FOCUS_ZOOM_FACTOR);
    this.flyTo(x, y, zoom, this.insetFor(card));
  }

  focusBounds(bounds: Bounds, card: FocusCard): void {
    const inset = this.insetFor(card);
    const boundsWidth = Math.max(bounds.maxX - bounds.minX, 1e-6);
    const boundsHeight = Math.max(bounds.maxY - bounds.minY, 1e-6);
    const zoom = Math.min(
      (this.width - inset - FOCUS_PADDING_PX) / boundsWidth,
      (this.height - FOCUS_PADDING_PX) / boundsHeight,
    );

    this.flyTo((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2, zoom, inset);
  }

  step(deltaMs: number): CameraStep {
    const momentum = this.applyMomentum(deltaMs);
    const { easing, changed } = this.easeTowardsTarget(deltaMs);

    return { easing, changed, moving: easing || momentum || this.dragging };
  }

  private insetFor(card: FocusCard): number {
    return this.width >= NARROW_SCREEN_PX ? CARD_INSET_PX[card] : 0;
  }

  private flyTo(x: number, y: number, zoom: number, insetLeft: number): void {
    this.target.x = x - insetLeft / 2 / zoom;
    this.target.y = y;
    this.target.z = zoom;
    this.userMoved = true;
    this.clampTarget();
  }

  private clampZoom(zoom: number): number {
    return clamp(zoom, this.fitZoom * MIN_ZOOM_FACTOR, this.fitZoom * MAX_ZOOM_FACTOR);
  }

  private clampTarget(): void {
    const marginX = (this.world.maxX - this.world.minX) * 0.15;
    const marginY = (this.world.maxY - this.world.minY) * 0.5;

    this.target.z = this.clampZoom(this.target.z);
    this.target.x = clamp(this.target.x, this.world.minX - marginX, this.world.maxX + marginX);
    this.target.y = clamp(this.target.y, this.world.minY - marginY, this.world.maxY + marginY);
  }

  private applyMomentum(deltaMs: number): boolean {
    if (this.dragging) return false;

    const velocity = this.velocity;
    if (Math.abs(velocity.x) + Math.abs(velocity.y) <= MOMENTUM_MIN_SPEED) {
      velocity.x = 0;
      velocity.y = 0;
      return false;
    }

    const decay = Math.exp(-deltaMs / MOMENTUM_DECAY_MS);
    this.target.x -= (velocity.x * deltaMs) / this.position.z;
    this.target.y -= (velocity.y * deltaMs) / this.position.z;
    velocity.x *= decay;
    velocity.y *= decay;
    this.clampTarget();

    return true;
  }

  private easeTowardsTarget(deltaMs: number): { easing: boolean; changed: boolean } {
    const { position, target } = this;
    const blend = 1 - Math.exp(-deltaMs / EASING_TIME_MS);
    const zoomGap = Math.log(target.z) - Math.log(position.z);

    const easing =
      Math.abs(target.x - position.x) * position.z > EASING_PIXEL_TOLERANCE ||
      Math.abs(target.y - position.y) * position.z > EASING_PIXEL_TOLERANCE ||
      Math.abs(zoomGap) > EASING_ZOOM_TOLERANCE;

    if (easing) {
      position.x += (target.x - position.x) * blend;
      position.y += (target.y - position.y) * blend;
      position.z = Math.exp(Math.log(position.z) + zoomGap * blend);
      return { easing: true, changed: true };
    }

    const needsSnap = position.x !== target.x || position.y !== target.y || position.z !== target.z;
    if (needsSnap) Object.assign(position, target);

    return { easing: false, changed: needsSnap };
  }
}

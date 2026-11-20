import {
  CLICK_SLOP_PX,
  KEY_PAN_PX,
  KEY_ZOOM_FACTOR,
  PINCH_WHEEL_ZOOM_SPEED,
  RELEASE_IDLE_MS,
  VELOCITY_SMOOTHING,
  WHEEL_LINE_HEIGHT_PX,
  WHEEL_ZOOM_SPEED,
} from "./constants";
import type { Camera } from "./camera";
import type { Point } from "./types";

export interface MapInputHooks {
  viewChanged(): void;
  tap(x: number, y: number): void;
  hover(x: number, y: number): void;
  hoverEnd(): void;
  resetView(): void;
  clearSelection(): void;
}

interface DragState {
  active: boolean;
  moved: number;
  lastX: number;
  lastY: number;
  lastTime: number;
}

export class MapInput {
  private readonly pointers = new Map<number, Point>();
  private readonly drag: DragState = { active: false, moved: 0, lastX: 0, lastY: 0, lastTime: 0 };
  private pinchDistance = 0;
  private hovering = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
    private readonly hooks: MapInputHooks,
  ) {
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("keydown", this.onKeyDown);
  }

  destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("keydown", this.onKeyDown);
  }

  setHovering(hovering: boolean): void {
    this.hovering = hovering;
    this.updateCursor();
  }

  private get isPanning(): boolean {
    return this.drag.active && this.drag.moved > CLICK_SLOP_PX;
  }

  private updateCursor(): void {
    this.canvas.style.cursor = this.isPanning ? "grabbing" : this.hovering ? "pointer" : "grab";
  }

  private setDragging(active: boolean): void {
    this.drag.active = active;
    this.camera.dragging = active;
  }

  private pinchCenterAndDistance(): { center: Point; distance: number } {
    const [a, b] = [...this.pointers.values()];

    return {
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      distance: Math.hypot(a.x - b.x, a.y - b.y),
    };
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.canvas.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.offsetX, y: event.offsetY });
    this.camera.userMoved = true;

    if (this.pointers.size === 1) {
      Object.assign(this.drag, {
        moved: 0,
        lastX: event.offsetX,
        lastY: event.offsetY,
        lastTime: event.timeStamp,
      });
      this.camera.velocity.x = 0;
      this.camera.velocity.y = 0;
      this.setDragging(true);
    } else if (this.pointers.size === 2) {
      this.setDragging(false);
      this.pinchDistance = this.pinchCenterAndDistance().distance;
    }
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.pointers.has(event.pointerId)) {
      this.hooks.hover(event.offsetX, event.offsetY);
      return;
    }

    this.pointers.set(event.pointerId, { x: event.offsetX, y: event.offsetY });

    if (this.pointers.size === 2) {
      this.pinch();
      return;
    }

    if (this.drag.active) this.dragTo(event);
  };

  private pinch(): void {
    const { center, distance } = this.pinchCenterAndDistance();

    if (this.pinchDistance > 0) {
      this.camera.zoomAt(center.x, center.y, distance / this.pinchDistance);
      this.hooks.viewChanged();
    }
    this.pinchDistance = distance;
  }

  private dragTo(event: PointerEvent): void {
    const drag = this.drag;
    const dx = event.offsetX - drag.lastX;
    const dy = event.offsetY - drag.lastY;
    drag.moved += Math.abs(dx) + Math.abs(dy);

    if (drag.moved > CLICK_SLOP_PX) {
      const elapsed = Math.max(1, event.timeStamp - drag.lastTime);
      const velocity = this.camera.velocity;

      this.camera.panByPixels(dx, dy);
      velocity.x = velocity.x * VELOCITY_SMOOTHING + (dx / elapsed) * (1 - VELOCITY_SMOOTHING);
      velocity.y = velocity.y * VELOCITY_SMOOTHING + (dy / elapsed) * (1 - VELOCITY_SMOOTHING);

      this.hovering = false;
      this.hooks.hoverEnd();
      this.hooks.viewChanged();
      this.updateCursor();
    }

    drag.lastX = event.offsetX;
    drag.lastY = event.offsetY;
    drag.lastTime = event.timeStamp;
  }

  private onPointerUp = (event: PointerEvent): void => {
    const wasDragging = this.drag.active;
    this.pointers.delete(event.pointerId);

    if (this.pointers.size === 0 && wasDragging) this.finishGesture(event);

    this.setDragging(false);
    this.pinchDistance = 0;
    this.hooks.hover(event.offsetX, event.offsetY);
    this.hooks.viewChanged();
  };

  private finishGesture(event: PointerEvent): void {
    const velocity = this.camera.velocity;

    if (this.drag.moved <= CLICK_SLOP_PX) {
      velocity.x = 0;
      velocity.y = 0;
      this.hooks.tap(event.offsetX, event.offsetY);
    } else if (event.timeStamp - this.drag.lastTime > RELEASE_IDLE_MS) {
      velocity.x = 0;
      velocity.y = 0;
    }
  }

  private onPointerLeave = (): void => {
    this.hooks.hoverEnd();
  };

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();

    const delta = event.deltaY * (event.deltaMode === 1 ? WHEEL_LINE_HEIGHT_PX : 1);
    const speed = event.ctrlKey ? PINCH_WHEEL_ZOOM_SPEED : WHEEL_ZOOM_SPEED;

    this.camera.zoomAt(event.offsetX, event.offsetY, Math.exp(-delta * speed));
    this.hooks.viewChanged();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    const pan = KEY_PAN_PX / this.camera.target.z;

    switch (event.key) {
      case "ArrowLeft":
        this.camera.nudge(-pan, 0);
        break;
      case "ArrowRight":
        this.camera.nudge(pan, 0);
        break;
      case "ArrowUp":
        this.camera.nudge(0, -pan);
        break;
      case "ArrowDown":
        this.camera.nudge(0, pan);
        break;
      case "+":
      case "=":
        this.camera.zoomAtCenter(KEY_ZOOM_FACTOR);
        break;
      case "-":
        this.camera.zoomAtCenter(1 / KEY_ZOOM_FACTOR);
        break;
      case "0":
        this.hooks.resetView();
        break;
      case "Escape":
        this.hooks.clearSelection();
        break;
      default:
        return;
    }

    this.hooks.viewChanged();
    event.preventDefault();
  };
}

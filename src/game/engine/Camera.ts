// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Camera System (Viewport & Smooth Scrolling)
// ═══════════════════════════════════════════════════════════════

import type { Vector2 } from '../types/SoulEntity';

export class Camera {
  x = 0;
  y = 0;
  targetX = 0;
  targetY = 0;
  zoom = 2.2;
  viewWidth: number;
  viewHeight: number;
  worldWidth: number;
  worldHeight: number;
  tileSize: number;
  smoothing = 0.08;
  // Deadzone — camera won't move until player exits this area (in pixels)
  deadzoneX = 50;
  deadzoneY = 50;

  constructor(viewW: number, viewH: number, worldW: number, worldH: number, tileSize: number) {
    this.viewWidth = viewW;
    this.viewHeight = viewH;
    this.worldWidth = worldW;
    this.worldHeight = worldH;
    this.tileSize = tileSize;
  }

  /** Follow a world position smoothly with deadzone */
  follow(target: Vector2): void {
    const px = target.x * this.tileSize;
    const py = target.y * this.tileSize;
    const halfW = this.viewWidth / (2 * this.zoom);
    const halfH = this.viewHeight / (2 * this.zoom);
    const camCenterX = this.targetX + halfW;
    const camCenterY = this.targetY + halfH;

    const dzX = this.deadzoneX / this.zoom;
    const dzY = this.deadzoneY / this.zoom;

    let tx = this.targetX;
    let ty = this.targetY;

    if (px < camCenterX - dzX) tx = px + dzX - halfW;
    else if (px > camCenterX + dzX) tx = px - dzX - halfW;

    if (py < camCenterY - dzY) ty = py + dzY - halfH;
    else if (py > camCenterY + dzY) ty = py - dzY - halfH;

    this.targetX = tx;
    this.targetY = ty;
  }

  /** Center on a position immediately */
  centerOn(target: Vector2): void {
    this.x = target.x * this.tileSize - this.viewWidth / (2 * this.zoom);
    this.y = target.y * this.tileSize - this.viewHeight / (2 * this.zoom);
    this.targetX = this.x;
    this.targetY = this.y;
  }

  update(): void {
    // Smooth interpolation
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;

    // Clamp to world bounds
    const maxX = this.worldWidth * this.tileSize - this.viewWidth / this.zoom;
    const maxY = this.worldHeight * this.tileSize - this.viewHeight / this.zoom;
    this.x = Math.max(0, Math.min(this.x, maxX));
    this.y = Math.max(0, Math.min(this.y, maxY));
  }

  /** Get the tile coordinate range visible on screen */
  getVisibleTiles(): { startX: number; startY: number; endX: number; endY: number } {
    const startX = Math.max(0, Math.floor(this.x / this.tileSize) - 1);
    const startY = Math.max(0, Math.floor(this.y / this.tileSize) - 1);
    const endX = Math.min(
      this.worldWidth - 1,
      Math.ceil((this.x + this.viewWidth / this.zoom) / this.tileSize) + 1
    );
    const endY = Math.min(
      this.worldHeight - 1,
      Math.ceil((this.y + this.viewHeight / this.zoom) / this.tileSize) + 1
    );
    return { startX, startY, endX, endY };
  }

  /** Convert screen coordinates to world tile coordinates */
  screenToWorld(screenX: number, screenY: number): Vector2 {
    return {
      x: (screenX / this.zoom + this.x) / this.tileSize,
      y: (screenY / this.zoom + this.y) / this.tileSize,
    };
  }

  /** Convert world tile coordinates to screen coordinates */
  worldToScreen(worldX: number, worldY: number): Vector2 {
    return {
      x: (worldX * this.tileSize - this.x) * this.zoom,
      y: (worldY * this.tileSize - this.y) * this.zoom,
    };
  }

  setZoom(z: number): void {
    this.zoom = Math.max(0.5, Math.min(3, z));
  }

  resize(w: number, h: number): void {
    this.viewWidth = w;
    this.viewHeight = h;
  }
}

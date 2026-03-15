// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — A* Pathfinder
// ═══════════════════════════════════════════════════════════════

import type { GameMap } from '../types/World';
import type { Vector2 } from '../types/SoulEntity';

interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export class PathFinder {
  private map: GameMap;
  private cache = new Map<string, Vector2[] | null>();

  constructor(map: GameMap) {
    this.map = map;
  }

  /** Find path from start to end. Returns array of tile positions or null. */
  findPath(start: Vector2, end: Vector2, maxSteps: number = 500): Vector2[] | null {
    const sx = Math.floor(start.x);
    const sy = Math.floor(start.y);
    const ex = Math.floor(end.x);
    const ey = Math.floor(end.y);

    const key = `${sx},${sy}-${ex},${ey}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    if (!this.isPassable(ex, ey)) return null;

    const open: PathNode[] = [];
    const closed = new Set<string>();

    open.push({ x: sx, y: sy, g: 0, h: this.heuristic(sx, sy, ex, ey), f: 0, parent: null });
    open[0].f = open[0].h;

    let steps = 0;
    while (open.length > 0 && steps < maxSteps) {
      steps++;

      // Find node with lowest f
      let lowestIdx = 0;
      for (let i = 1; i < open.length; i++) {
        if (open[i].f < open[lowestIdx].f) lowestIdx = i;
      }
      const current = open.splice(lowestIdx, 1)[0];

      if (current.x === ex && current.y === ey) {
        const path = this.reconstructPath(current);
        this.cache.set(key, path);
        return path;
      }

      closed.add(`${current.x},${current.y}`);

      // Check neighbors (4-directional)
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
        // Diagonals
        { x: current.x + 1, y: current.y + 1 },
        { x: current.x - 1, y: current.y + 1 },
        { x: current.x + 1, y: current.y - 1 },
        { x: current.x - 1, y: current.y - 1 },
      ];

      for (const n of neighbors) {
        if (!this.isPassable(n.x, n.y)) continue;
        if (closed.has(`${n.x},${n.y}`)) continue;

        const isDiag = n.x !== current.x && n.y !== current.y;
        const moveCost = isDiag ? 1.414 : 1;
        const g = current.g + moveCost;
        const h = this.heuristic(n.x, n.y, ex, ey);
        const f = g + h;

        const existing = open.find(o => o.x === n.x && o.y === n.y);
        if (existing) {
          if (g < existing.g) {
            existing.g = g;
            existing.f = f;
            existing.parent = current;
          }
        } else {
          open.push({ x: n.x, y: n.y, g, h, f, parent: current });
        }
      }
    }

    this.cache.set(key, null);
    return null;
  }

  /** Clear cached paths (call when map changes or periodically) */
  clearCache(): void {
    this.cache.clear();
  }

  private isPassable(x: number, y: number): boolean {
    const tile = this.map.tiles[y]?.[x];
    return !!tile && tile.isPassable;
  }

  private heuristic(ax: number, ay: number, bx: number, by: number): number {
    // Octile distance
    const dx = Math.abs(ax - bx);
    const dy = Math.abs(ay - by);
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
  }

  private reconstructPath(node: PathNode): Vector2[] {
    const path: Vector2[] = [];
    let current: PathNode | null = node;
    while (current) {
      path.unshift({ x: current.x + 0.5, y: current.y + 0.5 });
      current = current.parent;
    }
    return path;
  }
}

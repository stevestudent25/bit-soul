// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Procedural Dungeon Generator
// ═══════════════════════════════════════════════════════════════

import { Biome, TileMaterial, SymmetryMode } from '../types/World';
import type { Tile, GameMap } from '../types/World';
import type { Vector2 } from '../types/SoulEntity';

export interface WorldConfig {
  width: number;
  height: number;
  seed: number;
  tileSize: number;
  floor: number;
  biome?: Biome;
}

const DEFAULT_CONFIG: WorldConfig = {
  width: 80,
  height: 80,
  seed: Date.now(),
  tileSize: 32,
  floor: 1,
};

// ── Seeded PRNG ──────────────────────────────────────────
class SeededRandom {
  private s: number;
  constructor(seed: number) { this.s = (seed & 0x7fffffff) || 1; }
  next(): number {
    this.s = (this.s * 1664525 + 1013904223) & 0x7fffffff;
    return this.s / 0x7fffffff;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// ── Room type ────────────────────────────────────────────
interface DungeonRoom {
  x: number; y: number; w: number; h: number;
  cx: number; cy: number;
}

// ── Floor → biome theme ──────────────────────────────────
const FLOOR_BIOMES: Biome[] = [
  Biome.ShatteredPlains,
  Biome.CrystalCaverns,
  Biome.NeonRuins,
  Biome.EmberFields,
  Biome.FrozenAether,
  Biome.VoidMarsh,
  Biome.ArcaneForest,
];

function biomeWallMaterial(biome: Biome): TileMaterial {
  switch (biome) {
    case Biome.ShatteredPlains: return TileMaterial.Stone;
    case Biome.CrystalCaverns: return TileMaterial.Stone;
    case Biome.NeonRuins: return TileMaterial.Metal;
    case Biome.EmberFields: return TileMaterial.Lava;
    case Biome.FrozenAether: return TileMaterial.Ice;
    case Biome.ArcaneForest: return TileMaterial.Wood;
    case Biome.VoidMarsh: return TileMaterial.Stone;
    default: return TileMaterial.Stone;
  }
}

function biomeFloorMaterial(biome: Biome): TileMaterial {
  switch (biome) {
    case Biome.ShatteredPlains: return TileMaterial.Sand;
    case Biome.CrystalCaverns: return TileMaterial.Crystal;
    case Biome.EmberFields: return TileMaterial.Lava;
    case Biome.FrozenAether: return TileMaterial.Ice;
    case Biome.NeonRuins: return TileMaterial.Metal;
    case Biome.ArcaneForest: return TileMaterial.Grass;
    case Biome.VoidMarsh: return TileMaterial.Void;
    default: return TileMaterial.Stone;
  }
}

// ═══════════════════════════════════════════════════════════
// Main Generator
// ═══════════════════════════════════════════════════════════

export function generateWorld(cfg: Partial<WorldConfig> = {}): GameMap {
  const config = { ...DEFAULT_CONFIG, ...cfg };
  const { width, height, seed, tileSize } = config;
  const floor = config.floor || 1;
  const rng = new SeededRandom(seed);

  const biome = config.biome ?? FLOOR_BIOMES[(floor - 1) % FLOOR_BIOMES.length];
  const wallMat = biomeWallMaterial(biome);
  const floorMat = biomeFloorMaterial(biome);

  // Initialize all tiles as walls
  const tiles: Tile[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = makeTile(x, y, biome, wallMat, false);
    }
  }

  // Generate rooms
  const roomCount = Math.min(8 + floor * 2, 28);
  const rooms = generateRooms(width, height, roomCount, rng);

  // Carve rooms into tiles
  for (const room of rooms) {
    for (let ry = room.y; ry < room.y + room.h; ry++) {
      for (let rx = room.x; rx < room.x + room.w; rx++) {
        if (rx > 0 && rx < width - 1 && ry > 0 && ry < height - 1) {
          tiles[ry][rx] = makeTile(rx, ry, biome, floorMat, true);
        }
      }
    }
  }

  // Connect rooms with corridors (MST)
  connectRooms(rooms, tiles, biome, floorMat, width, height);

  // Place resources, structures, secret passages
  const resourceNodes = placeResources(rooms, rng, tiles);
  const structures = placeStructures(rooms, rng, tiles);
  const secretPassages = placeSecretPassages(rooms, rng);

  return {
    id: `dungeon_f${floor}_${seed}`,
    name: `Floor ${floor}`,
    seed,
    size: width as 64 | 128 | 256,
    symmetry: SymmetryMode.Chaos,
    tileSize,
    tiles,
    biomes: [biome],
    flagBases: [],
    spawnZones: rooms.map((r, i) => ({
      teamId: i === 0 ? 'player' : 'enemy',
      position: { x: r.cx, y: r.cy },
      radius: Math.floor(Math.min(r.w, r.h) / 2),
    })),
    resourceNodes,
    structures,
    secretPassages,
  };
}

// ── Tile factory ─────────────────────────────────────────
function makeTile(x: number, y: number, biome: Biome, material: TileMaterial, passable: boolean): Tile {
  return {
    x, y, biome,
    properties: {
      material,
      hardness: passable ? 3 : 10,
      friction: 1.0,
      flammability: 0.1,
      conductivity: 0.3,
      opacity: passable ? 0 : 1,
      resonance: 0.2,
      destructible: passable,
      hp: passable ? 100 : 300,
      elevation: passable ? 50 : 200,
    },
    isPassable: passable,
    isOccupied: false,
    historyLog: [],
    bloodSplatter: false,
    scorchMarks: false,
    damaged: false,
  };
}

// ── Room generation (random placement with overlap check)
function generateRooms(w: number, h: number, count: number, rng: SeededRandom): DungeonRoom[] {
  const rooms: DungeonRoom[] = [];
  const maxAttempts = count * 6;

  for (let i = 0; i < maxAttempts && rooms.length < count; i++) {
    const rw = rng.int(5, 13);
    const rh = rng.int(5, 13);
    const rx = rng.int(2, w - rw - 2);
    const ry = rng.int(2, h - rh - 2);

    // Check overlap (with 2-tile padding)
    const overlaps = rooms.some(r =>
      rx - 2 < r.x + r.w &&
      rx + rw + 2 > r.x &&
      ry - 2 < r.y + r.h &&
      ry + rh + 2 > r.y
    );

    if (!overlaps) {
      rooms.push({
        x: rx, y: ry, w: rw, h: rh,
        cx: rx + Math.floor(rw / 2),
        cy: ry + Math.floor(rh / 2),
      });
    }
  }

  return rooms;
}

// ── Connect rooms using Prim's MST ──────────────────────
function connectRooms(
  rooms: DungeonRoom[], tiles: Tile[][],
  biome: Biome, material: TileMaterial,
  w: number, h: number,
): void {
  if (rooms.length < 2) return;

  const connected = new Set<number>([0]);
  const unconnected = new Set<number>(rooms.map((_, i) => i).filter(i => i > 0));

  while (unconnected.size > 0) {
    let bestDist = Infinity;
    let bestFrom = 0;
    let bestTo = 0;

    for (const ci of connected) {
      for (const ui of unconnected) {
        const dx = rooms[ci].cx - rooms[ui].cx;
        const dy = rooms[ci].cy - rooms[ui].cy;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          bestFrom = ci;
          bestTo = ui;
        }
      }
    }

    connected.add(bestTo);
    unconnected.delete(bestTo);
    carveCorridor(rooms[bestFrom].cx, rooms[bestFrom].cy, rooms[bestTo].cx, rooms[bestTo].cy, tiles, biome, material, w, h);
  }
}

// ── L-shaped corridor ────────────────────────────────────
function carveCorridor(
  x1: number, y1: number, x2: number, y2: number,
  tiles: Tile[][], biome: Biome, material: TileMaterial,
  w: number, h: number,
): void {
  // Horizontal leg
  const sx = Math.min(x1, x2);
  const ex = Math.max(x1, x2);
  for (let x = sx; x <= ex; x++) {
    for (let dy = -1; dy <= 1; dy++) {
      const yy = y1 + dy;
      if (x > 0 && x < w - 1 && yy > 0 && yy < h - 1) {
        tiles[yy][x] = makeTile(x, yy, biome, material, true);
      }
    }
  }
  // Vertical leg
  const sy = Math.min(y1, y2);
  const ey = Math.max(y1, y2);
  for (let y = sy; y <= ey; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      const xx = x2 + dx;
      if (xx > 0 && xx < w - 1 && y > 0 && y < h - 1) {
        tiles[y][xx] = makeTile(xx, y, biome, material, true);
      }
    }
  }
}

// ── Resource placement ───────────────────────────────────
function placeResources(
  rooms: DungeonRoom[], rng: SeededRandom, tiles: Tile[][],
): { type: string; position: Vector2; remaining: number }[] {
  const resources: { type: string; position: Vector2; remaining: number }[] = [];
  const types = ['mana_crystal', 'health_soul', 'speed_boost', 'shield_charge'];

  for (let i = 1; i < rooms.length; i++) {
    if (rng.next() < 0.5) {
      const room = rooms[i];
      const rx = rng.int(room.x + 1, room.x + room.w - 2);
      const ry = rng.int(room.y + 1, room.y + room.h - 2);
      if (tiles[ry]?.[rx]?.isPassable) {
        resources.push({
          type: types[i % types.length],
          position: { x: rx, y: ry },
          remaining: 3,
        });
      }
    }
  }
  return resources;
}

// ── Structure placement (dense breakables + chests) ──────
function placeStructures(
  rooms: DungeonRoom[], rng: SeededRandom, tiles: Tile[][],
): { type: string; position: Vector2; hp: number }[] {
  const structures: { type: string; position: Vector2; hp: number }[] = [];
  const breakableTypes = ['barrel', 'crate', 'crate_small', 'barrels_stacked'];
  const decorTypes = ['pillar', 'table', 'campfire', 'coffin'];

  for (let i = 1; i < rooms.length; i++) {
    const room = rooms[i];
    const area = room.w * room.h;

    // Place 2-5 breakables per room (based on area)
    const breakableCount = Math.min(5, Math.max(2, Math.floor(area / 15)));
    for (let b = 0; b < breakableCount; b++) {
      const sx = rng.int(room.x + 1, room.x + room.w - 2);
      const sy = rng.int(room.y + 1, room.y + room.h - 2);
      if (tiles[sy]?.[sx]?.isPassable && !structures.some(s => s.position.x === sx && s.position.y === sy)) {
        const t = breakableTypes[rng.int(0, breakableTypes.length - 1)];
        structures.push({ type: t, position: { x: sx, y: sy }, hp: t === 'barrels_stacked' ? 80 : 50 });
      }
    }

    // Place 0-1 chest per room (higher chance in later rooms)
    if (rng.next() < 0.45) {
      const cx = rng.int(room.x + 1, room.x + room.w - 2);
      const cy = rng.int(room.y + 1, room.y + room.h - 2);
      if (tiles[cy]?.[cx]?.isPassable && !structures.some(s => s.position.x === cx && s.position.y === cy)) {
        structures.push({ type: 'chest', position: { x: cx, y: cy }, hp: 50 });
      }
    }

    // Place 0-1 decoration per room
    if (rng.next() < 0.35 && i > 1) {
      const dx = rng.int(room.x + 1, room.x + room.w - 2);
      const dy = rng.int(room.y + 1, room.y + room.h - 2);
      if (tiles[dy]?.[dx]?.isPassable && !structures.some(s => s.position.x === dx && s.position.y === dy)) {
        const t = decorTypes[rng.int(0, decorTypes.length - 1)];
        structures.push({ type: t, position: { x: dx, y: dy }, hp: t === 'pillar' ? 300 : 150 });
      }
    }
  }
  return structures;
}

// ── Secret passages ──────────────────────────────────────
function placeSecretPassages(
  rooms: DungeonRoom[], rng: SeededRandom,
): { entrance: Vector2; exit: Vector2 }[] {
  const passages: { entrance: Vector2; exit: Vector2 }[] = [];
  if (rooms.length < 4) return passages;

  for (let i = 0; i < 2 && i < rooms.length - 2; i++) {
    if (rng.next() < 0.3) {
      passages.push({
        entrance: { x: rooms[i].cx, y: rooms[i].cy },
        exit: { x: rooms[rooms.length - 1 - i].cx, y: rooms[rooms.length - 1 - i].cy },
      });
    }
  }
  return passages;
}

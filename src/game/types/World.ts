// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — World & Map Types
// ═══════════════════════════════════════════════════════════════

import type { Vector2 } from './SoulEntity';

export enum Biome {
  CrystalCaverns = 'Crystal Caverns',
  EmberFields = 'Ember Fields',
  VoidMarsh = 'Void Marsh',
  ArcaneForest = 'Arcane Forest',
  ShatteredPlains = 'Shattered Plains',
  FrozenAether = 'Frozen Aether',
  NeonRuins = 'Neon Ruins',
}

export enum TileMaterial {
  Stone = 'Stone',
  Wood = 'Wood',
  Crystal = 'Crystal',
  Ice = 'Ice',
  Lava = 'Lava',
  Void = 'Void',
  Metal = 'Metal',
  Water = 'Water',
  Grass = 'Grass',
  Sand = 'Sand',
}

export interface TileProperties {
  material: TileMaterial;
  hardness: number;       // Resistance to destruction
  friction: number;       // Movement speed modifier
  flammability: number;   // 0.0 fireproof — 1.0 instant ignite
  conductivity: number;   // Heat/electric propagation
  opacity: number;        // Light blocking 0.0 — 1.0
  resonance: number;      // Magic amplification
  destructible: boolean;
  hp: number;
  elevation: number;      // 0-255
}

export interface Tile {
  x: number;
  y: number;
  biome: Biome;
  properties: TileProperties;
  isPassable: boolean;
  isOccupied: boolean;
  occupantId?: string;
  historyLog: TileHistoryEntry[];
  bloodSplatter: boolean;
  scorchMarks: boolean;
  damaged: boolean;
}

export interface TileHistoryEntry {
  event: string;
  soulName: string;
  timestamp: number;
}

export enum MapSize {
  Small = 64,
  Medium = 128,
  Large = 256,
}

export enum SymmetryMode {
  Mirror = 'MIRROR',
  Chaos = 'CHAOS',
}

export interface FlagBase {
  teamId: string;
  position: Vector2;
  color: string;
}

export interface GameMap {
  id: string;
  name: string;
  seed: number;
  size: MapSize;
  symmetry: SymmetryMode;
  tileSize: number; // 16 or 32
  tiles: Tile[][];
  biomes: Biome[];
  flagBases: FlagBase[];
  spawnZones: { teamId: string; position: Vector2; radius: number }[];
  resourceNodes: { type: string; position: Vector2; remaining: number }[];
  structures: { type: string; position: Vector2; hp: number }[];
  secretPassages: { entrance: Vector2; exit: Vector2 }[];
}

// Biome gameplay effects
export interface BiomeEffect {
  biome: Biome;
  speedModifier: number;
  damageModifiers: Record<string, number>; // DamageType → multiplier
  visionModifier: number;
  manaRegenModifier: number;
  specialMechanic: string;
  abundantResource: string;
  hazardDescription: string;
}

export const BIOME_EFFECTS: BiomeEffect[] = [
  {
    biome: Biome.CrystalCaverns,
    speedModifier: 1.0,
    damageModifiers: {},
    visionModifier: 1.2,
    manaRegenModifier: 1.0,
    specialMechanic: 'Ranged attacks BOUNCE off crystal walls (ricochet)',
    abundantResource: 'Crystal Ore',
    hazardDescription: 'Shattering pillars when damaged (AoE glass shrapnel)',
  },
  {
    biome: Biome.EmberFields,
    speedModifier: 1.0,
    damageModifiers: { Fire: 1.3, Ice: 0.7 },
    visionModifier: 0.8,
    manaRegenModifier: 1.0,
    specialMechanic: 'Fire damage +30%, Ice damage -30%',
    abundantResource: 'Ember Dust',
    hazardDescription: 'Geysers erupt periodically (random fire pillars)',
  },
  {
    biome: Biome.VoidMarsh,
    speedModifier: 0.8,
    damageModifiers: {},
    visionModifier: 0.6,
    manaRegenModifier: 1.5,
    specialMechanic: 'Mana regen +50%, movement speed -20%',
    abundantResource: 'Void Essence',
    hazardDescription: 'Void tendrils grab souls that stand still 5s+',
  },
  {
    biome: Biome.ArcaneForest,
    speedModifier: 1.0,
    damageModifiers: {},
    visionModifier: 0.8,
    manaRegenModifier: 1.0,
    specialMechanic: 'All ability cooldowns -20%',
    abundantResource: 'Mana Shards',
    hazardDescription: 'Trees move when not observed (changing paths)',
  },
  {
    biome: Biome.ShatteredPlains,
    speedModifier: 1.0,
    damageModifiers: {},
    visionModifier: 1.2,
    manaRegenModifier: 1.0,
    specialMechanic: 'Knockback +50% (fall off edges = death)',
    abundantResource: 'Ancient Gears',
    hazardDescription: 'Bridges collapse after 10 crossings',
  },
  {
    biome: Biome.FrozenAether,
    speedModifier: 0.9,
    damageModifiers: { Ice: 1.3 },
    visionModifier: 1.0,
    manaRegenModifier: 1.0,
    specialMechanic: 'All souls slide (momentum persists), Ice +30%',
    abundantResource: 'Frost Core',
    hazardDescription: 'Blizzard events (periodic, reduces all vision to 2 tiles)',
  },
  {
    biome: Biome.NeonRuins,
    speedModifier: 1.0,
    damageModifiers: { Electric: 1.3 },
    visionModifier: 1.0,
    manaRegenModifier: 1.0,
    specialMechanic: 'Electric damage +30%, can hack turrets',
    abundantResource: 'Living Metal',
    hazardDescription: 'Security lasers activate on timers',
  },
];

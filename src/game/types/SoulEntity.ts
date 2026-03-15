// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Soul Entity System (deep-simulation Level Depth)
// ═══════════════════════════════════════════════════════════════

// ── Enumerations ──────────────────────────────────────────────

export enum SoulClass {
  Soldier = 'Soldier',
  Hitman = 'Hitman',
  Robot = 'Robot',
  Survivor = 'Survivor',
  Scout = 'Scout',
}

export enum SurfaceMaterial {
  Glass = 'Glass',
  Stone = 'Stone',
  Metal = 'Metal',
  Crystal = 'Crystal',
  Void = 'Void',
  Plasma = 'Plasma',
}

export enum AttackType {
  Melee = 'Melee',
  Ranged = 'Ranged',
  AoE = 'AoE',
  Beam = 'Beam',
  Summon = 'Summon',
}

export enum DamageType {
  Impact = 'Impact',
  Pierce = 'Pierce',
  Fire = 'Fire',
  Ice = 'Ice',
  Electric = 'Electric',
  Void = 'Void',
  Arcane = 'Arcane',
  Psychic = 'Psychic',
}

export enum EmotionalState {
  Calm = 'CALM',
  Enraged = 'ENRAGED',
  Fearful = 'FEARFUL',
  Confident = 'CONFIDENT',
  Desperate = 'DESPERATE',
  Vengeful = 'VENGEFUL',
  Inspired = 'INSPIRED',
  Corrupted = 'CORRUPTED',
}

export enum RelationshipType {
  Rival = 'rival',
  Nemesis = 'nemesis',
  BondedAlly = 'bonded_ally',
  Mentor = 'mentor',
  Feared = 'feared',
  Respected = 'respected',
}

// ── Core Interfaces ───────────────────────────────────────────

export interface SoulPersonality {
  aggression: number;   // 0.0 passive — 1.0 berserker
  loyalty: number;      // 0.0 traitor — 1.0 die-hard
  curiosity: number;    // 0.0 stays on path — 1.0 explores everything
  greed: number;        // 0.0 ignores loot — 1.0 hoards everything
  courage: number;      // 0.0 flees at 80% HP — 1.0 fights to death
  social: number;       // 0.0 lone wolf — 1.0 always groups up
  patience: number;     // 0.0 rushes flag — 1.0 plays defense forever
  creativity: number;   // 0.0 meta builds — 1.0 weird builds
}

export interface SoulMemoryEntry {
  event: 'killed_by' | 'killed' | 'explored_room' | 'found_loot' | 'boss_defeated' | 'assisted_by' | 'floor_cleared';
  targetId?: string;
  count: number;
  emotion: 'rage' | 'gratitude' | 'pride' | 'distrust' | 'fear' | 'respect';
  timestamp: number;
}

export interface SoulRelationship {
  targetId: string;
  type: RelationshipType;
  intensity: number; // 0.0 — 1.0
}

export interface BodyPart {
  name: string;
  hp: number;
  hpMax: number;
  material: string;
  intact: boolean;
  effects: string[]; // What happens when destroyed
}

export interface SoulMutation {
  id: string;
  name: string;
  description: string;
  statModifiers: Partial<SoulCombatStats>;
  specialEffect?: string;
}

// ── Stat Blocks ───────────────────────────────────────────────

export interface SoulPhysicalStats {
  mass: number;
  radius: number;
  density: number;
  elasticity: number;
  surfaceMaterial: SurfaceMaterial;
  temperature: number;
  luminosity: number;
  colorPrimary: string;
  colorSecondary: string;
  colorTrail: string;
}

export interface SoulVitals {
  hp: number;
  hpMax: number;
  hpRegen: number;
  shield: number;
  shieldMax: number;
  shieldRegen: number;
  mana: number;
  manaMax: number;
  manaRegen: number;
  stamina: number;
  staminaMax: number;
}

export interface SoulMovementStats {
  speedBase: number;
  speedCurrent: number;
  acceleration: number;
  friction: number;
  dashCharges: number;
  dashChargesMax: number;
  dashCooldown: number;
}

export interface SoulCombatStats {
  attackPower: number;
  attackSpeed: number;
  attackRange: number;
  attackType: AttackType;
  critChance: number;
  critMultiplier: number;
  armor: number;
  evasion: number;
}

// ── Ability System ────────────────────────────────────────────

export interface Ability {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldown: number;
  cooldownRemaining: number;
  damageType: DamageType;
  baseDamage: number;
  range: number;
  aoeRadius?: number;
  duration?: number;
  isUltimate: boolean;
}

// ── Position & Movement ───────────────────────────────────────

export interface Vector2 {
  x: number;
  y: number;
}

// ── The Complete Soul Entity ───────────────────────────────────

export interface SoulEntity {
  // Identity
  id: string;
  name: string;
  class: SoulClass;
  level: number;
  xp: number;
  teamId: string;

  // Position
  position: Vector2;
  velocity: Vector2;
  facing: Vector2;

  // Stats
  physical: SoulPhysicalStats;
  vitals: SoulVitals;
  movement: SoulMovementStats;
  combat: SoulCombatStats;

  // DF-Level Systems
  personality: SoulPersonality;
  emotionalState: EmotionalState;
  memories: SoulMemoryEntry[];
  relationships: SoulRelationship[];
  bodyParts: BodyPart[];
  mutations: SoulMutation[];
  abilities: Ability[];

  // State flags
  isAlive: boolean;
  isStealthed: boolean;
  isShielded: boolean;

  // Explorer/dungeon fields
  sprite: string;           // base sprite name (e.g. "soldier1")
  kills: number;
  gold: number;
  inventory: string[];      // item IDs collected
  currentFloor: number;
  roomsExplored: number;
  corruptionLevel: number;  // 0-100
  flagCorruptionTimer: number;
  isCarryingFlag: boolean;  // kept for compat, repurposed as "carrying key item"
}

// ── Body Part Templates ───────────────────────────────────────

export function createDefaultBodyParts(): BodyPart[] {
  return [
    {
      name: 'Outer Shell',
      hp: 50,
      hpMax: 50,
      material: 'crystal',
      intact: true,
      effects: ['All incoming damage +50% when broken'],
    },
    {
      name: 'Inner Core',
      hp: 100,
      hpMax: 100,
      material: 'mana_plasma',
      intact: true,
      effects: ['DEATH when broken'],
    },
    {
      name: 'Eye Sensor',
      hp: 20,
      hpMax: 20,
      material: 'lens',
      intact: true,
      effects: ['Vision range halved, accuracy -40% when broken'],
    },
    {
      name: 'Propulsion Jet',
      hp: 30,
      hpMax: 30,
      material: 'thruster',
      intact: true,
      effects: ['Speed halved, no dash when broken'],
    },
    {
      name: 'Mana Channel',
      hp: 40,
      hpMax: 40,
      material: 'conduit',
      intact: true,
      effects: ['No abilities, mana locked when broken'],
    },
  ];
}

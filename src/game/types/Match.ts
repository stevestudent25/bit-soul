// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — CTF Match Types & Core Loop
// ═══════════════════════════════════════════════════════════════

import type { Vector2 } from './SoulEntity';

export enum MatchMode {
  ClassicCTF = 'ClassicCTF',
  SiegeCTF = 'SiegeCTF',
  SoulWars = 'SoulWars',
  RelicHunt = 'RelicHunt',
}

export enum MatchPhase {
  Preparation = 'PREPARATION',
  Battle = 'BATTLE',
  DesperateHour = 'DESPERATE_HOUR',
  Overtime = 'OVERTIME',
  PostMatch = 'POST_MATCH',
}

export enum RespawnMode {
  Base = 'base',
  ForwardOutpost = 'forward_outpost',
  TeammateProximity = 'teammate_proximity',
}

export enum FlagStatus {
  AtBase = 'AT_BASE',
  Carried = 'CARRIED',
  Dropped = 'DROPPED',
  Returning = 'RETURNING',
  Destroyed = 'DESTROYED',
}

// ── Flag Entity ───────────────────────────────────────────────

export interface Flag {
  id: string;
  teamId: string;
  status: FlagStatus;
  position: Vector2;
  carrierId: string | null;
  corruptionLevel: number; // 0-100
  dropTimer: number;       // seconds remaining before auto-return
  respawnTimer: number;    // if destroyed, seconds until respawn
  isPrimary: boolean;
  velocity: Vector2;       // for thrown flags
  weight: number;
}

// ── Dynamic Events ────────────────────────────────────────────

export enum DynamicEventType {
  ManaSurge = 'MANA_SURGE',
  AncientGuardian = 'ANCIENT_GUARDIAN',
  RiftEvent = 'RIFT_EVENT',
  Eclipse = 'ECLIPSE',
}

export interface DynamicEvent {
  type: DynamicEventType;
  position?: Vector2;
  duration: number;
  timeRemaining: number;
  active: boolean;
  description: string;
}

// ── Match Configuration ───────────────────────────────────────

export interface MatchConfig {
  mode: MatchMode;
  teamCount: 2 | 3 | 4;
  soulsPerTeam: number;
  scoreToWin: number;
  timeLimit: number;       // seconds
  overtimeEnabled: boolean;
  respawnTime: number;
  respawnMode: RespawnMode;
  preparationTime: number; // seconds for prep phase
  desperateHourTime: number; // last N seconds trigger desperate hour
}

// ── Team State ────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  flag: Flag;
  members: string[]; // soul IDs
  resources: Resources;
}

export interface Resources {
  manaShards: number;
  crystalOre: number;
  voidEssence: number;
  ancientGears: number;
  emberDust: number;
  frostCore: number;
  livingMetal: number;
}

// ── Kill Feed & Events ────────────────────────────────────────

export type MatchEventType =
  | 'kill'
  | 'flag_pickup'
  | 'flag_drop'
  | 'flag_capture'
  | 'flag_return'
  | 'flag_throw'
  | 'flag_intercept'
  | 'flag_destroyed'
  | 'body_part_break'
  | 'ability_used'
  | 'mutation_gained'
  | 'phase_change'
  | 'dynamic_event'
  | 'respawn'
  | 'multi_kill';

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  timestamp: number;
  actorId?: string;
  actorName?: string;
  targetId?: string;
  targetName?: string;
  details: string;
  position?: Vector2;
}

// ── Post-Match Stats ──────────────────────────────────────────

export interface SoulMatchStats {
  soulId: string;
  soulName: string;
  soulClass: string;
  kills: number;
  deaths: number;
  assists: number;
  flagCaptures: number;
  flagReturns: number;
  flagCarryTime: number;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  structuresBuilt: number;
  resourcesGathered: number;
  bodyPartsDestroyed: number;
  longestKillStreak: number;
  distanceTraveled: number;
}

// ── The Full Match State ──────────────────────────────────────

export interface MatchState {
  id: string;
  config: MatchConfig;
  mapId: string;
  phase: MatchPhase;
  timeElapsed: number;
  timeRemaining: number;
  teams: Team[];
  events: MatchEvent[];
  dynamicEvents: DynamicEvent[];
  killFeed: MatchEvent[];

  // Phase-specific state
  preparationTimeRemaining: number;
  isDesperateHour: boolean;
  isOvertime: boolean;
  overtimeShrinkRadius: number;

  // Match result
  isFinished: boolean;
  winnerId: string | null;
  mvpId: string | null;
  matchStats: SoulMatchStats[];
}

// ── Default Config ────────────────────────────────────────────

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  mode: MatchMode.ClassicCTF,
  teamCount: 2,
  soulsPerTeam: 5,
  scoreToWin: 3,
  timeLimit: 900, // 15 minutes
  overtimeEnabled: true,
  respawnTime: 8,
  respawnMode: RespawnMode.Base,
  preparationTime: 60,
  desperateHourTime: 120,
};

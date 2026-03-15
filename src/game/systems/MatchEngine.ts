// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Match Engine: CTF Core Loop
// ═══════════════════════════════════════════════════════════════

import type { SoulEntity } from '../types/SoulEntity';
import {
  type MatchState,
  type MatchConfig,
  type MatchEvent,
  type Team,
  type Flag,
  type DynamicEvent,
  MatchPhase,
  FlagStatus,
  DynamicEventType,
  DEFAULT_MATCH_CONFIG,
} from '../types/Match';
import { createSoul } from './SoulFactory';
import { SoulClass } from '../types/SoulEntity';

// ── Match Initialization ──────────────────────────────────────

let matchIdCounter = 0;

export function createMatch(config: Partial<MatchConfig> = {}): MatchState {
  const fullConfig = { ...DEFAULT_MATCH_CONFIG, ...config };
  const matchId = `match_${++matchIdCounter}_${Date.now()}`;

  const teams = createTeams(fullConfig);

  return {
    id: matchId,
    config: fullConfig,
    mapId: '',
    phase: MatchPhase.Preparation,
    timeElapsed: 0,
    timeRemaining: fullConfig.timeLimit,
    teams,
    events: [],
    dynamicEvents: [],
    killFeed: [],
    preparationTimeRemaining: fullConfig.preparationTime,
    isDesperateHour: false,
    isOvertime: false,
    overtimeShrinkRadius: 0,
    isFinished: false,
    winnerId: null,
    mvpId: null,
    matchStats: [],
  };
}

function createTeams(config: MatchConfig): Team[] {
  const teamColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
  const teamNames = ['Red Legion', 'Blue Vanguard', 'Green Tide', 'Gold Accord'];
  const teams: Team[] = [];

  for (let i = 0; i < config.teamCount; i++) {
    const teamId = `team_${i}`;
    const flag: Flag = {
      id: `flag_${teamId}`,
      teamId,
      status: FlagStatus.AtBase,
      position: { x: i === 0 ? 5 : 59, y: 32 },
      carrierId: null,
      corruptionLevel: 0,
      dropTimer: 0,
      respawnTimer: 0,
      isPrimary: true,
      velocity: { x: 0, y: 0 },
      weight: 2.0,
    };

    teams.push({
      id: teamId,
      name: teamNames[i],
      color: teamColors[i],
      score: 0,
      flag,
      members: [],
      resources: {
        manaShards: 20,
        crystalOre: 10,
        voidEssence: 5,
        ancientGears: 5,
        emberDust: 5,
        frostCore: 3,
        livingMetal: 1,
      },
    });
  }

  return teams;
}

// ── Soul Spawning ──────────────────────────────────────────────

const CLASS_ROTATION: SoulClass[] = [
  SoulClass.Soldier, SoulClass.Hitman, SoulClass.Robot,
  SoulClass.Survivor, SoulClass.Scout,
];

export function spawnTeamSouls(match: MatchState): SoulEntity[] {
  const allSouls: SoulEntity[] = [];

  for (const team of match.teams) {
    for (let i = 0; i < match.config.soulsPerTeam; i++) {
      const soulClass = CLASS_ROTATION[i % CLASS_ROTATION.length];
      const baseX = team.flag.position.x;
      const baseY = team.flag.position.y;
      const spawnOffset = { x: baseX + (i % 3) * 2 - 2, y: baseY + Math.floor(i / 3) * 2 - 2 };

      const soul = createSoul(soulClass, team.id, spawnOffset);
      team.members.push(soul.id);
      allSouls.push(soul);
    }
  }

  return allSouls;
}

// ── Phase Management ──────────────────────────────────────────

export function updateMatchPhase(match: MatchState, deltaTime: number): MatchState {
  const updated = { ...match };
  updated.timeElapsed += deltaTime;

  switch (updated.phase) {
    case MatchPhase.Preparation:
      updated.preparationTimeRemaining -= deltaTime;
      if (updated.preparationTimeRemaining <= 0) {
        updated.phase = MatchPhase.Battle;
        updated.events.push(createMatchEvent('phase_change', 'BATTLE PHASE BEGINS!'));
      }
      break;

    case MatchPhase.Battle:
      updated.timeRemaining -= deltaTime;

      // Check for Desperate Hour
      if (!updated.isDesperateHour && updated.timeRemaining <= updated.config.desperateHourTime) {
        updated.isDesperateHour = true;
        updated.phase = MatchPhase.DesperateHour;
        updated.events.push(createMatchEvent('phase_change', 'DESPERATE HOUR! All stats +20%, respawn halved!'));
      }

      // Check for time's up
      if (updated.timeRemaining <= 0) {
        updated.timeRemaining = 0;
        const scores = updated.teams.map(t => t.score);
        const maxScore = Math.max(...scores);
        const tiedTeams = updated.teams.filter(t => t.score === maxScore);

        if (tiedTeams.length > 1 && updated.config.overtimeEnabled) {
          updated.phase = MatchPhase.Overtime;
          updated.isOvertime = true;
          updated.events.push(createMatchEvent('phase_change', 'OVERTIME! First capture wins! No respawns!'));
        } else {
          endMatch(updated);
        }
      }
      break;

    case MatchPhase.DesperateHour:
      updated.timeRemaining -= deltaTime;
      if (updated.timeRemaining <= 0) {
        updated.timeRemaining = 0;
        const scores = updated.teams.map(t => t.score);
        const maxScore = Math.max(...scores);
        const tiedTeams = updated.teams.filter(t => t.score === maxScore);

        if (tiedTeams.length > 1 && updated.config.overtimeEnabled) {
          updated.phase = MatchPhase.Overtime;
          updated.isOvertime = true;
          updated.events.push(createMatchEvent('phase_change', 'OVERTIME! First capture wins! No respawns!'));
        } else {
          endMatch(updated);
        }
      }
      break;

    case MatchPhase.Overtime:
      // Map slowly collapses inward
      updated.overtimeShrinkRadius += deltaTime * 0.5;
      // Match ends only when a flag is captured
      break;
  }

  // Check win condition (score)
  for (const team of updated.teams) {
    if (team.score >= updated.config.scoreToWin) {
      endMatch(updated, team.id);
      break;
    }
  }

  return updated;
}

function endMatch(match: MatchState, winnerId?: string): void {
  match.phase = MatchPhase.PostMatch;
  match.isFinished = true;

  if (winnerId) {
    match.winnerId = winnerId;
  } else {
    // Highest score wins
    const sorted = [...match.teams].sort((a, b) => b.score - a.score);
    match.winnerId = sorted[0].id;
  }

  match.events.push(createMatchEvent('phase_change',
    `MATCH OVER! ${match.teams.find(t => t.id === match.winnerId)?.name} wins!`
  ));
}

// ── Flag Operations ───────────────────────────────────────────

export function pickupFlag(
  match: MatchState,
  soul: SoulEntity,
  flagTeamId: string,
): { match: MatchState; soul: SoulEntity } {
  const updated = { ...match };
  const team = updated.teams.find(t => t.id === flagTeamId);
  if (!team) return { match, soul };

  const flag = team.flag;

  // Can't pickup your own flag unless it's dropped
  if (flagTeamId === soul.teamId) {
    if (flag.status === FlagStatus.Dropped) {
      flag.status = FlagStatus.Returning;
      flag.dropTimer = 0;
      updated.events.push(createMatchEvent('flag_return',
        `${soul.name} returned their team's flag!`, soul.id, soul.name
      ));
      // Instantly return to base
      flag.position = { ...flag.position }; // reset
      flag.status = FlagStatus.AtBase;
    }
    return { match: updated, soul };
  }

  // Pickup enemy flag
  if (flag.status !== FlagStatus.AtBase && flag.status !== FlagStatus.Dropped) {
    return { match, soul };
  }

  flag.status = FlagStatus.Carried;
  flag.carrierId = soul.id;

  const updatedSoul = { ...soul, isCarryingFlag: true };

  // Carrier penalty: -15% speed, +10% radius
  updatedSoul.movement = {
    ...updatedSoul.movement,
    speedCurrent: updatedSoul.movement.speedBase * 0.85,
  };
  updatedSoul.physical = {
    ...updatedSoul.physical,
    radius: updatedSoul.physical.radius * 1.1,
  };

  updated.events.push(createMatchEvent('flag_pickup',
    `${soul.name} picked up ${team.name}'s flag!`, soul.id, soul.name
  ));
  updated.killFeed.push(createMatchEvent('flag_pickup',
    `${soul.name} ➜ FLAG`, soul.id, soul.name
  ));

  return { match: updated, soul: updatedSoul };
}

export function captureFlag(
  match: MatchState,
  soul: SoulEntity,
): { match: MatchState; soul: SoulEntity; captured: boolean } {
  if (!soul.isCarryingFlag) return { match, soul, captured: false };

  const updated = { ...match };

  // Find the flag this soul is carrying
  const carriedFlag = updated.teams
    .map(t => t.flag)
    .find(f => f.carrierId === soul.id);

  if (!carriedFlag) return { match, soul, captured: false };

  // Check if soul's own flag is at base (required to capture)
  const soulTeam = updated.teams.find(t => t.id === soul.teamId);
  if (!soulTeam || soulTeam.flag.status !== FlagStatus.AtBase) {
    return { match: updated, soul, captured: false };
  }

  // Score!
  soulTeam.score += 1;
  carriedFlag.status = FlagStatus.AtBase;
  carriedFlag.carrierId = null;
  carriedFlag.corruptionLevel = 0;

  const updatedSoul = {
    ...soul,
    isCarryingFlag: false,
    corruptionLevel: 0,
    flagCorruptionTimer: 0,
  };
  // Reset carrier penalties
  updatedSoul.movement.speedCurrent = updatedSoul.movement.speedBase;
  updatedSoul.physical.radius = updatedSoul.physical.radius / 1.1;

  updated.events.push(createMatchEvent('flag_capture',
    `${soul.name} CAPTURED the flag! ${soulTeam.name}: ${soulTeam.score}`,
    soul.id, soul.name
  ));
  updated.killFeed.push(createMatchEvent('flag_capture',
    `${soul.name} ★ CAPTURED`, soul.id, soul.name
  ));

  return { match: updated, soul: updatedSoul, captured: true };
}

export function dropFlag(
  match: MatchState,
  soul: SoulEntity,
): { match: MatchState; soul: SoulEntity } {
  if (!soul.isCarryingFlag) return { match, soul };

  const updated = { ...match };
  const carriedFlag = updated.teams
    .map(t => t.flag)
    .find(f => f.carrierId === soul.id);

  if (!carriedFlag) return { match, soul };

  carriedFlag.status = FlagStatus.Dropped;
  carriedFlag.carrierId = null;
  carriedFlag.position = { ...soul.position };
  carriedFlag.dropTimer = 15; // 15 seconds to return

  const updatedSoul = { ...soul, isCarryingFlag: false, corruptionLevel: 0 };
  updatedSoul.movement.speedCurrent = updatedSoul.movement.speedBase;

  updated.events.push(createMatchEvent('flag_drop',
    `${soul.name} dropped the flag!`, soul.id, soul.name
  ));
  updated.killFeed.push(createMatchEvent('flag_drop',
    `${soul.name} ✕ DROPPED`, soul.id, soul.name
  ));

  return { match: updated, soul: updatedSoul };
}

// ── Flag Corruption ───────────────────────────────────────────

export function updateFlagCorruption(
  soul: SoulEntity,
  deltaTime: number,
): SoulEntity {
  if (!soul.isCarryingFlag) return soul;

  const updated = { ...soul };
  updated.flagCorruptionTimer += deltaTime;

  // Corruption starts after 60s of carrying
  if (updated.flagCorruptionTimer > 60) {
    const corruptionRate = 1.5; // per second
    updated.corruptionLevel = Math.min(100,
      updated.corruptionLevel + corruptionRate * deltaTime
    );

    // Corruption DoT
    if (updated.corruptionLevel > 0) {
      const dot = updated.corruptionLevel * 0.1; // damage scales with corruption
      updated.vitals = {
        ...updated.vitals,
        hp: Math.max(0, updated.vitals.hp - dot * deltaTime),
      };
    }

    // At 100% corruption: soul explodes
    if (updated.corruptionLevel >= 100) {
      updated.isAlive = false;
      updated.isCarryingFlag = false;
    }
  }

  return updated;
}

// ── Dynamic Events ────────────────────────────────────────────

export function rollDynamicEvent(match: MatchState): DynamicEvent | null {
  // 10% chance per minute
  if (Math.random() > 0.10) return null;
  if (match.phase !== MatchPhase.Battle && match.phase !== MatchPhase.DesperateHour) return null;

  const eventTypes = [
    {
      type: DynamicEventType.ManaSurge,
      duration: 30,
      description: 'Mana Surge! Control point appeared — team holding gets mana regen boost!',
    },
    {
      type: DynamicEventType.AncientGuardian,
      duration: 60,
      description: 'Ancient Guardian spawned at center! Defeat it for a super-weapon!',
    },
    {
      type: DynamicEventType.RiftEvent,
      duration: 20,
      description: 'Rift opened! Portal connecting two random map points!',
    },
    {
      type: DynamicEventType.Eclipse,
      duration: 30,
      description: 'Eclipse! Vision range halved, stealth souls invisible!',
    },
  ];

  const chosen = eventTypes[Math.floor(Math.random() * eventTypes.length)];

  return {
    type: chosen.type,
    position: { x: 32, y: 32 },
    duration: chosen.duration,
    timeRemaining: chosen.duration,
    active: true,
    description: chosen.description,
  };
}

// ── Desperate Hour Stat Boost ─────────────────────────────────

export function getDesperateHourMultiplier(match: MatchState): number {
  return match.isDesperateHour ? 1.2 : 1.0;
}

// ── Helper ────────────────────────────────────────────────────

let eventIdCounter = 0;

function createMatchEvent(
  type: MatchEvent['type'],
  details: string,
  actorId?: string,
  actorName?: string,
  targetId?: string,
  targetName?: string,
): MatchEvent {
  return {
    id: `evt_${++eventIdCounter}`,
    type,
    timestamp: Date.now(),
    actorId,
    actorName,
    targetId,
    targetName,
    details,
  };
}

// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Combat Engine: Damage Processing & Abilities
// ═══════════════════════════════════════════════════════════════

import type { SoulEntity, Ability, Vector2 } from '../types/SoulEntity';
import { EmotionalState, DamageType } from '../types/SoulEntity';
import { calculateDamage, type DamageResult, type StatusEffect } from '../types/Combat';
import type { MatchEvent } from '../types/Match';

// ── Active Status Effects Tracker ─────────────────────────────

export interface ActiveEffect {
  effect: StatusEffect;
  timeRemaining: number;
  lastTickTime: number;
}

export interface CombatState {
  soulId: string;
  activeEffects: ActiveEffect[];
  killStreak: number;
  lastKillTime: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
}

// ── Combat Engine ─────────────────────────────────────────────

export function processAttack(
  attacker: SoulEntity,
  defender: SoulEntity,
  abilityIndex?: number,
  terrainResonance: number = 1.0,
): { result: DamageResult; updatedDefender: SoulEntity; events: MatchEvent[] } {
  const events: MatchEvent[] = [];

  let baseDamage: number;
  let damageType: DamageType;
  let range: number;

  if (abilityIndex !== undefined && abilityIndex < attacker.abilities.length) {
    const ability = attacker.abilities[abilityIndex];
    if (ability.cooldownRemaining > 0) {
      return {
        result: createMissResult(DamageType.Impact),
        updatedDefender: defender,
        events: [],
      };
    }
    baseDamage = ability.baseDamage;
    damageType = ability.damageType;
    range = ability.range;
  } else {
    baseDamage = 10; // basic attack
    damageType = DamageType.Impact;
    range = attacker.combat.attackRange;
  }

  const distance = getDistance(attacker.position, defender.position);

  // Range check
  if (distance > range) {
    return {
      result: createMissResult(damageType),
      updatedDefender: defender,
      events: [],
    };
  }

  const result = calculateDamage(
    attacker, defender, damageType, baseDamage, distance, terrainResonance
  );

  // Apply damage to defender
  let updatedDefender = { ...defender };

  // Shield absorption
  if (result.shieldAbsorbed > 0) {
    updatedDefender.vitals = {
      ...updatedDefender.vitals,
      shield: Math.max(0, updatedDefender.vitals.shield - result.shieldAbsorbed),
    };
  }

  // HP damage
  updatedDefender.vitals = {
    ...updatedDefender.vitals,
    hp: Math.max(0, updatedDefender.vitals.hp - result.finalDamage),
  };

  // Body part damage
  if (result.bodyPartHit !== 'miss') {
    updatedDefender = applyBodyPartDamage(updatedDefender, result.bodyPartHit, result.finalDamage);

    if (result.bodyPartDestroyed) {
      events.push({
        id: `evt_bp_${Date.now()}`,
        type: 'body_part_break',
        timestamp: Date.now(),
        actorId: attacker.id,
        actorName: attacker.name,
        targetId: defender.id,
        targetName: defender.name,
        details: `${attacker.name} destroyed ${defender.name}'s ${result.bodyPartHit}!`,
      });
    }
  }

  // Knockback
  if (result.knockback.x !== 0 || result.knockback.y !== 0) {
    updatedDefender.velocity = {
      x: updatedDefender.velocity.x + result.knockback.x,
      y: updatedDefender.velocity.y + result.knockback.y,
    };
  }

  // Kill check
  if (result.killedTarget || updatedDefender.vitals.hp <= 0) {
    updatedDefender.isAlive = false;
    events.push({
      id: `evt_kill_${Date.now()}`,
      type: 'kill',
      timestamp: Date.now(),
      actorId: attacker.id,
      actorName: attacker.name,
      targetId: defender.id,
      targetName: defender.name,
      details: `${attacker.name} eliminated ${defender.name}!`,
      position: defender.position,
    });

    // Update emotional state
    updatedDefender = {
      ...updatedDefender,
      emotionalState: EmotionalState.Desperate,
    };
  }

  // Crit event
  if (result.isCrit) {
    events.push({
      id: `evt_crit_${Date.now()}`,
      type: 'ability_used',
      timestamp: Date.now(),
      actorId: attacker.id,
      actorName: attacker.name,
      targetId: defender.id,
      targetName: defender.name,
      details: `CRITICAL HIT! ${attacker.name} ➜ ${defender.name} for ${result.finalDamage}!`,
    });
  }

  return { result, updatedDefender, events };
}

// ── Ability Usage ─────────────────────────────────────────────

export function useAbility(
  soul: SoulEntity,
  abilityIndex: number,
): { soul: SoulEntity; ability: Ability | null; canUse: boolean } {
  if (abilityIndex >= soul.abilities.length) {
    return { soul, ability: null, canUse: false };
  }

  const ability = soul.abilities[abilityIndex];

  // Check cooldown
  if (ability.cooldownRemaining > 0) {
    return { soul, ability, canUse: false };
  }

  // Check mana
  if (soul.vitals.mana < ability.manaCost) {
    return { soul, ability, canUse: false };
  }

  // Check mana channel body part
  const manaChannel = soul.bodyParts.find(p => p.name === 'Mana Channel');
  if (manaChannel && !manaChannel.intact) {
    return { soul, ability, canUse: false };
  }

  // Use ability
  const updatedSoul = { ...soul };
  updatedSoul.vitals = {
    ...updatedSoul.vitals,
    mana: updatedSoul.vitals.mana - ability.manaCost,
  };

  updatedSoul.abilities = updatedSoul.abilities.map((a, i) =>
    i === abilityIndex ? { ...a, cooldownRemaining: a.cooldown } : a
  );

  return { soul: updatedSoul, ability, canUse: true };
}

// ── Cooldown & Regen Tick ─────────────────────────────────────

export function tickSoul(soul: SoulEntity, deltaTime: number): SoulEntity {
  const updated = { ...soul };

  if (!updated.isAlive) return updated;

  // HP regen
  if (updated.vitals.hp < updated.vitals.hpMax) {
    updated.vitals = {
      ...updated.vitals,
      hp: Math.min(updated.vitals.hpMax, updated.vitals.hp + updated.vitals.hpRegen * deltaTime),
    };
  }

  // Shield regen
  if (updated.vitals.shield < updated.vitals.shieldMax) {
    updated.vitals = {
      ...updated.vitals,
      shield: Math.min(updated.vitals.shieldMax, updated.vitals.shield + updated.vitals.shieldRegen * deltaTime),
    };
  }

  // Mana regen
  if (updated.vitals.mana < updated.vitals.manaMax) {
    updated.vitals = {
      ...updated.vitals,
      mana: Math.min(updated.vitals.manaMax, updated.vitals.mana + updated.vitals.manaRegen * deltaTime),
    };
  }

  // Stamina regen
  if (updated.vitals.stamina < updated.vitals.staminaMax) {
    updated.vitals = {
      ...updated.vitals,
      stamina: Math.min(updated.vitals.staminaMax, updated.vitals.stamina + 5 * deltaTime),
    };
  }

  // Cooldown reduction
  updated.abilities = updated.abilities.map(a => ({
    ...a,
    cooldownRemaining: Math.max(0, a.cooldownRemaining - deltaTime),
  }));

  // Dash recharge
  if (updated.movement.dashCharges < updated.movement.dashChargesMax) {
    // Simple timer-based recharge
    updated.movement = {
      ...updated.movement,
      dashCharges: Math.min(
        updated.movement.dashChargesMax,
        updated.movement.dashCharges + deltaTime / updated.movement.dashCooldown
      ),
    };
  }

  return updated;
}

// ── Respawn ───────────────────────────────────────────────────

export function respawnSoul(soul: SoulEntity, spawnPosition: Vector2): SoulEntity {
  return {
    ...soul,
    isAlive: true,
    position: { ...spawnPosition },
    velocity: { x: 0, y: 0 },
    vitals: {
      ...soul.vitals,
      hp: soul.vitals.hpMax,
      shield: soul.vitals.shieldMax,
      mana: soul.vitals.manaMax,
      stamina: soul.vitals.staminaMax,
    },
    bodyParts: soul.bodyParts.map(p => ({ ...p, hp: p.hpMax, intact: true })),
    abilities: soul.abilities.map(a => ({ ...a, cooldownRemaining: 0 })),
    emotionalState: EmotionalState.Calm,
    isCarryingFlag: false,
    isStealthed: false,
    isShielded: false,
    corruptionLevel: 0,
    flagCorruptionTimer: 0,
  };
}

// ── Emotional State Modifiers ─────────────────────────────────

export interface EmotionModifiers {
  damageMultiplier: number;
  speedMultiplier: number;
  accuracyMultiplier: number;
}

export function getEmotionModifiers(state: EmotionalState): EmotionModifiers {
  switch (state) {
    case EmotionalState.Calm:
      return { damageMultiplier: 1.0, speedMultiplier: 1.0, accuracyMultiplier: 1.0 };
    case EmotionalState.Enraged:
      return { damageMultiplier: 1.3, speedMultiplier: 1.0, accuracyMultiplier: 0.8 };
    case EmotionalState.Fearful:
      return { damageMultiplier: 0.7, speedMultiplier: 1.2, accuracyMultiplier: 0.9 };
    case EmotionalState.Confident:
      return { damageMultiplier: 1.1, speedMultiplier: 1.1, accuracyMultiplier: 1.1 };
    case EmotionalState.Desperate:
      return { damageMultiplier: 1.4, speedMultiplier: 1.1, accuracyMultiplier: 0.7 };
    case EmotionalState.Vengeful:
      return { damageMultiplier: 1.2, speedMultiplier: 1.1, accuracyMultiplier: 1.0 };
    case EmotionalState.Inspired:
      return { damageMultiplier: 1.15, speedMultiplier: 1.15, accuracyMultiplier: 1.15 };
    case EmotionalState.Corrupted:
      return { damageMultiplier: 1.3, speedMultiplier: 0.9, accuracyMultiplier: 0.6 };
    default:
      return { damageMultiplier: 1.0, speedMultiplier: 1.0, accuracyMultiplier: 1.0 };
  }
}

// ── Helpers ───────────────────────────────────────────────────

function getDistance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function applyBodyPartDamage(soul: SoulEntity, partName: string, damage: number): SoulEntity {
  const updated = { ...soul };
  updated.bodyParts = updated.bodyParts.map(p => {
    if (p.name !== partName) return p;
    const newHp = Math.max(0, p.hp - damage * 0.3); // body parts take 30% of hit damage
    const intact = newHp > 0;

    // Apply body part break effects
    if (!intact && p.intact) {
      switch (p.name) {
        case 'Outer Shell':
          // All incoming damage +50% (handled in combat calc)
          break;
        case 'Eye Sensor':
          // Vision halved, accuracy -40%
          updated.combat = {
            ...updated.combat,
            critChance: updated.combat.critChance * 0.6,
          };
          break;
        case 'Propulsion Jet':
          updated.movement = {
            ...updated.movement,
            speedCurrent: updated.movement.speedBase * 0.5,
            dashCharges: 0,
            dashChargesMax: 0,
          };
          break;
        case 'Mana Channel':
          // No abilities (checked in useAbility)
          updated.vitals = {
            ...updated.vitals,
            manaRegen: 0,
          };
          break;
        case 'Inner Core':
          updated.isAlive = false;
          break;
      }
    }

    return { ...p, hp: newHp, intact };
  });

  return updated;
}

function createMissResult(damageType: DamageType): DamageResult {
  return {
    rawDamage: 0,
    finalDamage: 0,
    isCrit: false,
    damageType,
    bodyPartHit: 'miss',
    bodyPartDestroyed: false,
    knockback: { x: 0, y: 0 },
    statusEffects: [],
    shieldAbsorbed: 0,
    overkillDamage: 0,
    killedTarget: false,
  };
}

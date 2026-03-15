// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Combat & Damage Model
// ═══════════════════════════════════════════════════════════════

import type { SoulEntity, BodyPart, Vector2 } from './SoulEntity';
import { DamageType, SurfaceMaterial } from './SoulEntity';

// ── Damage Type Effectiveness ─────────────────────────────────

export interface DamageEffectiveness {
  strongAgainst: SurfaceMaterial[];
  weakAgainst: SurfaceMaterial[];
  specialEffect: string;
}

export const DAMAGE_EFFECTIVENESS: Record<DamageType, DamageEffectiveness> = {
  [DamageType.Impact]: {
    strongAgainst: [SurfaceMaterial.Glass, SurfaceMaterial.Crystal],
    weakAgainst: [SurfaceMaterial.Metal, SurfaceMaterial.Stone],
    specialEffect: 'Knockback',
  },
  [DamageType.Pierce]: {
    strongAgainst: [SurfaceMaterial.Plasma, SurfaceMaterial.Void],
    weakAgainst: [SurfaceMaterial.Crystal, SurfaceMaterial.Metal],
    specialEffect: 'Ignores 30% armor',
  },
  [DamageType.Fire]: {
    strongAgainst: [SurfaceMaterial.Glass],
    weakAgainst: [SurfaceMaterial.Metal],
    specialEffect: 'DoT burn, spreads to nearby tiles',
  },
  [DamageType.Ice]: {
    strongAgainst: [SurfaceMaterial.Plasma],
    weakAgainst: [SurfaceMaterial.Crystal],
    specialEffect: 'Slow effect -30% speed',
  },
  [DamageType.Electric]: {
    strongAgainst: [SurfaceMaterial.Metal],
    weakAgainst: [SurfaceMaterial.Crystal],
    specialEffect: 'Chain to 2 nearby enemies',
  },
  [DamageType.Void]: {
    strongAgainst: [SurfaceMaterial.Glass, SurfaceMaterial.Crystal, SurfaceMaterial.Stone, SurfaceMaterial.Metal, SurfaceMaterial.Plasma],
    weakAgainst: [SurfaceMaterial.Void],
    specialEffect: 'Drains mana',
  },
  [DamageType.Arcane]: {
    strongAgainst: [],
    weakAgainst: [],
    specialEffect: 'Shield break — deals 2x to shields',
  },
  [DamageType.Psychic]: {
    strongAgainst: [],
    weakAgainst: [],
    specialEffect: 'Confusion debuff — reversed controls 2s',
  },
};

// ── Damage Calculation ────────────────────────────────────────

export interface DamageResult {
  rawDamage: number;
  finalDamage: number;
  isCrit: boolean;
  damageType: DamageType;
  bodyPartHit: string;
  bodyPartDestroyed: boolean;
  knockback: Vector2;
  statusEffects: StatusEffect[];
  shieldAbsorbed: number;
  overkillDamage: number;
  killedTarget: boolean;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'burn' | 'freeze' | 'shock' | 'poison' | 'confusion' | 'blind' | 'slow' | 'mana_drain';
  duration: number;
  tickDamage: number;
  tickInterval: number;
  modifier: Partial<{
    speedMultiplier: number;
    damageMultiplier: number;
    armorMultiplier: number;
    manaRegenMultiplier: number;
  }>;
}

export function calculateDamage(
  attacker: SoulEntity,
  defender: SoulEntity,
  damageType: DamageType,
  baseDamage: number,
  distance: number,
  terrainResonance: number = 1.0,
): DamageResult {
  // Random variance 0.85 — 1.15
  const variance = 0.85 + Math.random() * 0.3;

  // Crit check
  const isCrit = Math.random() < attacker.combat.critChance;
  const critMult = isCrit ? attacker.combat.critMultiplier : 1.0;

  // Material effectiveness
  const effectiveness = DAMAGE_EFFECTIVENESS[damageType];
  let materialMult = 1.0;
  if (effectiveness.strongAgainst.includes(defender.physical.surfaceMaterial)) {
    materialMult = 1.5;
  } else if (effectiveness.weakAgainst.includes(defender.physical.surfaceMaterial)) {
    materialMult = 0.6;
  }

  // Distance falloff (ranged only)
  const maxRange = attacker.combat.attackRange;
  const distanceFalloff = maxRange > 0 ? Math.max(0.3, 1.0 - (distance / maxRange) * 0.5) : 1.0;

  // Armor reduction
  const armorReduction = Math.max(0, defender.combat.armor * materialMult);
  const armorMult = Math.max(0.1, 1.0 - armorReduction / (armorReduction + 50));

  // Evasion check
  if (Math.random() < defender.combat.evasion) {
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

  // Calculate raw damage
  const rawDamage = baseDamage * attacker.combat.attackPower;

  // Final damage calculation
  let finalDamage = Math.round(
    rawDamage * critMult * materialMult * distanceFalloff * armorMult * terrainResonance * variance
  );

  // Pierce ignores 30% armor
  if (damageType === DamageType.Pierce) {
    finalDamage = Math.round(finalDamage * 1.3);
  }

  // Arcane does 2x to shields
  let shieldAbsorbed = 0;
  if (defender.vitals.shield > 0) {
    const shieldDamage = damageType === DamageType.Arcane ? finalDamage * 2 : finalDamage;
    shieldAbsorbed = Math.min(defender.vitals.shield, shieldDamage);
    finalDamage = Math.max(0, finalDamage - defender.vitals.shield);
  }

  // Determine body part hit (angle-based targeting)
  const bodyPart = selectBodyPartHit(defender);
  const bodyPartDestroyed = bodyPart.intact && bodyPart.hp <= finalDamage;

  // Knockback (Impact type)
  const knockback: Vector2 = { x: 0, y: 0 };
  if (damageType === DamageType.Impact && attacker.position && defender.position) {
    const dx = defender.position.x - attacker.position.x;
    const dy = defender.position.y - attacker.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const knockbackForce = (finalDamage / 10) * (1 / defender.physical.mass);
    knockback.x = (dx / dist) * knockbackForce;
    knockback.y = (dy / dist) * knockbackForce;
  }

  // Status effects
  const statusEffects = getStatusEffects(damageType, finalDamage);

  // Check for kill
  const totalHpRemaining = defender.vitals.hp - finalDamage;
  const killedTarget = totalHpRemaining <= 0;

  return {
    rawDamage,
    finalDamage,
    isCrit,
    damageType,
    bodyPartHit: bodyPart.name,
    bodyPartDestroyed,
    knockback,
    statusEffects,
    shieldAbsorbed,
    overkillDamage: Math.abs(Math.min(0, totalHpRemaining)),
    killedTarget,
  };
}

// ── Body Part Targeting ───────────────────────────────────────

function selectBodyPartHit(defender: SoulEntity): BodyPart {
  const intactParts = defender.bodyParts.filter(p => p.intact);
  if (intactParts.length === 0) {
    return defender.bodyParts[1]; // Inner Core fallback
  }
  // Weighted random — outer shell more likely to be hit
  const weights = intactParts.map((p) => {
    switch (p.name) {
      case 'Outer Shell': return 40;
      case 'Propulsion Jet': return 25;
      case 'Eye Sensor': return 10;
      case 'Mana Channel': return 15;
      case 'Inner Core': return 10;
      default: return 20;
    }
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < intactParts.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return intactParts[i];
  }
  return intactParts[0];
}

// ── Status Effects by Damage Type ─────────────────────────────

function getStatusEffects(damageType: DamageType, damage: number): StatusEffect[] {
  const effects: StatusEffect[] = [];

  switch (damageType) {
    case DamageType.Fire:
      effects.push({
        id: `burn_${Date.now()}`,
        name: 'Burning',
        type: 'burn',
        duration: 4,
        tickDamage: Math.round(damage * 0.15),
        tickInterval: 1,
        modifier: {},
      });
      break;
    case DamageType.Ice:
      effects.push({
        id: `freeze_${Date.now()}`,
        name: 'Frozen',
        type: 'freeze',
        duration: 3,
        tickDamage: 0,
        tickInterval: 0,
        modifier: { speedMultiplier: 0.7 },
      });
      break;
    case DamageType.Electric:
      effects.push({
        id: `shock_${Date.now()}`,
        name: 'Shocked',
        type: 'shock',
        duration: 1.5,
        tickDamage: Math.round(damage * 0.1),
        tickInterval: 0.5,
        modifier: {},
      });
      break;
    case DamageType.Void:
      effects.push({
        id: `drain_${Date.now()}`,
        name: 'Mana Drain',
        type: 'mana_drain',
        duration: 3,
        tickDamage: 0,
        tickInterval: 1,
        modifier: { manaRegenMultiplier: 0 },
      });
      break;
    case DamageType.Psychic:
      effects.push({
        id: `confuse_${Date.now()}`,
        name: 'Confused',
        type: 'confusion',
        duration: 2,
        tickDamage: 0,
        tickInterval: 0,
        modifier: {},
      });
      break;
  }

  return effects;
}

// ── Ability Definitions per Class ─────────────────────────────

export interface ClassAbilitySet {
  className: string;
  abilities: {
    name: string;
    description: string;
    manaCost: number;
    cooldown: number;
    damageType: DamageType;
    baseDamage: number;
    range: number;
    aoeRadius?: number;
    duration?: number;
    isUltimate: boolean;
  }[];
}

export const CLASS_ABILITIES: ClassAbilitySet[] = [
  {
    className: 'Soldier',
    abilities: [
      { name: 'Frag Grenade', description: 'Throw explosive grenade, AoE damage', manaCost: 20, cooldown: 6, damageType: DamageType.Fire, baseDamage: 35, range: 6, aoeRadius: 3, isUltimate: false },
      { name: 'Burst Fire', description: 'Rapid 3-shot burst, high accuracy', manaCost: 15, cooldown: 4, damageType: DamageType.Pierce, baseDamage: 25, range: 10, isUltimate: false },
      { name: 'Combat Roll', description: 'Dodge roll with brief invulnerability', manaCost: 10, cooldown: 5, damageType: DamageType.Impact, baseDamage: 0, range: 3, isUltimate: false },
      { name: 'Airstrike', description: 'Call in devastating bombardment on area', manaCost: 100, cooldown: 90, damageType: DamageType.Fire, baseDamage: 80, range: 8, aoeRadius: 6, isUltimate: true },
    ],
  },
  {
    className: 'Hitman',
    abilities: [
      { name: 'Silenced Shot', description: 'High-damage stealth shot, no aggro', manaCost: 20, cooldown: 8, damageType: DamageType.Pierce, baseDamage: 50, range: 12, isUltimate: false },
      { name: 'Smoke Bomb', description: 'Create vision-blocking cloud, go stealth', manaCost: 25, cooldown: 12, damageType: DamageType.Void, baseDamage: 0, range: 4, aoeRadius: 4, duration: 5, isUltimate: false },
      { name: 'Marked for Death', description: 'Mark target, next hit deals 2x damage', manaCost: 15, cooldown: 10, damageType: DamageType.Psychic, baseDamage: 0, range: 10, duration: 8, isUltimate: false },
      { name: 'Execute', description: 'Instant kill targets below 20% HP', manaCost: 100, cooldown: 90, damageType: DamageType.Pierce, baseDamage: 999, range: 5, isUltimate: true },
    ],
  },
  {
    className: 'Robot',
    abilities: [
      { name: 'Shield Matrix', description: 'Deploy energy shield absorbing damage', manaCost: 25, cooldown: 10, damageType: DamageType.Electric, baseDamage: 0, range: 3, duration: 5, isUltimate: false },
      { name: 'Laser Beam', description: 'Continuous beam, increasing damage', manaCost: 30, cooldown: 14, damageType: DamageType.Electric, baseDamage: 15, range: 8, duration: 3, isUltimate: false },
      { name: 'Deploy Turret', description: 'Auto-attacking turret, limited duration', manaCost: 30, cooldown: 20, damageType: DamageType.Pierce, baseDamage: 12, range: 8, duration: 30, isUltimate: false },
      { name: 'Overload', description: 'EMP blast — stun all enemies in range', manaCost: 100, cooldown: 90, damageType: DamageType.Electric, baseDamage: 40, range: 0, aoeRadius: 8, isUltimate: true },
    ],
  },
  {
    className: 'Survivor',
    abilities: [
      { name: 'Bandage', description: 'Heal self for 40 HP over 4s', manaCost: 15, cooldown: 8, damageType: DamageType.Arcane, baseDamage: -40, range: 0, duration: 4, isUltimate: false },
      { name: 'Trap Mine', description: 'Place invisible proximity mine', manaCost: 20, cooldown: 10, damageType: DamageType.Fire, baseDamage: 35, range: 4, isUltimate: false },
      { name: 'Scavenge', description: 'Find ammo/supplies from defeated enemies', manaCost: 10, cooldown: 6, damageType: DamageType.Impact, baseDamage: 0, range: 3, isUltimate: false },
      { name: 'Last Stand', description: 'When below 25% HP: +100% damage, +50% speed', manaCost: 100, cooldown: 90, damageType: DamageType.Impact, baseDamage: 0, range: 0, duration: 10, isUltimate: true },
    ],
  },
  {
    className: 'Scout',
    abilities: [
      { name: 'Sprint', description: '+60% movement speed for 5s', manaCost: 15, cooldown: 8, damageType: DamageType.Impact, baseDamage: 0, range: 0, duration: 5, isUltimate: false },
      { name: 'Flashbang', description: 'Blind and slow enemies in area', manaCost: 20, cooldown: 12, damageType: DamageType.Electric, baseDamage: 5, range: 5, aoeRadius: 4, duration: 3, isUltimate: false },
      { name: 'Recon Drone', description: 'Reveal all enemies on minimap for 8s', manaCost: 25, cooldown: 16, damageType: DamageType.Psychic, baseDamage: 0, range: 999, duration: 8, isUltimate: false },
      { name: 'Rapid Assault', description: 'Fire rate x3 for 6 seconds', manaCost: 100, cooldown: 90, damageType: DamageType.Pierce, baseDamage: 0, range: 0, duration: 6, isUltimate: true },
    ],
  },
];

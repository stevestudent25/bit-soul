// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Soul Factory: Create Souls for Each Class
// ═══════════════════════════════════════════════════════════════

import {
  type SoulEntity,
  type SoulPersonality,
  type SoulMutation,
  type Ability,
  SoulClass,
  SurfaceMaterial,
  AttackType,
  EmotionalState,
  createDefaultBodyParts,
} from '../types/SoulEntity';
import { CLASS_ABILITIES } from '../types/Combat';

// ── Seeded RNG ────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Name Generator ────────────────────────────────────────────

const NAME_PREFIXES = [
  'Zyx', 'Kael', 'Mira', 'Thex', 'Vorn', 'Orix', 'Nael', 'Pyra', 'Quix',
  'Drex', 'Lyra', 'Sven', 'Thal', 'Ixen', 'Rune', 'Volt', 'Cryo', 'Nova',
  'Hex', 'Flux', 'Grim', 'Ash', 'Ember', 'Frost', 'Void', 'Blaze', 'Storm',
];

const NAME_SUFFIXES = [
  'the Bold', 'the Volatile', 'Flameheart', 'Voidwalker', 'Ironshell',
  'Swiftdrift', 'Shadowmeld', 'Crystalborn', 'the Unyielding', 'Stormcaller',
  'the Silent', 'Duskweaver', 'the Radiant', 'Frostborne', 'the Cunning',
  'Embertouched', 'the Relentless', 'Arcwright', 'the Fierce', 'Neonspark',
];

export function generateSoulName(rng: () => number): string {
  const prefix = NAME_PREFIXES[Math.floor(rng() * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(rng() * NAME_SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}

// ── Personality Generator ─────────────────────────────────────

export function generatePersonality(rng: () => number): SoulPersonality {
  return {
    aggression: parseFloat(rng().toFixed(2)),
    loyalty: parseFloat(rng().toFixed(2)),
    curiosity: parseFloat(rng().toFixed(2)),
    greed: parseFloat(rng().toFixed(2)),
    courage: parseFloat(rng().toFixed(2)),
    social: parseFloat(rng().toFixed(2)),
    patience: parseFloat(rng().toFixed(2)),
    creativity: parseFloat(rng().toFixed(2)),
  };
}

// ── Mutation Definitions ──────────────────────────────────────

export const MUTATION_POOL: SoulMutation[] = [
  {
    id: 'volatile_core',
    name: 'Volatile Core',
    description: 'Explode on death dealing AoE damage',
    statModifiers: {},
    specialEffect: 'death_explosion',
  },
  {
    id: 'magnetic_shell',
    name: 'Magnetic Shell',
    description: 'Attract nearby projectiles (risk/reward)',
    statModifiers: { armor: 5 },
    specialEffect: 'attract_projectiles',
  },
  {
    id: 'phase_drift',
    name: 'Phase Drift',
    description: '5% chance to phase through walls',
    statModifiers: {},
    specialEffect: 'wall_phase_5pct',
  },
  {
    id: 'echo_split',
    name: 'Echo Split',
    description: 'On dash, leave a decoy clone behind',
    statModifiers: {},
    specialEffect: 'dash_clone',
  },
  {
    id: 'mana_leech',
    name: 'Mana Leech',
    description: 'Attacks steal mana but deal 20% less damage',
    statModifiers: { attackPower: -0.2 },
    specialEffect: 'mana_steal',
  },
  {
    id: 'glass_cannon',
    name: 'Glass Cannon Core',
    description: '+50% damage, -50% HP permanently',
    statModifiers: { attackPower: 0.5 },
    specialEffect: 'hp_halved',
  },
  {
    id: 'thermal_runaway',
    name: 'Thermal Runaway',
    description: 'Gradually heat up, explode if not cooled',
    statModifiers: {},
    specialEffect: 'heat_buildup',
  },
  {
    id: 'void_touched',
    name: 'Void Touched',
    description: 'Invisible in shadows, take 2x light damage',
    statModifiers: {},
    specialEffect: 'shadow_stealth',
  },
  {
    id: 'crystalline_armor',
    name: 'Crystalline Armor',
    description: '+30% armor, but take 20% more impact damage',
    statModifiers: { armor: 15 },
    specialEffect: 'impact_weakness',
  },
  {
    id: 'overcharged',
    name: 'Overcharged',
    description: 'Abilities cost 50% less mana but cooldowns +30%',
    statModifiers: {},
    specialEffect: 'cheap_abilities',
  },
];

// ── Class Base Stats ──────────────────────────────────────────

interface ClassTemplate {
  physical: {
    mass: number;
    radius: number;
    density: number;
    elasticity: number;
    surfaceMaterial: SurfaceMaterial;
    luminosity: number;
    colorPrimary: string;
    colorSecondary: string;
    colorTrail: string;
  };
  vitals: {
    hpMax: number;
    hpRegen: number;
    shieldMax: number;
    shieldRegen: number;
    manaMax: number;
    manaRegen: number;
    staminaMax: number;
  };
  movement: {
    speedBase: number;
    acceleration: number;
    friction: number;
    dashChargesMax: number;
    dashCooldown: number;
  };
  combat: {
    attackPower: number;
    attackSpeed: number;
    attackRange: number;
    attackType: AttackType;
    critChance: number;
    critMultiplier: number;
    armor: number;
    evasion: number;
  };
}

const CLASS_TEMPLATES: Record<SoulClass, ClassTemplate & { sprite: string }> = {
  [SoulClass.Soldier]: {
    sprite: 'soldier1',
    physical: {
      mass: 1.0, radius: 14, density: 0.9, elasticity: 0.4,
      surfaceMaterial: SurfaceMaterial.Metal,
      luminosity: 0.3, colorPrimary: '#22c55e', colorSecondary: '#16a34a', colorTrail: '#4ade80',
    },
    vitals: {
      hpMax: 120, hpRegen: 2, shieldMax: 30, shieldRegen: 1,
      manaMax: 80, manaRegen: 2, staminaMax: 100,
    },
    movement: {
      speedBase: 4.5, acceleration: 10, friction: 0.85, dashChargesMax: 2, dashCooldown: 5,
    },
    combat: {
      attackPower: 1.2, attackSpeed: 1.2, attackRange: 7, attackType: AttackType.Ranged,
      critChance: 0.10, critMultiplier: 1.8, armor: 20, evasion: 0.05,
    },
  },
  [SoulClass.Hitman]: {
    sprite: 'hitman1',
    physical: {
      mass: 0.7, radius: 13, density: 0.7, elasticity: 0.6,
      surfaceMaterial: SurfaceMaterial.Void,
      luminosity: 0.2, colorPrimary: '#ef4444', colorSecondary: '#dc2626', colorTrail: '#f87171',
    },
    vitals: {
      hpMax: 75, hpRegen: 1.5, shieldMax: 15, shieldRegen: 0.5,
      manaMax: 100, manaRegen: 3, staminaMax: 120,
    },
    movement: {
      speedBase: 5.5, acceleration: 13, friction: 0.8, dashChargesMax: 3, dashCooldown: 3,
    },
    combat: {
      attackPower: 1.8, attackSpeed: 0.9, attackRange: 10, attackType: AttackType.Ranged,
      critChance: 0.25, critMultiplier: 2.5, armor: 8, evasion: 0.18,
    },
  },
  [SoulClass.Robot]: {
    sprite: 'robot1',
    physical: {
      mass: 1.5, radius: 16, density: 1.2, elasticity: 0.3,
      surfaceMaterial: SurfaceMaterial.Metal,
      luminosity: 0.5, colorPrimary: '#3b82f6', colorSecondary: '#2563eb', colorTrail: '#60a5fa',
    },
    vitals: {
      hpMax: 160, hpRegen: 1, shieldMax: 80, shieldRegen: 2,
      manaMax: 120, manaRegen: 3, staminaMax: 80,
    },
    movement: {
      speedBase: 3.5, acceleration: 8, friction: 0.9, dashChargesMax: 1, dashCooldown: 7,
    },
    combat: {
      attackPower: 1.0, attackSpeed: 0.8, attackRange: 6, attackType: AttackType.Ranged,
      critChance: 0.05, critMultiplier: 1.5, armor: 40, evasion: 0.03,
    },
  },
  [SoulClass.Survivor]: {
    sprite: 'survivor1',
    physical: {
      mass: 0.8, radius: 13, density: 0.7, elasticity: 0.5,
      surfaceMaterial: SurfaceMaterial.Stone,
      luminosity: 0.3, colorPrimary: '#f59e0b', colorSecondary: '#d97706', colorTrail: '#fbbf24',
    },
    vitals: {
      hpMax: 100, hpRegen: 3, shieldMax: 20, shieldRegen: 1,
      manaMax: 70, manaRegen: 2, staminaMax: 110,
    },
    movement: {
      speedBase: 5.0, acceleration: 11, friction: 0.85, dashChargesMax: 2, dashCooldown: 4,
    },
    combat: {
      attackPower: 1.0, attackSpeed: 1.1, attackRange: 5, attackType: AttackType.Ranged,
      critChance: 0.12, critMultiplier: 1.8, armor: 15, evasion: 0.10,
    },
  },
  [SoulClass.Scout]: {
    sprite: 'womanGreen',
    physical: {
      mass: 0.5, radius: 12, density: 0.5, elasticity: 0.8,
      surfaceMaterial: SurfaceMaterial.Crystal,
      luminosity: 0.4, colorPrimary: '#a855f7', colorSecondary: '#7c3aed', colorTrail: '#c084fc',
    },
    vitals: {
      hpMax: 70, hpRegen: 2, shieldMax: 10, shieldRegen: 0.5,
      manaMax: 90, manaRegen: 3, staminaMax: 140,
    },
    movement: {
      speedBase: 7.0, acceleration: 15, friction: 0.7, dashChargesMax: 3, dashCooldown: 3,
    },
    combat: {
      attackPower: 0.8, attackSpeed: 1.5, attackRange: 8, attackType: AttackType.Ranged,
      critChance: 0.15, critMultiplier: 2.0, armor: 5, evasion: 0.22,
    },
  },
};

// ── Soul Factory ───────────────────────────────────────────────

let soulIdCounter = 0;

export function createSoul(
  soulClass: SoulClass,
  teamId: string,
  position: { x: number; y: number },
  seed?: number,
): SoulEntity {
  const rng = seededRandom(seed ?? Date.now() + soulIdCounter++);
  const template = CLASS_TEMPLATES[soulClass];

  const classAbilitySet = CLASS_ABILITIES.find(c => c.className === soulClass);
  const abilities: Ability[] = (classAbilitySet?.abilities ?? []).map((a, i) => ({
    id: `ability_${soulClass}_${i}`,
    ...a,
    cooldownRemaining: 0,
  }));

  return {
    id: `soul_${soulIdCounter++}_${Math.floor(rng() * 99999)}`,
    name: generateSoulName(rng),
    class: soulClass,
    level: 1,
    xp: 0,
    teamId,

    position: { ...position },
    velocity: { x: 0, y: 0 },
    facing: { x: 1, y: 0 },

    physical: {
      ...template.physical,
      temperature: 20,
    },
    vitals: {
      hp: template.vitals.hpMax,
      hpMax: template.vitals.hpMax,
      hpRegen: template.vitals.hpRegen,
      shield: template.vitals.shieldMax,
      shieldMax: template.vitals.shieldMax,
      shieldRegen: template.vitals.shieldRegen,
      mana: template.vitals.manaMax,
      manaMax: template.vitals.manaMax,
      manaRegen: template.vitals.manaRegen,
      stamina: template.vitals.staminaMax,
      staminaMax: template.vitals.staminaMax,
    },
    movement: {
      speedBase: template.movement.speedBase,
      speedCurrent: template.movement.speedBase,
      acceleration: template.movement.acceleration,
      friction: template.movement.friction,
      dashCharges: template.movement.dashChargesMax,
      dashChargesMax: template.movement.dashChargesMax,
      dashCooldown: template.movement.dashCooldown,
    },
    combat: { ...template.combat },

    personality: generatePersonality(rng),
    emotionalState: EmotionalState.Calm,
    memories: [],
    relationships: [],
    bodyParts: createDefaultBodyParts(),
    mutations: [],
    abilities,

    isAlive: true,
    isCarryingFlag: false,
    isStealthed: false,
    isShielded: false,
    sprite: template.sprite,
    kills: 0,
    gold: 0,
    inventory: [],
    currentFloor: 1,
    roomsExplored: 0,
    corruptionLevel: 0,
    flagCorruptionTimer: 0,
  };
}

// ── Mutation Application ──────────────────────────────────────

export function applyMutation(soul: SoulEntity, mutation: SoulMutation): SoulEntity {
  const updated = { ...soul };
  updated.mutations = [...updated.mutations, mutation];

  // Apply stat modifiers
  if (mutation.statModifiers.attackPower) {
    updated.combat = {
      ...updated.combat,
      attackPower: updated.combat.attackPower + mutation.statModifiers.attackPower,
    };
  }
  if (mutation.statModifiers.armor) {
    updated.combat = {
      ...updated.combat,
      armor: updated.combat.armor + mutation.statModifiers.armor,
    };
  }

  // Special effects
  if (mutation.specialEffect === 'hp_halved') {
    updated.vitals = {
      ...updated.vitals,
      hpMax: Math.round(updated.vitals.hpMax * 0.5),
      hp: Math.min(updated.vitals.hp, Math.round(updated.vitals.hpMax * 0.5)),
    };
  }

  return updated;
}

export function getRandomMutation(rng: () => number, existingMutations: SoulMutation[]): SoulMutation | null {
  const available = MUTATION_POOL.filter(m => !existingMutations.some(e => e.id === m.id));
  if (available.length === 0) return null;
  return available[Math.floor(rng() * available.length)];
}

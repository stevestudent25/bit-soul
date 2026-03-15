// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Item Color System
// Comprehensive color lookup for items, gold, chests, and loot
// ═══════════════════════════════════════════════════════════════

import type { ItemDef } from './ItemDatabase';

export interface ItemColors {
  spriteTint: string;     // hex color for canvas tinting
  glowColor: string;      // glow circle color
  borderColor: string;    // inventory slot border
  pickupTextColor: string; // floating pickup text
}

export interface ChestColors {
  spriteTint: string;
  glowColor: string;
  glowAlpha: number;
  glowRadius: number;
  sparkleColor: string;
  nameColor: string;
  outlineColor: string;
  animated?: boolean;
}

// ── Rarity Colors ───────────────────────────────────────────

const RARITY_TEXT_COLORS: Record<string, string> = {
  common: '#999999',
  uncommon: '#44CC44',
  rare: '#4488FF',
  epic: '#BB44FF',
  legendary: '#FFAA00',
  mythic: '#FF4488',
  unique: '#44FFDD',
};

const RARITY_BORDER_COLORS: Record<string, string> = {
  common: '#666666',
  uncommon: '#338833',
  rare: '#3366CC',
  epic: '#8833CC',
  legendary: '#CC8800',
  mythic: '#CC3366',
  unique: '#33CCAA',
};

const RARITY_GLOW_COLORS: Record<string, string> = {
  common: '#888888',
  uncommon: '#44CC44',
  rare: '#4488FF',
  epic: '#BB44FF',
  legendary: '#FFAA00',
  mythic: '#FF4488',
  unique: '#44FFDD',
};

// ── Item Name → Color Lookup ────────────────────────────────

const ITEM_COLOR_MAP: Record<string, string> = {
  // Gold / Currency
  gold_coin: '#CCAA00',
  gold_pile: '#DDBB00',
  gold_bar: '#EECC00',
  gold_nugget: '#FFCC33',
  gem: '#22CC44',
  ruby: '#FF2244',
  sapphire: '#2266FF',
  emerald: '#22CC44',
  diamond: '#EEEEFF',
  amethyst: '#AA44FF',
  topaz: '#FFAA22',

  // Potions
  health_potion: '#FF3344',
  large_health_potion: '#FF2233',
  mana_potion: '#4466FF',
  stamina_flask: '#FFAA00',
  shield_orb: '#44CCFF',
  speed_scroll: '#22AAFF',
  antidote: '#44DD44',
  fire_resist_potion: '#FF5500',
  invisibility_potion: '#AABBCC',

  // Food
  bread: '#CC9944',
  meat: '#AA4422',
  cooked_meat: '#AA4422',
  apple: '#FF4444',
  fish: '#66AACC',
  mushroom: '#BB8844',
  herb: '#44AA44',

  // Ammo
  ammo_pack: '#CCBB77',
  pistol_ammo: '#CCBB77',
  shotgun_shells: '#CC4444',
  rifle_rounds: '#77AA77',
  arrows: '#996633',

  // Weapons – Swords & Melee
  iron_sword: '#AABBCC',
  steel_dagger: '#BBCCDD',
  battle_axe: '#889999',
  war_hammer: '#99AABB',
  void_spear: '#7744CC',
  legendary_longsword: '#FFDD44',
  hunting_bow: '#996633',
  arcane_staff: '#8866FF',
  rusty_sword: '#887766',
  silver_sword: '#CCDDEE',
  gold_sword: '#FFDD44',
  fire_blade: '#FF6622',
  ice_blade: '#88DDFF',
  poison_dagger: '#44CC44',
  shadow_blade: '#7744CC',
  holy_sword: '#FFFFAA',

  // Armor
  leather_vest: '#8B6914',
  chainmail: '#99AABB',
  iron_plate: '#778899',
  dragon_armor: '#CC4422',
  cloth_robe: '#886688',

  // Shields
  curved_shield: '#99AABB',
  tower_shield: '#778899',
  wooden_shield: '#996633',

  // Accessories
  speed_ring: '#44DDEE',
  lucky_charm: '#FFDD44',
  magic_ring: '#BB44FF',
  defense_amulet: '#8888CC',

  // Key Items
  dungeon_key: '#FFDD44',
  boss_key: '#FF8844',
  treasure_map: '#CCAA66',

  // Materials
  iron_scrap: '#888899',
  crystal_shard: '#44DDEE',
  void_essence: '#AA66FF',
  ember_dust: '#CC6622',
  silver_ore: '#BBCCDD',
  gold_nugget_mat: '#FFCC33',
  dragon_scale: '#CC5533',
  bone: '#CCCCBB',
};

// ── Category → Fallback Color ───────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  consumable: '#FF6644',
  weapon: '#AABBCC',
  armor: '#778899',
  accessory: '#BB88FF',
  material: '#888899',
  currency: '#DDBB00',
  key: '#FFDD44',
  ammo: '#CCBB77',
};

// ── Gold Tier Colors ────────────────────────────────────────

export interface GoldTierColors {
  tint: string;
  glow: string;
  glowRadius: number;
  textColor: string;
  textSize: string;
}

export function getGoldTierColors(amount: number): GoldTierColors {
  if (amount >= 100) return { tint: '#FFDD22', glow: '#FFDD22', glowRadius: 14, textColor: '#FFEE44', textSize: 'bold 15px monospace' };
  if (amount >= 50)  return { tint: '#FFD700', glow: '#FFD700', glowRadius: 12, textColor: '#FFD700', textSize: 'bold 14px monospace' };
  if (amount >= 25)  return { tint: '#EECC00', glow: '#EECC00', glowRadius: 10, textColor: '#EECC00', textSize: 'bold 13px monospace' };
  if (amount >= 10)  return { tint: '#DDBB00', glow: '#DDBB00', glowRadius: 8,  textColor: '#DDBB00', textSize: 'bold 13px monospace' };
  if (amount >= 5)   return { tint: '#CCAA00', glow: '#CCAA00', glowRadius: 6,  textColor: '#CCAA00', textSize: '13px monospace' };
  return               { tint: '#BBAA00', glow: '#BBAA00', glowRadius: 4,  textColor: '#BBAA00', textSize: '12px monospace' };
}

// ── Chest Colors ────────────────────────────────────────────

export const CHEST_COLORS: Record<string, ChestColors> = {
  small: {
    spriteTint: '#BB9944',
    glowColor: '#AA8833',
    glowAlpha: 0.12,
    glowRadius: 12,
    sparkleColor: '#CCAA44',
    nameColor: '#bb9944',
    outlineColor: '#886622',
  },
  large: {
    spriteTint: '#DDBB33',
    glowColor: '#CCAA22',
    glowAlpha: 0.15,
    glowRadius: 16,
    sparkleColor: '#DDCC44',
    nameColor: '#ddbb33',
    outlineColor: '#AA8822',
  },
  locked: {
    spriteTint: '#AA8833',
    glowColor: '#887722',
    glowAlpha: 0.1,
    glowRadius: 10,
    sparkleColor: '#BB9933',
    nameColor: '#aa8833',
    outlineColor: '#776622',
  },
  boss: {
    spriteTint: '#FFDD00',
    glowColor: '#FFCC00',
    glowAlpha: 0.25,
    glowRadius: 24,
    sparkleColor: '#FFEE44',
    nameColor: '#ffdd00',
    outlineColor: '#CCAA00',
    animated: true,
  },
  rare: {
    spriteTint: '#EEDD55',
    glowColor: '#4488FF',
    glowAlpha: 0.18,
    glowRadius: 18,
    sparkleColor: '#88BBFF',
    nameColor: '#eedd55',
    outlineColor: '#BBAA33',
  },
  mimic: {
    spriteTint: '#CC8833',
    glowColor: '#CC4444',
    glowAlpha: 0.08,
    glowRadius: 10,
    sparkleColor: '#CC5555',
    nameColor: '#cc8833',
    outlineColor: '#AA6622',
  },
};

// ── Main Color Lookup ───────────────────────────────────────

export function getItemColors(item: ItemDef): ItemColors {
  // 1. Check exact item ID match
  const tint = ITEM_COLOR_MAP[item.id] || CATEGORY_COLORS[item.category] || '#AAAAAA';
  const rarity = item.rarity || 'common';

  return {
    spriteTint: tint,
    glowColor: RARITY_GLOW_COLORS[rarity] || '#888888',
    borderColor: RARITY_BORDER_COLORS[rarity] || '#666666',
    pickupTextColor: RARITY_TEXT_COLORS[rarity] || '#999999',
  };
}

export function getRarityTextColor(rarity: string): string {
  return RARITY_TEXT_COLORS[rarity] || '#999999';
}

export function getRarityBorderColor(rarity: string): string {
  return RARITY_BORDER_COLORS[rarity] || '#666666';
}

// ── Color Utilities ─────────────────────────────────────────

/** Parse hex color to RGB components */
function parseHex(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

/** Convert RGB to hex string */
function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

/** Brighten a hex color by amount (0-255) */
export function brighten(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  return toHex(r + amount, g + amount, b + amount);
}

/** Darken a hex color by amount (0-255) */
export function darken(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  return toHex(r - amount, g - amount, b - amount);
}

/** Get a tint overlay color with alpha for canvas compositing */
export function getTintOverlay(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

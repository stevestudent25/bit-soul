// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Item Database & Loot Tables
// ═══════════════════════════════════════════════════════════════

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemCategory = 'consumable' | 'weapon' | 'armor' | 'accessory' | 'material' | 'currency' | 'key' | 'ammo';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  description: string;
  sprite: string;           // path under /assets/
  stackable: boolean;
  maxStack: number;
  // Effects when used/equipped
  effects?: {
    healHp?: number;
    healMana?: number;
    healStamina?: number;
    healShield?: number;
    speedBoost?: number;     // multiplier, duration in frames
    speedDuration?: number;
    attackBoost?: number;
    defenseBoost?: number;
    goldValue?: number;
  };
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#aaaaaa',
  uncommon: '#44ff44',
  rare: '#4488ff',
  epic: '#aa44ff',
  legendary: '#ffaa00',
};

export const RARITY_GLOW: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 4,
  rare: 8,
  epic: 12,
  legendary: 18,
};

// ── Core Items ──────────────────────────────────────────

export const ITEMS: Record<string, ItemDef> = {
  // ─── Consumables ────────────────────────────────
  health_potion: {
    id: 'health_potion', name: 'Health Potion', category: 'consumable', rarity: 'common',
    description: 'Restores 30 HP', sprite: 'loot/genericItem_color_001.png',
    stackable: true, maxStack: 10,
    effects: { healHp: 30 },
  },
  large_health_potion: {
    id: 'large_health_potion', name: 'Large Health Potion', category: 'consumable', rarity: 'uncommon',
    description: 'Restores 60 HP', sprite: 'loot/genericItem_color_002.png',
    stackable: true, maxStack: 5,
    effects: { healHp: 60 },
  },
  mana_potion: {
    id: 'mana_potion', name: 'Mana Potion', category: 'consumable', rarity: 'common',
    description: 'Restores 25 Mana', sprite: 'loot/genericItem_color_003.png',
    stackable: true, maxStack: 10,
    effects: { healMana: 25 },
  },
  stamina_flask: {
    id: 'stamina_flask', name: 'Stamina Flask', category: 'consumable', rarity: 'common',
    description: 'Restores 40 Stamina', sprite: 'loot/genericItem_color_004.png',
    stackable: true, maxStack: 10,
    effects: { healStamina: 40 },
  },
  shield_orb: {
    id: 'shield_orb', name: 'Shield Orb', category: 'consumable', rarity: 'uncommon',
    description: 'Grants 30 Shield', sprite: 'loot/genericItem_color_005.png',
    stackable: true, maxStack: 5,
    effects: { healShield: 30 },
  },
  speed_scroll: {
    id: 'speed_scroll', name: 'Speed Scroll', category: 'consumable', rarity: 'rare',
    description: 'x1.5 speed for 10 seconds', sprite: 'loot/genericItem_color_006.png',
    stackable: true, maxStack: 3,
    effects: { speedBoost: 1.5, speedDuration: 600 },
  },
  bread: {
    id: 'bread', name: 'Bread', category: 'consumable', rarity: 'common',
    description: 'Restores 15 HP', sprite: 'loot/genericItem_color_007.png',
    stackable: true, maxStack: 20,
    effects: { healHp: 15 },
  },
  meat: {
    id: 'meat', name: 'Cooked Meat', category: 'consumable', rarity: 'uncommon',
    description: 'Restores 40 HP', sprite: 'loot/genericItem_color_008.png',
    stackable: true, maxStack: 10,
    effects: { healHp: 40 },
  },

  // ─── Weapons (loot drop versions) ──────────────
  iron_sword: {
    id: 'iron_sword', name: 'Iron Sword', category: 'weapon', rarity: 'common',
    description: '+5 Attack', sprite: 'loot/sd_item_weapon_sword.png',
    stackable: false, maxStack: 1,
    effects: { attackBoost: 5 },
  },
  steel_dagger: {
    id: 'steel_dagger', name: 'Steel Dagger', category: 'weapon', rarity: 'common',
    description: '+3 Attack, fast strikes', sprite: 'loot/sd_item_weapon_dagger.png',
    stackable: false, maxStack: 1,
    effects: { attackBoost: 3 },
  },
  battle_axe: {
    id: 'battle_axe', name: 'Battle Axe', category: 'weapon', rarity: 'uncommon',
    description: '+8 Attack', sprite: 'loot/sd_item_weapon_axe.png',
    stackable: false, maxStack: 1,
    effects: { attackBoost: 8 },
  },
  war_hammer: {
    id: 'war_hammer', name: 'War Hammer', category: 'weapon', rarity: 'rare',
    description: '+12 Attack', sprite: 'loot/sd_item_weapon_hammer.png',
    stackable: false, maxStack: 1,
    effects: { attackBoost: 12 },
  },
  void_spear: {
    id: 'void_spear', name: 'Void Spear', category: 'weapon', rarity: 'epic',
    description: '+16 Attack, void-infused', sprite: 'loot/sd_item_weapon_spear.png',
    stackable: false, maxStack: 1,
    effects: { attackBoost: 16 },
  },
  legendary_longsword: {
    id: 'legendary_longsword', name: 'Soul Reaper', category: 'weapon', rarity: 'legendary',
    description: '+25 Attack, heals on kill', sprite: 'loot/sd_item_weapon_longsword.png',
    stackable: false, maxStack: 1,
    effects: { attackBoost: 25 },
  },
  hunting_bow: {
    id: 'hunting_bow', name: 'Hunting Bow', category: 'weapon', rarity: 'uncommon',
    description: '+6 Attack, ranged', sprite: 'loot/sd_item_weapon_bow.png',
    stackable: false, maxStack: 1,
    effects: { attackBoost: 6 },
  },
  arcane_staff: {
    id: 'arcane_staff', name: 'Arcane Staff', category: 'weapon', rarity: 'rare',
    description: '+10 Attack, magic empowered', sprite: 'loot/sd_item_weapon_staff.png',
    stackable: false, maxStack: 1,
    effects: { attackBoost: 10 },
  },

  // ─── Armor ─────────────────────────────────────
  leather_vest: {
    id: 'leather_vest', name: 'Leather Vest', category: 'armor', rarity: 'common',
    description: '+3 Defense', sprite: 'loot/genericItem_color_009.png',
    stackable: false, maxStack: 1,
    effects: { defenseBoost: 3 },
  },
  chainmail: {
    id: 'chainmail', name: 'Chainmail', category: 'armor', rarity: 'uncommon',
    description: '+6 Defense', sprite: 'loot/genericItem_color_010.png',
    stackable: false, maxStack: 1,
    effects: { defenseBoost: 6 },
  },
  iron_plate: {
    id: 'iron_plate', name: 'Iron Plate', category: 'armor', rarity: 'rare',
    description: '+10 Defense', sprite: 'loot/genericItem_color_011.png',
    stackable: false, maxStack: 1,
    effects: { defenseBoost: 10 },
  },
  curved_shield: {
    id: 'curved_shield', name: 'Curved Shield', category: 'armor', rarity: 'uncommon',
    description: '+15 Max Shield', sprite: 'loot/sd_item_shield_curved.png',
    stackable: false, maxStack: 1,
    effects: { healShield: 15, defenseBoost: 4 },
  },
  tower_shield: {
    id: 'tower_shield', name: 'Tower Shield', category: 'armor', rarity: 'rare',
    description: '+25 Max Shield', sprite: 'loot/sd_item_shield_straight.png',
    stackable: false, maxStack: 1,
    effects: { healShield: 25, defenseBoost: 7 },
  },

  // ─── Accessories ───────────────────────────────
  speed_ring: {
    id: 'speed_ring', name: 'Speed Ring', category: 'accessory', rarity: 'rare',
    description: '+10% movement speed', sprite: 'loot/genericItem_color_012.png',
    stackable: false, maxStack: 1,
    effects: { speedBoost: 1.1, speedDuration: -1 },
  },
  lucky_charm: {
    id: 'lucky_charm', name: 'Lucky Charm', category: 'accessory', rarity: 'epic',
    description: 'Better loot drops', sprite: 'loot/genericItem_color_013.png',
    stackable: false, maxStack: 1,
  },

  // ─── Materials ─────────────────────────────────
  iron_scrap: {
    id: 'iron_scrap', name: 'Iron Scrap', category: 'material', rarity: 'common',
    description: 'Crafting material', sprite: 'loot/genericItem_color_014.png',
    stackable: true, maxStack: 50,
    effects: { goldValue: 2 },
  },
  crystal_shard: {
    id: 'crystal_shard', name: 'Crystal Shard', category: 'material', rarity: 'uncommon',
    description: 'Glowing crystal fragment', sprite: 'loot/genericItem_color_015.png',
    stackable: true, maxStack: 50,
    effects: { goldValue: 5 },
  },
  void_essence: {
    id: 'void_essence', name: 'Void Essence', category: 'material', rarity: 'rare',
    description: 'Essence from the void', sprite: 'loot/genericItem_color_016.png',
    stackable: true, maxStack: 20,
    effects: { goldValue: 15 },
  },
  ember_dust: {
    id: 'ember_dust', name: 'Ember Dust', category: 'material', rarity: 'uncommon',
    description: 'Smoldering powder', sprite: 'loot/genericItem_color_017.png',
    stackable: true, maxStack: 50,
    effects: { goldValue: 4 },
  },

  // ─── Currency ──────────────────────────────────
  gold_coin: {
    id: 'gold_coin', name: 'Gold Coin', category: 'currency', rarity: 'common',
    description: 'Standard currency', sprite: 'loot/genericItem_color_018.png',
    stackable: true, maxStack: 999,
    effects: { goldValue: 1 },
  },
  gold_pile: {
    id: 'gold_pile', name: 'Gold Pile', category: 'currency', rarity: 'uncommon',
    description: '5 gold coins', sprite: 'loot/genericItem_color_019.png',
    stackable: true, maxStack: 999,
    effects: { goldValue: 5 },
  },
  gem: {
    id: 'gem', name: 'Gem', category: 'currency', rarity: 'rare',
    description: 'Worth 25 gold', sprite: 'loot/genericItem_color_020.png',
    stackable: true, maxStack: 99,
    effects: { goldValue: 25 },
  },

  // ─── Key Items ─────────────────────────────────
  dungeon_key: {
    id: 'dungeon_key', name: 'Dungeon Key', category: 'key', rarity: 'rare',
    description: 'Opens locked chests', sprite: 'loot/genericItem_color_021.png',
    stackable: true, maxStack: 5,
  },

  // ─── Ammo ──────────────────────────────────────
  ammo_pack: {
    id: 'ammo_pack', name: 'Ammo Pack', category: 'ammo', rarity: 'common',
    description: 'Refills one magazine', sprite: 'loot/genericItem_color_022.png',
    stackable: true, maxStack: 10,
  },
};

// ── Loot Tables ─────────────────────────────────────────

export interface LootEntry {
  itemId: string;
  weight: number;       // higher = more likely
  minCount: number;
  maxCount: number;
}

// What breakable objects drop
export const BREAKABLE_LOOT: LootEntry[] = [
  { itemId: 'gold_coin', weight: 40, minCount: 1, maxCount: 5 },
  { itemId: 'health_potion', weight: 15, minCount: 1, maxCount: 1 },
  { itemId: 'ammo_pack', weight: 12, minCount: 1, maxCount: 1 },
  { itemId: 'bread', weight: 10, minCount: 1, maxCount: 2 },
  { itemId: 'iron_scrap', weight: 8, minCount: 1, maxCount: 3 },
  { itemId: 'mana_potion', weight: 8, minCount: 1, maxCount: 1 },
  { itemId: 'stamina_flask', weight: 7, minCount: 1, maxCount: 1 },
];

// What chests drop
export const CHEST_LOOT: LootEntry[] = [
  { itemId: 'gold_pile', weight: 20, minCount: 1, maxCount: 3 },
  { itemId: 'health_potion', weight: 12, minCount: 1, maxCount: 2 },
  { itemId: 'large_health_potion', weight: 8, minCount: 1, maxCount: 1 },
  { itemId: 'iron_sword', weight: 6, minCount: 1, maxCount: 1 },
  { itemId: 'steel_dagger', weight: 6, minCount: 1, maxCount: 1 },
  { itemId: 'leather_vest', weight: 5, minCount: 1, maxCount: 1 },
  { itemId: 'battle_axe', weight: 4, minCount: 1, maxCount: 1 },
  { itemId: 'chainmail', weight: 4, minCount: 1, maxCount: 1 },
  { itemId: 'hunting_bow', weight: 4, minCount: 1, maxCount: 1 },
  { itemId: 'curved_shield', weight: 3, minCount: 1, maxCount: 1 },
  { itemId: 'shield_orb', weight: 5, minCount: 1, maxCount: 1 },
  { itemId: 'crystal_shard', weight: 5, minCount: 1, maxCount: 3 },
  { itemId: 'speed_scroll', weight: 3, minCount: 1, maxCount: 1 },
  { itemId: 'gem', weight: 2, minCount: 1, maxCount: 1 },
  { itemId: 'dungeon_key', weight: 2, minCount: 1, maxCount: 1 },
];

// What enemies drop (scaled by floor)
export const ENEMY_LOOT: LootEntry[] = [
  { itemId: 'gold_coin', weight: 35, minCount: 2, maxCount: 8 },
  { itemId: 'ammo_pack', weight: 15, minCount: 1, maxCount: 1 },
  { itemId: 'health_potion', weight: 12, minCount: 1, maxCount: 1 },
  { itemId: 'mana_potion', weight: 8, minCount: 1, maxCount: 1 },
  { itemId: 'iron_scrap', weight: 8, minCount: 1, maxCount: 2 },
  { itemId: 'bread', weight: 6, minCount: 1, maxCount: 1 },
  { itemId: 'ember_dust', weight: 4, minCount: 1, maxCount: 2 },
  { itemId: 'crystal_shard', weight: 3, minCount: 1, maxCount: 1 },
  { itemId: 'iron_sword', weight: 2, minCount: 1, maxCount: 1 },
  { itemId: 'steel_dagger', weight: 2, minCount: 1, maxCount: 1 },
];

// Higher floor enemies get better loot added
export const FLOOR_BONUS_LOOT: Record<number, LootEntry[]> = {
  3: [
    { itemId: 'battle_axe', weight: 3, minCount: 1, maxCount: 1 },
    { itemId: 'chainmail', weight: 3, minCount: 1, maxCount: 1 },
  ],
  5: [
    { itemId: 'war_hammer', weight: 2, minCount: 1, maxCount: 1 },
    { itemId: 'iron_plate', weight: 2, minCount: 1, maxCount: 1 },
    { itemId: 'arcane_staff', weight: 2, minCount: 1, maxCount: 1 },
  ],
  7: [
    { itemId: 'void_spear', weight: 1, minCount: 1, maxCount: 1 },
    { itemId: 'speed_ring', weight: 1, minCount: 1, maxCount: 1 },
    { itemId: 'tower_shield', weight: 1, minCount: 1, maxCount: 1 },
  ],
  10: [
    { itemId: 'legendary_longsword', weight: 1, minCount: 1, maxCount: 1 },
    { itemId: 'lucky_charm', weight: 1, minCount: 1, maxCount: 1 },
    { itemId: 'void_essence', weight: 2, minCount: 1, maxCount: 2 },
  ],
};

// ── Loot Roll Utility ───────────────────────────────────

export function rollLoot(table: LootEntry[], rolls: number, floor: number): { itemId: string; count: number }[] {
  // Add floor bonus entries
  const fullTable = [...table];
  for (const [floorReq, bonusEntries] of Object.entries(FLOOR_BONUS_LOOT)) {
    if (floor >= Number(floorReq)) {
      fullTable.push(...bonusEntries);
    }
  }

  const totalWeight = fullTable.reduce((sum, e) => sum + e.weight, 0);
  const results: { itemId: string; count: number }[] = [];

  for (let i = 0; i < rolls; i++) {
    let roll = Math.random() * totalWeight;
    for (const entry of fullTable) {
      roll -= entry.weight;
      if (roll <= 0) {
        const count = entry.minCount + Math.floor(Math.random() * (entry.maxCount - entry.minCount + 1));
        const existing = results.find(r => r.itemId === entry.itemId);
        if (existing) {
          existing.count += count;
        } else {
          results.push({ itemId: entry.itemId, count });
        }
        break;
      }
    }
  }

  return results;
}

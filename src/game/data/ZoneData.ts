// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Zone Definitions & Boss Configurations
// ═══════════════════════════════════════════════════════════════

import { Biome } from '../types/World';

// ── Zone System ───────────────────────────────────────────────

export interface ZoneDef {
  id: string;
  name: string;
  number: number;
  biome: Biome;
  floorRange: [number, number];   // which floors this zone spans
  enemyCount: number;
  bossId: string | null;          // null for zone 1 (tutorial/safe)
  enemySprites: string[];         // monster sprite base names for this zone
  musicTrack: string;
  ambientTrack: string;
  entryLabel: string;
  exitLabel: string;
  requiresBoss: string | null;    // boss that must be defeated to enter
}

export const ZONES: ZoneDef[] = [
  {
    id: 'zone1_village', name: 'Haven Village', number: 1,
    biome: Biome.ShatteredPlains, floorRange: [1, 1],
    enemyCount: 6, bossId: null,
    enemySprites: ['slime', 'slimeGreen', 'mouse', 'snail'],
    musicTrack: 'music_dungeon', ambientTrack: 'amb_spooky',
    entryLabel: 'Haven Village', exitLabel: 'Enter Darkwood Forest',
    requiresBoss: null,
  },
  {
    id: 'zone2_forest', name: 'Darkwood Forest', number: 2,
    biome: Biome.ArcaneForest, floorRange: [2, 3],
    enemyCount: 10, bossId: 'alpha_wolf',
    enemySprites: ['spider', 'snake', 'bat', 'bee'],
    musicTrack: 'music_dungeon', ambientTrack: 'amb_spooky',
    entryLabel: 'Darkwood Forest', exitLabel: 'Enter Crystal Caves',
    requiresBoss: null,
  },
  {
    id: 'zone3_caves', name: 'Crystal Caves', number: 3,
    biome: Biome.CrystalCaverns, floorRange: [4, 5],
    enemyCount: 12, bossId: 'crystal_colossus',
    enemySprites: ['bat', 'worm', 'spider', 'slimeBlue'],
    musicTrack: 'music_dungeon', ambientTrack: 'amb_spooky',
    entryLabel: 'Crystal Caves', exitLabel: 'Exit to Murkmire Swamp',
    requiresBoss: 'alpha_wolf',
  },
  {
    id: 'zone4_swamp', name: 'Murkmire Swamp', number: 4,
    biome: Biome.VoidMarsh, floorRange: [6, 7],
    enemyCount: 14, bossId: 'swamp_hydra',
    enemySprites: ['frog', 'snakeSlime', 'fly', 'worm'],
    musicTrack: 'music_dungeon', ambientTrack: 'amb_spooky',
    entryLabel: 'Murkmire Swamp', exitLabel: 'Enter Ancient Ruins',
    requiresBoss: 'crystal_colossus',
  },
  {
    id: 'zone5_ruins', name: 'Ancient Ruins', number: 5,
    biome: Biome.NeonRuins, floorRange: [8, 9],
    enemyCount: 16, bossId: 'lich_king',
    enemySprites: ['ghost', 'spinner', 'worm', 'snakeSlime'],
    musicTrack: 'music_dungeon', ambientTrack: 'amb_spooky',
    entryLabel: 'Ancient Ruins', exitLabel: 'Cross to Iron Fortress',
    requiresBoss: 'swamp_hydra',
  },
  {
    id: 'zone6_castle', name: 'Iron Fortress', number: 6,
    biome: Biome.ShatteredPlains, floorRange: [10, 11],
    enemyCount: 18, bossId: 'tyrant_king',
    enemySprites: ['ladyBug', 'spinnerHalf', 'spider', 'slimeBlock'],
    musicTrack: 'music_dungeon', ambientTrack: 'amb_spooky',
    entryLabel: 'Iron Fortress', exitLabel: 'Exit to Scorching Desert',
    requiresBoss: 'lich_king',
  },
  {
    id: 'zone7_desert', name: 'Scorching Desert', number: 7,
    biome: Biome.EmberFields, floorRange: [12, 13],
    enemyCount: 20, bossId: 'sand_pharaoh',
    enemySprites: ['snakeLava', 'bee', 'grassBlock', 'fly'],
    musicTrack: 'music_dungeon', ambientTrack: 'amb_spooky',
    entryLabel: 'Scorching Desert', exitLabel: 'Enter Magma Fortress',
    requiresBoss: 'tyrant_king',
  },
  {
    id: 'zone8_volcano', name: 'Magma Fortress', number: 8,
    biome: Biome.EmberFields, floorRange: [14, 15],
    enemyCount: 22, bossId: 'infernal_dragon',
    enemySprites: ['snakeLava', 'slimeBlock', 'grassBlock', 'spinner'],
    musicTrack: 'music_dungeon', ambientTrack: 'amb_spooky',
    entryLabel: 'Magma Fortress', exitLabel: 'Enter the Void',
    requiresBoss: 'sand_pharaoh',
  },
  {
    id: 'zone9_void', name: 'The Dark Realm', number: 9,
    biome: Biome.VoidMarsh, floorRange: [16, 17],
    enemyCount: 24, bossId: 'void_lord',
    enemySprites: ['ghost', 'spinnerHalf', 'spider', 'snakeLava'],
    musicTrack: 'music_dungeon', ambientTrack: 'amb_spooky',
    entryLabel: 'The Dark Realm', exitLabel: '',
    requiresBoss: 'infernal_dragon',
  },
];

// ── Boss Attack Definition ────────────────────────────────────

export interface BossAttack {
  name: string;
  damage: number;
  range: number;
  cooldown: number;           // frames
  type: 'melee' | 'projectile' | 'area' | 'summon' | 'charge' | 'beam' | 'heal';
  projectileCount?: number;
  summonCount?: number;
  healAmount?: number;
}

export interface BossConfig {
  id: string;
  name: string;
  title: string;
  zone: string;
  maxHealth: number;
  damage: number;
  speed: number;
  defense: number;
  phases: number;
  phaseThresholds: number[];  // HP ratios that trigger phase changes
  attacks: BossAttack[];
  maxSummons: number;
  goldDrop: [number, number];
  xpDrop: number;
  guaranteedLoot: string[];
  loot: { item: string; chance: number }[];
  sprite: string;             // base sprite name for boss
}

export const BOSS_CONFIGS: Record<string, BossConfig> = {
  alpha_wolf: {
    id: 'alpha_wolf', name: 'ALPHA WOLF', title: 'Terror of the Forest',
    zone: 'zone2_forest', maxHealth: 300, damage: 15, speed: 85, defense: 3,
    phases: 3, phaseThresholds: [0.66, 0.33, 0], maxSummons: 4,
    sprite: 'mon_snake',
    attacks: [
      { name: 'bite', damage: 15, range: 3, cooldown: 70, type: 'melee' },
      { name: 'lunge', damage: 20, range: 8, cooldown: 180, type: 'charge' },
      { name: 'howl', damage: 0, range: 0, cooldown: 480, type: 'summon', summonCount: 2 },
    ],
    goldDrop: [50, 120], xpDrop: 300,
    guaranteedLoot: ['large_health_potion', 'health_potion'],
    loot: [
      { item: 'speed_scroll', chance: 0.5 },
      { item: 'iron_sword', chance: 0.3 },
      { item: 'lucky_charm', chance: 0.15 },
    ],
  },
  crystal_colossus: {
    id: 'crystal_colossus', name: 'CRYSTAL COLOSSUS', title: 'Guardian of the Deep',
    zone: 'zone3_caves', maxHealth: 500, damage: 20, speed: 40, defense: 10,
    phases: 3, phaseThresholds: [0.6, 0.3, 0], maxSummons: 0,
    sprite: 'mon_slimeBlock',
    attacks: [
      { name: 'slam', damage: 25, range: 4, cooldown: 120, type: 'melee' },
      { name: 'crystal_barrage', damage: 10, range: 15, cooldown: 240, type: 'projectile', projectileCount: 8 },
      { name: 'earthquake', damage: 15, range: 10, cooldown: 600, type: 'area' },
    ],
    goldDrop: [100, 250], xpDrop: 600,
    guaranteedLoot: ['large_health_potion', 'crystal_shard'],
    loot: [
      { item: 'chainmail', chance: 0.4 },
      { item: 'battle_axe', chance: 0.3 },
      { item: 'shield_orb', chance: 0.3 },
    ],
  },
  swamp_hydra: {
    id: 'swamp_hydra', name: 'SWAMP HYDRA', title: 'Poison of the Murk',
    zone: 'zone4_swamp', maxHealth: 450, damage: 18, speed: 50, defense: 5,
    phases: 3, phaseThresholds: [0.66, 0.33, 0], maxSummons: 0,
    sprite: 'mon_snakeSlime',
    attacks: [
      { name: 'head_strike', damage: 18, range: 4, cooldown: 90, type: 'melee' },
      { name: 'poison_spit', damage: 8, range: 12, cooldown: 150, type: 'projectile', projectileCount: 3 },
      { name: 'tail_sweep', damage: 12, range: 5, cooldown: 210, type: 'area' },
      { name: 'regrow_head', damage: 0, range: 0, cooldown: 900, type: 'heal', healAmount: 50 },
    ],
    goldDrop: [80, 200], xpDrop: 700,
    guaranteedLoot: ['large_health_potion', 'mana_potion'],
    loot: [
      { item: 'hunting_bow', chance: 0.3 },
      { item: 'void_essence', chance: 0.2 },
    ],
  },
  lich_king: {
    id: 'lich_king', name: 'LICH KING', title: 'Ruler of the Dead',
    zone: 'zone5_ruins', maxHealth: 550, damage: 22, speed: 60, defense: 8,
    phases: 3, phaseThresholds: [0.66, 0.33, 0], maxSummons: 6,
    sprite: 'mon_ghost',
    attacks: [
      { name: 'dark_bolt', damage: 18, range: 15, cooldown: 70, type: 'projectile', projectileCount: 1 },
      { name: 'summon_skeletons', damage: 0, range: 0, cooldown: 360, type: 'summon', summonCount: 3 },
      { name: 'death_circle', damage: 25, range: 8, cooldown: 480, type: 'area' },
      { name: 'soul_drain', damage: 15, range: 5, cooldown: 300, type: 'beam' },
    ],
    goldDrop: [120, 300], xpDrop: 900,
    guaranteedLoot: ['large_health_potion', 'arcane_staff'],
    loot: [
      { item: 'iron_plate', chance: 0.3 },
      { item: 'void_essence', chance: 0.5 },
    ],
  },
  tyrant_king: {
    id: 'tyrant_king', name: 'TYRANT KING', title: 'Iron Fist of the Realm',
    zone: 'zone6_castle', maxHealth: 700, damage: 25, speed: 55, defense: 15,
    phases: 3, phaseThresholds: [0.5, 0.2, 0], maxSummons: 4,
    sprite: 'mon_spinnerHalf',
    attacks: [
      { name: 'sword_combo', damage: 20, range: 3, cooldown: 90, type: 'melee' },
      { name: 'shield_bash', damage: 15, range: 3, cooldown: 150, type: 'melee' },
      { name: 'charge', damage: 30, range: 12, cooldown: 300, type: 'charge' },
      { name: 'call_guards', damage: 0, range: 0, cooldown: 600, type: 'summon', summonCount: 2 },
      { name: 'ground_pound', damage: 20, range: 6, cooldown: 360, type: 'area' },
    ],
    goldDrop: [200, 500], xpDrop: 1200,
    guaranteedLoot: ['large_health_potion', 'large_health_potion'],
    loot: [
      { item: 'war_hammer', chance: 0.3 },
      { item: 'iron_plate', chance: 0.5 },
      { item: 'void_spear', chance: 0.15 },
    ],
  },
  sand_pharaoh: {
    id: 'sand_pharaoh', name: 'SAND PHARAOH', title: 'Eternal King of the Sands',
    zone: 'zone7_desert', maxHealth: 600, damage: 22, speed: 70, defense: 8,
    phases: 3, phaseThresholds: [0.66, 0.33, 0], maxSummons: 3,
    sprite: 'mon_snakeLava',
    attacks: [
      { name: 'staff_beam', damage: 20, range: 15, cooldown: 120, type: 'beam' },
      { name: 'sand_wave', damage: 15, range: 10, cooldown: 180, type: 'area' },
      { name: 'quicksand', damage: 5, range: 8, cooldown: 300, type: 'area' },
      { name: 'sandstorm', damage: 3, range: 20, cooldown: 900, type: 'area' },
    ],
    goldDrop: [150, 400], xpDrop: 1000,
    guaranteedLoot: ['large_health_potion', 'speed_scroll'],
    loot: [
      { item: 'legendary_longsword', chance: 0.1 },
      { item: 'void_essence', chance: 0.5 },
      { item: 'gem', chance: 1.0 },
    ],
  },
  infernal_dragon: {
    id: 'infernal_dragon', name: 'INFERNAL DRAGON', title: 'Flame of the Abyss',
    zone: 'zone8_volcano', maxHealth: 800, damage: 30, speed: 60, defense: 12,
    phases: 3, phaseThresholds: [0.66, 0.33, 0], maxSummons: 0,
    sprite: 'mon_dragon',
    attacks: [
      { name: 'fire_breath', damage: 8, range: 10, cooldown: 150, type: 'beam' },
      { name: 'claw_swipe', damage: 25, range: 4, cooldown: 108, type: 'melee' },
      { name: 'tail_slam', damage: 20, range: 5, cooldown: 180, type: 'area' },
      { name: 'lava_eruption', damage: 30, range: 6, cooldown: 420, type: 'area' },
    ],
    goldDrop: [250, 600], xpDrop: 1500,
    guaranteedLoot: ['large_health_potion', 'large_health_potion', 'void_essence'],
    loot: [
      { item: 'legendary_longsword', chance: 0.2 },
      { item: 'tower_shield', chance: 0.3 },
      { item: 'gem', chance: 1.0 },
    ],
  },
  void_lord: {
    id: 'void_lord', name: 'THE VOID LORD', title: 'Destroyer of Reality',
    zone: 'zone9_void', maxHealth: 1200, damage: 35, speed: 75, defense: 15,
    phases: 4, phaseThresholds: [0.75, 0.5, 0.25, 0], maxSummons: 8,
    sprite: 'mon_spinner',
    attacks: [
      { name: 'void_beam', damage: 30, range: 18, cooldown: 120, type: 'beam' },
      { name: 'reality_tear', damage: 20, range: 15, cooldown: 300, type: 'area' },
      { name: 'shadow_summon', damage: 0, range: 0, cooldown: 480, type: 'summon', summonCount: 2 },
      { name: 'void_nova', damage: 40, range: 10, cooldown: 720, type: 'area' },
      { name: 'consume', damage: 50, range: 4, cooldown: 1200, type: 'melee' },
    ],
    goldDrop: [500, 1000], xpDrop: 3000,
    guaranteedLoot: ['large_health_potion', 'legendary_longsword', 'lucky_charm'],
    loot: [
      { item: 'void_essence', chance: 1.0 },
      { item: 'gem', chance: 1.0 },
      { item: 'speed_ring', chance: 0.5 },
    ],
  },
};

// ── Store Items ───────────────────────────────────────────────

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'health' | 'buffs' | 'ammo' | 'weapons' | 'armor' | 'keys';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  minZone: number;
  itemId: string;    // maps to ITEMS key
  oneTimePurchase?: boolean;
}

export const STORE_ITEMS: StoreItem[] = [
  // Health
  { id: 'store_hp_small', name: 'Health Potion', description: 'Restore 30 HP', price: 15, category: 'health', rarity: 'common', minZone: 1, itemId: 'health_potion' },
  { id: 'store_hp_large', name: 'Large Health Potion', description: 'Restore 60 HP', price: 40, category: 'health', rarity: 'uncommon', minZone: 2, itemId: 'large_health_potion' },
  { id: 'store_mana', name: 'Mana Potion', description: 'Restore 25 Mana', price: 20, category: 'health', rarity: 'common', minZone: 1, itemId: 'mana_potion' },
  { id: 'store_stamina', name: 'Stamina Flask', description: 'Restore 40 Stamina', price: 15, category: 'health', rarity: 'common', minZone: 1, itemId: 'stamina_flask' },
  { id: 'store_bread', name: 'Bread', description: 'Restore 15 HP', price: 8, category: 'health', rarity: 'common', minZone: 1, itemId: 'bread' },
  { id: 'store_meat', name: 'Cooked Meat', description: 'Restore 40 HP', price: 25, category: 'health', rarity: 'uncommon', minZone: 2, itemId: 'meat' },
  // Buffs
  { id: 'store_shield', name: 'Shield Orb', description: 'Grants 30 Shield', price: 35, category: 'buffs', rarity: 'uncommon', minZone: 2, itemId: 'shield_orb' },
  { id: 'store_speed', name: 'Speed Scroll', description: '1.5x speed 10s', price: 50, category: 'buffs', rarity: 'rare', minZone: 3, itemId: 'speed_scroll' },
  // Ammo
  { id: 'store_ammo', name: 'Ammo Pack', description: 'Refill magazine', price: 12, category: 'ammo', rarity: 'common', minZone: 1, itemId: 'ammo_pack' },
  // Weapons
  { id: 'store_sword', name: 'Iron Sword', description: '+5 ATK', price: 100, category: 'weapons', rarity: 'common', minZone: 1, itemId: 'iron_sword' },
  { id: 'store_dagger', name: 'Steel Dagger', description: '+3 ATK fast', price: 60, category: 'weapons', rarity: 'common', minZone: 1, itemId: 'steel_dagger' },
  { id: 'store_axe', name: 'Battle Axe', description: '+8 ATK', price: 180, category: 'weapons', rarity: 'uncommon', minZone: 3, itemId: 'battle_axe' },
  { id: 'store_hammer', name: 'War Hammer', description: '+12 ATK', price: 300, category: 'weapons', rarity: 'rare', minZone: 5, itemId: 'war_hammer' },
  { id: 'store_staff', name: 'Arcane Staff', description: '+10 ATK magic', price: 250, category: 'weapons', rarity: 'rare', minZone: 4, itemId: 'arcane_staff' },
  // Armor
  { id: 'store_leather', name: 'Leather Vest', description: '+3 DEF', price: 80, category: 'armor', rarity: 'common', minZone: 1, itemId: 'leather_vest' },
  { id: 'store_chain', name: 'Chainmail', description: '+6 DEF', price: 200, category: 'armor', rarity: 'uncommon', minZone: 3, itemId: 'chainmail' },
  { id: 'store_plate', name: 'Iron Plate', description: '+10 DEF', price: 500, category: 'armor', rarity: 'rare', minZone: 6, itemId: 'iron_plate' },
  { id: 'store_cshield', name: 'Curved Shield', description: '+15 Shield +4 DEF', price: 150, category: 'armor', rarity: 'uncommon', minZone: 2, itemId: 'curved_shield' },
  // Keys
  { id: 'store_key', name: 'Dungeon Key', description: 'Opens locked chests', price: 40, category: 'keys', rarity: 'rare', minZone: 1, itemId: 'dungeon_key' },
  // Boss / NPC drop weapons
  { id: 'store_bow', name: 'Hunting Bow', description: '+6 ATK ranged', price: 120, category: 'weapons', rarity: 'uncommon', minZone: 3, itemId: 'hunting_bow' },
  { id: 'store_vspear', name: 'Void Spear', description: '+16 ATK void', price: 400, category: 'weapons', rarity: 'epic', minZone: 6, itemId: 'void_spear' },
  { id: 'store_lsword', name: 'Soul Reaper', description: '+25 ATK heal-on-kill', price: 800, category: 'weapons', rarity: 'legendary', minZone: 8, itemId: 'legendary_longsword' },
  // Boss / NPC drop armor & accessories
  { id: 'store_tshield', name: 'Tower Shield', description: '+25 Shield +7 DEF', price: 350, category: 'armor', rarity: 'rare', minZone: 6, itemId: 'tower_shield' },
  { id: 'store_sring', name: 'Speed Ring', description: '+10% speed', price: 200, category: 'armor', rarity: 'rare', minZone: 5, itemId: 'speed_ring' },
  { id: 'store_lcharm', name: 'Lucky Charm', description: 'Better loot drops', price: 500, category: 'armor', rarity: 'epic', minZone: 7, itemId: 'lucky_charm' },
  // Materials (sellable & buyable)
  { id: 'store_crystal', name: 'Crystal Shard', description: 'Glowing fragment', price: 30, category: 'buffs', rarity: 'uncommon', minZone: 3, itemId: 'crystal_shard' },
  { id: 'store_void', name: 'Void Essence', description: 'Essence from the void', price: 80, category: 'buffs', rarity: 'rare', minZone: 5, itemId: 'void_essence' },
  { id: 'store_ember', name: 'Ember Dust', description: 'Smoldering powder', price: 20, category: 'buffs', rarity: 'uncommon', minZone: 2, itemId: 'ember_dust' },
  { id: 'store_iron', name: 'Iron Scrap', description: 'Crafting material', price: 10, category: 'buffs', rarity: 'common', minZone: 1, itemId: 'iron_scrap' },
];

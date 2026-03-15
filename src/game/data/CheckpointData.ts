// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Checkpoint Definitions for All 9 Zones
// ═══════════════════════════════════════════════════════════════

export type CheckpointType = 'crystal' | 'campfire' | 'totem' | 'shrine' | 'flag' | 'statue' | 'obelisk' | 'lantern' | 'well' | 'bonfire';

export interface CheckpointDef {
  id: string;
  name: string;
  type: CheckpointType;
  /** Tile offset from zone center (relative position within the map) */
  tileOffsetX: number;
  tileOffsetY: number;
  isZoneEntrance?: boolean;
  isPreBoss?: boolean;
  isHidden?: boolean;
  healOnActivate?: boolean;
  healAmount?: number;
  radius?: number;
}

// ── Checkpoint Visual Colors ────────────────────────────────

export const CHECKPOINT_ACTIVE_TINTS: Record<CheckpointType, string> = {
  crystal:  '#44DDFF',
  campfire: '#FFAA44',
  totem:    '#44FF88',
  shrine:   '#FFDD44',
  flag:     '#FFFFFF',
  statue:   '#AABBFF',
  obelisk:  '#BB88FF',
  lantern:  '#FFCC66',
  well:     '#88CCFF',
  bonfire:  '#FF8833',
};

export const CHECKPOINT_GLOW_COLORS: Record<CheckpointType, string> = {
  crystal:  '#44DDFF',
  campfire: '#FF8833',
  totem:    '#44FF88',
  shrine:   '#FFDD44',
  flag:     '#FFFFFF',
  statue:   '#8899FF',
  obelisk:  '#BB88FF',
  lantern:  '#FFCC44',
  well:     '#44AAFF',
  bonfire:  '#FF6622',
};

export const CHECKPOINT_SYMBOLS: Record<CheckpointType, string> = {
  crystal:  '◆',
  campfire: '🔥',
  totem:    '⌘',
  shrine:   '✦',
  flag:     '⚑',
  statue:   '♜',
  obelisk:  '▲',
  lantern:  '☀',
  well:     '◎',
  bonfire:  '🔥',
};

// ── Zone Checkpoint Definitions ─────────────────────────────

export const ZONE_CHECKPOINTS: Record<number, CheckpointDef[]> = {
  // Zone 1: Haven Village — generous, safe
  1: [
    { id: 'z1_player_house', name: "Player's Home", type: 'lantern',
      tileOffsetX: -20, tileOffsetY: -10, isZoneEntrance: true,
      healOnActivate: true, healAmount: 999 },
    { id: 'z1_village_center', name: 'Village Square', type: 'shrine',
      tileOffsetX: 0, tileOffsetY: -5, healOnActivate: true, healAmount: 50 },
    { id: 'z1_north_gate', name: 'North Gate', type: 'flag',
      tileOffsetX: 15, tileOffsetY: -15 },
    { id: 'z1_chapel', name: 'Village Chapel', type: 'shrine',
      tileOffsetX: -15, tileOffsetY: 10, healOnActivate: true, healAmount: 999 },
    { id: 'z1_hidden_well', name: 'Hidden Well', type: 'well',
      tileOffsetX: 5, tileOffsetY: 8, isHidden: true,
      healOnActivate: true, healAmount: 30 },
  ],

  // Zone 2: Darkwood Forest
  2: [
    { id: 'z2_forest_entrance', name: 'Forest Entrance', type: 'flag',
      tileOffsetX: -20, tileOffsetY: 15, isZoneEntrance: true },
    { id: 'z2_ranger_outpost', name: 'Ranger Outpost', type: 'campfire',
      tileOffsetX: -10, tileOffsetY: 5, healOnActivate: true, healAmount: 30 },
    { id: 'z2_river_crossing', name: 'River Crossing', type: 'totem',
      tileOffsetX: 5, tileOffsetY: -5 },
    { id: 'z2_witch_hut', name: "Witch's Clearing", type: 'campfire',
      tileOffsetX: 15, tileOffsetY: -10, healOnActivate: true, healAmount: 25 },
    { id: 'z2_wolf_den', name: 'Wolf Den Entrance', type: 'campfire',
      tileOffsetX: 20, tileOffsetY: -18, isPreBoss: true,
      healOnActivate: true, healAmount: 40 },
    { id: 'z2_cave_mouth', name: 'Cave Entrance', type: 'lantern',
      tileOffsetX: 25, tileOffsetY: -22 },
    { id: 'z2_hidden_grove', name: 'Fairy Ring', type: 'crystal',
      tileOffsetX: 0, tileOffsetY: -12, isHidden: true,
      healOnActivate: true, healAmount: 50 },
  ],

  // Zone 3: Crystal Caves
  3: [
    { id: 'z3_cave_entrance', name: 'Cave Entrance', type: 'lantern',
      tileOffsetX: -18, tileOffsetY: -15, isZoneEntrance: true },
    { id: 'z3_first_cavern', name: 'Glowing Cavern', type: 'crystal',
      tileOffsetX: -8, tileOffsetY: -5, healOnActivate: true, healAmount: 20 },
    { id: 'z3_underground_lake', name: 'Underground Lake', type: 'well',
      tileOffsetX: 5, tileOffsetY: 5, healOnActivate: true, healAmount: 30 },
    { id: 'z3_minecart', name: 'Minecart Station', type: 'lantern',
      tileOffsetX: -10, tileOffsetY: 12 },
    { id: 'z3_crystal_chamber', name: 'Crystal Chamber', type: 'crystal',
      tileOffsetX: 15, tileOffsetY: 15, isPreBoss: true,
      healOnActivate: true, healAmount: 40 },
    { id: 'z3_hidden_waterfall', name: 'Secret Grotto', type: 'crystal',
      tileOffsetX: -15, tileOffsetY: 3, isHidden: true,
      healOnActivate: true, healAmount: 60 },
  ],

  // Zone 4: Murkmire Swamp
  4: [
    { id: 'z4_swamp_entrance', name: 'Swamp Edge', type: 'totem',
      tileOffsetX: -20, tileOffsetY: 8, isZoneEntrance: true },
    { id: 'z4_dry_island', name: 'Dry Island', type: 'campfire',
      tileOffsetX: -8, tileOffsetY: 0, healOnActivate: true, healAmount: 25 },
    { id: 'z4_witch_doctor', name: "Witch Doctor's Camp", type: 'totem',
      tileOffsetX: 8, tileOffsetY: -8, healOnActivate: true, healAmount: 35 },
    { id: 'z4_sunken_temple', name: 'Sunken Temple', type: 'totem',
      tileOffsetX: 18, tileOffsetY: -15, isPreBoss: true,
      healOnActivate: true, healAmount: 40 },
    { id: 'z4_hidden_shrine', name: 'Forgotten Shrine', type: 'shrine',
      tileOffsetX: 0, tileOffsetY: -18, isHidden: true,
      healOnActivate: true, healAmount: 50 },
  ],

  // Zone 5: Ancient Ruins
  5: [
    { id: 'z5_ruins_entrance', name: 'Ruins Gateway', type: 'statue',
      tileOffsetX: -20, tileOffsetY: 5, isZoneEntrance: true },
    { id: 'z5_courtyard', name: 'Outer Courtyard', type: 'statue',
      tileOffsetX: -8, tileOffsetY: -5 },
    { id: 'z5_puzzle_hall', name: 'Puzzle Hall', type: 'obelisk',
      tileOffsetX: 5, tileOffsetY: -10, healOnActivate: true, healAmount: 25 },
    { id: 'z5_inner_sanctum', name: 'Inner Sanctum', type: 'obelisk',
      tileOffsetX: 15, tileOffsetY: -18, isPreBoss: true,
      healOnActivate: true, healAmount: 40 },
    { id: 'z5_hidden_library', name: 'Lost Library', type: 'lantern',
      tileOffsetX: -15, tileOffsetY: -15, isHidden: true,
      healOnActivate: true, healAmount: 50 },
  ],

  // Zone 6: Iron Fortress
  6: [
    { id: 'z6_drawbridge', name: 'Castle Drawbridge', type: 'flag',
      tileOffsetX: 0, tileOffsetY: 18, isZoneEntrance: true },
    { id: 'z6_courtyard', name: 'Castle Courtyard', type: 'campfire',
      tileOffsetX: 0, tileOffsetY: 10, healOnActivate: true, healAmount: 20 },
    { id: 'z6_barracks', name: 'Barracks', type: 'campfire',
      tileOffsetX: -15, tileOffsetY: 0 },
    { id: 'z6_armory', name: 'Armory', type: 'lantern',
      tileOffsetX: 12, tileOffsetY: -5, healOnActivate: true, healAmount: 25 },
    { id: 'z6_throne_room', name: 'Throne Room Doors', type: 'flag',
      tileOffsetX: 0, tileOffsetY: -15, isPreBoss: true,
      healOnActivate: true, healAmount: 40 },
    { id: 'z6_dungeon_secret', name: 'Dungeon Cell', type: 'lantern',
      tileOffsetX: -18, tileOffsetY: 10, isHidden: true,
      healOnActivate: true, healAmount: 50 },
  ],

  // Zone 7: Scorching Desert
  7: [
    { id: 'z7_desert_pass', name: 'Desert Pass', type: 'flag',
      tileOffsetX: -22, tileOffsetY: 5, isZoneEntrance: true },
    { id: 'z7_oasis', name: 'Desert Oasis', type: 'well',
      tileOffsetX: -5, tileOffsetY: 0, healOnActivate: true, healAmount: 40 },
    { id: 'z7_nomad_camp', name: 'Nomad Camp', type: 'campfire',
      tileOffsetX: 12, tileOffsetY: -8, healOnActivate: true, healAmount: 25 },
    { id: 'z7_tomb_entrance', name: 'Pharaoh Tomb', type: 'obelisk',
      tileOffsetX: 22, tileOffsetY: -15, isPreBoss: true,
      healOnActivate: true, healAmount: 40 },
    { id: 'z7_hidden_spring', name: 'Hidden Spring', type: 'well',
      tileOffsetX: 8, tileOffsetY: -18, isHidden: true,
      healOnActivate: true, healAmount: 60 },
  ],

  // Zone 8: Magma Fortress
  8: [
    { id: 'z8_volcano_entrance', name: 'Volcano Tunnel', type: 'lantern',
      tileOffsetX: -20, tileOffsetY: 12, isZoneEntrance: true },
    { id: 'z8_lava_bridge', name: 'Lava Bridge', type: 'bonfire',
      tileOffsetX: -8, tileOffsetY: 5 },
    { id: 'z8_forge_room', name: 'Ancient Forge', type: 'bonfire',
      tileOffsetX: 5, tileOffsetY: -5, healOnActivate: true, healAmount: 30 },
    { id: 'z8_dragon_gate', name: "Dragon's Gate", type: 'bonfire',
      tileOffsetX: -5, tileOffsetY: -15, isPreBoss: true,
      healOnActivate: true, healAmount: 50 },
    { id: 'z8_hidden_obsidian', name: 'Obsidian Chamber', type: 'crystal',
      tileOffsetX: 12, tileOffsetY: -3, isHidden: true,
      healOnActivate: true, healAmount: 60 },
  ],

  // Zone 9: The Dark Realm — hardest zone, fewest saves
  9: [
    { id: 'z9_void_entrance', name: 'Void Rift', type: 'crystal',
      tileOffsetX: 0, tileOffsetY: 15, isZoneEntrance: true },
    { id: 'z9_shadow_crossing', name: 'Shadow Crossing', type: 'obelisk',
      tileOffsetX: -10, tileOffsetY: 3, healOnActivate: true, healAmount: 25 },
    { id: 'z9_crystal_altar', name: 'Crystal Altar', type: 'crystal',
      tileOffsetX: 0, tileOffsetY: -8, healOnActivate: true, healAmount: 35 },
    { id: 'z9_void_lord_gate', name: 'Heart of the Void', type: 'crystal',
      tileOffsetX: 0, tileOffsetY: -18, isPreBoss: true,
      healOnActivate: true, healAmount: 50 },
    { id: 'z9_hidden_echo', name: 'Echo of Light', type: 'crystal',
      tileOffsetX: -18, tileOffsetY: -10, isHidden: true,
      healOnActivate: true, healAmount: 999 },
  ],
};

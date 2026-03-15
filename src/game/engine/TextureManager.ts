// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Texture Manager (Named Tiles + Character Sprites)
// ═══════════════════════════════════════════════════════════════

import { Biome, TileMaterial } from '../types/World';

// ── Named biome ground tiles (Platformer Assets Base) ──────
// Each biome gets ground tile variants for visual variety
const BIOME_GROUND_TILES: Record<Biome, string[]> = {
  [Biome.ShatteredPlains]: ['grassMid', 'grassCenter', 'grassCenter_rounded', 'grassHalf'],
  [Biome.ArcaneForest]:    ['dirtMid', 'dirtCenter', 'dirtCenter_rounded', 'dirtHalf'],
  [Biome.CrystalCaverns]:  ['stoneMid', 'stoneCenter', 'stoneCenter_rounded', 'stoneHalf'],
  [Biome.VoidMarsh]:       ['dirtMid', 'dirtCenter', 'dirtCenter_rounded', 'dirtHalf'],
  [Biome.NeonRuins]:       ['stoneMid', 'stoneCenter', 'stoneCenter_rounded', 'stoneHalf'],
  [Biome.EmberFields]:     ['sandMid', 'sandCenter', 'sandCenter_rounded', 'sandHalf'],
  [Biome.FrozenAether]:    ['snowMid', 'snowCenter', 'snowCenter_rounded', 'snowHalf'],
};

// Each biome gets wall tile variants
const BIOME_WALL_TILES: Record<Biome, string[]> = {
  [Biome.ShatteredPlains]: ['dirt', 'dirtHalf', 'dirtLeft', 'dirtRight'],
  [Biome.ArcaneForest]:    ['grass', 'grassHalf', 'grassLeft', 'grassRight'],
  [Biome.CrystalCaverns]:  ['stone', 'stoneHalf', 'stoneLeft', 'stoneRight'],
  [Biome.VoidMarsh]:       ['stone', 'stoneHalf', 'stoneLeft', 'stoneRight'],
  [Biome.NeonRuins]:       ['castle', 'castleHalf', 'castleLeft', 'castleRight'],
  [Biome.EmberFields]:     ['sand', 'sandHalf', 'sandLeft', 'sandRight'],
  [Biome.FrozenAether]:    ['snow', 'snowHalf', 'snowLeft', 'snowRight'],
};

// Named tiles to load from assets/tiles/named/
const NAMED_TILES = [
  // Grass terrain
  'grassMid', 'grassCenter', 'grassCenter_rounded', 'grassLeft', 'grassRight', 'grassHalf', 'grass',
  // Dirt terrain
  'dirtMid', 'dirtCenter', 'dirtCenter_rounded', 'dirtLeft', 'dirtRight', 'dirtHalf', 'dirt',
  // Sand terrain
  'sandMid', 'sandCenter', 'sandCenter_rounded', 'sandLeft', 'sandRight', 'sandHalf', 'sand',
  // Stone terrain
  'stoneMid', 'stoneCenter', 'stoneCenter_rounded', 'stoneLeft', 'stoneRight', 'stoneHalf', 'stone',
  // Castle terrain
  'castleMid', 'castleCenter', 'castleCenter_rounded', 'castleLeft', 'castleRight', 'castleHalf', 'castle',
  // Snow terrain
  'snowMid', 'snowCenter', 'snowCenter_rounded', 'snowLeft', 'snowRight', 'snowHalf', 'snow',
  // Liquids
  'liquidLava', 'liquidLavaTop', 'liquidLavaTop_mid',
  'liquidWater', 'liquidWaterTop', 'liquidWaterTop_mid',
  // Walls
  'brickWall', 'stoneWall',
  // Props
  'bridge', 'bridgeLogs', 'fence', 'fenceBroken',
  'tochLit', 'tochLit2', 'torch',
  // Environment (from Background Elements Redux)
  'pyramid', 'pyramidMayan', 'tree', 'treeDead', 'treeFrozen',
  'treePine', 'treePineFrozen', 'treePalm', 'treePineOrange', 'treePineSnow',
  'cactus1', 'cactus2', 'cactus3',
  'bush1', 'bush2', 'bush3', 'bush4',
  'castleWall', 'castleWallAlt', 'tower', 'towerAlt',
];

// ── Legacy dungeon tile indices (fallback) ──────
const MATERIAL_TILES: Record<TileMaterial, number[]> = {
  [TileMaterial.Stone]: [0, 1, 2, 3],
  [TileMaterial.Wood]:  [16, 17, 18, 19],
  [TileMaterial.Crystal]: [32, 33, 34, 35],
  [TileMaterial.Ice]:   [48, 49, 50, 51],
  [TileMaterial.Lava]:  [64, 65, 66, 67],
  [TileMaterial.Void]:  [80, 81, 82, 83],
  [TileMaterial.Metal]: [96, 97, 98, 99],
  [TileMaterial.Water]: [112, 113, 114, 115],
  [TileMaterial.Grass]: [4, 5, 6, 7],
  [TileMaterial.Sand]:  [8, 9, 10, 11],
};

const MATERIAL_WALL_TILES: Record<TileMaterial, number[]> = {
  [TileMaterial.Stone]: [20, 21, 22, 23],
  [TileMaterial.Wood]:  [24, 25, 26, 27],
  [TileMaterial.Crystal]: [36, 37, 38, 39],
  [TileMaterial.Ice]:   [52, 53, 54, 55],
  [TileMaterial.Lava]:  [68, 69, 70, 71],
  [TileMaterial.Void]:  [84, 85, 86, 87],
  [TileMaterial.Metal]: [100, 101, 102, 103],
  [TileMaterial.Water]: [116, 117, 118, 119],
  [TileMaterial.Grass]: [12, 13, 14, 15],
  [TileMaterial.Sand]:  [28, 29, 30, 31],
};

// Character sprite filenames
const CHARACTER_SPRITES = [
  'soldier1', 'soldier2', 'hitman1', 'robot1', 'robot2',
  'survivor1', 'womanGreen', 'manBlue', 'manBrown',
  'zoimbie1', 'zombie2',
];
const SPRITE_POSES = ['_stand', '_gun', '_hold', '_machine', '_reload', '_silencer'];

// Prop sprite filenames (Scribble Dungeons 64px)
const PROP_SPRITES = [
  'barrel', 'barrels_stacked', 'chest', 'crate', 'crate_small',
  'campfire', 'table', 'chair', 'bed', 'cart', 'coffin',
  'door_closed', 'door_open', 'doorway', 'carpet', 'tree', 'plants',
  'trap', 'trap_door', 'planks', 'wood', 'grass', 'puddle', 'water',
  'tile', 'wall', 'wall_corner', 'wall_damaged',
];

// Loot item sprites to preload
const LOOT_SPRITES: string[] = [];
for (let i = 1; i <= 22; i++) {
  LOOT_SPRITES.push(`genericItem_color_${i.toString().padStart(3, '0')}`);
}
const SD_LOOT_SPRITES = [
  'sd_item_weapon_sword', 'sd_item_weapon_dagger', 'sd_item_weapon_axe',
  'sd_item_weapon_hammer', 'sd_item_weapon_spear', 'sd_item_weapon_longsword',
  'sd_item_weapon_bow', 'sd_item_weapon_staff', 'sd_item_weapon_bow_arrow',
  'sd_item_shield_curved', 'sd_item_shield_straight',
];

export class TextureManager {
  private images = new Map<string, HTMLImageElement>();
  private tileCache = new Map<string, HTMLCanvasElement>();
  private loaded = false;

  async loadAll(): Promise<void> {
    const promises: Promise<void>[] = [];

    // Load named tiles (Platformer Assets Base + Background Elements Redux)
    for (const tile of NAMED_TILES) {
      promises.push(this.loadImage(`named_${tile}`, `assets/tiles/named/${tile}.png`));
    }

    // Load dungeon tiles as fallback (tile_0000 through tile_0131)
    for (let i = 0; i < 132; i++) {
      const name = `tile_${i.toString().padStart(4, '0')}`;
      promises.push(this.loadImage(name, `assets/tiles/dungeon/${name}.png`));
    }

    // Load character sprites
    for (const char of CHARACTER_SPRITES) {
      for (const pose of SPRITE_POSES) {
        const name = `${char}${pose}`;
        promises.push(this.loadImage(name, `assets/characters/${name}.png`));
      }
    }

    // Load enemy sprites
    for (const enemy of ['red_character', 'green_character', 'purple_character']) {
      promises.push(this.loadImage(enemy, `assets/enemies/${enemy}.png`));
    }

    // Load monster sprites (zone enemies & bosses)
    const MONSTER_SPRITES = [
      'slime', 'slime_walk', 'slime_hit', 'slime_dead',
      'slimeGreen', 'slimeGreen_walk', 'slimeGreen_hit', 'slimeGreen_dead',
      'slimeBlue', 'slimeBlue_hit', 'slimeBlue_dead',
      'slimeBlock', 'slimeBlock_hit', 'slimeBlock_dead',
      'mouse', 'mouse_walk', 'mouse_hit', 'mouse_dead',
      'snail', 'snail_walk', 'snail_hit',
      'spider', 'spider_walk1', 'spider_hit', 'spider_dead',
      'snake', 'snake_walk', 'snake_hit', 'snake_dead',
      'snakeLava', 'snakeLava_ani', 'snakeLava_hit', 'snakeLava_dead',
      'snakeSlime', 'snakeSlime_ani', 'snakeSlime_hit', 'snakeSlime_dead',
      'bat', 'bat_fly', 'bat_hit', 'bat_dead',
      'frog', 'frog_leap', 'frog_hit', 'frog_dead',
      'ghost', 'ghost_normal', 'ghost_hit', 'ghost_dead',
      'worm', 'worm_walk', 'worm_hit', 'worm_dead',
      'spinner', 'spinner_spin', 'spinner_hit', 'spinner_dead',
      'spinnerHalf', 'spinnerHalf_spin', 'spinnerHalf_hit', 'spinnerHalf_dead',
      'ladyBug', 'ladyBug_walk', 'ladyBug_hit',
      'fly', 'fly_fly', 'fly_hit', 'fly_dead',
      'bee', 'bee_fly', 'bee_hit', 'bee_dead',
      'grassBlock', 'grassBlock_hit', 'grassBlock_dead',
      'dragon',
    ];
    for (const m of MONSTER_SPRITES) {
      promises.push(this.loadImage(`mon_${m}`, `assets/enemies/monsters/${m}.png`));
    }

    // Load prop sprites (Scribble Dungeons 64px)
    for (const prop of PROP_SPRITES) {
      promises.push(this.loadImage(`prop_${prop}`, `assets/props/${prop}.png`));
    }

    // Load loot item sprites (Generic Items)
    for (const loot of LOOT_SPRITES) {
      promises.push(this.loadImage(loot, `assets/loot/${loot}.png`));
    }
    // Load Scribble Dungeons loot sprites
    for (const loot of SD_LOOT_SPRITES) {
      promises.push(this.loadImage(loot, `assets/loot/${loot}.png`));
    }

    await Promise.all(promises);
    this.loaded = true;
  }

  private loadImage(name: string, path: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(name, img);
        resolve();
      };
      img.onerror = () => {
        resolve(); // Don't block on missing textures
      };
      img.src = path;
    });
  }

  /** Get a character sprite image */
  getCharacterSprite(name: string): HTMLImageElement | null {
    return this.images.get(name) || null;
  }

  /** Get a tile-sized canvas for a material type (prefers named tiles) */
  getTile(material: TileMaterial | string, tileSize: number, variant: number = 0, biome?: Biome): HTMLCanvasElement {
    const key = biome ? `named_${biome}_${tileSize}_${variant}` : `${material}_${tileSize}_${variant}`;
    if (this.tileCache.has(key)) return this.tileCache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Try named tile from biome mapping first
    if (biome) {
      const tiles = BIOME_GROUND_TILES[biome];
      if (tiles) {
        const tileName = tiles[variant % tiles.length];
        const img = this.images.get(`named_${tileName}`);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, 0, 0, tileSize, tileSize);
          this.tileCache.set(key, canvas);
          return canvas;
        }
      }
    }

    // Fallback: numbered dungeon tiles
    const mat = material as TileMaterial;
    const indices = MATERIAL_TILES[mat];
    if (indices) {
      const idx = indices[variant % indices.length];
      const tileName = `tile_${idx.toString().padStart(4, '0')}`;
      const img = this.images.get(tileName);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, tileSize, tileSize);
        this.tileCache.set(key, canvas);
        return canvas;
      }
    }

    // Final fallback: solid color with noise
    ctx.fillStyle = this.getFallbackColor(material);
    ctx.fillRect(0, 0, tileSize, tileSize);
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
      ctx.fillRect(
        Math.random() * tileSize,
        Math.random() * tileSize,
        Math.random() * 4 + 1,
        Math.random() * 4 + 1
      );
    }

    this.tileCache.set(key, canvas);
    return canvas;
  }

  /** Get a wall tile canvas (biome-aware, prefers named tiles) */
  getWallTile(tileSize: number, variant: number = 0, material?: TileMaterial, biome?: Biome): HTMLCanvasElement {
    const mat = material ?? TileMaterial.Stone;
    const key = biome ? `wall_named_${biome}_${tileSize}_${variant}` : `wall_${mat}_${tileSize}_${variant}`;
    if (this.tileCache.has(key)) return this.tileCache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Try named wall tile from biome mapping first
    if (biome) {
      const tiles = BIOME_WALL_TILES[biome];
      if (tiles) {
        const tileName = tiles[variant % tiles.length];
        const img = this.images.get(`named_${tileName}`);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, 0, 0, tileSize, tileSize);
          // Darken wall tiles to distinguish from floor
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(0, 0, tileSize, tileSize);
          this.tileCache.set(key, canvas);
          return canvas;
        }
      }
    }

    // Fallback: numbered wall/floor tiles
    const wallIndices = MATERIAL_WALL_TILES[mat];
    const floorIndices = MATERIAL_TILES[mat];
    const indices = wallIndices || floorIndices;
    if (indices) {
      const idx = indices[variant % indices.length];
      const tileName = `tile_${idx.toString().padStart(4, '0')}`;
      const img = this.images.get(tileName);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, tileSize, tileSize);
        // Darken wall tiles slightly to distinguish from floor
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, tileSize, tileSize);
        this.tileCache.set(key, canvas);
        return canvas;
      }
    }

    // Fallback: use floor tile with heavy darken
    if (floorIndices) {
      const idx = floorIndices[variant % floorIndices.length];
      const tileName = `tile_${idx.toString().padStart(4, '0')}`;
      const img = this.images.get(tileName);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, tileSize, tileSize);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, tileSize, tileSize);
        this.tileCache.set(key, canvas);
        return canvas;
      }
    }

    // Final fallback: colored rectangle
    ctx.fillStyle = this.getFallbackColor(mat);
    ctx.fillRect(0, 0, tileSize, tileSize);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, tileSize, tileSize);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, tileSize, tileSize);

    this.tileCache.set(key, canvas);
    return canvas;
  }

  /** Get the primary texture name for a biome */
  getBiomeTexture(biome: Biome, secondary = false): string {
    switch (biome) {
      case Biome.CrystalCaverns: return secondary ? TileMaterial.Stone : TileMaterial.Crystal;
      case Biome.EmberFields: return secondary ? TileMaterial.Stone : TileMaterial.Lava;
      case Biome.VoidMarsh: return secondary ? TileMaterial.Water : TileMaterial.Void;
      case Biome.ArcaneForest: return secondary ? TileMaterial.Wood : TileMaterial.Grass;
      case Biome.FrozenAether: return secondary ? TileMaterial.Stone : TileMaterial.Ice;
      case Biome.NeonRuins: return secondary ? TileMaterial.Stone : TileMaterial.Metal;
      default: return secondary ? TileMaterial.Stone : TileMaterial.Sand;
    }
  }

  /** Get a prop sprite image (barrel, chest, crate, etc.) */
  getPropSprite(name: string): HTMLImageElement | null {
    return this.images.get(`prop_${name}`) || null;
  }

  /** Get a named tile image directly (liquidLava, tree, etc.) */
  getNamedTile(name: string): HTMLImageElement | null {
    return this.images.get(`named_${name}`) || null;
  }

  /** Get a loot item sprite by its asset path */
  getLootSprite(spritePath: string): HTMLImageElement | null {
    // spritePath is like 'loot/genericItem_color_001.png' or 'loot/sd_item_weapon_sword.png'
    const filename = spritePath.split('/').pop()?.replace('.png', '') || '';
    return this.images.get(filename) || null;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  private getFallbackColor(name: string): string {
    const colors: Record<string, string> = {
      [TileMaterial.Crystal]: '#4a3d78',
      [TileMaterial.Lava]: '#c44b16',
      [TileMaterial.Void]: '#1a1a2e',
      [TileMaterial.Wood]: '#5a3d1a',
      [TileMaterial.Stone]: '#4a4a5a',
      [TileMaterial.Ice]: '#a0d4e8',
      [TileMaterial.Metal]: '#6a6d7a',
      [TileMaterial.Water]: '#2855a0',
      [TileMaterial.Grass]: '#2d5a2d',
      [TileMaterial.Sand]: '#c4a84d',
    };
    return colors[name] || '#3a3a4a';
  }
}

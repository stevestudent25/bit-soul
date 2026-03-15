// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Master Game Engine
// ═══════════════════════════════════════════════════════════════

import type { SoulEntity, Vector2 } from '../types/SoulEntity';
import { SoulClass } from '../types/SoulEntity';
import type { GameMap } from '../types/World';
import { TextureManager } from './TextureManager';
import { Camera } from './Camera';
import { InputManager } from './InputManager';
import { Renderer } from './Renderer';
import { AIController } from './AIController';
import { PathFinder } from './PathFinder';
import { ParticleSystem } from './ParticleSystem';
import { WeatherSystem } from './WeatherSystem';
import { DamageNumberSystem, ScreenShake } from './DamageNumbers';
import { generateWorld } from './WorldGenerator';
import { BulletSystem, WEAPONS, type WeaponState } from './BulletSystem';
import { LootSystem } from './LootSystem';
import { AudioManager } from './AudioManager';
import { rollLoot, BREAKABLE_LOOT, CHEST_LOOT, ENEMY_LOOT, ITEMS } from '../data/ItemDatabase';
import { getRarityTextColor, getGoldTierColors } from '../data/ItemColorSystem';
import { createSoul } from '../systems/SoulFactory';
import { processAttack, tickSoul } from '../systems/CombatEngine';
import { BossSystem } from './BossSystem';
import { ZoneManager } from './ZoneManager';
import { InventoryOverlay } from './InventoryOverlay';
import { BOSS_CONFIGS } from '../data/ZoneData';
import { CheckpointManager } from './CheckpointManager';

export type GameState = 'loading' | 'menu' | 'playing' | 'paused' | 'post_match' | 'quit';

export interface MatchScoreState {
  scores: Map<string, number>;
  killFeed: { text: string; color: string; time: number }[];
  matchTime: number;
  phase: string;
  winner: string | null;
}

export interface GameConfig {
  mapWidth: number;
  mapHeight: number;
  tileSize: number;
  enemyCount: number;
  playerClass: SoulClass;
}

const DEFAULT_GAME_CONFIG: GameConfig = {
  mapWidth: 100,
  mapHeight: 80,
  tileSize: 32,
  enemyCount: 12,
  playerClass: SoulClass.Soldier,
};

export class GameEngine {
  // State
  state: GameState = 'loading';
  config: GameConfig;
  map!: GameMap;
  souls: SoulEntity[] = [];
  playerSoul: SoulEntity | null = null;
  matchScore: MatchScoreState = {
    scores: new Map(),
    killFeed: [],
    matchTime: 0,
    phase: 'Preparation',
    winner: null,
  };

  // Systems
  textures = new TextureManager();
  camera!: Camera;
  input = new InputManager();
  renderer!: Renderer;
  ai = new AIController();
  pathfinder!: PathFinder;
  particles = new ParticleSystem();
  weather = new WeatherSystem();
  damageNumbers = new DamageNumberSystem();
  screenShake = new ScreenShake();

  // Dungeon state
  currentFloor = 1;
  playerKills = 0;
  playerGold = 0;
  enemiesRemaining = 0;

  // Bullet / weapon system
  bulletSystem = new BulletSystem();
  lootSystem = new LootSystem();
  audio = new AudioManager();
  bossSystem = new BossSystem();
  zoneManager = new ZoneManager();
  inventory = new InventoryOverlay();
  checkpointManager = new CheckpointManager();
  playerWeapon: WeaponState = {
    weapon: WEAPONS.pistol,
    ammo: WEAPONS.pistol.magSize,
    cooldown: 0,
    reloading: 0,
  };
  private hitstopFrames = 0;
  private footstepTimer = 0;
  private lastPlayerHp = 0;
  private musicStarted = false;
  private matchWon = false;

  // Internal
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animFrame = 0;
  private frameCount = 0;
  private running = false;
  private loadProgress = 0;
  private loadMessage = '';
  private attackCooldowns = new Map<string, number>();
  private activeEvent: { type: string; description: string; timer: number; position: Vector2 } | null = null;
  private eventCooldown = 0;

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_GAME_CONFIG, ...config };
    this.bossSystem.audio = this.audio;
    this.inventory.audio = this.audio;
  }

  // ── Initialization ──────────────────────────────────────
  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.renderer = new Renderer(this.ctx, canvas.width, canvas.height, this.config.tileSize);

    this.loadMessage = 'Loading textures...';
    this.loadProgress = 0.1;
    this.renderLoadingFrame();

    await this.textures.loadAll();
    this.loadProgress = 0.4;
    this.loadMessage = 'Generating dungeon...';
    this.renderLoadingFrame();

    const seed = Math.floor(Math.random() * 999999);
    this.map = generateWorld({
      width: this.config.mapWidth,
      height: this.config.mapHeight,
      seed,
      tileSize: this.config.tileSize,
      floor: this.currentFloor,
    });

    this.pathfinder = new PathFinder(this.map);
    this.loadProgress = 0.6;
    this.loadMessage = 'Spawning souls...';
    this.renderLoadingFrame();

    this.spawnSouls();
    this.loadProgress = 0.8;
    this.loadMessage = 'Initializing systems...';
    this.renderLoadingFrame();

    this.camera = new Camera(
      canvas.width, canvas.height,
      this.config.mapWidth, this.config.mapHeight,
      this.config.tileSize,
    );

    if (this.playerSoul) {
      this.camera.centerOn(this.playerSoul.position);
    }

    this.input.attach(canvas);

    this.loadProgress = 1;
    this.loadMessage = 'Ready!';
    this.renderLoadingFrame();

    this.state = 'menu';
  }

  /** Restore game state from a checkpoint save (called after init for Continue Game) */
  loadFromSave(): boolean {
    const save = CheckpointManager.loadSave();
    if (!save) return false;

    // Restore zone & floor state
    this.zoneManager.restoreFromSave(save.zoneNumber, save.currentFloor, save.bossesDefeated);
    this.currentFloor = save.currentFloor;
    this.playerGold = save.playerGold;
    this.playerKills = save.playerKills;

    // Regenerate world for the saved floor
    const seed = Math.floor(Math.random() * 999999);
    this.map = generateWorld({
      width: this.config.mapWidth,
      height: this.config.mapHeight,
      seed,
      tileSize: this.config.tileSize,
      floor: this.currentFloor,
    });
    this.pathfinder = new PathFinder(this.map);

    // Respawn player and enemies for this floor
    this.spawnSouls();

    // Restore player HP / mana
    if (this.playerSoul) {
      this.playerSoul.vitals.hpMax = save.playerHpMax;
      this.playerSoul.vitals.hp = save.playerHp;
      this.playerSoul.vitals.manaMax = save.playerManaMax;
      this.playerSoul.vitals.mana = save.playerMana;
      this.camera.centerOn(this.playerSoul.position);
    }

    // Restore inventory
    this.inventory = new InventoryOverlay();
    this.inventory.audio = this.audio;
    for (const itemId of save.inventorySnapshot) {
      this.inventory.addItem(itemId, 1);
    }
    // Restore equipment (equip saved items)
    const eqSlots: Array<'weapon' | 'armor' | 'accessory' | 'shield'> = ['weapon', 'armor', 'accessory', 'shield'];
    for (const itemId of save.equipmentSnapshot) {
      for (const slot of eqSlots) {
        if (!this.inventory.equipment[slot]) {
          this.inventory.equipment[slot] = itemId;
          break;
        }
      }
    }

    // Update match score label
    this.matchScore.phase = this.zoneManager.getPhaseLabel();

    return true;
  }

  private renderLoadingFrame(): void {
    this.renderer.renderLoadingScreen(this.loadProgress, this.loadMessage);
  }

  private spawnSouls(): void {
    const enemyClasses = [SoulClass.Soldier, SoulClass.Hitman, SoulClass.Robot, SoulClass.Survivor, SoulClass.Scout];
    const monsterSprites = this.zoneManager.enemySprites;
    this.souls = [];

    // Spawn player near center of map
    const centerX = Math.floor(this.config.mapWidth / 2);
    const centerY = Math.floor(this.config.mapHeight / 2);
    const spawn = this.findPassableTile(centerX, centerY);
    const spawnX = spawn.x;
    const spawnY = spawn.y;

    const player = createSoul(this.config.playerClass, 'player', { x: spawnX, y: spawnY }, Date.now());
    this.playerSoul = player;
    this.souls.push(player);

    // Spawn enemies scattered around the map (zone-based count)
    const enemyCount = this.zoneManager.enemyCount + (this.currentFloor - 1) * 2;
    this.enemiesRemaining = enemyCount;
    for (let i = 0; i < enemyCount; i++) {
      let ex: number, ey: number;
      let attempts = 0;
      do {
        ex = 3 + Math.floor(Math.random() * (this.config.mapWidth - 6));
        ey = 3 + Math.floor(Math.random() * (this.config.mapHeight - 6));
        attempts++;
      } while (
        attempts < 50 &&
        (!this.map.tiles[ey]?.[ex]?.isPassable || this.dist({ x: ex, y: ey }, { x: spawnX, y: spawnY }) < 10)
      );

      const cls = enemyClasses[i % enemyClasses.length];
      const enemy = createSoul(cls, 'enemy', { x: ex, y: ey }, Date.now() + i + 1);

      // Assign zone-specific monster sprite
      enemy.sprite = `mon_${monsterSprites[i % monsterSprites.length]}`;

      // Scale enemy stats with floor
      const floorMult = 1 + (this.currentFloor - 1) * 0.15;
      enemy.combat.attackPower = Math.floor(enemy.combat.attackPower * floorMult);
      enemy.vitals.hpMax = Math.floor(enemy.vitals.hpMax * floorMult);
      enemy.vitals.hp = enemy.vitals.hpMax;

      this.souls.push(enemy);
    }

    // Setup checkpoints for starting zone
    this.checkpointManager.clearZone();
    this.checkpointManager.setupZone(
      this.zoneManager.currentZoneNumber,
      centerX, centerY,
      (x, y) => this.findPassableTile(x, y),
    );
  }

  // ── Game Loop ── ────────────────────────────────────────
  start(): void {
    if (this.running) return;
    this.running = true;
    this.state = 'playing';
    this.matchScore.phase = this.zoneManager.getPhaseLabel();
    this.matchScore.matchTime = 0;

    // Start dungeon music
    if (!this.musicStarted) {
      this.audio.playMusic('music_dungeon', { fadeIn: 2000 });
      this.audio.playAmbient('amb_spooky', { volume: 0.15, fadeIn: 3000 });
      this.musicStarted = true;
    }

    if (this.playerSoul) {
      this.lastPlayerHp = this.playerSoul.vitals.hp;
    }

    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = 0;
    }
  }

  private loop = (): void => {
    if (!this.running) return;
    this.update();
    this.render();
    this.input.endFrame();
    this.frameCount++;
    this.animFrame = requestAnimationFrame(this.loop);
  };

  // ── Update ──────────────────────────────────────────────
  private update(): void {
    if (this.state === 'paused') {
      this.updatePauseMenu();
      return;
    }
    if (this.state !== 'playing') return;

    if (this.input.wasPressed('pause')) {
      if (this.inventory.isOpen) {
        this.inventory.close();
        return;
      }
      this.state = 'paused';
      this.audio.playSFX('pause', { volume: 0.3 });
      return;
    }

    // Inventory toggle (Tab / I)
    if (this.input.wasPressed('inventory')) {
      this.inventory.toggle();
      this.audio.playSFX(this.inventory.isOpen ? 'inventory_open' : 'inventory_close', { volume: 0.3 });
    }

    // Quick slot usage (1-4)
    if (this.playerSoul && this.playerSoul.isAlive && !this.inventory.isOpen) {
      const quickActions: Array<'quick_1' | 'quick_2' | 'quick_3' | 'quick_4'> = ['quick_1', 'quick_2', 'quick_3', 'quick_4'];
      for (let i = 0; i < quickActions.length; i++) {
        if (this.input.wasPressed(quickActions[i])) {
          const usedId = this.inventory.useQuickSlot(i, this.playerSoul);
          if (usedId) {
            const def = ITEMS[usedId];
            if (def?.effects) {
              this.applyItemEffects(def.effects);
              this.audio.playSFX('potion_drink', { volume: 0.5 });
              this.addKillFeed(`Used ${def.name}`, getRarityTextColor(def.rarity));
            }
          }
        }
      }
    }

    // If inventory is open, skip game updates (freeze gameplay)
    if (this.inventory.isOpen) {
      this.inventory.update(this.input.getMousePos().x, this.input.getMousePos().y, this.canvas.width, this.canvas.height);
      // Handle inventory clicks
      if (this.input.wasMouseClicked() && this.playerSoul) {
        const result = this.inventory.handleClick(
          this.input.getMousePos().x, this.input.getMousePos().y,
          this.canvas.width, this.canvas.height,
          this.playerGold, this.playerSoul, this.zoneManager.currentZoneNumber,
        );
        if (result.goldChange !== 0) {
          this.playerGold += result.goldChange;
          if (result.goldChange < 0) {
            this.audio.playSFX('coin_pickup', { volume: 0.4 });
          } else {
            this.audio.playSFX('collect_points', { volume: 0.4 });
          }
        }
        if (result.usedItemId) {
          const def = ITEMS[result.usedItemId];
          if (def?.effects) {
            this.applyItemEffects(def.effects);
            this.audio.playSFX('potion_drink', { volume: 0.5 });
          }
        }
      }
      return;
    }

    this.matchScore.phase = this.zoneManager.getPhaseLabel();
    this.matchScore.matchTime++;

    // Check if player died → checkpoint respawn or game over
    if (this.playerSoul && !this.playerSoul.isAlive) {
      this.audio.playSFX('player_death', { volume: 0.7 });
      const respawn = this.checkpointManager.onPlayerDeath();
      if (respawn) {
        // Respawn at checkpoint
        this.executeCheckpointRespawn(respawn.respawnPos, respawn.hpFraction);
      } else {
        // No checkpoint — true game over
        this.audio.stopMusic(1500);
        this.audio.stopAllAmbient(1500);
        this.endMatch();
      }
      return;
    }

    // Detect player taking damage
    if (this.playerSoul && this.playerSoul.isAlive) {
      if (this.playerSoul.vitals.hp < this.lastPlayerHp) {
        this.audio.playSFX('player_hurt', { volume: 0.5, cooldown: 300, randomPitch: true });
      }
      this.lastPlayerHp = this.playerSoul.vitals.hp;
    }

    // Check if all enemies dead → next floor
    this.enemiesRemaining = this.souls.filter(s => s.teamId === 'enemy' && s.isAlive).length;
    if (this.enemiesRemaining === 0) {
      this.advanceFloor();
      return;
    }

    // Last enemies standing — desperate boost
    if (this.enemiesRemaining <= 3 && this.enemiesRemaining > 0) {
      this.matchScore.phase = `${this.zoneManager.zoneName} — DESPERATE HOUR`;
      for (const s of this.souls) {
        if (s.teamId === 'enemy' && s.isAlive) {
          s.combat.attackPower *= 1.001;
          s.movement.speedCurrent *= 1.002;
        }
      }
    }

    this.weather.update();
    this.damageNumbers.update();
    this.screenShake.update();

    // Hitstop — freeze game briefly on impactful hits
    if (this.hitstopFrames > 0) {
      this.hitstopFrames--;
      return;
    }

    this.updatePlayer();
    this.updateAI();
    this.updateSouls();
    this.updateBullets();
    this.updateCombat();
    this.updateResources();
    this.updateLoot();
    this.updateDynamicEvents();
    this.updateCheckpoints();
    this.particles.update();

    // Boss system update
    if (this.bossSystem.isActive && this.playerSoul) {
      this.bossSystem.update(
        this.playerSoul.position,
        this.souls,
        (pos: Vector2) => {
          // Spawn a minion at given position
          const cls = [SoulClass.Soldier, SoulClass.Hitman, SoulClass.Robot][Math.floor(Math.random() * 3)];
          const minion = createSoul(cls, 'enemy', pos, Date.now() + Math.random() * 99999);
          const mSprites = this.zoneManager.enemySprites;
          minion.sprite = `mon_${mSprites[Math.floor(Math.random() * mSprites.length)]}`;
          const floorMult = this.zoneManager.getFloorMultiplier();
          minion.combat.attackPower = Math.floor(minion.combat.attackPower * floorMult * 0.6);
          minion.vitals.hpMax = Math.floor(minion.vitals.hpMax * floorMult * 0.5);
          minion.vitals.hp = minion.vitals.hpMax;
          minion.name = 'Minion';
          this.souls.push(minion);
          this.particles.emit(pos.x, pos.y, 8, { color: '#ff4444', speed: 0.08, size: 3, life: 15 });
          return minion;
        },
        (target: SoulEntity, damage: number, kb: Vector2) => {
          // Skip damage if player is invincible from checkpoint respawn
          if (target === this.playerSoul && this.checkpointManager.isInvincible) return;

          target.vitals.hp -= damage;
          target.velocity.x += kb.x;
          target.velocity.y += kb.y;
          this.damageNumbers.add(target.position, damage, { isCrit: false, isHeal: false });
          this.screenShake.shake(4, 8);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target as any).hitFlash = 8;
          this.audio.playSFX('hit_flesh', { volume: 0.5 });
          if (target.vitals.hp <= 0) {
            target.vitals.hp = 0;
            target.isAlive = false;
            if (target === this.playerSoul) {
              this.audio.playSFX('player_death', { volume: 0.7 });
              // Let the main update loop handle respawn/game-over on next frame
            }
          }
        },
      );

      // Boss died
      if (this.bossSystem.boss && !this.bossSystem.boss.isAlive && !this.bossSystem.bossState?.isDefeated) {
        const cfg = this.bossSystem.defeatBoss();
        if (cfg) {
          this.zoneManager.defeatBoss(cfg.id);
          this.addKillFeed(`🏆 ${cfg.name} DEFEATED!`, '#FFD700');
          this.audio.playSFX('combo_clear', { volume: 0.8 });
          this.audio.playSFX('achievement', { volume: 0.8, delay: 500 });
          this.audio.playMusic('music_dungeon', { fadeIn: 2000 });
          this.screenShake.shake(15, 30);
          this.particles.deathEffect(
            this.bossSystem.boss!.position.x,
            this.bossSystem.boss!.position.y,
            '#ff4444',
          );

          // Drop boss loot
          const goldAmt = cfg.goldDrop[0] + Math.floor(Math.random() * (cfg.goldDrop[1] - cfg.goldDrop[0]));
          this.playerGold += goldAmt;
          const goldColor = getGoldTierColors(goldAmt).textColor;
          this.addKillFeed(`💰 +${goldAmt} gold!`, goldColor);

          // Guaranteed loot drops
          for (const itemId of cfg.guaranteedLoot) {
            this.inventory.addItem(itemId, 1);
            const def = ITEMS[itemId];
            if (def) this.addKillFeed(`💎 Got ${def.name}!`, getRarityTextColor(def.rarity));
          }

          // Random loot rolls
          for (const drop of cfg.loot) {
            if (Math.random() < drop.chance) {
              this.inventory.addItem(drop.item, 1);
              const def = ITEMS[drop.item];
              if (def) this.addKillFeed(`💎 Got ${def.name}!`, getRarityTextColor(def.rarity));
            }
          }

          // Auto-save on boss defeat
          this.triggerAutoSave();
        }
      }
    }

    if (this.playerSoul?.isAlive) {
      this.camera.follow(this.playerSoul.position);
    }
    this.camera.update();

    if (this.frameCount % 300 === 0) {
      this.pathfinder.clearCache();
    }
  }

  private advanceFloor(): void {
    const zoneResult = this.zoneManager.advanceFloor();
    this.currentFloor = this.zoneManager.state.currentFloor;

    if (zoneResult === 'game_complete') {
      this.matchWon = true;
      this.addKillFeed('🏆 ALL ZONES CONQUERED! YOU WIN!', '#FFD700');
      this.audio.playSFX('achievement', { volume: 0.8 });
      this.audio.playMusic('music_victory', { fadeIn: 1000, loop: false });
      this.endMatch();
      return;
    }

    if (zoneResult === 'next_zone') {
      this.addKillFeed(`⚡ Entering ${this.zoneManager.zoneName}!`, '#FFD700');
      this.audio.playSFX('zone_transition', { volume: 0.6 });
      // Auto-save on zone transition
      this.triggerAutoSave();
    } else {
      this.addKillFeed(`⚡ FLOOR ${this.currentFloor} — Enemies grow stronger!`, '#FFD700');
    }

    this.audio.playSFX('achievement', { volume: 0.6 });
    this.bulletSystem.clear();
    this.lootSystem.clear();
    this.bossSystem.clear();

    // Heal player partially
    if (this.playerSoul) {
      this.playerSoul.vitals.hp = Math.min(this.playerSoul.vitals.hpMax,
        this.playerSoul.vitals.hp + this.playerSoul.vitals.hpMax * 0.3);
      this.playerSoul.vitals.mana = this.playerSoul.vitals.manaMax;
    }

    // Regenerate world
    const seed = Math.floor(Math.random() * 999999);
    this.map = generateWorld({
      width: this.config.mapWidth,
      height: this.config.mapHeight,
      seed,
      tileSize: this.config.tileSize,
      floor: this.currentFloor,
    });
    this.pathfinder = new PathFinder(this.map);

    // Keep player, respawn enemies on passable tiles
    const oldPlayer = this.playerSoul!;
    this.souls = [oldPlayer];
    const centerX = Math.floor(this.config.mapWidth / 2);
    const centerY = Math.floor(this.config.mapHeight / 2);
    const safeSpawn = this.findPassableTile(centerX, centerY);
    oldPlayer.position.x = safeSpawn.x;
    oldPlayer.position.y = safeSpawn.y;
    oldPlayer.velocity.x = 0;
    oldPlayer.velocity.y = 0;

    // Spawn new enemies (zone-based count)
    const enemyClasses = [SoulClass.Soldier, SoulClass.Hitman, SoulClass.Robot, SoulClass.Survivor, SoulClass.Scout];
    const monsterSprites = this.zoneManager.enemySprites;
    const enemyCount = this.zoneManager.enemyCount + (this.currentFloor - 1) * 2;
    this.enemiesRemaining = enemyCount;
    const floorMult = this.zoneManager.getFloorMultiplier();

    for (let i = 0; i < enemyCount; i++) {
      let ex: number, ey: number;
      let attempts = 0;
      do {
        ex = 3 + Math.floor(Math.random() * (this.config.mapWidth - 6));
        ey = 3 + Math.floor(Math.random() * (this.config.mapHeight - 6));
        attempts++;
      } while (attempts < 50 && (!this.map.tiles[ey]?.[ex]?.isPassable || this.dist({ x: ex, y: ey }, oldPlayer.position) < 10));

      const cls = enemyClasses[i % enemyClasses.length];
      const enemy = createSoul(cls, 'enemy', { x: ex, y: ey }, Date.now() + i + 1);
      enemy.sprite = `mon_${monsterSprites[i % monsterSprites.length]}`;
      enemy.combat.attackPower = Math.floor(enemy.combat.attackPower * floorMult);
      enemy.vitals.hpMax = Math.floor(enemy.vitals.hpMax * floorMult);
      enemy.vitals.hp = enemy.vitals.hpMax;
      this.souls.push(enemy);
    }

    // Setup checkpoints for this zone
    this.checkpointManager.clearZone();
    const cpCenterX = Math.floor(this.config.mapWidth / 2);
    const cpCenterY = Math.floor(this.config.mapHeight / 2);
    this.checkpointManager.setupZone(
      this.zoneManager.currentZoneNumber,
      cpCenterX, cpCenterY,
      (x, y) => this.findPassableTile(x, y),
    );

    // Spawn boss if this is a boss floor
    if (zoneResult === 'boss_floor' || this.zoneManager.shouldSpawnBoss()) {
      const bossId = this.zoneManager.getBossId();
      if (bossId) {
        const bossSpawn = this.findPassableTile(
          Math.floor(this.config.mapWidth * 0.7),
          Math.floor(this.config.mapHeight * 0.5),
        );
        const boss = this.bossSystem.spawnBoss(bossId, bossSpawn, floorMult);
        if (boss) {
          this.souls.push(boss);
          this.zoneManager.markBossSpawned();
          this.addKillFeed(`💀 ${BOSS_CONFIGS[bossId].name} has appeared!`, '#ff4444');
          this.audio.playSFX('alert_siren', { volume: 0.6 });
          this.audio.playMusic('music_boss', { fadeIn: 1000 });
        }
      }
    }

    this.attackCooldowns.clear();
    this.camera.centerOn(oldPlayer.position);
    this.particles.particles.length = 0;
  }

  private updatePlayer(): void {
    if (!this.playerSoul || !this.playerSoul.isAlive) return;
    const soul = this.playerSoul;

    // Movement with acceleration/deceleration
    let dx = 0, dy = 0;
    if (this.input.isDown('move_up')) dy = -1;
    if (this.input.isDown('move_down')) dy = 1;
    if (this.input.isDown('move_left')) dx = -1;
    if (this.input.isDown('move_right')) dx = 1;

    // Sprint — drains stamina, increases speed
    const isSprinting = this.input.isDown('sprint') && soul.vitals.stamina > 0 && (dx !== 0 || dy !== 0);
    if (isSprinting) {
      soul.vitals.stamina = Math.max(0, soul.vitals.stamina - 0.35);
    } else {
      soul.vitals.stamina = Math.min(soul.vitals.staminaMax, soul.vitals.stamina + 0.15);
    }

    if (dx !== 0 || dy !== 0) {
      // Diagonal correction
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;

      // Acceleration-based movement (not instant velocity)
      const targetSpeed = isSprinting ? soul.movement.speedCurrent * 0.035 : soul.movement.speedCurrent * 0.02;
      const accel = soul.movement.acceleration * 0.0004;
      soul.velocity.x += dx * accel;
      soul.velocity.y += dy * accel;

      // Clamp to target speed
      const curSpeed = Math.sqrt(soul.velocity.x ** 2 + soul.velocity.y ** 2);
      if (curSpeed > targetSpeed) {
        soul.velocity.x *= targetSpeed / curSpeed;
        soul.velocity.y *= targetSpeed / curSpeed;
      }

      // Update facing — preserve last horizontal direction for sprite flip
      soul.facing.y = dy;
      if (dx !== 0) soul.facing.x = dx;

      // Track vertical tilt ramp (for up/down sprite rotation)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = soul as any;
      if (dx === 0 && dy !== 0) {
        // Pure vertical movement — ramp tilt toward 1.0
        s.verticalTilt = Math.min(1, (s.verticalTilt || 0) + 0.06);
      } else {
        // Horizontal input present — decay tilt
        s.verticalTilt = Math.max(0, (s.verticalTilt || 0) - 0.12);
      }

      // Footstep sounds
      this.footstepTimer--;
      if (this.footstepTimer <= 0) {
        this.footstepTimer = isSprinting ? 12 : 20;
        this.audio.playSFX('footsteps', { volume: 0.2, cooldown: 150, randomPitch: true });
      }
    } else {
      this.footstepTimer = 0;
      // Decay vertical tilt when not moving
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s2 = soul as any;
      s2.verticalTilt = Math.max(0, (s2.verticalTilt || 0) - 0.12);
    }

    // Dash (dodge roll)
    if (this.input.wasPressed('dash') && soul.movement.dashCharges > 0 && soul.vitals.stamina > 15) {
      soul.velocity.x += soul.facing.x * 0.35;
      soul.velocity.y += soul.facing.y * 0.35;
      soul.movement.dashCharges--;
      soul.vitals.stamina -= 15;
      this.particles.dashEffect(soul.position.x, soul.position.y, soul.facing.x, soul.facing.y, soul.physical.colorPrimary);
      this.audio.playSFX('dodge_roll', { volume: 0.5 });
    }

    // Shoot (mouse click or hold) — fires bullets toward cursor
    if (this.input.isMouseDown()) {
      const ws = this.playerWeapon;
      ws.cooldown = Math.max(0, ws.cooldown - 1);

      if (ws.reloading > 0) {
        ws.reloading--;
        if (ws.reloading <= 0) {
          ws.ammo = ws.weapon.magSize;
          this.addKillFeed('Reloaded!', '#88ff88');
        }
      } else if (ws.cooldown <= 0 && ws.ammo > 0) {
        const mouseWorld = this.camera.screenToWorld(
          this.input.getMousePos().x,
          this.input.getMousePos().y,
        );
        const aimDx = mouseWorld.x - soul.position.x;
        const aimDy = mouseWorld.y - soul.position.y;
        const angle = Math.atan2(aimDy, aimDx);

        // Update facing — only flip horizontal direction, don't touch facing.y
        const aimCos = Math.cos(angle);
        if (Math.abs(aimCos) > 0.15) soul.facing.x = aimCos;

        this.bulletSystem.fire(
          { x: soul.position.x, y: soul.position.y },
          angle, ws.weapon, soul.id, soul.teamId, soul.physical.colorPrimary,
        );

        // Weapon fire sound
        const weaponSoundMap: Record<string, string> = {
          Pistol: 'pistol_fire', Shotgun: 'shotgun_fire',
          Rifle: 'rifle_fire', SMG: 'smg_fire',
        };
        this.audio.playSFX(weaponSoundMap[ws.weapon.name] || 'pistol_fire', {
          volume: 0.5, cooldown: ws.weapon.fireRate * 10, randomPitch: true,
        });

        ws.ammo--;
        ws.cooldown = ws.weapon.fireRate;

        // Gun raise animation — show _gun pose for 15 frames
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (soul as any).shootingFrames = 15;

        // Muzzle flash particles
        this.particles.emit(
          soul.position.x + soul.facing.x * 0.5,
          soul.position.y + soul.facing.y * 0.5,
          4, { color: '#ffaa33', speed: 0.08, size: 3, life: 8, spread: 0.6, dirX: soul.facing.x, dirY: soul.facing.y },
        );
        // Light screen shake on fire
        this.screenShake.shake(1.5, 4);
      } else if (ws.ammo <= 0 && ws.reloading <= 0) {
        // Auto-reload when empty
        ws.reloading = ws.weapon.reloadTime;
        this.addKillFeed('Reloading...', '#ffaa00');
        this.audio.playSFX('reload', { volume: 0.4 });
        this.audio.playSFX('empty_click', { volume: 0.3 });
      }
    } else {
      // Tick cooldown when not firing
      this.playerWeapon.cooldown = Math.max(0, this.playerWeapon.cooldown - 1);
      if (this.playerWeapon.reloading > 0) {
        this.playerWeapon.reloading--;
        if (this.playerWeapon.reloading <= 0) {
          this.playerWeapon.ammo = this.playerWeapon.weapon.magSize;
          this.addKillFeed('Reloaded!', '#88ff88');
        }
      }
    }

    // Manual reload (R key, mapped to ability_3)
    if (this.input.wasPressed('ability_3') && this.playerWeapon.ammo < this.playerWeapon.weapon.magSize && this.playerWeapon.reloading <= 0) {
      this.playerWeapon.reloading = this.playerWeapon.weapon.reloadTime;
      this.addKillFeed('Reloading...', '#ffaa00');
      this.audio.playSFX('reload', { volume: 0.4 });
    }

    // Abilities
    const abilityActions: Array<'ability_1' | 'ability_2' | 'ability_3' | 'ability_4'> = ['ability_1', 'ability_2', 'ability_3', 'ability_4'];
    for (let i = 0; i < abilityActions.length; i++) {
      if (this.input.wasPressed(abilityActions[i]) && soul.abilities[i]) {
        const ab = soul.abilities[i];
        if (ab.cooldownRemaining <= 0 && soul.vitals.mana >= ab.manaCost) {
          soul.vitals.mana -= ab.manaCost;
          ab.cooldownRemaining = ab.cooldown;

          // Find target in range
          const target = this.findNearestEnemy(soul, ab.range);
          if (target) {
            const { result, updatedDefender } = processAttack(soul, target, i);
            Object.assign(target, updatedDefender);
            if (result.finalDamage > 0) {
              this.particles.abilityEffect(target.position.x, target.position.y, soul.physical.colorPrimary);
              if (!target.isAlive) {
                this.onSoulDeath(target, soul);
              }
            }
          } else {
            this.particles.abilityEffect(
              soul.position.x + soul.facing.x * ab.range * 0.5,
              soul.position.y + soul.facing.y * ab.range * 0.5,
              soul.physical.colorPrimary,
            );
          }
        }
      }
    }
  }

  private updateBullets(): void {
    this.bulletSystem.update(this.map);

    // Check hits
    const hits = this.bulletSystem.checkHits(this.souls);
    for (const { bullet, target } of hits) {
      // Skip damage if player is invincible from checkpoint respawn
      if (target === this.playerSoul && this.checkpointManager.isInvincible) continue;

      // Apply damage directly (bypass processAttack for bullets)
      const isCrit = Math.random() < 0.08;
      const dmg = isCrit ? Math.floor(bullet.damage * 1.5) : bullet.damage;
      target.vitals.hp -= dmg;
      if (target.vitals.hp <= 0) {
        target.vitals.hp = 0;
        target.isAlive = false;
      }

      // Knockback
      const kbx = bullet.vx / Math.sqrt(bullet.vx ** 2 + bullet.vy ** 2) * bullet.knockback;
      const kby = bullet.vy / Math.sqrt(bullet.vx ** 2 + bullet.vy ** 2) * bullet.knockback;
      target.velocity.x += kbx;
      target.velocity.y += kby;

      // Impact particles (spark burst)
      this.particles.emit(bullet.x, bullet.y, 6, {
        color: '#ffffff', speed: 0.1, size: 2, life: 12, spread: Math.PI,
        dirX: -bullet.vx, dirY: -bullet.vy,
      });
      // Blood/hit particles
      this.particles.emit(bullet.x, bullet.y, 4, {
        color: '#ff4444', speed: 0.06, size: 2, life: 20, spread: Math.PI * 0.5,
        dirX: bullet.vx, dirY: bullet.vy,
      });

      // Damage number
      this.damageNumbers.add(target.position, dmg, { isCrit, isHeal: false });
      this.screenShake.shake(isCrit ? 5 : 2.5, isCrit ? 10 : 6);

      // Impact sounds
      this.audio.playSFX(isCrit ? 'critical_hit' : 'hit_flesh', {
        volume: isCrit ? 0.6 : 0.4,
        randomPitch: true,
        spatial: true,
        sourceX: target.position.x, sourceY: target.position.y,
        listenerX: this.playerSoul?.position.x, listenerY: this.playerSoul?.position.y,
        cooldown: 50,
      });

      // Hitstop on crits
      if (isCrit) this.hitstopFrames = 3;

      // Flash the target (tracked via ad-hoc property)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (target as any).hitFlash = 8;

      const attacker = this.souls.find(s => s.id === bullet.ownerId);
      if (!target.isAlive && attacker) {
        this.onSoulDeath(target, attacker);
      }
    }
  }

  private updateAI(): void {
    for (const soul of this.souls) {
      if (soul === this.playerSoul || !soul.isAlive) continue;

      const allies = this.souls.filter(o => o.teamId === soul.teamId && o.id !== soul.id && o.isAlive);
      const enemies = this.souls.filter(o => o.teamId !== soul.teamId && o.isAlive);

      const decision = this.ai.decide({
        soul,
        allies,
        enemies,
        map: this.map,
        teamFlag: { carriedBy: null, position: soul.position },
        enemyFlags: [],
        teamBasePos: soul.position,
        pathfinder: this.pathfinder,
      }, this.frameCount);

      // Execute decision — cap AI movement speed
      if (decision.targetPosition) {
        const isPatrol = decision.state === 'patrol' || decision.state === 'idle';
        const maxSpeed = isPatrol ? 0.008 : 0.013; // wander slow, chase faster
        const speed = Math.min(soul.movement.speedCurrent * 0.015, maxSpeed);
        this.moveToward(soul, decision.targetPosition, speed);
      }

      // AI attack — fire bullets at target
      if (decision.attackTargetId) {
        const target = this.souls.find(o => o.id === decision.attackTargetId);
        if (target && target.isAlive) {
          const dist = this.dist(soul.position, target.position);
          if (dist <= soul.combat.attackRange + 1) {
            const cd = this.attackCooldowns.get(soul.id) || 0;
            if (cd <= 0) {
              const angle = Math.atan2(target.position.y - soul.position.y, target.position.x - soul.position.x);
              this.bulletSystem.fire(
                { x: soul.position.x, y: soul.position.y },
                angle, WEAPONS.pistol, soul.id, soul.teamId, soul.physical.colorPrimary,
              );
              this.attackCooldowns.set(soul.id, Math.floor(60 / soul.combat.attackSpeed));
              // AI gun raise animation
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (soul as any).shootingFrames = 15;
              // AI muzzle flash
              this.particles.emit(
                soul.position.x + Math.cos(angle) * 0.4,
                soul.position.y + Math.sin(angle) * 0.4,
                3, { color: '#ffaa33', speed: 0.06, size: 2, life: 6, spread: 0.5, dirX: Math.cos(angle), dirY: Math.sin(angle) },
              );
            }
          }
        }
      }

      // AI ability use
      if (decision.abilityToUse >= 0 && decision.abilityToUse < soul.abilities.length) {
        const ab = soul.abilities[decision.abilityToUse];
        if (ab.cooldownRemaining <= 0 && soul.vitals.mana >= ab.manaCost) {
          soul.vitals.mana -= ab.manaCost;
          ab.cooldownRemaining = ab.cooldown;
          const target = this.findNearestEnemy(soul, ab.range);
          if (target) {
            const { result: aiResult, updatedDefender: aiDefender } = processAttack(soul, target);
            Object.assign(target, aiDefender);
            if (aiResult.finalDamage > 0) {
              this.particles.abilityEffect(target.position.x, target.position.y, soul.physical.colorPrimary);
              if (!target.isAlive) this.onSoulDeath(target, soul);
            }
          }
        }
      }
    }
  }

  private updateSouls(): void {
    for (const soul of this.souls) {
      if (!soul.isAlive) continue;

      // Physics — apply velocity with drag for natural deceleration
      const newX = soul.position.x + soul.velocity.x;
      const newY = soul.position.y + soul.velocity.y;

      // Wall collision — slide along walls instead of bouncing
      const txNew = Math.floor(newX);
      const tyNew = Math.floor(newY);
      const tileX = this.map.tiles[Math.floor(soul.position.y)]?.[txNew];
      const tileY = this.map.tiles[tyNew]?.[Math.floor(soul.position.x)];
      const tileBoth = this.map.tiles[tyNew]?.[txNew];

      if (tileBoth && tileBoth.isPassable) {
        // Both axes passable — full move
        soul.position.x = newX;
        soul.position.y = newY;
      } else if (tileX && tileX.isPassable) {
        // Can slide on X axis only
        soul.position.x = newX;
        soul.velocity.y *= -0.1;
      } else if (tileY && tileY.isPassable) {
        // Can slide on Y axis only
        soul.position.y = newY;
        soul.velocity.x *= -0.1;
      } else {
        // Blocked on both — push back gently
        soul.velocity.x *= -0.2;
        soul.velocity.y *= -0.2;
      }

      // Drag/friction: higher = slower stop. Movement feels weighty.
      const drag = soul.movement.friction || 0.85;
      soul.velocity.x *= drag;
      soul.velocity.y *= drag;
      // Kill tiny velocities to prevent drift
      if (Math.abs(soul.velocity.x) < 0.001) soul.velocity.x = 0;
      if (Math.abs(soul.velocity.y) < 0.001) soul.velocity.y = 0;

      // Biome speed modifier + weather
      const tx = Math.floor(soul.position.x);
      const ty = Math.floor(soul.position.y);
      const tile = this.map.tiles[ty]?.[tx];
      if (tile) {
        const biomeEffect = tile.properties.friction;
        const weatherEffects = this.weather.getEffects();
        soul.movement.speedCurrent = soul.movement.speedBase * biomeEffect * weatherEffects.speedMult;
      }

      // Regen and cooldowns
      tickSoul(soul, 1);

      // Tick gun animation frame counter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sf = (soul as any).shootingFrames as number | undefined;
      if (sf && sf > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (soul as any).shootingFrames = sf - 1;
        // When gun animation ends, reset facing.y so shot direction doesn't linger
        if (sf - 1 <= 0) {
          soul.facing.y = 0;
        }
      }

      // Attack cooldown
      const cd = this.attackCooldowns.get(soul.id) || 0;
      if (cd > 0) this.attackCooldowns.set(soul.id, cd - 1);

      // Clamp to map
      soul.position.x = Math.max(1, Math.min(this.config.mapWidth - 2, soul.position.x));
      soul.position.y = Math.max(1, Math.min(this.config.mapHeight - 2, soul.position.y));
    }
  }

  private updateCombat(): void {
    // Auto-attack for AI in range
    // (Handled in updateAI, this is for collision-based combat)
    for (let i = 0; i < this.souls.length; i++) {
      for (let j = i + 1; j < this.souls.length; j++) {
        const a = this.souls[i];
        const b = this.souls[j];
        if (!a.isAlive || !b.isAlive || a.teamId === b.teamId) continue;

        const dist = this.dist(a.position, b.position);
        if (dist < 1) {
          // Collision push
          const dx = b.position.x - a.position.x;
          const dy = b.position.y - a.position.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const push = 0.15;
          a.velocity.x -= (dx / len) * push;
          a.velocity.y -= (dy / len) * push;
          b.velocity.x += (dx / len) * push;
          b.velocity.y += (dy / len) * push;
        }
      }
    }
  }

  private updateResources(): void {
    for (const res of this.map.resourceNodes) {
      if (res.remaining <= 0) continue;
      for (const soul of this.souls) {
        if (!soul.isAlive) continue;
        if (this.dist(soul.position, res.position) < 1.5) {
          res.remaining--;
          switch (res.type) {
            case 'mana_crystal':
              soul.vitals.mana = Math.min(soul.vitals.manaMax, soul.vitals.mana + 30);
              break;
            case 'health_soul':
              soul.vitals.hp = Math.min(soul.vitals.hpMax, soul.vitals.hp + 20);
              break;
            case 'speed_boost':
              soul.movement.speedCurrent = soul.movement.speedBase * 1.5;
              break;
            case 'shield_charge':
              soul.vitals.shield = Math.min(soul.vitals.shieldMax, soul.vitals.shield + 25);
              break;
          }
          // Award gold to player
          if (soul === this.playerSoul) {
            this.playerGold += 5;
          }
          this.particles.emit(res.position.x, res.position.y, 6, {
            color: '#ffffff',
            speed: 0.05,
            size: 2,
            life: 30,
          });
          break;
        }
      }
    }
  }

  private updateLoot(): void {
    if (!this.playerSoul || !this.playerSoul.isAlive) return;

    // E-key to interact with chests
    if (this.input.wasPressed('ability_2')) {
      for (let i = this.map.structures.length - 1; i >= 0; i--) {
        const s = this.map.structures[i];
        if (s.type === 'chest' && this.dist(this.playerSoul.position, s.position) < 2.0) {
          // Open chest — roll loot
          const loot = rollLoot(CHEST_LOOT, 2 + Math.floor(this.currentFloor / 3), this.currentFloor);
          this.lootSystem.spawnDrops(loot, s.position);
          this.particles.emit(s.position.x, s.position.y, 12, {
            color: '#DDBB33', speed: 0.08, size: 3, life: 25, spread: Math.PI * 2,
          });
          this.addKillFeed('💎 Chest opened!', '#DDBB33');
          this.audio.playSFX('chest_open', { volume: 0.5 });
          this.audio.playSFX('power_up_2', { volume: 0.35, delay: 200 });
          this.map.structures.splice(i, 1);
          break;
        }
      }
    }

    // Bullet vs breakable structures
    for (let bi = this.bulletSystem.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bulletSystem.bullets[bi];
      for (let si = this.map.structures.length - 1; si >= 0; si--) {
        const s = this.map.structures[si];
        const breakable = s.type === 'barrel' || s.type === 'crate' || s.type === 'crate_small' || s.type === 'barrels_stacked';
        if (!breakable) continue;

        const dx = b.x - s.position.x;
        const dy = b.y - s.position.y;
        if (Math.abs(dx) < 0.8 && Math.abs(dy) < 0.8) {
          s.hp -= b.damage;
          this.particles.emit(s.position.x, s.position.y, 4, {
            color: '#8b6914', speed: 0.06, size: 2, life: 15,
          });
          this.bulletSystem.bullets.splice(bi, 1);

          if (s.hp <= 0) {
            // Breakable destroyed — drop loot
            const loot = rollLoot(BREAKABLE_LOOT, 1, this.currentFloor);
            this.lootSystem.spawnDrops(loot, s.position);
            this.particles.emit(s.position.x, s.position.y, 8, {
              color: '#aa7722', speed: 0.1, size: 3, life: 20,
            });
            this.audio.playSFX('break_barrel', { volume: 0.4, randomPitch: true });
            this.map.structures.splice(si, 1);
          }
          break;
        }
      }
    }

    // Update loot pickups
    const pickupResult = this.lootSystem.update(this.playerSoul.position, this.frameCount);
    this.playerGold += pickupResult.goldGained;

    if (pickupResult.goldGained > 0) {
      this.audio.playSFX('coin_pickup', { volume: 0.3, cooldown: 80, randomPitch: true });
    }

    if (pickupResult.ammoGained > 0) {
      this.playerWeapon.ammo = Math.min(this.playerWeapon.weapon.magSize,
        this.playerWeapon.ammo + this.playerWeapon.weapon.magSize);
      this.audio.playSFX('reload', { volume: 0.3 });
    }

    // Apply consumable effects from picked-up items
    for (const itemId of pickupResult.itemsPickedUp) {
      const def = ITEMS[itemId];
      // Add to inventory overlay
      this.inventory.addItem(itemId, 1);
      if (def && def.category === 'consumable' && def.effects) {
        this.applyItemEffects(def.effects);
        this.audio.playSFX('item_pickup', { volume: 0.4, randomPitch: true });
        if (def.effects.healHp) {
          this.audio.playSFX('heal', { volume: 0.3, delay: 100 });
        }
      } else {
        this.audio.playSFX('item_pickup', { volume: 0.35, randomPitch: true });
      }
    }
  }

  private applyItemEffects(effects: NonNullable<(typeof ITEMS)[string]['effects']>): void {
    if (!this.playerSoul) return;
    const soul = this.playerSoul;
    if (effects.healHp) soul.vitals.hp = Math.min(soul.vitals.hpMax, soul.vitals.hp + effects.healHp);
    if (effects.healMana) soul.vitals.mana = Math.min(soul.vitals.manaMax, soul.vitals.mana + effects.healMana);
    if (effects.healStamina) soul.vitals.stamina = Math.min(soul.vitals.staminaMax, soul.vitals.stamina + effects.healStamina);
    if (effects.healShield) soul.vitals.shield = Math.min(soul.vitals.shieldMax, soul.vitals.shield + effects.healShield);
    if (effects.attackBoost) soul.combat.attackPower += effects.attackBoost;
    if (effects.defenseBoost) soul.combat.armor += effects.defenseBoost;
  }

  private updateDynamicEvents(): void {
    // Tick active event
    if (this.activeEvent) {
      this.activeEvent.timer--;
      // Apply event effects
      if (this.activeEvent.type === 'MANA_SURGE') {
        // Souls near the event position get mana regen
        for (const soul of this.souls) {
          if (!soul.isAlive) continue;
          if (this.dist(soul.position, this.activeEvent.position) < 8) {
            soul.vitals.mana = Math.min(soul.vitals.manaMax, soul.vitals.mana + 0.3);
          }
        }
      } else if (this.activeEvent.type === 'ECLIPSE') {
        // Reduced vision — tricksters get stealth boost
        for (const soul of this.souls) {
          if (soul.class === SoulClass.Hitman && soul.isAlive) {
            soul.vitals.mana = Math.min(soul.vitals.manaMax, soul.vitals.mana + 0.1);
          }
        }
      }

      // Event expired
      if (this.activeEvent.timer <= 0) {
        this.addKillFeed('Dynamic event ended.', '#888888');
        this.activeEvent = null;
        this.eventCooldown = 60 * 30; // 30s cooldown between events
      }
      return;
    }

    // Cooldown between events
    if (this.eventCooldown > 0) {
      this.eventCooldown--;
      return;
    }

    // 0.5% chance per frame to trigger (roughly every ~3 minutes)
    if (Math.random() > 0.005) return;

    const events = [
      { type: 'MANA_SURGE', description: '⚡ Mana Surge! Control the crystal for bonus mana!' },
      { type: 'ECLIPSE', description: '🌑 Eclipse! Vision reduced — tricksters empowered!' },
      { type: 'POWER_RUNE', description: '💎 Power Rune spawned! First to grab it gets a boost!' },
      { type: 'BLOOD_MOON', description: '🔴 Blood Moon! All damage increased by 50%!' },
    ];

    const chosen = events[Math.floor(Math.random() * events.length)];
    const pos = {
      x: 10 + Math.random() * (this.config.mapWidth - 20),
      y: 10 + Math.random() * (this.config.mapHeight - 20),
    };

    this.activeEvent = {
      type: chosen.type,
      description: chosen.description,
      timer: 60 * 20, // 20 seconds
      position: pos,
    };

    this.addKillFeed(chosen.description, '#FFD700');
    this.particles.flagCaptureEffect(pos.x, pos.y);
    this.audio.playSFX('alert_siren', { volume: 0.4 });
  }

  private onSoulDeath(dead: SoulEntity, killer: SoulEntity): void {
    dead.isAlive = false;
    this.particles.deathEffect(dead.position.x, dead.position.y, dead.physical.colorPrimary);
    this.screenShake.shake(8, 15);
    this.damageNumbers.add(dead.position, 0, { isCrit: false, isHeal: false, color: '#ff4444' });
    this.addKillFeed(`${killer.name} killed ${dead.name}!`, killer.physical.colorPrimary);

    // Death sound
    this.audio.playSFX('enemy_death', {
      volume: 0.5, randomPitch: true,
      spatial: true,
      sourceX: dead.position.x, sourceY: dead.position.y,
      listenerX: this.playerSoul?.position.x, listenerY: this.playerSoul?.position.y,
    });

    // Splatter nearby tiles
    const tx = Math.floor(dead.position.x);
    const ty = Math.floor(dead.position.y);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tile = this.map.tiles[ty + dy]?.[tx + dx];
        if (tile && Math.random() > 0.5) tile.bloodSplatter = true;
      }
    }

    // Track kills and gold for player
    if (killer === this.playerSoul) {
      this.playerKills++;
      this.playerGold += 10 + this.currentFloor * 5;

      // Drop loot from killed enemy
      const lootRolls = 1 + Math.floor(this.currentFloor / 3);
      const loot = rollLoot(ENEMY_LOOT, lootRolls, this.currentFloor);
      // Always drop some gold
      loot.push({ itemId: 'gold_coin', count: 3 + Math.floor(Math.random() * (this.currentFloor * 2)) });
      this.lootSystem.spawnDrops(loot, dead.position);
    }
  }

  private endMatch(): void {
    this.state = 'post_match';
    this.matchScore.phase = 'Game Over';
    // Game over music after a short delay
    setTimeout(() => {
      this.audio.playMusic('music_game_over', { volume: 0.5, loop: false, fadeIn: 1000 });
    }, 1500);
  }

  // ── Render ──────────────────────────────────────────────
  private render(): void {
    this.renderer.clear();

    if (this.state === 'menu') {
      this.renderMenu();
      return;
    }

    if (this.state === 'post_match') {
      this.renderPostMatch();
      return;
    }

    // Apply screen shake
    const shakeX = this.screenShake.offsetX;
    const shakeY = this.screenShake.offsetY;
    if (shakeX || shakeY) {
      this.ctx.save();
      this.ctx.translate(shakeX, shakeY);
    }

    // Render game world
    this.renderer.renderTiles(this.map, this.camera, this.textures);
    this.renderer.renderResources(this.map, this.camera);
    this.renderer.renderStructures(this.map, this.camera, this.textures);
    this.renderer.renderCheckpoints(this.checkpointManager.checkpoints, this.camera, this.frameCount);
    this.renderer.renderCheckpointFlash(this.checkpointManager.getActivationFlash(), this.camera);
    this.renderer.renderLootDrops(this.lootSystem.drops, this.camera, this.frameCount, this.textures);
    this.renderer.renderSouls(this.souls, this.camera, this.playerSoul?.id || '', this.textures);
    this.renderer.renderBullets(this.bulletSystem.bullets, this.camera);
    this.renderer.renderParticles(this.particles.particles, this.camera);
    this.renderer.renderPickupTexts(this.lootSystem.pickupTexts, this.camera);

    // Render dynamic event marker
    if (this.activeEvent) {
      const ex = (this.activeEvent.position.x - this.camera.x) * this.camera.tileSize + this.canvas.width / 2;
      const ey = (this.activeEvent.position.y - this.camera.y) * this.camera.tileSize + this.canvas.height / 2;
      const pulse = Math.sin(Date.now() * 0.005) * 4;
      const radius = 16 + pulse;
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(ex, ey, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(ex, ey, radius * 0.5, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      this.ctx.fill();
    }

    // Weather overlay
    this.weather.renderWeather(this.ctx, this.canvas.width, this.canvas.height);

    // Floating damage numbers
    for (const dn of this.damageNumbers.numbers) {
      const sx = (dn.x - this.camera.x) * this.camera.tileSize + this.canvas.width / 2;
      const sy = (dn.y - this.camera.y) * this.camera.tileSize + this.canvas.height / 2;
      const alpha = dn.life / dn.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.font = dn.isCrit ? 'bold 22px monospace' : 'bold 16px monospace';
      this.ctx.fillStyle = dn.color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(dn.value > 0 ? `${dn.value}` : 'KILLED', sx, sy);
    }
    this.ctx.globalAlpha = 1;
    this.ctx.textAlign = 'left';

    if (shakeX || shakeY) {
      this.ctx.restore();
    }

    this.renderer.renderMinimap(this.map, this.souls, this.camera, this.playerSoul?.teamId || '');
    this.weather.renderWeatherHUD(this.ctx, this.canvas.width - 160, 10);
    this.renderer.renderHUD(
      this.playerSoul || undefined,
      { kills: this.playerKills, gold: this.playerGold, floor: this.currentFloor, enemiesLeft: this.enemiesRemaining, items: this.lootSystem.inventory.length, zoneName: this.zoneManager.zoneName },
      this.matchScore.matchTime,
      this.matchScore.phase,
      this.matchScore.killFeed,
    );
    this.renderer.renderAmmoHUD(this.playerWeapon);

    // Boss health bar
    if (this.bossSystem.isBossAlive) {
      this.bossSystem.renderBossHealthBar(this.ctx, this.canvas.width);
    }

    // Checkpoint save indicator
    this.renderer.renderSaveIndicator(this.checkpointManager.getSaveIndicator());

    // Invincibility shimmer after checkpoint respawn
    if (this.checkpointManager.isInvincible && this.playerSoul?.isAlive) {
      this.renderer.renderInvincibleOverlay(this.playerSoul.position, this.camera, this.frameCount);
    }

    // Inventory overlay (renders on top of everything)
    this.inventory.render(
      this.ctx, this.canvas.width, this.canvas.height,
      this.playerGold, this.playerSoul || null, this.zoneManager.currentZoneNumber,
    );

    // Paused overlay
    if (this.state === 'paused') {
      this.renderPauseScreen();
    }
  }

  private renderMenu(): void {
    // Menu is handled by React — auto-start when engine is in menu state
    this.start();
  }

  private renderPostMatch(): void {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const cx = this.canvas.width / 2;

    // Title — victory or death
    if (this.matchWon) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 48px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('VICTORY', cx, 100);
    } else {
      this.ctx.fillStyle = '#ff4444';
      this.ctx.font = 'bold 48px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('YOU DIED', cx, 100);
    }

    // Stats
    this.ctx.font = '22px monospace';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(`⚔ Kills: ${this.playerKills}`, cx, 170);
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`💰 Gold: ${this.playerGold}`, cx, 205);
    this.ctx.fillStyle = '#a855f7';
    this.ctx.fillText(`🏰 Floors Cleared: ${this.currentFloor - 1}`, cx, 240);

    // Duration
    const mins = Math.floor(this.matchScore.matchTime / 3600);
    const secs = Math.floor((this.matchScore.matchTime % 3600) / 60);
    this.ctx.fillStyle = '#888';
    this.ctx.font = '16px monospace';
    this.ctx.fillText(`Survived: ${mins}:${secs.toString().padStart(2, '0')}`, cx, 280);

    // Kill feed recap
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = '#666';
    let y = 320;
    for (const entry of this.matchScore.killFeed.slice(-6)) {
      this.ctx.fillText(entry.text, cx, y);
      y += 16;
    }

    // Credits
    y = Math.max(y + 20, 430);
    this.ctx.fillStyle = '#555';
    this.ctx.font = '12px monospace';
    this.ctx.fillText('— CREDITS —', cx, y);
    y += 22;
    this.ctx.fillStyle = '#a855f7';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.fillText('Created by', cx, y);
    y += 20;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillText('stevestudent   battledoze   steve embry', cx, y);

    // Play again button
    const btnW = 220, btnH = 50;
    const btnX = cx - btnW / 2;
    const btnY = this.canvas.height - 100;
    const time = Date.now() * 0.001;
    const pulse = Math.sin(time * 3) * 0.15 + 0.85;
    this.ctx.fillStyle = `rgba(136, 68, 255, ${pulse})`;
    this.ctx.fillRect(btnX, btnY, btnW, btnH);
    this.ctx.strokeStyle = '#c084fc';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(btnX, btnY, btnW, btnH);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px monospace';
    this.ctx.fillText('ENTER AGAIN', cx, btnY + 32);
    this.ctx.textAlign = 'left';

    if (this.input.wasMouseClicked()) {
      const m = this.input.getMousePos();
      if (m.x >= btnX && m.x <= btnX + btnW && m.y >= btnY && m.y <= btnY + btnH) {
        this.audio.playSFX('game_start', { volume: 0.5 });
        this.restart();
      }
    }
  }

  // ── Checkpoint System ────────────────────────────────────

  private updateCheckpoints(): void {
    if (!this.playerSoul || !this.playerSoul.isAlive) return;

    this.checkpointManager.update(this.playerSoul.position, this.frameCount);

    // Consume heal from checkpoint activation
    const heal = this.checkpointManager.consumeHeal();
    if (heal > 0) {
      const soul = this.playerSoul;
      const actual = Math.min(heal, soul.vitals.hpMax - soul.vitals.hp);
      soul.vitals.hp = Math.min(soul.vitals.hpMax, soul.vitals.hp + heal);
      if (actual > 0) {
        this.damageNumbers.add(soul.position, actual, { isCrit: false, isHeal: true });
      }
      this.audio.playSFX('checkpoint_activate' as string, { volume: 0.6 });
      this.particles.emit(soul.position.x, soul.position.y, 12, {
        color: '#44DDFF', speed: 0.06, size: 2, life: 25, spread: Math.PI * 2,
      });
    }

    // Checkpoint just activated — auto save + feed message
    if (this.checkpointManager.wasJustActivated()) {
      const cp = this.checkpointManager.activeCheckpoint;
      if (cp) {
        cp.zoneNumber = this.zoneManager.currentZoneNumber;
        this.addKillFeed(`✦ Checkpoint: ${cp.name}`, '#44DDFF');
        this.triggerAutoSave();
      }
    }

    // Periodic auto-save (every ~5 minutes)
    if (this.checkpointManager.shouldAutoSave()) {
      this.triggerAutoSave();
    }

    // Invincibility: reduce damage to 0
    if (this.checkpointManager.isInvincible) {
      // Handled in damage application — the player flashes but takes no damage
    }
  }

  private executeCheckpointRespawn(respawnPos: Vector2, hpFraction: number): void {
    if (!this.playerSoul) return;

    const soul = this.playerSoul;

    // Revive the player
    soul.isAlive = true;
    soul.vitals.hp = Math.floor(soul.vitals.hpMax * hpFraction);
    soul.vitals.mana = soul.vitals.manaMax;
    soul.vitals.stamina = soul.vitals.staminaMax;
    soul.position.x = respawnPos.x;
    soul.position.y = respawnPos.y;
    soul.velocity.x = 0;
    soul.velocity.y = 0;

    // Start invincibility
    this.checkpointManager.startRespawnInvincibility();

    // Respawn all dead enemies (clear dead, spawn fresh)
    this.respawnEnemies();

    // Reset boss if boss fight was in progress
    if (this.bossSystem.isActive && this.bossSystem.boss) {
      const bossId = this.zoneManager.getBossId();
      if (bossId) {
        // Reset boss to full HP
        this.bossSystem.clear();
        const floorMult = this.zoneManager.getFloorMultiplier();
        const bossSpawn = this.findPassableTile(
          Math.floor(this.config.mapWidth * 0.7),
          Math.floor(this.config.mapHeight * 0.5),
        );
        const boss = this.bossSystem.spawnBoss(bossId, bossSpawn, floorMult);
        if (boss) {
          this.souls.push(boss);
          this.addKillFeed(`💀 ${BOSS_CONFIGS[bossId].name} has reformed!`, '#ff4444');
        }
      }
    }

    // Camera snap
    this.camera.centerOn(soul.position);

    // Visual/audio feedback
    this.particles.emit(respawnPos.x, respawnPos.y, 20, {
      color: '#44DDFF', speed: 0.08, size: 3, life: 30, spread: Math.PI * 2,
    });
    this.screenShake.shake(6, 12);
    this.audio.playSFX('respawn' as string, { volume: 0.6 });

    const deaths = this.checkpointManager.deathCount;
    this.addKillFeed(`💀 Death #${deaths} — Respawned at checkpoint`, '#44DDFF');

    this.lastPlayerHp = soul.vitals.hp;
  }

  private respawnEnemies(): void {
    // Remove all dead enemies, keep alive ones
    this.souls = this.souls.filter(s => s === this.playerSoul || (s.teamId === 'enemy' && s.isAlive));

    // Count current alive enemies
    const aliveEnemies = this.souls.filter(s => s.teamId === 'enemy' && s.isAlive).length;
    const targetCount = this.zoneManager.enemyCount + (this.currentFloor - 1) * 2;
    const toSpawn = Math.max(0, targetCount - aliveEnemies);

    const enemyClasses = [SoulClass.Soldier, SoulClass.Hitman, SoulClass.Robot, SoulClass.Survivor, SoulClass.Scout];
    const monsterSprites = this.zoneManager.enemySprites;
    const floorMult = this.zoneManager.getFloorMultiplier();

    for (let i = 0; i < toSpawn; i++) {
      let ex: number, ey: number;
      let attempts = 0;
      do {
        ex = 3 + Math.floor(Math.random() * (this.config.mapWidth - 6));
        ey = 3 + Math.floor(Math.random() * (this.config.mapHeight - 6));
        attempts++;
      } while (attempts < 50 && (!this.map.tiles[ey]?.[ex]?.isPassable ||
        (this.playerSoul && this.dist({ x: ex, y: ey }, this.playerSoul.position) < 10)));

      const cls = enemyClasses[i % enemyClasses.length];
      const enemy = createSoul(cls, 'enemy', { x: ex, y: ey }, Date.now() + i + 1);
      enemy.sprite = `mon_${monsterSprites[i % monsterSprites.length]}`;
      enemy.combat.attackPower = Math.floor(enemy.combat.attackPower * floorMult);
      enemy.vitals.hpMax = Math.floor(enemy.vitals.hpMax * floorMult);
      enemy.vitals.hp = enemy.vitals.hpMax;
      this.souls.push(enemy);
    }

    this.enemiesRemaining = this.souls.filter(s => s.teamId === 'enemy' && s.isAlive).length;
  }

  private triggerAutoSave(): void {
    if (!this.playerSoul) return;

    this.checkpointManager.autoSave({
      zoneNumber: this.zoneManager.currentZoneNumber,
      currentFloor: this.currentFloor,
      playerClass: this.config.playerClass,
      playerGold: this.playerGold,
      playerKills: this.playerKills,
      inventorySnapshot: this.inventory.getItemIds(),
      equipmentSnapshot: this.inventory.getEquippedIds(),
      playerHp: this.playerSoul.vitals.hp,
      playerHpMax: this.playerSoul.vitals.hpMax,
      playerMana: this.playerSoul.vitals.mana,
      playerManaMax: this.playerSoul.vitals.manaMax,
      bossesDefeated: this.zoneManager.getDefeatedBosses(),
    });
  }

  // ── Utility ─────────────────────────────────────────────
  private moveToward(soul: SoulEntity, target: Vector2, speed: number): void {
    const dx = target.x - soul.position.x;
    const dy = target.y - soul.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.5) return;
    const nx = dx / dist;
    const ny = dy / dist;
    soul.velocity.x += nx * speed;
    soul.velocity.y += ny * speed;
    soul.facing.x = nx;
    soul.facing.y = ny;
  }

  private findNearestEnemy(soul: SoulEntity, range: number): SoulEntity | null {
    let nearest: SoulEntity | null = null;
    let minDist = range + 1;
    for (const other of this.souls) {
      if (other.teamId === soul.teamId || !other.isAlive) continue;
      const d = this.dist(soul.position, other.position);
      if (d < minDist) { minDist = d; nearest = other; }
    }
    return nearest;
  }

  private dist(a: Vector2, b: Vector2): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  /** Spiral-search outward from (cx, cy) to find the nearest passable tile */
  private findPassableTile(cx: number, cy: number): Vector2 {
    const maxR = Math.max(this.config.mapWidth, this.config.mapHeight);
    for (let r = 0; r < maxR; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // only check perimeter
          const tx = cx + dx;
          const ty = cy + dy;
          if (this.map.tiles[ty]?.[tx]?.isPassable) {
            return { x: tx, y: ty };
          }
        }
      }
    }
    return { x: cx, y: cy }; // fallback (should never happen)
  }

  private addKillFeed(text: string, color: string): void {
    this.matchScore.killFeed.push({ text, color, time: Date.now() });
    if (this.matchScore.killFeed.length > 50) {
      this.matchScore.killFeed.shift();
    }
  }

  restart(): void {
    this.stop();
    this.matchScore = {
      scores: new Map(),
      killFeed: [],
      matchTime: 0,
      phase: 'Floor 1',
      winner: null,
    };
    this.attackCooldowns.clear();
    this.particles.particles.length = 0;
    this.damageNumbers.numbers.length = 0;
    this.bulletSystem.clear();
    this.lootSystem.clear();
    this.lootSystem.inventory = [];
    this.bossSystem.clear();
    this.zoneManager.reset();
    this.checkpointManager.reset();
    CheckpointManager.clearSave();
    this.inventory = new InventoryOverlay();
    this.inventory.audio = this.audio;
    this.playerWeapon.ammo = this.playerWeapon.weapon.magSize;
    this.playerWeapon.cooldown = 0;
    this.playerWeapon.reloading = 0;
    this.activeEvent = null;
    this.eventCooldown = 0;
    this.currentFloor = 1;
    this.playerKills = 0;
    this.playerGold = 0;
    this.musicStarted = false;
    this.matchWon = false;
    this.footstepTimer = 0;
    this.lastPlayerHp = 0;

    // Reset audio
    this.audio.stopMusic();
    this.audio.stopAllAmbient(0);

    const seed = Math.floor(Math.random() * 999999);
    this.map = generateWorld({
      width: this.config.mapWidth,
      height: this.config.mapHeight,
      seed,
      tileSize: this.config.tileSize,
      floor: this.currentFloor,
    });
    this.pathfinder = new PathFinder(this.map);

    this.spawnSouls();

    if (this.playerSoul) {
      this.camera.centerOn(this.playerSoul.position);
    }

    this.start();
  }

  handleResize(w: number, h: number): void {
    if (!this.canvas) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.renderer?.resize(w, h);
    this.camera?.resize(w, h);
    this.weather?.resize(w, h);
  }

  destroy(): void {
    this.stop();
    this.input.detach();
    this.audio.destroy();
  }

  // Resume from pause
  resume(): void {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.audio.playSFX('unpause', { volume: 0.3 });
    }
  }

  // ── Pause Menu ──────────────────────────────────────────

  private getPauseButtons(): { label: string; y: number; w: number; h: number; x: number }[] {
    const cx = this.canvas.width / 2;
    const btnW = 260, btnH = 44;
    const startY = this.canvas.height / 2 - 10;
    const gap = 58;
    const hasCheckpoint = this.checkpointManager.activeCheckpoint !== null;
    const buttons = [
      { label: 'RESUME', y: startY, w: btnW, h: btnH, x: cx - btnW / 2 },
      ...(hasCheckpoint ? [{ label: 'RESET TO CHECKPOINT', y: startY + gap, w: btnW, h: btnH, x: cx - btnW / 2 }] : []),
      { label: 'QUIT TO MENU', y: startY + gap * (hasCheckpoint ? 2 : 1), w: btnW, h: btnH, x: cx - btnW / 2 },
    ];
    return buttons;
  }

  private updatePauseMenu(): void {
    // ESC to resume
    if (this.input.wasPressed('pause')) {
      this.resume();
      return;
    }

    // Check button clicks
    if (this.input.wasMouseClicked()) {
      const m = this.input.getMousePos();
      const buttons = this.getPauseButtons();
      for (const btn of buttons) {
        if (m.x >= btn.x && m.x <= btn.x + btn.w && m.y >= btn.y && m.y <= btn.y + btn.h) {
          this.audio.playSFX('menu_click', { volume: 0.4 });
          if (btn.label === 'RESUME') {
            this.resume();
          } else if (btn.label === 'RESET TO CHECKPOINT') {
            const respawn = this.checkpointManager.onPlayerDeath();
            if (respawn) {
              this.state = 'playing';
              this.executeCheckpointRespawn(respawn.respawnPos, respawn.hpFraction);
              this.addKillFeed('↩ Reset to last checkpoint', '#44DDFF');
            }
          } else if (btn.label === 'QUIT TO MENU') {
            this.state = 'quit';
            this.stop();
            this.audio.stopMusic();
            this.audio.stopAllAmbient(0);
          }
          return;
        }
      }
    }
  }

  private renderPauseScreen(): void {
    const cx = this.canvas.width / 2;

    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 40px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', cx, this.canvas.height / 2 - 80);

    // Stats line
    this.ctx.font = '13px monospace';
    this.ctx.fillStyle = '#888';
    const mins = Math.floor(this.matchScore.matchTime / 3600);
    const secs = Math.floor((this.matchScore.matchTime % 3600) / 60);
    this.ctx.fillText(
      `Floor ${this.currentFloor}  •  ${this.zoneManager.zoneName}  •  ${mins}:${secs.toString().padStart(2, '0')}`,
      cx, this.canvas.height / 2 - 50,
    );

    // Buttons
    const mouse = this.input.getMousePos();
    const buttons = this.getPauseButtons();
    for (const btn of buttons) {
      const hovered = mouse.x >= btn.x && mouse.x <= btn.x + btn.w && mouse.y >= btn.y && mouse.y <= btn.y + btn.h;

      // Button background
      this.ctx.fillStyle = hovered ? 'rgba(136, 68, 255, 0.5)' : 'rgba(136, 68, 255, 0.2)';
      this.ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      this.ctx.strokeStyle = hovered ? '#c084fc' : '#6633aa';
      this.ctx.lineWidth = hovered ? 2 : 1;
      this.ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

      // Button text
      this.ctx.fillStyle = hovered ? '#ffffff' : '#cccccc';
      this.ctx.font = 'bold 15px monospace';
      this.ctx.fillText(btn.label, cx, btn.y + btn.h / 2 + 5);
    }

    // Hint
    this.ctx.font = '11px monospace';
    this.ctx.fillStyle = '#555';
    const lastBtn = buttons[buttons.length - 1];
    this.ctx.fillText('Press ESC to resume', cx, lastBtn.y + lastBtn.h + 30);
    this.ctx.textAlign = 'left';
  }

  handlePauseToggle(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'playing';
    }
  }
}

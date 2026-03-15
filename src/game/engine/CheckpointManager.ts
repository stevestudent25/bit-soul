// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Checkpoint Manager (Auto-Save & Respawn System)
// Adapted for custom HTML5 Canvas engine (no Phaser)
// ═══════════════════════════════════════════════════════════════

import type { Vector2 } from '../types/SoulEntity';
import type { CheckpointDef } from '../data/CheckpointData';
import { ZONE_CHECKPOINTS, CHECKPOINT_ACTIVE_TINTS } from '../data/CheckpointData';

const SAVE_KEY = 'bitsoul_checkpoint_save';
const ACTIVATION_RADIUS = 2.0;
const HIDDEN_REVEAL_RADIUS = 3.5;
const RESPAWN_HP_FRACTION = 0.5;
const INVINCIBILITY_FRAMES = 180; // ~3s at 60fps
const AUTO_SAVE_INTERVAL = 18000; // ~5 minutes at 60fps

export interface CheckpointState {
  id: string;
  name: string;
  position: Vector2;
  zoneNumber: number;
  type: string;
}

export interface CheckpointSaveData {
  timestamp: number;
  activeCheckpointId: string;
  zoneNumber: number;
  currentFloor: number;
  playerClass: string;
  playerGold: number;
  playerKills: number;
  inventorySnapshot: string[];
  equipmentSnapshot: string[];
  playerHp: number;
  playerHpMax: number;
  playerMana: number;
  playerManaMax: number;
  bossesDefeated: string[];
}

export interface ActiveCheckpoint {
  def: CheckpointDef;
  worldPos: Vector2;
  activated: boolean;
  revealed: boolean; // for hidden checkpoints
  animPhase: number;
}

export class CheckpointManager {
  // Active checkpoints for current zone
  checkpoints: ActiveCheckpoint[] = [];
  // Currently activated checkpoint (respawn point)
  activeCheckpoint: CheckpointState | null = null;
  // Set of all activated checkpoint IDs (persist across zones)
  activatedIds = new Set<string>();
  // Death counter
  deathCount = 0;
  // Invincibility frames after respawn
  invincibilityFrames = 0;
  // Save indicator display
  private saveIndicatorTimer = 0;
  private saveIndicatorText = '';
  // Auto-save timer
  private autoSaveTimer = AUTO_SAVE_INTERVAL;
  // Activation flash animation
  private activationFlashTimer = 0;
  private activationFlashPos: Vector2 | null = null;

  // ── Zone Setup ──────────────────────────────────────────

  /** Place checkpoints for the given zone on the current map. Call on zone enter / floor advance. */
  setupZone(zoneNumber: number, mapCenterX: number, mapCenterY: number,
    findPassableTile: (x: number, y: number) => Vector2): void {
    this.checkpoints = [];
    const defs = ZONE_CHECKPOINTS[zoneNumber];
    if (!defs) return;

    for (const def of defs) {
      const rawX = mapCenterX + def.tileOffsetX;
      const rawY = mapCenterY + def.tileOffsetY;
      const worldPos = findPassableTile(rawX, rawY);

      this.checkpoints.push({
        def,
        worldPos,
        activated: this.activatedIds.has(def.id),
        revealed: !def.isHidden,
        animPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  // ── Update (called every frame) ─────────────────────────

  update(playerPos: Vector2, _frameCount: number): void {
    // Tick invincibility
    if (this.invincibilityFrames > 0) this.invincibilityFrames--;

    // Tick save indicator
    if (this.saveIndicatorTimer > 0) this.saveIndicatorTimer--;

    // Tick activation flash
    if (this.activationFlashTimer > 0) this.activationFlashTimer--;

    // Auto-save timer
    this.autoSaveTimer--;
    if (this.autoSaveTimer <= 0) {
      this.autoSaveTimer = AUTO_SAVE_INTERVAL;
      return; // signal to GameEngine to trigger auto-save
    }

    // Proximity checks
    for (const cp of this.checkpoints) {
      cp.animPhase += 0.03;

      // Hidden checkpoint reveal
      if (!cp.revealed && cp.def.isHidden) {
        const dist = this.dist(playerPos, cp.worldPos);
        if (dist < HIDDEN_REVEAL_RADIUS) {
          cp.revealed = true;
        }
      }

      // Activation check
      if (cp.revealed && !cp.activated) {
        const dist = this.dist(playerPos, cp.worldPos);
        if (dist < ACTIVATION_RADIUS) {
          this.activateCheckpoint(cp);
        }
      }
    }
  }

  /** Should the auto-save timer fire this frame? (Called from GameEngine) */
  shouldAutoSave(): boolean {
    return this.autoSaveTimer <= 0;
  }

  // ── Activation ──────────────────────────────────────────

  private activateCheckpoint(cp: ActiveCheckpoint): void {
    cp.activated = true;
    this.activatedIds.add(cp.def.id);
    this.activeCheckpoint = {
      id: cp.def.id,
      name: cp.def.name,
      position: { x: cp.worldPos.x, y: cp.worldPos.y },
      zoneNumber: 0, // will be set by GameEngine
      type: cp.def.type,
    };

    // Activation flash
    this.activationFlashTimer = 60;
    this.activationFlashPos = { x: cp.worldPos.x, y: cp.worldPos.y };

    // Heal amount
    this.healAmount = cp.def.healOnActivate ? (cp.def.healAmount || 0) : 0;

    // Show indicator text
    this.showSaveIndicator(`✦ ${cp.def.name}`);
  }

  /** Heal amount from the last checkpoint activation (consumed by GameEngine) */
  healAmount = 0;

  consumeHeal(): number {
    const amt = this.healAmount;
    this.healAmount = 0;
    return amt;
  }

  /** Was a checkpoint JUST activated this frame? */
  wasJustActivated(): boolean {
    return this.activationFlashTimer === 59;
  }

  // ── Save Indicator ──────────────────────────────────────

  showSaveIndicator(text: string): void {
    this.saveIndicatorText = text;
    this.saveIndicatorTimer = 120; // ~2 seconds
  }

  // ── Auto-Save to localStorage ───────────────────────────

  autoSave(data: Omit<CheckpointSaveData, 'timestamp' | 'activeCheckpointId'>): void {
    if (!this.activeCheckpoint) return;

    const saveData: CheckpointSaveData = {
      ...data,
      timestamp: Date.now(),
      activeCheckpointId: this.activeCheckpoint.id,
    };

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      this.showSaveIndicator('💾 Saved');
    } catch {
      // localStorage full or disabled — silently fail
    }
  }

  /** Load checkpoint save data from localStorage (returns null if none) */
  static loadSave(): CheckpointSaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as CheckpointSaveData;
    } catch {
      return null;
    }
  }

  /** Delete saved checkpoint data */
  static clearSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
  }

  /** Check if a saved game exists */
  static hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  }

  // ── Death & Respawn ─────────────────────────────────────

  /** Called when the player dies. Returns respawn position if a checkpoint is active, null otherwise. */
  onPlayerDeath(): { respawnPos: Vector2; hpFraction: number } | null {
    this.deathCount++;

    if (!this.activeCheckpoint) {
      return null; // no checkpoint — real game over
    }

    return {
      respawnPos: { x: this.activeCheckpoint.position.x, y: this.activeCheckpoint.position.y },
      hpFraction: RESPAWN_HP_FRACTION,
    };
  }

  /** Start invincibility after respawn */
  startRespawnInvincibility(): void {
    this.invincibilityFrames = INVINCIBILITY_FRAMES;
  }

  /** Is the player currently invincible from respawn? */
  get isInvincible(): boolean {
    return this.invincibilityFrames > 0;
  }

  // ── Rendering Data ──────────────────────────────────────

  /** Get save indicator info for HUD rendering */
  getSaveIndicator(): { text: string; alpha: number } | null {
    if (this.saveIndicatorTimer <= 0) return null;
    const alpha = Math.min(1, this.saveIndicatorTimer / 30); // fade out last 0.5s
    return { text: this.saveIndicatorText, alpha };
  }

  /** Get activation flash info for rendering */
  getActivationFlash(): { pos: Vector2; progress: number; color: string } | null {
    if (this.activationFlashTimer <= 0 || !this.activationFlashPos) return null;
    const progress = 1 - this.activationFlashTimer / 60;
    // Find the checkpoint type for color
    const cp = this.checkpoints.find(c =>
      c.worldPos.x === this.activationFlashPos!.x &&
      c.worldPos.y === this.activationFlashPos!.y);
    const color = cp ? CHECKPOINT_ACTIVE_TINTS[cp.def.type] : '#ffffff';
    return { pos: this.activationFlashPos, progress, color };
  }

  // ── Clear / Reset ───────────────────────────────────────

  /** Clear checkpoint state for this zone (when regenerating the map on advanceFloor) */
  clearZone(): void {
    this.checkpoints = [];
  }

  /** Full reset (new game) */
  reset(): void {
    this.checkpoints = [];
    this.activeCheckpoint = null;
    this.activatedIds.clear();
    this.deathCount = 0;
    this.invincibilityFrames = 0;
    this.saveIndicatorTimer = 0;
    this.autoSaveTimer = AUTO_SAVE_INTERVAL;
    this.activationFlashTimer = 0;
    this.activationFlashPos = null;
    this.healAmount = 0;
  }

  // ── Utility ─────────────────────────────────────────────

  private dist(a: Vector2, b: Vector2): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
}

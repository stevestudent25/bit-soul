// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Boss System (Spawning, AI, Health Bar, Phases)
// ═══════════════════════════════════════════════════════════════

import type { SoulEntity, Vector2 } from '../types/SoulEntity';
import { SoulClass } from '../types/SoulEntity';
import { createSoul } from '../systems/SoulFactory';
import { BOSS_CONFIGS, type BossConfig, type BossAttack } from '../data/ZoneData';
import type { AudioManager } from './AudioManager';

// ── Boss Entity Extension ─────────────────────────────────────

export interface BossState {
  configId: string;
  config: BossConfig;
  currentPhase: number;
  attackCooldowns: Map<string, number>;
  summonCount: number;
  introTimer: number;        // frames of boss intro animation
  isDefeated: boolean;
  chargeTarget: Vector2 | null;
  chargeSpeed: number;
  beamTarget: Vector2 | null;
  beamTimer: number;
}

export class BossSystem {
  boss: SoulEntity | null = null;
  bossState: BossState | null = null;
  private summons: string[] = [];   // soul IDs of summoned minions
  audio: AudioManager | null = null;

  get isActive(): boolean {
    return this.boss !== null && !this.bossState?.isDefeated;
  }

  get isBossAlive(): boolean {
    return this.boss !== null && this.boss.isAlive && !this.bossState?.isDefeated;
  }

  /** Spawn a boss at a given position */
  spawnBoss(bossId: string, position: Vector2, floorMult: number): SoulEntity | null {
    const cfg = BOSS_CONFIGS[bossId];
    if (!cfg) return null;

    // Create boss soul from a base class
    const boss = createSoul(SoulClass.Soldier, 'enemy', position, Date.now() + 99999);
    boss.name = cfg.name;
    boss.sprite = cfg.sprite;
    boss.vitals.hpMax = Math.floor(cfg.maxHealth * floorMult);
    boss.vitals.hp = boss.vitals.hpMax;
    boss.combat.attackPower = Math.floor(cfg.damage * floorMult);
    boss.combat.armor = cfg.defense;
    boss.movement.speedBase = cfg.speed * 0.01;
    boss.movement.speedCurrent = boss.movement.speedBase;
    boss.physical.colorPrimary = '#ff2222';
    boss.physical.colorSecondary = '#ffaa00';
    // Make boss bigger (renderer checks this)
    boss.physical.radius = 1.5;

    this.boss = boss;
    this.bossState = {
      configId: bossId,
      config: cfg,
      currentPhase: 0,
      attackCooldowns: new Map(),
      summonCount: 0,
      introTimer: 120,  // 2 seconds intro
      isDefeated: false,
      chargeTarget: null,
      chargeSpeed: 0,
      beamTarget: null,
      beamTimer: 0,
    };
    this.summons = [];

    // Boss intro roar
    this.audio?.playSFX('boss_roar', { volume: 0.7 });

    return boss;
  }

  /** Main boss update loop — call each frame */
  update(
    playerPos: Vector2,
    souls: SoulEntity[],
    spawnSummon: (pos: Vector2) => SoulEntity | null,
    onAttackHit: (target: SoulEntity, damage: number, knockback: Vector2) => void,
  ): void {
    if (!this.boss || !this.bossState || !this.boss.isAlive) return;

    const bs = this.bossState;
    const cfg = bs.config;

    // Intro timer — boss stands still during intro
    if (bs.introTimer > 0) {
      bs.introTimer--;
      return;
    }

    // Phase check — advance phase when HP drops below thresholds
    const hpRatio = this.boss.vitals.hp / this.boss.vitals.hpMax;
    while (bs.currentPhase < cfg.phaseThresholds.length - 1 &&
           hpRatio <= cfg.phaseThresholds[bs.currentPhase]) {
      bs.currentPhase++;
      // Phase change buff — speed + damage increase
      this.boss.movement.speedBase *= 1.15;
      this.boss.combat.attackPower = Math.floor(this.boss.combat.attackPower * 1.1);
      this.audio?.playSFX('power_up_2', { volume: 0.6 });
    }

    // Clean up dead summons
    this.summons = this.summons.filter(id => {
      const s = souls.find(s => s.id === id);
      return s && s.isAlive;
    });
    bs.summonCount = this.summons.length;

    // Tick all attack cooldowns
    for (const [name, cd] of bs.attackCooldowns) {
      if (cd > 0) bs.attackCooldowns.set(name, cd - 1);
    }

    // Handle active charge
    if (bs.chargeTarget) {
      const dx = bs.chargeTarget.x - this.boss.position.x;
      const dy = bs.chargeTarget.y - this.boss.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.5) {
        bs.chargeTarget = null;
      } else {
        const speed = bs.chargeSpeed || 0.15;
        this.boss.velocity.x = (dx / dist) * speed;
        this.boss.velocity.y = (dy / dist) * speed;
      }
      return; // Don't do other actions during charge
    }

    // Handle beam
    if (bs.beamTimer > 0) {
      bs.beamTimer--;
      return;
    }

    // Choose and execute attacks
    const distToPlayer = Math.sqrt(
      (playerPos.x - this.boss.position.x) ** 2 +
      (playerPos.y - this.boss.position.y) ** 2,
    );

    // Move toward player if no attack is ready
    let attacked = false;
    const phaseScale = 1 + bs.currentPhase * 0.15;

    for (const atk of cfg.attacks) {
      const cd = bs.attackCooldowns.get(atk.name) || 0;
      if (cd > 0) continue;

      // Phase-scaled cooldown (faster in later phases)
      const phaseCd = Math.floor(atk.cooldown / phaseScale);

      if (atk.type === 'melee' && distToPlayer <= atk.range) {
        this.executeMelee(atk, playerPos, souls, onAttackHit);
        this.audio?.playSFX('melee_hit', { volume: 0.5, randomPitch: true });
        bs.attackCooldowns.set(atk.name, phaseCd);
        attacked = true;
        break;
      }

      if (atk.type === 'projectile' && distToPlayer <= atk.range) {
        this.executeProjectile(atk, playerPos, onAttackHit, souls);
        this.audio?.playSFX('magic_sfx', { volume: 0.5, randomPitch: true });
        bs.attackCooldowns.set(atk.name, phaseCd);
        attacked = true;
        break;
      }

      if (atk.type === 'area' && distToPlayer <= atk.range) {
        this.executeArea(atk, souls, onAttackHit);
        this.audio?.playSFX('explosion', { volume: 0.6 });
        bs.attackCooldowns.set(atk.name, phaseCd);
        attacked = true;
        break;
      }

      if (atk.type === 'charge' && distToPlayer <= atk.range && distToPlayer > 3) {
        bs.chargeTarget = { ...playerPos };
        bs.chargeSpeed = 0.18;
        this.audio?.playSFX('glitch_transition', { volume: 0.5 });
        bs.attackCooldowns.set(atk.name, phaseCd);
        attacked = true;
        break;
      }

      if (atk.type === 'beam' && distToPlayer <= atk.range) {
        bs.beamTarget = { ...playerPos };
        bs.beamTimer = 30; // hold beam for 0.5s
        this.executeBeam(atk, playerPos, souls, onAttackHit);
        this.audio?.playSFX('fire_magic', { volume: 0.6 });
        bs.attackCooldowns.set(atk.name, phaseCd);
        attacked = true;
        break;
      }

      if (atk.type === 'summon' && bs.summonCount < cfg.maxSummons) {
        const count = atk.summonCount || 1;
        for (let i = 0; i < count; i++) {
          if (bs.summonCount >= cfg.maxSummons) break;
          const angle = Math.random() * Math.PI * 2;
          const dist = 2 + Math.random() * 3;
          const pos: Vector2 = {
            x: this.boss.position.x + Math.cos(angle) * dist,
            y: this.boss.position.y + Math.sin(angle) * dist,
          };
          const minion = spawnSummon(pos);
          if (minion) {
            this.summons.push(minion.id);
            bs.summonCount++;
          }
        }
        this.audio?.playSFX('teleport', { volume: 0.5 });
        bs.attackCooldowns.set(atk.name, phaseCd);
        attacked = true;
        break;
      }

      if (atk.type === 'heal' && hpRatio < 0.5) {
        const healAmt = atk.healAmount || 50;
        this.boss.vitals.hp = Math.min(this.boss.vitals.hpMax,
          this.boss.vitals.hp + Math.floor(healAmt * phaseScale));
        this.audio?.playSFX('heal', { volume: 0.5 });
        bs.attackCooldowns.set(atk.name, phaseCd);
        attacked = true;
        break;
      }
    }

    // If no attack executed, move toward player
    if (!attacked) {
      const dx = playerPos.x - this.boss.position.x;
      const dy = playerPos.y - this.boss.position.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 2) {
        const speed = this.boss.movement.speedCurrent * 0.015;
        this.boss.velocity.x += (dx / d) * speed;
        this.boss.velocity.y += (dy / d) * speed;
      }
      this.boss.facing.x = dx > 0 ? 1 : -1;
      this.boss.facing.y = dy;
    }
  }

  private executeMelee(
    atk: BossAttack,
    _playerPos: Vector2,
    souls: SoulEntity[],
    onHit: (target: SoulEntity, damage: number, kb: Vector2) => void,
  ): void {
    if (!this.boss) return;
    for (const s of souls) {
      if (s.teamId === this.boss.teamId || !s.isAlive) continue;
      const dx = s.position.x - this.boss.position.x;
      const dy = s.position.y - this.boss.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= atk.range) {
        const kb: Vector2 = { x: (dx / dist) * 0.2, y: (dy / dist) * 0.2 };
        onHit(s, atk.damage, kb);
      }
    }
  }

  private executeProjectile(
    atk: BossAttack,
    _playerPos: Vector2,
    onHit: (target: SoulEntity, damage: number, kb: Vector2) => void,
    souls: SoulEntity[],
  ): void {
    if (!this.boss) return;
    // Simulate projectile as instant hit if in range (simplified for canvas engine)
    const count = atk.projectileCount || 1;
    for (const s of souls) {
      if (s.teamId === this.boss.teamId || !s.isAlive) continue;
      const dx = s.position.x - this.boss.position.x;
      const dy = s.position.y - this.boss.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= atk.range) {
        const dmgPer = Math.floor(atk.damage / Math.max(1, count));
        const kb: Vector2 = { x: (dx / dist) * 0.1, y: (dy / dist) * 0.1 };
        onHit(s, dmgPer, kb);
      }
    }
  }

  private executeArea(
    atk: BossAttack,
    souls: SoulEntity[],
    onHit: (target: SoulEntity, damage: number, kb: Vector2) => void,
  ): void {
    if (!this.boss) return;
    for (const s of souls) {
      if (s.teamId === this.boss.teamId || !s.isAlive) continue;
      const dx = s.position.x - this.boss.position.x;
      const dy = s.position.y - this.boss.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= atk.range) {
        const kb: Vector2 = { x: (dx / (dist || 1)) * 0.15, y: (dy / (dist || 1)) * 0.15 };
        onHit(s, atk.damage, kb);
      }
    }
  }

  private executeBeam(
    atk: BossAttack,
    playerPos: Vector2,
    souls: SoulEntity[],
    onHit: (target: SoulEntity, damage: number, kb: Vector2) => void,
  ): void {
    if (!this.boss) return;
    // Beam hits everything in a line toward the player
    const dx = playerPos.x - this.boss.position.x;
    const dy = playerPos.y - this.boss.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    for (const s of souls) {
      if (s.teamId === this.boss.teamId || !s.isAlive) continue;
      // Check if soul is roughly in the beam path
      const sx = s.position.x - this.boss.position.x;
      const sy = s.position.y - this.boss.position.y;
      const proj = sx * nx + sy * ny;
      if (proj < 0 || proj > atk.range) continue;
      const perpDist = Math.abs(sx * ny - sy * nx);
      if (perpDist < 1.5) {
        const kb: Vector2 = { x: nx * 0.1, y: ny * 0.1 };
        onHit(s, atk.damage, kb);
      }
    }
  }

  /** Mark boss as defeated and return loot config */
  defeatBoss(): BossConfig | null {
    if (!this.bossState || !this.boss) return null;
    this.bossState.isDefeated = true;
    this.boss.isAlive = false;
    return this.bossState.config;
  }

  /** Render boss health bar at top of screen */
  renderBossHealthBar(ctx: CanvasRenderingContext2D, canvasWidth: number): void {
    if (!this.boss || !this.bossState || this.bossState.isDefeated) return;
    if (this.boss.vitals.hp <= 0) return;

    const cfg = this.bossState.config;
    const barW = Math.min(500, canvasWidth * 0.5);
    const barH = 20;
    const barX = (canvasWidth - barW) / 2;
    const barY = 30;
    const hpPct = Math.max(0, this.boss.vitals.hp / this.boss.vitals.hpMax);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 4, barY - 20, barW + 8, barH + 34);
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX - 4, barY - 20, barW + 8, barH + 34);

    // Boss name + title
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${cfg.name} — ${cfg.title}`, canvasWidth / 2, barY - 5);

    // HP bar background
    ctx.fillStyle = '#2a0a0a';
    ctx.fillRect(barX, barY, barW, barH);

    // HP bar fill with phase color
    const phaseColors = ['#ff2222', '#ff8800', '#ff00ff', '#8800ff'];
    const phaseColor = phaseColors[this.bossState.currentPhase] || '#ff2222';
    ctx.fillStyle = phaseColor;
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    // Phase markers
    for (let i = 0; i < cfg.phaseThresholds.length - 1; i++) {
      const threshold = cfg.phaseThresholds[i];
      const mx = barX + barW * threshold;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx, barY);
      ctx.lineTo(mx, barY + barH);
      ctx.stroke();
    }

    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.boss.vitals.hp} / ${this.boss.vitals.hpMax}`, canvasWidth / 2, barY + barH - 4);

    // Phase indicator
    ctx.fillStyle = '#cccccc';
    ctx.font = '10px monospace';
    ctx.fillText(`Phase ${this.bossState.currentPhase + 1}/${cfg.phases}`, canvasWidth / 2, barY + barH + 12);

    ctx.textAlign = 'left';
  }

  clear(): void {
    this.boss = null;
    this.bossState = null;
    this.summons = [];
  }
}

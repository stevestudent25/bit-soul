// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Projectile Bullet System
// ═══════════════════════════════════════════════════════════════

import type { Vector2, SoulEntity } from '../types/SoulEntity';
import type { GameMap } from '../types/World';

// ── Weapon Definitions ───────────────────────────────────────

export interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number;       // frames between shots
  bulletSpeed: number;    // tiles per frame
  spread: number;         // degrees of random spread
  magSize: number;
  reloadTime: number;     // frames to reload
  pellets: number;        // >1 for shotgun
  range: number;          // max bullet lifetime in tiles
  knockback: number;      // push force on hit
}

export const WEAPONS: Record<string, WeaponStats> = {
  pistol:  { name: 'Pistol',  damage: 12, fireRate: 20, bulletSpeed: 0.5,  spread: 3,  magSize: 12, reloadTime: 80,  pellets: 1, range: 20, knockback: 0.15 },
  shotgun: { name: 'Shotgun', damage: 7,  fireRate: 45, bulletSpeed: 0.45, spread: 12, magSize: 6,  reloadTime: 120, pellets: 5, range: 10, knockback: 0.3 },
  rifle:   { name: 'Rifle',   damage: 18, fireRate: 12, bulletSpeed: 0.65, spread: 1,  magSize: 30, reloadTime: 90,  pellets: 1, range: 28, knockback: 0.2 },
  smg:     { name: 'SMG',     damage: 8,  fireRate: 6,  bulletSpeed: 0.48, spread: 6,  magSize: 40, reloadTime: 100, pellets: 1, range: 16, knockback: 0.1 },
};

// ── Bullet Entity ────────────────────────────────────────────

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  ownerId: string;
  ownerTeam: string;
  life: number;
  knockback: number;
  color: string;
}

// ── Weapon State (per-soul) ──────────────────────────────────

export interface WeaponState {
  weapon: WeaponStats;
  ammo: number;
  cooldown: number;       // frames until next shot
  reloading: number;      // frames left in reload (0 = not reloading)
}

// ── Bullet System ────────────────────────────────────────────

export class BulletSystem {
  bullets: Bullet[] = [];
  private readonly MAX_BULLETS = 200;

  /** Fire a weapon — spawns bullet(s) toward target angle */
  fire(
    origin: Vector2,
    angleRad: number,
    weapon: WeaponStats,
    ownerId: string,
    ownerTeam: string,
    color: string,
  ): void {
    for (let i = 0; i < weapon.pellets; i++) {
      if (this.bullets.length >= this.MAX_BULLETS) break;

      // Apply spread (convert degrees to radians)
      const spreadRad = (weapon.spread * Math.PI / 180) * (Math.random() - 0.5);
      const a = angleRad + spreadRad;

      this.bullets.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(a) * weapon.bulletSpeed,
        vy: Math.sin(a) * weapon.bulletSpeed,
        damage: weapon.damage,
        ownerId,
        ownerTeam,
        life: Math.ceil(weapon.range / weapon.bulletSpeed),
        knockback: weapon.knockback,
        color,
      });
    }
  }

  /** Update all bullets — move, check wall collisions, check lifetime */
  update(map: GameMap): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Wall collision
      const tx = Math.floor(b.x);
      const ty = Math.floor(b.y);
      const tile = map.tiles[ty]?.[tx];
      if (!tile || !tile.isPassable || b.life <= 0) {
        this.bullets.splice(i, 1);
      }
    }
  }

  /** Check bullet-vs-soul collisions. Returns hit pairs. */
  checkHits(souls: SoulEntity[]): { bullet: Bullet; target: SoulEntity; index: number }[] {
    const hits: { bullet: Bullet; target: SoulEntity; index: number }[] = [];

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      for (const soul of souls) {
        if (!soul.isAlive) continue;
        if (soul.id === b.ownerId) continue;
        if (soul.teamId === b.ownerTeam) continue;

        const dx = soul.position.x - b.x;
        const dy = soul.position.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.6) {
          hits.push({ bullet: b, target: soul, index: i });
          this.bullets.splice(i, 1);
          break;
        }
      }
    }

    return hits;
  }

  clear(): void {
    this.bullets.length = 0;
  }
}

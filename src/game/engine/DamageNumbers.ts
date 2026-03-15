// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Damage Numbers & Screen Effects
// ═══════════════════════════════════════════════════════════════

import type { Vector2 } from '../types/SoulEntity';

export interface DamageNumber {
  x: number;
  y: number;
  value: number;
  color: string;
  isCrit: boolean;
  isHeal: boolean;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  scale: number;
}

export class DamageNumberSystem {
  numbers: DamageNumber[] = [];
  private readonly MAX_NUMBERS = 50;

  add(worldPos: Vector2, value: number, options: {
    isCrit?: boolean;
    isHeal?: boolean;
    color?: string;
  } = {}): void {
    if (this.numbers.length >= this.MAX_NUMBERS) {
      this.numbers.shift();
    }

    const color = options.color || (options.isHeal ? '#44ff44' : options.isCrit ? '#FFD700' : '#ffffff');
    const life = options.isCrit ? 70 : 50;

    this.numbers.push({
      x: worldPos.x,
      y: worldPos.y,
      value: Math.round(value),
      color,
      isCrit: options.isCrit || false,
      isHeal: options.isHeal || false,
      life,
      maxLife: life,
      vx: (Math.random() - 0.5) * 0.02,
      vy: -0.03 - Math.random() * 0.02,
      scale: options.isCrit ? 1.5 : 1,
    });
  }

  update(): void {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.x += n.vx;
      n.y += n.vy;
      n.vy += 0.0005; // Slight gravity
      n.life--;

      if (n.life <= 0) {
        this.numbers.splice(i, 1);
      }
    }
  }
}

export class ScreenShake {
  offsetX = 0;
  offsetY = 0;
  private intensity = 0;
  private duration = 0;
  private decay = 0.9;

  shake(intensity: number, duration: number = 10): void {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
  }

  update(): void {
    if (this.duration <= 0) {
      this.offsetX = 0;
      this.offsetY = 0;
      this.intensity = 0;
      return;
    }

    this.offsetX = (Math.random() - 0.5) * 2 * this.intensity;
    this.offsetY = (Math.random() - 0.5) * 2 * this.intensity;
    this.intensity *= this.decay;
    this.duration--;
  }
}

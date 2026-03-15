// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Particle System (Visual Effects)
// ═══════════════════════════════════════════════════════════════

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  decay: number;
}

export class ParticleSystem {
  particles: Particle[] = [];
  private readonly MAX_PARTICLES = 300;

  /** Spawn particles at a world position */
  emit(
    x: number, y: number,
    count: number,
    config: {
      color: string;
      speed?: number;
      size?: number;
      life?: number;
      spread?: number;
      dirX?: number;
      dirY?: number;
    }
  ): void {
    const { color, speed = 0.05, size = 2, life = 60, spread = Math.PI * 2, dirX = 0, dirY = 0 } = config;
    for (let i = 0; i < count && this.particles.length < this.MAX_PARTICLES; i++) {
      const angle = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * spread;
      const spd = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: size * (0.5 + Math.random()),
        alpha: 1,
        color,
        life,
        maxLife: life,
        decay: 1 / life,
      });
    }
  }

  /** Pre-built effects */
  hitEffect(x: number, y: number, color: string): void {
    this.emit(x, y, 8, { color, speed: 0.08, size: 3, life: 30, spread: Math.PI * 2 });
  }

  deathEffect(x: number, y: number, color: string): void {
    this.emit(x, y, 20, { color, speed: 0.12, size: 4, life: 60, spread: Math.PI * 2 });
    this.emit(x, y, 10, { color: '#ffffff', speed: 0.06, size: 2, life: 40, spread: Math.PI * 2 });
  }

  dashEffect(x: number, y: number, dx: number, dy: number, color: string): void {
    this.emit(x, y, 6, { color, speed: 0.04, size: 2, life: 20, spread: 0.8, dirX: -dx, dirY: -dy });
  }

  abilityEffect(x: number, y: number, color: string): void {
    this.emit(x, y, 12, { color, speed: 0.1, size: 3, life: 45, spread: Math.PI * 2 });
  }

  flagCaptureEffect(x: number, y: number): void {
    this.emit(x, y, 25, { color: '#FFD700', speed: 0.15, size: 5, life: 80, spread: Math.PI * 2 });
    this.emit(x, y, 15, { color: '#ffffff', speed: 0.08, size: 3, life: 50, spread: Math.PI * 2 });
  }

  /** Update all particles */
  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life--;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size *= 0.98;

      if (p.life <= 0 || p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}

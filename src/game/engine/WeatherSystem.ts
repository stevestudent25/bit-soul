// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Weather System (Dynamic Weather with Gameplay Effects)
// ═══════════════════════════════════════════════════════════════

export enum WeatherType {
  Clear = 'CLEAR',
  Rain = 'RAIN',
  Storm = 'STORM',
  Fog = 'FOG',
  ManaRain = 'MANA_RAIN',
  VoidEclipse = 'VOID_ECLIPSE',
  CrystalShower = 'CRYSTAL_SHOWER',
}

export interface WeatherState {
  current: WeatherType;
  intensity: number;       // 0.0 - 1.0
  timeRemaining: number;   // frames until weather change
  particles: WeatherParticle[];
  windX: number;
  windY: number;
}

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
}

export interface WeatherEffects {
  visibilityMult: number;
  speedMult: number;
  fireDamageMult: number;
  electricChainBonus: number;
  stealthBonus: number;
  manaRegenMult: number;
  cooldownMult: number;
}

const WEATHER_CONFIGS: Record<WeatherType, {
  minDuration: number;
  maxDuration: number;
  effects: WeatherEffects;
  probability: number;
}> = {
  [WeatherType.Clear]: {
    minDuration: 60 * 120,
    maxDuration: 60 * 300,
    effects: { visibilityMult: 1, speedMult: 1, fireDamageMult: 1, electricChainBonus: 0, stealthBonus: 0, manaRegenMult: 1, cooldownMult: 1 },
    probability: 0.45,
  },
  [WeatherType.Rain]: {
    minDuration: 60 * 60,
    maxDuration: 60 * 180,
    effects: { visibilityMult: 0.8, speedMult: 0.95, fireDamageMult: 0.5, electricChainBonus: 1, stealthBonus: 0, manaRegenMult: 1, cooldownMult: 1 },
    probability: 0.2,
  },
  [WeatherType.Storm]: {
    minDuration: 60 * 45,
    maxDuration: 60 * 120,
    effects: { visibilityMult: 0.5, speedMult: 0.85, fireDamageMult: 0.3, electricChainBonus: 2, stealthBonus: 0.1, manaRegenMult: 1, cooldownMult: 1 },
    probability: 0.1,
  },
  [WeatherType.Fog]: {
    minDuration: 60 * 60,
    maxDuration: 60 * 150,
    effects: { visibilityMult: 0.3, speedMult: 1, fireDamageMult: 1, electricChainBonus: 0, stealthBonus: 0.4, manaRegenMult: 1, cooldownMult: 1 },
    probability: 0.1,
  },
  [WeatherType.ManaRain]: {
    minDuration: 60 * 45,
    maxDuration: 60 * 90,
    effects: { visibilityMult: 0.9, speedMult: 1, fireDamageMult: 1, electricChainBonus: 0, stealthBonus: 0, manaRegenMult: 3, cooldownMult: 0.5 },
    probability: 0.08,
  },
  [WeatherType.VoidEclipse]: {
    minDuration: 60 * 30,
    maxDuration: 60 * 30,
    effects: { visibilityMult: 0.1, speedMult: 1.1, fireDamageMult: 1, electricChainBonus: 0, stealthBonus: 0.6, manaRegenMult: 1, cooldownMult: 1 },
    probability: 0.03,
  },
  [WeatherType.CrystalShower]: {
    minDuration: 60 * 30,
    maxDuration: 60 * 60,
    effects: { visibilityMult: 0.7, speedMult: 0.9, fireDamageMult: 1, electricChainBonus: 0, stealthBonus: 0, manaRegenMult: 1.5, cooldownMult: 0.8 },
    probability: 0.04,
  },
};

export class WeatherSystem {
  state: WeatherState = {
    current: WeatherType.Clear,
    intensity: 0,
    timeRemaining: 60 * 180,
    particles: [],
    windX: 0,
    windY: 0,
  };

  private screenWidth = 0;
  private screenHeight = 0;
  private transitionTimer = 0;
  private readonly MAX_PARTICLES = 200;

  resize(w: number, h: number): void {
    this.screenWidth = w;
    this.screenHeight = h;
  }

  update(): void {
    this.state.timeRemaining--;

    // Transition weather
    if (this.state.timeRemaining <= 0) {
      this.rollNewWeather();
    }

    // Fade intensity in/out
    if (this.transitionTimer > 0) {
      this.transitionTimer--;
      this.state.intensity = Math.min(1, this.state.intensity + 0.01);
    }

    // Update wind
    const time = Date.now() * 0.001;
    this.state.windX = Math.sin(time * 0.3) * 0.5;
    this.state.windY = Math.cos(time * 0.2) * 0.2;

    // Spawn weather particles
    this.spawnParticles();

    // Update particles
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx + this.state.windX;
      p.y += p.vy;
      p.life--;
      p.alpha = Math.max(0, p.life / 60);

      if (p.life <= 0 || p.y > this.screenHeight + 10 || p.x < -10 || p.x > this.screenWidth + 10) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  getEffects(): WeatherEffects {
    const config = WEATHER_CONFIGS[this.state.current];
    const t = this.state.intensity;
    return {
      visibilityMult: 1 + (config.effects.visibilityMult - 1) * t,
      speedMult: 1 + (config.effects.speedMult - 1) * t,
      fireDamageMult: 1 + (config.effects.fireDamageMult - 1) * t,
      electricChainBonus: config.effects.electricChainBonus * t,
      stealthBonus: config.effects.stealthBonus * t,
      manaRegenMult: 1 + (config.effects.manaRegenMult - 1) * t,
      cooldownMult: 1 + (config.effects.cooldownMult - 1) * t,
    };
  }

  private rollNewWeather(): void {
    const types = Object.keys(WEATHER_CONFIGS) as WeatherType[];
    const roll = Math.random();
    let cumulative = 0;
    let chosen = WeatherType.Clear;

    for (const type of types) {
      cumulative += WEATHER_CONFIGS[type].probability;
      if (roll <= cumulative) {
        chosen = type;
        break;
      }
    }

    const config = WEATHER_CONFIGS[chosen];
    this.state.current = chosen;
    this.state.intensity = 0;
    this.state.timeRemaining = config.minDuration + Math.floor(Math.random() * (config.maxDuration - config.minDuration));
    this.state.particles = [];
    this.transitionTimer = 60; // 1s fade in
  }

  private spawnParticles(): void {
    if (this.state.particles.length >= this.MAX_PARTICLES) return;
    const w = this.state.current;
    const intensity = this.state.intensity;
    if (intensity < 0.1) return;

    const spawnCount = Math.floor(intensity * this.getSpawnRate(w));

    for (let i = 0; i < spawnCount; i++) {
      const p = this.createParticle(w);
      if (p) this.state.particles.push(p);
    }
  }

  private getSpawnRate(w: WeatherType): number {
    switch (w) {
      case WeatherType.Rain: return 5;
      case WeatherType.Storm: return 8;
      case WeatherType.Fog: return 2;
      case WeatherType.ManaRain: return 4;
      case WeatherType.VoidEclipse: return 1;
      case WeatherType.CrystalShower: return 3;
      default: return 0;
    }
  }

  private createParticle(w: WeatherType): WeatherParticle | null {
    const x = Math.random() * this.screenWidth;

    switch (w) {
      case WeatherType.Rain:
        return { x, y: -5, vx: this.state.windX * 2, vy: 6 + Math.random() * 3, size: 1, alpha: 0.4, color: '#88aadd', life: 80 };
      case WeatherType.Storm:
        return { x, y: -5, vx: this.state.windX * 4, vy: 8 + Math.random() * 4, size: 1.5, alpha: 0.5, color: '#6688bb', life: 60 };
      case WeatherType.Fog:
        return { x, y: Math.random() * this.screenHeight, vx: 0.3, vy: 0, size: 30 + Math.random() * 40, alpha: 0.08, color: '#aabbcc', life: 200 };
      case WeatherType.ManaRain:
        return { x, y: -5, vx: 0, vy: 2 + Math.random() * 2, size: 3, alpha: 0.6, color: '#aa44ff', life: 100 };
      case WeatherType.VoidEclipse:
        return { x, y: Math.random() * this.screenHeight, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, size: 5, alpha: 0.3, color: '#220044', life: 150 };
      case WeatherType.CrystalShower:
        return { x, y: -5, vx: (Math.random() - 0.5) * 2, vy: 3 + Math.random() * 2, size: 4, alpha: 0.5, color: '#66eeff', life: 80 };
      default:
        return null;
    }
  }

  renderWeather(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const w = this.state.current;
    if (w === WeatherType.Clear) return;

    // Render overlay
    this.renderOverlay(ctx, width, height);

    // Render particles
    for (const p of this.state.particles) {
      ctx.globalAlpha = p.alpha * this.state.intensity;

      if (w === WeatherType.Rain || w === WeatherType.Storm) {
        // Rain streaks
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
        ctx.stroke();
      } else if (w === WeatherType.Fog) {
        // Fog blobs
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(170, 187, 204, ${p.alpha * 0.15})`);
        gradient.addColorStop(1, 'rgba(170, 187, 204, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      } else {
        // Glowing particles (mana rain, crystal shower, void eclipse)
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    ctx.globalAlpha = 1;

    // Lightning flash for storms
    if (w === WeatherType.Storm && Math.random() < 0.003 * this.state.intensity) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.2})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  private renderOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const w = this.state.current;
    const t = this.state.intensity;

    switch (w) {
      case WeatherType.Fog:
        ctx.fillStyle = `rgba(150, 160, 170, ${0.15 * t})`;
        ctx.fillRect(0, 0, width, height);
        break;
      case WeatherType.VoidEclipse:
        ctx.fillStyle = `rgba(0, 0, 20, ${0.5 * t})`;
        ctx.fillRect(0, 0, width, height);
        break;
      case WeatherType.Storm:
        ctx.fillStyle = `rgba(20, 20, 40, ${0.2 * t})`;
        ctx.fillRect(0, 0, width, height);
        break;
      case WeatherType.ManaRain:
        ctx.fillStyle = `rgba(40, 0, 60, ${0.08 * t})`;
        ctx.fillRect(0, 0, width, height);
        break;
    }
  }

  /** Render the weather indicator HUD element */
  renderWeatherHUD(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const icons: Record<WeatherType, string> = {
      [WeatherType.Clear]: '☀',
      [WeatherType.Rain]: '🌧',
      [WeatherType.Storm]: '⛈',
      [WeatherType.Fog]: '🌫',
      [WeatherType.ManaRain]: '✨',
      [WeatherType.VoidEclipse]: '🌑',
      [WeatherType.CrystalShower]: '💎',
    };

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'left';
    ctx.fillText(`${icons[this.state.current]} ${this.state.current}`, x, y);
  }
}

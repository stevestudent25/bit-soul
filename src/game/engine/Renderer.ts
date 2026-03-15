// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Canvas Renderer (Tiles, Entities, Effects, HUD)
// ═══════════════════════════════════════════════════════════════

import { Biome, TileMaterial } from '../types/World';
import type { GameMap, Tile } from '../types/World';
import type { SoulEntity, Vector2 } from '../types/SoulEntity';
import type { Camera } from './Camera';
import type { TextureManager } from './TextureManager';
import type { Particle } from './ParticleSystem';
import type { Bullet } from './BulletSystem';
import type { WeaponState } from './BulletSystem';
import type { LootDrop } from './LootSystem';
import { ITEMS, RARITY_COLORS, RARITY_GLOW } from '../data/ItemDatabase';
import { getItemColors, getGoldTierColors, getTintOverlay } from '../data/ItemColorSystem';
import type { ActiveCheckpoint } from './CheckpointManager';
import { CHECKPOINT_ACTIVE_TINTS, CHECKPOINT_GLOW_COLORS, CHECKPOINT_SYMBOLS } from '../data/CheckpointData';

// ── Biome color fallbacks ──
const BIOME_COLORS: Record<Biome, string> = {
  [Biome.CrystalCaverns]: '#2a1f4e',
  [Biome.EmberFields]: '#3d1a0a',
  [Biome.VoidMarsh]: '#1a2d1a',
  [Biome.ArcaneForest]: '#0f2e1a',
  [Biome.ShatteredPlains]: '#3a3020',
  [Biome.FrozenAether]: '#c0d8e8',
  [Biome.NeonRuins]: '#1a1a2e',
};

const WALL_VARIANTS = 8;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private tileSize: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, tileSize: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
  }

  clear(): void {
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // ── Tile Rendering ──────────────────────────────────────
  renderTiles(map: GameMap, camera: Camera, textures: TextureManager): void {
    const { startX, startY, endX, endY } = camera.getVisibleTiles();
    const ts = this.tileSize;

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = map.tiles[y]?.[x];
        if (!tile) continue;

        const screen = camera.worldToScreen(x, y);
        const sx = Math.floor(screen.x);
        const sy = Math.floor(screen.y);
        const size = Math.ceil(ts * camera.zoom);

        // Skip tiles fully off-screen
        if (sx + size < 0 || sy + size < 0 || sx > this.width || sy > this.height) continue;

        if (!tile.isPassable) {
          if (tile.properties.material === TileMaterial.Water) {
            this.renderWaterTile(sx, sy, size, x, y);
          } else {
            this.renderWallTile(sx, sy, size, tile, textures);
          }
        } else {
          this.renderGroundTile(sx, sy, size, tile, textures);
        }

        // Battle damage overlays
        if (tile.bloodSplatter) {
          this.ctx.fillStyle = 'rgba(180, 0, 0, 0.3)';
          this.ctx.fillRect(sx + size * 0.2, sy + size * 0.3, size * 0.4, size * 0.3);
        }
        if (tile.scorchMarks) {
          this.ctx.fillStyle = 'rgba(40, 20, 0, 0.4)';
          this.ctx.fillRect(sx, sy, size, size);
        }
      }
    }
  }

  private renderGroundTile(sx: number, sy: number, size: number, tile: Tile, textures: TextureManager): void {
    const texName = textures.getBiomeTexture(tile.biome);
    const variant = (tile.x * 7 + tile.y * 13) % 4;
    const tileCanvas = textures.getTile(texName, this.tileSize, variant);

    if (size === this.tileSize) {
      this.ctx.drawImage(tileCanvas, sx, sy);
    } else {
      this.ctx.drawImage(tileCanvas, 0, 0, this.tileSize, this.tileSize, sx, sy, size, size);
    }

    // Biome tint overlay
    this.ctx.fillStyle = BIOME_COLORS[tile.biome] + '30';
    this.ctx.fillRect(sx, sy, size, size);
  }

  private renderWallTile(sx: number, sy: number, size: number, tile: Tile, textures: TextureManager): void {
    const tileCanvas = textures.getWallTile(this.tileSize, (tile.x + tile.y) % WALL_VARIANTS);
    this.ctx.drawImage(tileCanvas, 0, 0, this.tileSize, this.tileSize, sx, sy, size, size);

    // 3D edge shadow
    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.ctx.fillRect(sx, sy + size - 2, size, 2);
    this.ctx.fillRect(sx + size - 2, sy, 2, size);
  }

  private renderWaterTile(sx: number, sy: number, size: number, wx: number, wy: number): void {
    const time = Date.now() * 0.001;
    const wave = Math.sin(wx * 0.5 + time * 2) * 0.1 + Math.cos(wy * 0.5 + time * 1.5) * 0.1;
    const r = 26, g = 58 + Math.floor(wave * 30), b = 107;
    this.ctx.fillStyle = `rgb(${r},${g},${b})`;
    this.ctx.fillRect(sx, sy, size, size);
    // Highlight ripple
    this.ctx.fillStyle = `rgba(100,180,255,${0.1 + wave * 0.15})`;
    this.ctx.fillRect(sx + size * 0.2, sy + size * 0.3, size * 0.6, size * 0.3);
  }

  // ── Resource Rendering ──────────────────────────────────
  renderResources(map: GameMap, camera: Camera): void {
    for (const res of map.resourceNodes) {
      if (res.remaining <= 0) continue;
      const screen = camera.worldToScreen(res.position.x, res.position.y);
      const size = Math.ceil(this.tileSize * camera.zoom * 0.5);

      const colors: Record<string, string> = {
        mana_crystal: '#8844ff',
        health_soul: '#44ff44',
        speed_boost: '#ffff44',
        shield_charge: '#44ccff',
      };
      const color = colors[res.type] || '#ffffff';

      // Pulsing glow
      const pulse = Math.sin(Date.now() * 0.003 + res.position.x) * 0.3 + 0.7;
      this.ctx.save();
      this.ctx.globalAlpha = pulse;
      this.ctx.fillStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(screen.x + size, screen.y + size, size * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  // ── Structure Rendering (with sprites) ──────────────────
  renderStructures(map: GameMap, camera: Camera, textures?: TextureManager): void {
    const structColors: Record<string, string> = {
      chest: '#c4a44d',
      shrine: '#aa88ff',
      barrel: '#8b6914',
      barrels_stacked: '#7a5a10',
      crate: '#6b5020',
      crate_small: '#5a4518',
      pillar: '#777788',
      table: '#6b4020',
      campfire: '#ff6622',
      coffin: '#554433',
      ruin: '#665544',
      tower: '#887766',
    };
    const structSymbols: Record<string, string> = {
      chest: '◈',
      shrine: '⛩',
      barrel: '⊜',
      barrels_stacked: '⊜',
      crate: '□',
      crate_small: '▫',
      pillar: '▊',
      table: '▬',
      campfire: '🔥',
      coffin: '⚰',
      ruin: '⌂',
      tower: '⛫',
    };

    for (const s of map.structures) {
      const screen = camera.worldToScreen(s.position.x, s.position.y);
      const size = Math.ceil(this.tileSize * camera.zoom);
      const color = structColors[s.type] || '#888888';

      // Try to draw sprite
      const spriteImg = textures?.getPropSprite(s.type);
      if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(spriteImg, screen.x, screen.y - size * 0.1, size, size);
        this.ctx.restore();
      } else {
        // Fallback: colored block with symbol
        this.ctx.fillStyle = color;
        this.ctx.fillRect(screen.x, screen.y, size, size);
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(screen.x, screen.y, size, size);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${Math.floor(size * 0.6)}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(structSymbols[s.type] || '?', screen.x + size / 2, screen.y + size * 0.7);
        this.ctx.textAlign = 'left';
      }

      // Show "E" prompt for chests near player (visual hint)
      if (s.type === 'chest') {
        this.ctx.fillStyle = 'rgba(255,215,0,0.6)';
        this.ctx.font = `bold ${Math.floor(size * 0.3)}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('[E]', screen.x + size / 2, screen.y - 4);
        this.ctx.textAlign = 'left';
      }
    }
  }

  // ── Loot Drop Rendering (with ItemColorSystem tinting) ──
  renderLootDrops(drops: LootDrop[], camera: Camera, frameCount: number, textures?: TextureManager): void {
    for (const drop of drops) {
      if (drop.collected) continue;
      const screen = camera.worldToScreen(drop.position.x, drop.position.y);
      const size = Math.ceil(this.tileSize * camera.zoom * 0.5);

      // Bob animation
      const bob = Math.sin((frameCount * 0.06) + drop.bobOffset) * 3;

      // Get item-specific colors
      const def = ITEMS[drop.itemId];
      const isCurrency = def?.category === 'currency';
      const goldAmount = isCurrency ? (def?.effects?.goldValue || 1) * drop.count : 0;
      const goldTier = isCurrency ? getGoldTierColors(goldAmount) : null;

      // Determine glow color — gold uses tier color, items use rarity + item color
      let glowColor: string;
      let glowSize: number;
      if (goldTier) {
        glowColor = goldTier.glow;
        glowSize = goldTier.glowRadius;
      } else if (def) {
        const itemColors = getItemColors(def);
        glowColor = itemColors.glowColor;
        glowSize = RARITY_GLOW[drop.rarity];
      } else {
        glowColor = RARITY_COLORS[drop.rarity];
        glowSize = RARITY_GLOW[drop.rarity];
      }

      // Glow circle
      if (glowSize > 0) {
        this.ctx.save();
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = glowSize;
        this.ctx.fillStyle = glowColor;
        this.ctx.globalAlpha = 0.25 + Math.sin(frameCount * 0.04) * 0.1;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y + bob - size * 0.2, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      // Draw sprite with item-specific color tint overlay
      const spriteImg = textures?.getLootSprite(drop.sprite);
      if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(spriteImg, screen.x - size * 0.5, screen.y + bob - size, size, size);

        // Apply color tint overlay
        const tintColor = goldTier ? goldTier.tint : (def ? getItemColors(def).spriteTint : null);
        if (tintColor) {
          this.ctx.globalCompositeOperation = 'source-atop';
          this.ctx.fillStyle = getTintOverlay(tintColor, 0.35);
          this.ctx.fillRect(screen.x - size * 0.5, screen.y + bob - size, size, size);
        }
        this.ctx.restore();
      } else {
        // Fallback: colored diamond using item color
        const tintColor = goldTier ? goldTier.tint : (def ? getItemColors(def).spriteTint : RARITY_COLORS[drop.rarity]);
        this.ctx.save();
        this.ctx.fillStyle = tintColor;
        this.ctx.translate(screen.x, screen.y + bob - size * 0.4);
        this.ctx.rotate(Math.PI / 4);
        this.ctx.fillRect(-size * 0.2, -size * 0.2, size * 0.4, size * 0.4);
        this.ctx.restore();
      }

      // Legendary/Epic sparkle effect
      if (drop.rarity === 'legendary' || drop.rarity === 'epic') {
        const sparkleAlpha = 0.4 + Math.sin(frameCount * 0.08 + drop.bobOffset) * 0.3;
        this.ctx.save();
        this.ctx.globalAlpha = sparkleAlpha;
        this.ctx.fillStyle = glowColor;
        const sparkleSize = 2;
        const sparkleOffset = Math.sin(frameCount * 0.05 + drop.bobOffset * 2) * size * 0.4;
        this.ctx.fillRect(screen.x + sparkleOffset - sparkleSize / 2, screen.y + bob - size * 0.6, sparkleSize, sparkleSize);
        this.ctx.restore();
      }
    }
  }

  // ── Pickup Text Rendering ───────────────────────────────
  renderPickupTexts(texts: { text: string; color: string; x: number; y: number; life: number }[], camera: Camera): void {
    for (const t of texts) {
      const screen = camera.worldToScreen(t.x, t.y);
      const alpha = Math.min(1, t.life / 30);
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = t.color;
      this.ctx.font = 'bold 13px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#000';
      this.ctx.shadowBlur = 3;
      this.ctx.fillText(t.text, screen.x, screen.y);
      this.ctx.restore();
    }
    this.ctx.textAlign = 'left';
  }

  // ── Flag Rendering ──────────────────────────────────────
  renderFlags(map: GameMap, camera: Camera, flagStates: Map<string, { carriedBy: string | null; position: Vector2 }>): void {
    for (const base of map.flagBases) {
      const screen = camera.worldToScreen(base.position.x, base.position.y);
      const size = Math.ceil(this.tileSize * camera.zoom);

      // Flag base marker (always visible)
      this.ctx.strokeStyle = base.color;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(screen.x - size * 0.3, screen.y - size * 0.3, size * 1.6, size * 1.6);

      // "BASE" label
      this.ctx.fillStyle = base.color;
      this.ctx.font = `bold ${Math.max(10, size * 0.35)}px monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText('BASE', screen.x + size * 0.5, screen.y - size * 0.4);

      // Flag position (may differ from base if being carried)
      const flagState = flagStates.get(base.teamId);
      const flagPos = flagState?.position || base.position;
      const isCarried = !!flagState?.carriedBy;
      const flagScreen = camera.worldToScreen(flagPos.x, flagPos.y);

      if (!isCarried) {
        // Draw flag at position
        const wave = Math.sin(Date.now() * 0.004) * 3;
        this.ctx.fillStyle = base.color;
        this.ctx.fillRect(flagScreen.x + size * 0.4, flagScreen.y - size * 0.2 + wave, size * 0.5, size * 0.35);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(flagScreen.x + size * 0.4, flagScreen.y - size * 0.2 + wave);
        this.ctx.lineTo(flagScreen.x + size * 0.4, flagScreen.y + size * 0.6);
        this.ctx.stroke();
      }
    }
  }

  // ── Soul Rendering ───────────────────────────────────────
  renderSouls(souls: SoulEntity[], camera: Camera, playerSoulId: string, textures?: TextureManager): void {
    for (const soul of souls) {
      if (!soul.isAlive) continue;
      const screen = camera.worldToScreen(soul.position.x, soul.position.y);
      const size = Math.ceil(this.tileSize * camera.zoom);
      const cx = screen.x + size * 0.5;
      const cy = screen.y + size * 0.5;
      const radius = size * 0.35;

      // Skip off-screen
      if (cx + size < 0 || cy + size < 0 || cx - size > this.width || cy - size > this.height) continue;

      const isPlayer = soul.id === playerSoulId;

      // Shadow
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy + size * 0.4, size * 0.3, size * 0.1, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Try to draw sprite image
      // Gun raise animation: use _gun pose when soul is actively shooting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shootFrames = (soul as any).shootingFrames as number | undefined;
      const isMonster = soul.sprite?.startsWith('mon_');
      let spriteName: string | null = null;
      if (soul.sprite) {
        if (isMonster) {
          // Monster sprites: use base sprite directly (no _stand/_gun poses)
          spriteName = soul.sprite;
        } else {
          const pose = (shootFrames && shootFrames > 0) ? '_gun' : '_stand';
          spriteName = `${soul.sprite}${pose}`;
        }
      }
      const spriteImg = spriteName && textures ? textures.getCharacterSprite(spriteName) : null;

      if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
        // Draw pixel-art sprite scaled up
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;

        // Player glow
        if (isPlayer) {
          this.ctx.shadowColor = '#44ff88';
          this.ctx.shadowBlur = 15;
        }

        // Flip sprite based on facing direction + progressive tilt for up/down
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vTilt = (soul as any).verticalTilt as number || 0;
        // Gradual ramp from 0° to 90° as W/S is held
        const tiltAngle = soul.facing.y * vTilt * (Math.PI / 2);
        if (soul.facing.x < 0) {
          this.ctx.translate(cx, cy - size * 0.15);
          this.ctx.scale(-1, 1);
          if (tiltAngle !== 0) this.ctx.rotate(tiltAngle);
          this.ctx.drawImage(spriteImg, -size * 0.5, -size * 0.45, size, size);
        } else {
          this.ctx.translate(cx, cy - size * 0.15);
          if (tiltAngle !== 0) this.ctx.rotate(tiltAngle);
          this.ctx.drawImage(spriteImg, -size * 0.5, -size * 0.45, size, size);
        }

        this.ctx.restore();
      } else {
        // Fallback: colored circle
        this.ctx.save();
        this.ctx.shadowColor = soul.physical.colorPrimary;
        this.ctx.shadowBlur = isPlayer ? 20 : 10;
        const grad = this.ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
        grad.addColorStop(0, soul.physical.colorSecondary || '#ffffff');
        grad.addColorStop(0.7, soul.physical.colorPrimary);
        grad.addColorStop(1, this.darkenColor(soul.physical.colorPrimary, 0.5));
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      // Hit flash overlay (white flash when damaged)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hitFlash = (soul as any).hitFlash as number | undefined;
      if (hitFlash && hitFlash > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = hitFlash / 8;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (soul as any).hitFlash = hitFlash - 1;
      }

      // Player indicator ring
      if (isPlayer) {
        this.ctx.strokeStyle = '#44ff88';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }

      // HP bar
      const hpPct = soul.vitals.hp / soul.vitals.hpMax;
      const barW = size * 0.7;
      const barH = 4;
      const barX = cx - barW / 2;
      const barY = cy - size * 0.55;
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(barX, barY, barW, barH);
      this.ctx.fillStyle = hpPct > 0.5 ? '#44ff44' : hpPct > 0.25 ? '#ffaa00' : '#ff4444';
      this.ctx.fillRect(barX, barY, barW * hpPct, barH);

      // Shield bar
      if (soul.vitals.shieldMax > 0) {
        const shieldPct = soul.vitals.shield / soul.vitals.shieldMax;
        this.ctx.fillStyle = '#223';
        this.ctx.fillRect(barX, barY + barH + 1, barW, 2);
        this.ctx.fillStyle = '#44ccff';
        this.ctx.fillRect(barX, barY + barH + 1, barW * shieldPct, 2);
      }

      // Name
      this.ctx.fillStyle = isPlayer ? '#ffffff' : '#aaaaaa';
      this.ctx.font = `${Math.max(9, size * 0.25)}px monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(soul.name, cx, barY - 3);
      this.ctx.textAlign = 'left';
    }
  }

  // ── Bullet Rendering ───────────────────────────────────
  renderBullets(bullets: Bullet[], camera: Camera): void {
    for (const b of bullets) {
      const screen = camera.worldToScreen(b.x, b.y);
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const len = Math.max(4, speed * this.tileSize * camera.zoom * 0.4);
      const angle = Math.atan2(b.vy, b.vx);

      this.ctx.save();
      this.ctx.strokeStyle = b.color;
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(screen.x - Math.cos(angle) * len, screen.y - Math.sin(angle) * len);
      this.ctx.lineTo(screen.x, screen.y);
      this.ctx.stroke();

      // Bright tip
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  // ── Particle Rendering ──────────────────────────────────
  renderParticles(particles: Particle[], camera: Camera): void {
    for (const p of particles) {
      const screen = camera.worldToScreen(p.x, p.y);
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, p.size * camera.zoom, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  // ── Checkpoint Rendering ─────────────────────────────────
  renderCheckpoints(checkpoints: ActiveCheckpoint[], camera: Camera, frameCount: number): void {
    for (const cp of checkpoints) {
      if (!cp.revealed) continue;

      const screen = camera.worldToScreen(cp.worldPos.x, cp.worldPos.y);
      const size = Math.ceil(this.tileSize * camera.zoom);
      const cx = screen.x + size * 0.5;
      const cy = screen.y + size * 0.5;

      // Skip off-screen
      if (cx + size * 2 < 0 || cy + size * 2 < 0 || cx - size * 2 > this.width || cy - size * 2 > this.height) continue;

      const isActive = cp.activated;
      const type = cp.def.type;
      const tint = CHECKPOINT_ACTIVE_TINTS[type];
      const glow = CHECKPOINT_GLOW_COLORS[type];
      const symbol = CHECKPOINT_SYMBOLS[type];

      // Bob animation
      const bob = Math.sin(cp.animPhase) * 2;

      // Hidden checkpoint fade-in (partially transparent until close)
      const baseAlpha = cp.def.isHidden && !isActive ? 0.5 : 1.0;

      this.ctx.save();
      this.ctx.globalAlpha = baseAlpha;

      // Glow circle (larger for active)
      const glowRadius = isActive ? size * 0.8 : size * 0.5;
      const glowAlpha = isActive
        ? 0.25 + Math.sin(frameCount * 0.04) * 0.1
        : 0.1 + Math.sin(frameCount * 0.03) * 0.05;
      this.ctx.save();
      this.ctx.shadowColor = glow;
      this.ctx.shadowBlur = isActive ? 20 : 8;
      this.ctx.fillStyle = glow;
      this.ctx.globalAlpha = glowAlpha * baseAlpha;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy + bob, glowRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      // Base pedestal
      this.ctx.fillStyle = isActive ? '#555566' : '#333344';
      this.ctx.fillRect(cx - size * 0.3, cy + size * 0.2 + bob, size * 0.6, size * 0.15);

      // Checkpoint symbol — colored and glowing for active, dim for inactive
      this.ctx.save();
      this.ctx.globalAlpha = baseAlpha;
      this.ctx.fillStyle = isActive ? tint : '#666677';
      if (isActive) {
        this.ctx.shadowColor = tint;
        this.ctx.shadowBlur = 12;
      }
      this.ctx.font = `${Math.floor(size * 0.65)}px monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(symbol, cx, cy + bob + size * 0.1);
      this.ctx.restore();

      // Active checkpoint: rotating ring
      if (isActive) {
        const ringAngle = frameCount * 0.02;
        this.ctx.save();
        this.ctx.strokeStyle = tint;
        this.ctx.lineWidth = 1.5;
        this.ctx.globalAlpha = 0.5 * baseAlpha;
        this.ctx.setLineDash([4, 6]);
        this.ctx.beginPath();
        this.ctx.arc(cx, cy + bob, size * 0.55, ringAngle, ringAngle + Math.PI * 1.5);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
      }

      // Name label (only when active or nearby — just always show for simplicity)
      if (isActive) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.8 * baseAlpha;
        this.ctx.fillStyle = tint;
        this.ctx.font = `bold ${Math.max(9, Math.floor(size * 0.28))}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText(cp.def.name, cx, cy - size * 0.45 + bob);
        this.ctx.restore();
      }

      // Pre-boss indicator
      if (cp.def.isPreBoss) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.6 * baseAlpha;
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = `${Math.max(8, Math.floor(size * 0.22))}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('☠ BOSS AHEAD', cx, cy + size * 0.5 + bob);
        this.ctx.restore();
      }

      this.ctx.restore();
    }
  }

  // ── Checkpoint Save Indicator (HUD overlay) ─────────────
  renderSaveIndicator(indicator: { text: string; alpha: number } | null): void {
    if (!indicator) return;
    this.ctx.save();
    this.ctx.globalAlpha = indicator.alpha;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    const textW = this.ctx.measureText(indicator.text).width + 30;
    const ix = this.width / 2 - textW / 2;
    const iy = this.height - 180;
    this.ctx.fillRect(ix, iy, textW, 28);
    this.ctx.strokeStyle = '#44DDFF';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(ix, iy, textW, 28);
    this.ctx.fillStyle = '#44DDFF';
    this.ctx.font = 'bold 13px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(indicator.text, this.width / 2, iy + 19);
    this.ctx.textAlign = 'left';
    this.ctx.restore();
  }

  // ── Checkpoint Activation Flash Effect ──────────────────
  renderCheckpointFlash(flash: { pos: { x: number; y: number }; progress: number; color: string } | null, camera: Camera): void {
    if (!flash) return;
    const screen = camera.worldToScreen(flash.pos.x, flash.pos.y);
    const size = this.tileSize * camera.zoom;
    const cx = screen.x + size * 0.5;
    const cy = screen.y + size * 0.5;
    const radius = flash.progress * size * 3;
    const alpha = 1 - flash.progress;

    this.ctx.save();
    this.ctx.globalAlpha = alpha * 0.4;
    this.ctx.strokeStyle = flash.color;
    this.ctx.lineWidth = 3 * (1 - flash.progress);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  // ── Invincibility Shimmer (after respawn) ───────────────
  renderInvincibleOverlay(playerPos: { x: number; y: number }, camera: Camera, frameCount: number): void {
    const screen = camera.worldToScreen(playerPos.x, playerPos.y);
    const size = this.tileSize * camera.zoom;
    const cx = screen.x + size * 0.5;
    const cy = screen.y + size * 0.5;
    const alpha = 0.15 + Math.sin(frameCount * 0.15) * 0.1;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = '#44DDFF';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#44DDFF';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, size * 0.55, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  // ── Minimap ─────────────────────────────────────────────
  renderMinimap(map: GameMap, souls: SoulEntity[], camera: Camera, playerTeamId: string): void {
    const mmSize = 160;
    const mmX = this.width - mmSize - 10;
    const mmY = this.height - mmSize - 10;
    const scale = mmSize / Math.max(map.tiles[0].length, map.tiles.length);

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4);
    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4);

    // Simplified tile rendering (every 2nd tile)
    const step = Math.max(1, Math.floor(2 / scale));
    for (let y = 0; y < map.tiles.length; y += step) {
      for (let x = 0; x < map.tiles[0].length; x += step) {
        const tile = map.tiles[y][x];
        if (!tile.isPassable) {
          this.ctx.fillStyle = tile.properties.material === TileMaterial.Water ? '#1a3a6b' : '#333';
        } else {
          this.ctx.fillStyle = BIOME_COLORS[tile.biome];
        }
        this.ctx.fillRect(mmX + x * scale, mmY + y * scale, Math.max(1, step * scale), Math.max(1, step * scale));
      }
    }

    // Souls — player green, enemies red
    for (const soul of souls) {
      if (!soul.isAlive) continue;
      this.ctx.fillStyle = soul.teamId === playerTeamId ? '#44ff88' : '#ff4444';
      const dotSize = soul.teamId === playerTeamId ? 4 : 2;
      this.ctx.fillRect(mmX + soul.position.x * scale - dotSize / 2, mmY + soul.position.y * scale - dotSize / 2, dotSize, dotSize);
    }

    // Camera viewport
    const { startX, startY, endX, endY } = camera.getVisibleTiles();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      mmX + startX * scale,
      mmY + startY * scale,
      (endX - startX) * scale,
      (endY - startY) * scale
    );
  }

  // ── HUD ─────────────────────────────────────────────────
  renderHUD(
    playerSoul: SoulEntity | undefined,
    dungeonStats: { kills: number; gold: number; floor: number; enemiesLeft: number; items?: number; zoneName?: string },
    matchTime: number,
    phase: string,
    killFeed: { text: string; color: string; time: number }[]
  ): void {
    if (!playerSoul) return;

    // Player stats panel (bottom-left)
    const panelX = 10;
    const panelY = this.height - 130;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(panelX, panelY, 260, 120);
    this.ctx.strokeStyle = playerSoul.physical.colorPrimary;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(panelX, panelY, 260, 120);

    this.ctx.fillStyle = '#ddd';
    this.ctx.font = 'bold 13px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${playerSoul.name} [${playerSoul.class}]`, panelX + 8, panelY + 18);

    // HP bar
    this.drawStatBar(panelX + 8, panelY + 28, 244, 12, playerSoul.vitals.hp, playerSoul.vitals.hpMax, '#44ff44', '#ff4444', 'HP');
    // Shield bar
    this.drawStatBar(panelX + 8, panelY + 44, 244, 8, playerSoul.vitals.shield, playerSoul.vitals.shieldMax, '#44ccff', '#224466', 'SH');
    // Mana bar
    this.drawStatBar(panelX + 8, panelY + 56, 244, 8, playerSoul.vitals.mana, playerSoul.vitals.manaMax, '#8844ff', '#332244', 'MP');
    // Stamina bar
    this.drawStatBar(panelX + 8, panelY + 68, 244, 6, playerSoul.vitals.stamina, playerSoul.vitals.staminaMax, '#ffaa22', '#332200', 'ST');

    // Abilities
    this.ctx.font = '10px monospace';
    this.ctx.fillStyle = '#aaa';
    const abilityKeys = ['Q', 'E', 'R', 'F'];
    for (let i = 0; i < Math.min(4, playerSoul.abilities.length); i++) {
      const ab = playerSoul.abilities[i];
      const ax = panelX + 8 + i * 62;
      const ay = panelY + 84;
      const onCooldown = ab.cooldownRemaining > 0;
      const noMana = playerSoul.vitals.mana < ab.manaCost;

      this.ctx.fillStyle = onCooldown ? '#333' : noMana ? '#442' : '#224';
      this.ctx.fillRect(ax, ay, 56, 28);
      this.ctx.strokeStyle = onCooldown ? '#555' : ab.isUltimate ? '#ff8800' : '#66aaff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(ax, ay, 56, 28);

      this.ctx.fillStyle = onCooldown ? '#666' : '#ddd';
      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText(`[${abilityKeys[i]}]`, ax + 2, ay + 11);
      this.ctx.font = '8px monospace';
      this.ctx.fillText(ab.name.substring(0, 8), ax + 2, ay + 22);

      if (onCooldown) {
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText(`${Math.ceil(ab.cooldownRemaining / 60)}`, ax + 40, ay + 18);
      }
    }

    // Dungeon stats display (top center)
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'center';
    const cx = this.width / 2;
    this.ctx.fillStyle = '#a855f7';
    this.ctx.fillText(`${dungeonStats.zoneName ?? ''} — Floor ${dungeonStats.floor}`, cx, 20);
    this.ctx.font = '13px monospace';
    this.ctx.fillStyle = '#44ff44';
    this.ctx.fillText(`⚔ ${dungeonStats.kills}`, cx - 80, 20);
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fillText(`💰 ${dungeonStats.gold}`, cx + 80, 20);
    if (dungeonStats.items !== undefined && dungeonStats.items > 0) {
      this.ctx.fillStyle = '#44ccff';
      this.ctx.fillText(`📦 ${dungeonStats.items}`, cx + 160, 20);
    }
    this.ctx.fillStyle = '#ff6644';
    this.ctx.fillText(`Enemies: ${dungeonStats.enemiesLeft}`, cx, 38);

    // Timer and phase
    const minutes = Math.floor(matchTime / 3600);
    const seconds = Math.floor((matchTime % 3600) / 60);
    this.ctx.fillStyle = '#888';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')} — ${phase}`, cx, 54);

    // Kill feed (top right)
    const now = Date.now();
    this.ctx.textAlign = 'right';
    this.ctx.font = '11px monospace';
    let kfY = 60;
    for (const entry of killFeed.slice(-6)) {
      const age = now - entry.time;
      if (age > 8000) continue;
      this.ctx.globalAlpha = Math.max(0, 1 - age / 8000);
      this.ctx.fillStyle = entry.color;
      this.ctx.fillText(entry.text, this.width - 10, kfY);
      kfY += 15;
    }
    this.ctx.globalAlpha = 1;
    this.ctx.textAlign = 'left';

    // Dash charges (above abilities)
    if (playerSoul.movement.dashChargesMax > 0) {
      this.ctx.font = '10px monospace';
      this.ctx.fillStyle = '#ffaa22';
      this.ctx.fillText(`DASH: ${'●'.repeat(playerSoul.movement.dashCharges)}${'○'.repeat(playerSoul.movement.dashChargesMax - playerSoul.movement.dashCharges)}`, panelX + 180, panelY - 5);
    }
  }

  // ── Ammo HUD (bottom-right) ─────────────────────────────
  renderAmmoHUD(weaponState: WeaponState): void {
    const panelW = 160;
    const panelH = 50;
    const px = this.width - panelW - 10;
    const py = this.height - panelH - 10;

    // Background
    this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
    this.ctx.fillRect(px, py, panelW, panelH);
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(px, py, panelW, panelH);

    const w = weaponState.weapon;

    // Weapon name
    this.ctx.fillStyle = '#ddd';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`🔫 ${w.name}`, px + 6, py + 16);

    // Ammo count
    const ammoColor = weaponState.ammo === 0 ? '#ff4444' : weaponState.ammo <= w.magSize * 0.25 ? '#ffaa00' : '#44ff44';
    this.ctx.fillStyle = ammoColor;
    this.ctx.font = 'bold 18px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`${weaponState.ammo}/${w.magSize}`, px + panelW - 6, py + 18);

    // Reload bar (if reloading)
    if (weaponState.reloading > 0) {
      const pct = 1 - weaponState.reloading / w.reloadTime;
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(px + 6, py + 28, panelW - 12, 6);
      this.ctx.fillStyle = '#ffaa22';
      this.ctx.fillRect(px + 6, py + 28, (panelW - 12) * pct, 6);
      this.ctx.fillStyle = '#ffaa22';
      this.ctx.font = '9px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('RELOADING', px + panelW / 2, py + 45);
    } else {
      // Ammo pips
      const maxPips = Math.min(w.magSize, 30);
      const pipW = Math.min(4, (panelW - 16) / maxPips);
      for (let i = 0; i < maxPips; i++) {
        this.ctx.fillStyle = i < weaponState.ammo ? ammoColor : '#222';
        this.ctx.fillRect(px + 6 + i * (pipW + 1), py + 28, pipW, 4);
      }
    }
    this.ctx.textAlign = 'left';
  }

  private drawStatBar(x: number, y: number, w: number, h: number, current: number, max: number, colorFull: string, colorLow: string, label: string): void {
    const pct = max > 0 ? current / max : 0;
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(x, y, w, h);
    this.ctx.fillStyle = pct > 0.3 ? colorFull : colorLow;
    this.ctx.fillRect(x, y, w * pct, h);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = `${Math.max(8, h - 2)}px monospace`;
    this.ctx.fillText(`${label} ${Math.floor(current)}/${Math.floor(max)}`, x + 3, y + h - 2);
  }

  // ── Loading screen ──────────────────────────────────────
  renderLoadingScreen(progress: number, message: string): void {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Title
    this.ctx.fillStyle = '#8844ff';
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BIT-SOUL', this.width / 2, this.height / 2 - 60);

    this.ctx.fillStyle = '#666';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(message, this.width / 2, this.height / 2 - 20);

    // Progress bar
    const barW = 300;
    const barH = 8;
    const barX = (this.width - barW) / 2;
    const barY = this.height / 2;
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(barX, barY, barW, barH);
    this.ctx.fillStyle = '#8844ff';
    this.ctx.fillRect(barX, barY, barW * progress, barH);
    this.ctx.textAlign = 'left';
  }

  private darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
  }
}

// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Loot Drop System
// ═══════════════════════════════════════════════════════════════

import type { Vector2 } from '../types/SoulEntity';
import { ITEMS, RARITY_COLORS, type ItemRarity } from '../data/ItemDatabase';

export interface LootDrop {
  id: number;
  itemId: string;
  count: number;
  position: Vector2;
  rarity: ItemRarity;
  sprite: string;
  bobOffset: number;    // random phase for bobbing animation
  spawnTime: number;     // frame when spawned
  collected: boolean;
}

export interface InventorySlot {
  itemId: string;
  count: number;
}

export class LootSystem {
  drops: LootDrop[] = [];
  inventory: InventorySlot[] = [];
  pickupTexts: { text: string; color: string; x: number; y: number; life: number }[] = [];
  private nextDropId = 1;
  private readonly MAX_DROPS = 150;
  private readonly PICKUP_RADIUS = 1.8;
  private readonly GOLD_MAGNET_RADIUS = 4.0;
  private readonly MAX_INVENTORY = 30;

  /** Spawn loot drops at a position (from enemy death, breakable, chest, etc.) */
  spawnDrops(items: { itemId: string; count: number }[], position: Vector2): void {
    for (const item of items) {
      if (this.drops.length >= this.MAX_DROPS) break;
      const def = ITEMS[item.itemId];
      if (!def) continue;

      // Scatter slightly around the position
      const scatter = 0.6;
      const drop: LootDrop = {
        id: this.nextDropId++,
        itemId: item.itemId,
        count: item.count,
        position: {
          x: position.x + (Math.random() - 0.5) * scatter,
          y: position.y + (Math.random() - 0.5) * scatter,
        },
        rarity: def.rarity,
        sprite: def.sprite,
        bobOffset: Math.random() * Math.PI * 2,
        spawnTime: 0,
        collected: false,
      };
      this.drops.push(drop);
    }
  }

  /** Update — check player proximity for pickups, gold magnet, animate */
  update(playerPos: Vector2, _frameCount: number): { goldGained: number; ammoGained: number; itemsPickedUp: string[] } {
    let goldGained = 0;
    let ammoGained = 0;
    const itemsPickedUp: string[] = [];

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      if (drop.collected) continue;

      const dx = playerPos.x - drop.position.x;
      const dy = playerPos.y - drop.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const def = ITEMS[drop.itemId];
      if (!def) continue;

      // Gold magnet — pull currency toward player
      if (def.category === 'currency' && dist < this.GOLD_MAGNET_RADIUS && dist > this.PICKUP_RADIUS) {
        const pull = 0.08;
        const len = dist || 1;
        drop.position.x += (dx / len) * pull;
        drop.position.y += (dy / len) * pull;
      }

      // Auto-pickup when close enough
      if (dist < this.PICKUP_RADIUS) {
        drop.collected = true;

        // Handle different item types
        if (def.category === 'currency') {
          const gold = (def.effects?.goldValue || 1) * drop.count;
          goldGained += gold;
          this.addPickupText(`+${gold}g`, '#FFD700', drop.position);
        } else if (def.category === 'ammo') {
          ammoGained += drop.count;
          this.addPickupText(`+Ammo`, '#88ff88', drop.position);
        } else {
          // Add to inventory
          if (this.addToInventory(drop.itemId, drop.count)) {
            itemsPickedUp.push(drop.itemId);
            const color = RARITY_COLORS[def.rarity];
            this.addPickupText(`+${def.name}`, color, drop.position);
          } else {
            // Inventory full — don't pick up
            drop.collected = false;
            continue;
          }
        }

        this.drops.splice(i, 1);
      }
    }

    // Update pickup texts
    for (let i = this.pickupTexts.length - 1; i >= 0; i--) {
      this.pickupTexts[i].life--;
      this.pickupTexts[i].y -= 0.02;
      if (this.pickupTexts[i].life <= 0) {
        this.pickupTexts.splice(i, 1);
      }
    }

    return { goldGained, ammoGained, itemsPickedUp };
  }

  /** Add item to inventory with stacking */
  addToInventory(itemId: string, count: number): boolean {
    const def = ITEMS[itemId];
    if (!def) return false;

    if (def.stackable) {
      const existing = this.inventory.find(s => s.itemId === itemId);
      if (existing) {
        existing.count = Math.min(existing.count + count, def.maxStack);
        return true;
      }
    }

    if (this.inventory.length >= this.MAX_INVENTORY) return false;
    this.inventory.push({ itemId, count });
    return true;
  }

  /** Use a consumable from inventory */
  useItem(itemId: string): { success: boolean; effects: NonNullable<typeof ITEMS[string]['effects']> | null } {
    const slot = this.inventory.find(s => s.itemId === itemId);
    if (!slot) return { success: false, effects: null };

    const def = ITEMS[itemId];
    if (!def || def.category !== 'consumable') return { success: false, effects: null };

    slot.count--;
    if (slot.count <= 0) {
      this.inventory.splice(this.inventory.indexOf(slot), 1);
    }

    return { success: true, effects: def.effects || null };
  }

  /** Check if player has a specific item */
  hasItem(itemId: string): boolean {
    return this.inventory.some(s => s.itemId === itemId);
  }

  /** Clear all drops (on floor change) */
  clear(): void {
    this.drops = [];
    this.pickupTexts = [];
  }

  private addPickupText(text: string, color: string, pos: Vector2): void {
    this.pickupTexts.push({
      text, color,
      x: pos.x, y: pos.y,
      life: 60,
    });
  }
}

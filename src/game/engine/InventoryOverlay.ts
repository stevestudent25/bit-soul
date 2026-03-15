// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Inventory Overlay (Canvas-rendered 4-Tab UI)
// ═══════════════════════════════════════════════════════════════

import { ITEMS } from '../data/ItemDatabase';
import { getItemColors, getRarityTextColor, getTintOverlay } from '../data/ItemColorSystem';
import { STORE_ITEMS, type StoreItem } from '../data/ZoneData';
import type { SoulEntity } from '../types/SoulEntity';
import type { AudioManager } from './AudioManager';

export type InventoryTab = 'items' | 'equipment' | 'store' | 'stats';

export interface InventorySlot {
  itemId: string;
  count: number;
}

export interface EquipmentSlots {
  weapon: string | null;
  armor: string | null;
  accessory: string | null;
  shield: string | null;
}

export class InventoryOverlay {
  isOpen = false;
  activeTab: InventoryTab = 'items';
  slots: InventorySlot[] = [];
  equipment: EquipmentSlots = { weapon: null, armor: null, accessory: null, shield: null };
  quickSlots: (string | null)[] = [null, null, null, null];
  audio: AudioManager | null = null;

  private scrollOffset = 0;
  private storeMessage = '';
  private storeMessageTimer = 0;

  // Layout constants
  private readonly PAD = 16;
  private readonly SLOT_SIZE = 48;
  private readonly SLOT_GAP = 6;
  private readonly COLS = 6;
  private readonly TAB_W = 90;
  private readonly TAB_H = 28;

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.scrollOffset = 0;
    }
  }

  open(): void { this.isOpen = true; this.scrollOffset = 0; }
  close(): void { this.isOpen = false; }

  /** Get all item IDs in inventory (for checkpoint save) */
  getItemIds(): string[] {
    return this.slots.map(s => s.itemId);
  }

  /** Get equipped item IDs (for checkpoint save) */
  getEquippedIds(): string[] {
    return Object.values(this.equipment).filter((v): v is string => v !== null);
  }

  /** Add items from loot pickups — stacks or inserts */
  addItem(itemId: string, count: number = 1): void {
    const def = ITEMS[itemId];
    if (!def) return;

    if (def.stackable) {
      const existing = this.slots.find(s => s.itemId === itemId);
      if (existing) {
        existing.count = Math.min(existing.count + count, def.maxStack);
        return;
      }
    }
    this.slots.push({ itemId, count });
  }

  /** Remove an item from inventory (used in consumption/selling) */
  removeItem(itemId: string, count: number = 1): boolean {
    const idx = this.slots.findIndex(s => s.itemId === itemId);
    if (idx < 0) return false;
    this.slots[idx].count -= count;
    if (this.slots[idx].count <= 0) {
      this.slots.splice(idx, 1);
    }
    return true;
  }

  hasItem(itemId: string): boolean {
    return this.slots.some(s => s.itemId === itemId);
  }

  getItemCount(itemId: string): number {
    const slot = this.slots.find(s => s.itemId === itemId);
    return slot ? slot.count : 0;
  }

  /** Use a consumable item on the player */
  useItem(itemId: string, _player: SoulEntity): boolean {
    const def = ITEMS[itemId];
    if (!def || def.category !== 'consumable' || !def.effects) return false;
    if (!this.removeItem(itemId, 1)) return false;
    // Effects are applied by GameEngine
    return true;
  }

  /** Buy an item from the store */
  buyItem(storeItem: StoreItem, playerGold: number): { success: boolean; cost: number } {
    if (playerGold < storeItem.price) {
      this.storeMessage = 'Not enough gold!';
      this.storeMessageTimer = 90;
      this.audio?.playSFX('ui_negative', { volume: 0.4 });
      return { success: false, cost: 0 };
    }
    this.addItem(storeItem.itemId, 1);
    this.storeMessage = `Bought ${storeItem.name}!`;
    this.storeMessageTimer = 90;
    return { success: true, cost: storeItem.price };
  }

  /** Sell an item back for half price */
  sellItem(itemId: string): number {
    const def = ITEMS[itemId];
    if (!def) return 0;
    if (!this.removeItem(itemId, 1)) return 0;
    // Look up store price, or estimate based on rarity
    const storeEntry = STORE_ITEMS.find(s => s.itemId === itemId);
    const sellPrice = storeEntry ? Math.floor(storeEntry.price * 0.5) : this.rarityValue(def.rarity);
    this.storeMessage = `Sold ${def.name} for ${sellPrice}g`;
    this.storeMessageTimer = 90;
    this.audio?.playSFX('collect_points', { volume: 0.4 });
    return sellPrice;
  }

  private rarityValue(rarity: string): number {
    switch (rarity) {
      case 'common': return 5;
      case 'uncommon': return 15;
      case 'rare': return 40;
      case 'epic': return 100;
      case 'legendary': return 250;
      default: return 5;
    }
  }

  /** Equip a weapon/armor/accessory */
  equipItem(itemId: string, player: SoulEntity): boolean {
    const def = ITEMS[itemId];
    if (!def) return false;

    let slot: keyof EquipmentSlots | null = null;
    if (def.category === 'weapon') slot = 'weapon';
    else if (def.category === 'armor') slot = 'armor';
    else if (def.category === 'accessory') slot = 'accessory';
    if (!slot) return false;

    // Unequip current
    const current = this.equipment[slot];
    if (current) this.addItem(current, 1);

    // Equip new
    this.equipment[slot] = itemId;
    this.removeItem(itemId, 1);

    // Apply stat effects
    if (def.effects) {
      if (def.effects.attackBoost) player.combat.attackPower += def.effects.attackBoost;
      if (def.effects.defenseBoost) player.combat.armor += def.effects.defenseBoost;
      if (def.effects.healShield) player.vitals.shieldMax += def.effects.healShield;
    }
    this.audio?.playSFX('rare_item', { volume: 0.5 });
    return true;
  }

  /** Set a quick-slot (1-4) */
  setQuickSlot(slotIndex: number, itemId: string | null): void {
    if (slotIndex >= 0 && slotIndex < 4) {
      this.quickSlots[slotIndex] = itemId;
    }
  }

  /** Use item from quick slot */
  useQuickSlot(index: number, player: SoulEntity): string | null {
    const itemId = this.quickSlots[index];
    if (!itemId) return null;
    if (this.useItem(itemId, player)) return itemId;
    // If out of item, clear slot
    if (!this.hasItem(itemId)) this.quickSlots[index] = null;
    return null;
  }

  /** Handle mouse click inside the overlay — returns true if click was consumed */
  handleClick(mx: number, my: number, canvasW: number, canvasH: number, playerGold: number, player: SoulEntity, currentZone: number): { consumed: boolean; goldChange: number; usedItemId: string | null } {
    if (!this.isOpen) return { consumed: false, goldChange: 0, usedItemId: null };

    const panelW = this.COLS * (this.SLOT_SIZE + this.SLOT_GAP) + this.PAD * 2 + 160;
    const panelH = canvasH * 0.7;
    const panelX = (canvasW - panelW) / 2;
    const panelY = (canvasH - panelH) / 2;

    // Check if click is outside panel (close)
    if (mx < panelX || mx > panelX + panelW || my < panelY || my > panelY + panelH) {
      this.close();
      return { consumed: true, goldChange: 0, usedItemId: null };
    }

    // Tab buttons
    const tabs: InventoryTab[] = ['items', 'equipment', 'store', 'stats'];
    for (let i = 0; i < tabs.length; i++) {
      const tx = panelX + this.PAD + i * (this.TAB_W + 4);
      const ty = panelY + this.PAD;
      if (mx >= tx && mx <= tx + this.TAB_W && my >= ty && my <= ty + this.TAB_H) {
        this.activeTab = tabs[i];
        this.scrollOffset = 0;
        this.audio?.playSFX('menu_click', { volume: 0.3 });
        return { consumed: true, goldChange: 0, usedItemId: null };
      }
    }

    const contentY = panelY + this.PAD + this.TAB_H + 10;

    // Items tab — click to use consumable or equip
    if (this.activeTab === 'items') {
      for (let i = 0; i < this.slots.length; i++) {
        const col = i % this.COLS;
        const row = Math.floor(i / this.COLS);
        const sx = panelX + this.PAD + col * (this.SLOT_SIZE + this.SLOT_GAP);
        const sy = contentY + row * (this.SLOT_SIZE + this.SLOT_GAP) - this.scrollOffset;
        if (mx >= sx && mx <= sx + this.SLOT_SIZE && my >= sy && my <= sy + this.SLOT_SIZE) {
          const slot = this.slots[i];
          const def = ITEMS[slot.itemId];
          if (def?.category === 'consumable') {
            if (this.useItem(slot.itemId, player)) {
              return { consumed: true, goldChange: 0, usedItemId: slot.itemId };
            }
          } else if (def?.category === 'weapon' || def?.category === 'armor' || def?.category === 'accessory') {
            this.equipItem(slot.itemId, player);
          }
          return { consumed: true, goldChange: 0, usedItemId: null };
        }
      }
    }

    // Store tab — click items to buy
    if (this.activeTab === 'store') {
      const available = STORE_ITEMS.filter(s => s.minZone <= currentZone);
      for (let i = 0; i < available.length; i++) {
        const col = i % this.COLS;
        const row = Math.floor(i / this.COLS);
        const sx = panelX + this.PAD + col * (this.SLOT_SIZE + this.SLOT_GAP);
        const sy = contentY + row * (this.SLOT_SIZE + this.SLOT_GAP) - this.scrollOffset;
        if (mx >= sx && mx <= sx + this.SLOT_SIZE && my >= sy && my <= sy + this.SLOT_SIZE) {
          const result = this.buyItem(available[i], playerGold);
          return { consumed: true, goldChange: result.success ? -result.cost : 0, usedItemId: null };
        }
      }
    }

    return { consumed: true, goldChange: 0, usedItemId: null };
  }

  /** Update per-frame (store message timer, hover) */
  update(_mx: number, _my: number, _canvasW: number, _canvasH: number): void {
    if (this.storeMessageTimer > 0) this.storeMessageTimer--;
    // Could track hover for tooltips here
  }

  /** Render the full inventory overlay */
  render(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, playerGold: number, player: SoulEntity | null, currentZone: number): void {
    if (!this.isOpen) return;

    // Dim background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const panelW = this.COLS * (this.SLOT_SIZE + this.SLOT_GAP) + this.PAD * 2 + 160;
    const panelH = canvasH * 0.7;
    const panelX = (canvasW - panelW) / 2;
    const panelY = (canvasH - panelH) / 2;

    // Panel background
    ctx.fillStyle = 'rgba(15, 15, 25, 0.95)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY', canvasW / 2, panelY - 8);

    // Gold display
    ctx.fillStyle = '#FFD700';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`💰 ${playerGold}g`, panelX + panelW - this.PAD, panelY + this.PAD + 18);
    ctx.textAlign = 'left';

    // Tabs
    const tabs: { key: InventoryTab; label: string }[] = [
      { key: 'items', label: 'ITEMS' },
      { key: 'equipment', label: 'EQUIP' },
      { key: 'store', label: 'STORE' },
      { key: 'stats', label: 'STATS' },
    ];
    for (let i = 0; i < tabs.length; i++) {
      const tx = panelX + this.PAD + i * (this.TAB_W + 4);
      const ty = panelY + this.PAD;
      const isActive = this.activeTab === tabs[i].key;
      ctx.fillStyle = isActive ? 'rgba(100, 50, 200, 0.6)' : 'rgba(40, 40, 60, 0.8)';
      ctx.fillRect(tx, ty, this.TAB_W, this.TAB_H);
      ctx.strokeStyle = isActive ? '#a855f7' : '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, this.TAB_W, this.TAB_H);
      ctx.fillStyle = isActive ? '#ffffff' : '#888';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tabs[i].label, tx + this.TAB_W / 2, ty + 18);
    }
    ctx.textAlign = 'left';

    const contentY = panelY + this.PAD + this.TAB_H + 10;
    const contentH = panelH - this.PAD * 2 - this.TAB_H - 20;

    // Clip content area
    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX, contentY, panelW, contentH);
    ctx.clip();

    switch (this.activeTab) {
      case 'items': this.renderItemsTab(ctx, panelX, contentY, panelW, contentH); break;
      case 'equipment': this.renderEquipmentTab(ctx, panelX, contentY, panelW, contentH, player); break;
      case 'store': this.renderStoreTab(ctx, panelX, contentY, panelW, contentH, currentZone, playerGold); break;
      case 'stats': this.renderStatsTab(ctx, panelX, contentY, panelW, contentH, player); break;
    }

    ctx.restore();

    // Quick-slots display at bottom of panel
    this.renderQuickSlots(ctx, panelX, panelY + panelH + 5, panelW);

    // Store message
    if (this.storeMessageTimer > 0) {
      const alpha = Math.min(1, this.storeMessageTimer / 30);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.storeMessage, canvasW / 2, panelY + panelH + 40);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
  }

  private renderItemsTab(ctx: CanvasRenderingContext2D, px: number, cy: number, pw: number, _ch: number): void {
    if (this.slots.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No items yet', px + pw / 2, cy + 40);
      ctx.textAlign = 'left';
      return;
    }

    for (let i = 0; i < this.slots.length; i++) {
      const col = i % this.COLS;
      const row = Math.floor(i / this.COLS);
      const sx = px + this.PAD + col * (this.SLOT_SIZE + this.SLOT_GAP);
      const sy = cy + row * (this.SLOT_SIZE + this.SLOT_GAP) - this.scrollOffset;

      const slot = this.slots[i];
      const def = ITEMS[slot.itemId];
      if (!def) continue;

      const itemColors = getItemColors(def);

      // Slot background with subtle item color tint
      ctx.fillStyle = getTintOverlay(itemColors.spriteTint, 0.08);
      ctx.fillRect(sx, sy, this.SLOT_SIZE, this.SLOT_SIZE);
      ctx.fillStyle = 'rgba(30, 30, 50, 0.85)';
      ctx.fillRect(sx, sy, this.SLOT_SIZE, this.SLOT_SIZE);

      // Rarity-colored border from ItemColorSystem
      ctx.strokeStyle = itemColors.borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, this.SLOT_SIZE, this.SLOT_SIZE);

      // Item name in rarity text color
      ctx.fillStyle = getRarityTextColor(def.rarity);
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      const shortName = def.name.length > 7 ? def.name.substring(0, 6) + '…' : def.name;
      ctx.fillText(shortName, sx + this.SLOT_SIZE / 2, sy + this.SLOT_SIZE / 2 + 3);

      // Stack count
      if (slot.count > 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${slot.count}`, sx + this.SLOT_SIZE - 3, sy + this.SLOT_SIZE - 4);
      }

      // Category icon in item tint color
      ctx.fillStyle = itemColors.spriteTint;
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      const icon = def.category === 'consumable' ? '♥' : def.category === 'weapon' ? '⚔' : def.category === 'armor' ? '🛡' : '◆';
      ctx.fillText(icon, sx + 3, sy + 14);

      // Subtle shimmer for epic+ items
      if (def.rarity === 'epic' || def.rarity === 'legendary') {
        ctx.fillStyle = getTintOverlay(itemColors.glowColor, 0.06);
        ctx.fillRect(sx + 1, sy + 1, this.SLOT_SIZE - 2, this.SLOT_SIZE - 2);
      }
    }
    ctx.textAlign = 'left';
  }

  private renderEquipmentTab(ctx: CanvasRenderingContext2D, px: number, cy: number, pw: number, _ch: number, _player: SoulEntity | null): void {
    const slotNames: { key: keyof EquipmentSlots; label: string; icon: string }[] = [
      { key: 'weapon', label: 'Weapon', icon: '⚔' },
      { key: 'armor', label: 'Armor', icon: '🛡' },
      { key: 'accessory', label: 'Accessory', icon: '◆' },
      { key: 'shield', label: 'Shield', icon: '🛡' },
    ];

    let y = cy + 10;
    for (const s of slotNames) {
      const equipped = this.equipment[s.key];
      const def = equipped ? ITEMS[equipped] : null;
      const itemColors = def ? getItemColors(def) : null;

      // Slot background with subtle item tint
      if (itemColors) {
        ctx.fillStyle = getTintOverlay(itemColors.spriteTint, 0.05);
        ctx.fillRect(px + this.PAD, y, pw - this.PAD * 2, 44);
      }
      ctx.fillStyle = 'rgba(30, 30, 50, 0.87)';
      ctx.fillRect(px + this.PAD, y, pw - this.PAD * 2, 44);

      ctx.strokeStyle = itemColors ? itemColors.borderColor : '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + this.PAD, y, pw - this.PAD * 2, 44);

      ctx.fillStyle = '#888';
      ctx.font = '12px monospace';
      ctx.fillText(`${s.icon} ${s.label}:`, px + this.PAD + 8, y + 18);

      if (def && itemColors) {
        ctx.fillStyle = getRarityTextColor(def.rarity);
        ctx.font = 'bold 12px monospace';
        ctx.fillText(def.name, px + this.PAD + 120, y + 18);
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText(def.description, px + this.PAD + 120, y + 34);

        // Glow effect for epic+ gear
        if (def.rarity === 'epic' || def.rarity === 'legendary') {
          ctx.fillStyle = getTintOverlay(itemColors.glowColor, 0.05);
          ctx.fillRect(px + this.PAD + 1, y + 1, pw - this.PAD * 2 - 2, 42);
        }
      } else {
        ctx.fillStyle = '#444';
        ctx.font = '11px monospace';
        ctx.fillText('- Empty -', px + this.PAD + 120, y + 18);
      }

      y += 52;
    }
  }

  private renderStoreTab(ctx: CanvasRenderingContext2D, px: number, cy: number, pw: number, _ch: number, currentZone: number, playerGold: number): void {
    const available = STORE_ITEMS.filter(s => s.minZone <= currentZone);

    if (available.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No items available', px + pw / 2, cy + 40);
      ctx.textAlign = 'left';
      return;
    }

    for (let i = 0; i < available.length; i++) {
      const col = i % this.COLS;
      const row = Math.floor(i / this.COLS);
      const sx = px + this.PAD + col * (this.SLOT_SIZE + this.SLOT_GAP);
      const sy = cy + row * (this.SLOT_SIZE + this.SLOT_GAP) - this.scrollOffset;

      const item = available[i];
      const canAfford = playerGold >= item.price;
      const itemDef = ITEMS[item.itemId];
      const itemColors = itemDef ? getItemColors(itemDef) : null;

      // Slot background — subtle item color tint when affordable
      if (canAfford && itemColors) {
        ctx.fillStyle = getTintOverlay(itemColors.spriteTint, 0.06);
        ctx.fillRect(sx, sy, this.SLOT_SIZE, this.SLOT_SIZE);
      }
      ctx.fillStyle = canAfford ? 'rgba(30, 40, 30, 0.88)' : 'rgba(40, 25, 25, 0.9)';
      ctx.fillRect(sx, sy, this.SLOT_SIZE, this.SLOT_SIZE);

      // Rarity-colored border from ItemColorSystem
      const borderColor = itemColors ? (canAfford ? itemColors.borderColor : '#442222') : '#555';
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, this.SLOT_SIZE, this.SLOT_SIZE);

      // Name in rarity text color
      const nameColor = canAfford ? getRarityTextColor(item.rarity) : '#664444';
      ctx.fillStyle = nameColor;
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      const shortName = item.name.length > 7 ? item.name.substring(0, 6) + '…' : item.name;
      ctx.fillText(shortName, sx + this.SLOT_SIZE / 2, sy + this.SLOT_SIZE / 2 - 2);

      // Price
      ctx.fillStyle = canAfford ? '#FFD700' : '#ff4444';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`${item.price}g`, sx + this.SLOT_SIZE / 2, sy + this.SLOT_SIZE - 5);
    }
    ctx.textAlign = 'left';
  }

  private renderStatsTab(ctx: CanvasRenderingContext2D, px: number, cy: number, _pw: number, _ch: number, player: SoulEntity | null): void {
    if (!player) return;

    const stats = [
      { label: 'Class', value: player.class, color: '#a855f7' },
      { label: 'Level', value: `${player.level}`, color: '#44ff44' },
      { label: 'HP', value: `${player.vitals.hp}/${player.vitals.hpMax}`, color: '#44ff44' },
      { label: 'Shield', value: `${Math.floor(player.vitals.shield)}/${player.vitals.shieldMax}`, color: '#44ccff' },
      { label: 'Mana', value: `${Math.floor(player.vitals.mana)}/${player.vitals.manaMax}`, color: '#8844ff' },
      { label: 'Stamina', value: `${Math.floor(player.vitals.stamina)}/${player.vitals.staminaMax}`, color: '#ffaa00' },
      { label: 'Attack', value: `${player.combat.attackPower}`, color: '#ff4444' },
      { label: 'Armor', value: `${player.combat.armor}`, color: '#8888ff' },
      { label: 'Speed', value: `${player.movement.speedBase.toFixed(1)}`, color: '#44ffaa' },
      { label: 'Crit %', value: `${(player.combat.critChance * 100).toFixed(0)}%`, color: '#ffaa44' },
      { label: 'Kills', value: `${player.kills}`, color: '#ff8888' },
      { label: 'Gold', value: `${player.gold}`, color: '#FFD700' },
      { label: 'Floor', value: `${player.currentFloor}`, color: '#888' },
    ];

    let y = cy + 10;
    for (const s of stats) {
      ctx.fillStyle = '#888';
      ctx.font = '12px monospace';
      ctx.fillText(s.label + ':', px + this.PAD + 8, y + 14);
      ctx.fillStyle = s.color;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(String(s.value), px + this.PAD + 120, y + 14);
      y += 22;
    }
  }

  private renderQuickSlots(ctx: CanvasRenderingContext2D, px: number, y: number, pw: number): void {
    const slotW = 40;
    const gap = 8;
    const totalW = 4 * slotW + 3 * gap;
    const startX = px + (pw - totalW) / 2;

    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Quick Slots [1-4]', px + pw / 2, y);

    for (let i = 0; i < 4; i++) {
      const sx = startX + i * (slotW + gap);
      const sy = y + 5;

      ctx.fillStyle = 'rgba(20, 20, 35, 0.9)';
      ctx.fillRect(sx, sy, slotW, slotW);

      const itemId = this.quickSlots[i];
      const def = itemId ? ITEMS[itemId] : null;
      const itemColors = def ? getItemColors(def) : null;

      // Border — colored by item or dim gray
      ctx.strokeStyle = itemColors ? itemColors.borderColor : '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, slotW, slotW);

      // Key number
      ctx.fillStyle = '#555';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}`, sx + 3, sy + 12);

      if (def && itemColors) {
        // Item name in item tint color
        ctx.fillStyle = itemColors.spriteTint;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        const short = def.name.length > 5 ? def.name.substring(0, 4) + '…' : def.name;
        ctx.fillText(short, sx + slotW / 2, sy + slotW / 2 + 3);
      }
    }
    ctx.textAlign = 'left';
  }
}

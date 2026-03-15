// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Zone Manager (Zone Progression & State Tracking)
// ═══════════════════════════════════════════════════════════════

import { ZONES, type ZoneDef } from '../data/ZoneData';

export interface ZoneState {
  currentZoneIndex: number;       // index into ZONES array
  currentFloor: number;           // absolute floor within zone
  bossesDefeated: Set<string>;    // boss IDs that have been beaten
  zonesUnlocked: Set<string>;     // zone IDs that the player can access
  bossSpawned: boolean;           // whether the boss has been spawned this zone
}

export class ZoneManager {
  state: ZoneState;

  constructor() {
    this.state = {
      currentZoneIndex: 0,
      currentFloor: 1,
      bossesDefeated: new Set(),
      zonesUnlocked: new Set(['zone1_village']),
      bossSpawned: false,
    };
  }

  get currentZone(): ZoneDef {
    return ZONES[this.state.currentZoneIndex];
  }

  get currentZoneNumber(): number {
    return this.currentZone.number;
  }

  get zoneName(): string {
    return this.currentZone.name;
  }

  get biome() {
    return this.currentZone.biome;
  }

  get enemyCount(): number {
    return this.currentZone.enemyCount;
  }

  get enemySprites(): string[] {
    return this.currentZone.enemySprites;
  }

  /** Check if the current zone's last floor should spawn a boss */
  shouldSpawnBoss(): boolean {
    const zone = this.currentZone;
    if (!zone.bossId) return false;
    if (this.state.bossesDefeated.has(zone.bossId)) return false;
    if (this.state.bossSpawned) return false;
    // Boss spawns on the last floor of the zone
    return this.state.currentFloor >= zone.floorRange[1];
  }

  /** Get the boss ID for the current zone (null if none or already defeated) */
  getBossId(): string | null {
    const zone = this.currentZone;
    if (!zone.bossId) return null;
    if (this.state.bossesDefeated.has(zone.bossId)) return null;
    return zone.bossId;
  }

  /** Mark the current zone's boss as defeated */
  defeatBoss(bossId: string): void {
    this.state.bossesDefeated.add(bossId);
    // Unlock next zone
    const nextIdx = this.state.currentZoneIndex + 1;
    if (nextIdx < ZONES.length) {
      this.state.zonesUnlocked.add(ZONES[nextIdx].id);
    }
  }

  /** Advance to next floor within the current zone; returns true if we should move to next zone */
  advanceFloor(): 'same_zone' | 'next_zone' | 'boss_floor' | 'game_complete' {
    const zone = this.currentZone;
    this.state.currentFloor++;

    // Check if this floor is the boss floor
    if (this.state.currentFloor >= zone.floorRange[1] && zone.bossId && !this.state.bossesDefeated.has(zone.bossId)) {
      return 'boss_floor';
    }

    // Check if we've completed all floors in this zone
    if (this.state.currentFloor > zone.floorRange[1]) {
      // If zone has no boss, auto-unlock the next zone
      if (!zone.bossId) {
        const nextIdx = this.state.currentZoneIndex + 1;
        if (nextIdx < ZONES.length) {
          this.state.zonesUnlocked.add(ZONES[nextIdx].id);
        }
      }

      // Move to next zone if available
      const nextIdx = this.state.currentZoneIndex + 1;
      if (nextIdx >= ZONES.length) {
        return 'game_complete';
      }
      // Check if next zone is unlocked
      if (this.state.zonesUnlocked.has(ZONES[nextIdx].id)) {
        this.state.currentZoneIndex = nextIdx;
        this.state.currentFloor = ZONES[nextIdx].floorRange[0];
        this.state.bossSpawned = false;
        return 'next_zone';
      }
      // If not unlocked, stay on the current zone's last floor (boss must be defeated)
      this.state.currentFloor = zone.floorRange[1];
      return 'boss_floor';
    }

    return 'same_zone';
  }

  /** Set boss as spawned for the current zone */
  markBossSpawned(): void {
    this.state.bossSpawned = true;
  }

  /** Get the floor multiplier for enemy scaling */
  getFloorMultiplier(): number {
    return 1 + (this.state.currentFloor - 1) * 0.15;
  }

  /** Reset zone state for a new game */
  reset(): void {
    this.state = {
      currentZoneIndex: 0,
      currentFloor: 1,
      bossesDefeated: new Set(),
      zonesUnlocked: new Set(['zone1_village']),
      bossSpawned: false,
    };
  }

  /** Restore zone state from a saved game */
  restoreFromSave(zoneNumber: number, floor: number, bossesDefeated: string[]): void {
    const idx = ZONES.findIndex(z => z.number === zoneNumber);
    this.state.currentZoneIndex = idx >= 0 ? idx : 0;
    this.state.currentFloor = floor;
    this.state.bossesDefeated = new Set(bossesDefeated);
    this.state.bossSpawned = false;
    // Unlock zones up to the current one
    this.state.zonesUnlocked = new Set<string>();
    for (let i = 0; i <= this.state.currentZoneIndex; i++) {
      this.state.zonesUnlocked.add(ZONES[i].id);
    }
  }

  /** Get display string for the current zone/floor */
  getPhaseLabel(): string {
    return `${this.zoneName} — Floor ${this.state.currentFloor}`;
  }

  /** Get list of defeated boss IDs (for checkpoint save) */
  getDefeatedBosses(): string[] {
    return Array.from(this.state.bossesDefeated);
  }
}

// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Audio Manager (Web Audio API)
// ═══════════════════════════════════════════════════════════════

// ── Sound Manifest — maps logical keys to actual file paths ──

const AUDIO_BASE = 'assets/audio';

/** Every audio key → relative path under public/assets/audio/ */
const SOUND_MANIFEST: Record<string, string> = {
  // ── MUSIC ──
  music_game_over:   'music/alphix-game-over-417465.mp3',
  music_exploration: 'music/freesound_community-short-chillout-loop-for-games-or-layering-80244.mp3',
  music_level_complete: 'music/freesound_crunchpixstudio-level-complete-394515.mp3',
  music_intro:       'music/kucinskyphotos-game-intro-345507.mp3',
  music_victory:     'music/pw23check-winning-218995.mp3',
  music_defeat:      'music/tromosm-beated-by-a-computer-by-tromosm-281034.mp3',
  music_dungeon:     'music/xtremefreddy-game-music-loop-3-144252.mp3',

  // ── AMBIENT ──
  amb_horror:        'ambient/alesiadavina-lurking-horror-monster-143278.mp3',
  amb_town:          'ambient/freesound_community-alone-in-town-22743.mp3',
  amb_forest:        'ambient/freesound_community-centaur-forest-60695.mp3',
  amb_swamp:         'ambient/freesound_community-marsh-27860.mp3',
  amb_industrial:    'ambient/jadeallencook-large-industrial-fan-running-constantly-in-warehouse-environment-339216.mp3',
  amb_mystery:       'ambient/liecio-cartoon-sci-fi-mystery-132275.mp3',
  amb_spooky:        'ambient/trenox8-spooky-background-atmosphere-for-games-295559.mp3',

  // ── SFX — Effects / Transitions ──
  glitch_transition: 'sfx/alexzavesa-glitch-transition-2-463626.mp3',
  achievement:       'sfx/denielcz-achievement-unlocked-463070.mp3',
  alert_siren:       'sfx/dogwolf123-retro-siren-sound-474816.mp3',

  // ── SFX — Weapons ──
  laser_fire:        'sfx/driken5482-retro-laser-1-236669.mp3',
  pistol_reload:     'sfx/epic_stock_media-game_weapons_designed_pistol_revolver_recharge_ammo_2-47135.mp3',
  fireball:          'sfx/freesound_community-8-bit-fireball-81148.mp3',
  missile_fire:      'sfx/freesound_community-missile-firing-fl-106655.mp3',
  bio_gun:           'sfx/u_7atk93mmrk-video-game-bio-gun-sfx-203965.mp3',
  explosion:         'sfx/lumora_studios-pixel-explosion-319166.mp3',

  // ── SFX — Impacts ──
  damage_hit:        'sfx/freesound_community-damage-40114.mp3',
  energy_hit:        'sfx/freesound_crunchpixstudio-material-energy-hit-394495.mp3',
  flesh_impact:      'sfx/u_nwdx76su56-impacto-flesh-448972.mp3',

  // ── SFX — Player ──
  footsteps:         'sfx/creatorshome-footsteps-video-games-330952.mp3',
  player_hurt:       'sfx/stepir44-hurt-sound-435314.mp3',
  eat_food:          'sfx/u_scysdwddsp-eating-effect-254996.mp3',
  player_character:  'sfx/universfield-game-character-140506.mp3',

  // ── SFX — Power Ups / Buffs ──
  power_up_1:        'sfx/floraphonic-power-up-sparkle-1-177983.mp3',
  power_up_2:        'sfx/floraphonic-power-up-sparkle-2-177984.mp3',
  power_up_3:        'sfx/floraphonic-power-up-sparkle-3-177985.mp3',
  power_up_generic:  'sfx/superpuyofans1234-video-game-power-up-404172.mp3',
  energy_drink:      'sfx/ribhavagrawal-energy-drink-effect-230559.mp3',

  // ── SFX — Magic / Effects ──
  magic_sfx:         'sfx/freesound_community-076833_magic-sfx-for-games-86023.mp3',
  fire_magic:        'sfx/freesound_community-fire-magic-6947.mp3',
  teleport:          'sfx/freesound_community-game-teleport-90735.mp3',
  scary_effect:      'sfx/universfield-scary-game-effect-131801.mp3',

  // ── SFX — Items / Loot ──
  chest_open:        'sfx/freesound_crunchpixstudio-material-chest-open-394472.mp3',
  coin_pickup:       'sfx/freesound_crunchpixstudio-material-gold-394476.mp3',
  collect_points:    'sfx/liecio-collect-points-190037.mp3',
  item_pickup:       'sfx/u_o8xh7gwsrj-flower_pickup_positive-476369.mp3',
  inventory_change:  'sfx/lazychillzone-inventory-change-1-232442.mp3',
  bonus:             'sfx/universfield-video-game-bonus-323603.mp3',

  // ── SFX — UI ──
  menu_click:        'sfx/not_amasingrock-video-game-menu-click-sounds-148373.mp3',
  ui_negative:       'sfx/freesound_community-negative_beeps-6008.mp3',
  ui_popup:          'sfx/freesound_crunchpixstudio-board-pop-up-394471.mp3',
  combo_clear:       'sfx/freesound_crunchpixstudio-clear-combo-4-394493.mp3',

  // ── SFX — Environment ──
  robot_sound:       'sfx/freesound_community-little-robot-sound-84657.mp3',
  sand_effect:       'sfx/u_scysdwddsp-sand-effect-254993.mp3',
};

// ── Fuzzy Key Aliases — maps trigger names to manifest keys ──
const KEY_ALIASES: Record<string, string> = {
  // Weapon fire aliases
  pistol_fire: 'laser_fire',
  shotgun_fire: 'fireball',
  rifle_fire: 'missile_fire',
  smg_fire: 'bio_gun',
  reload: 'pistol_reload',
  weapon_swap: 'inventory_change',
  empty_click: 'ui_negative',

  // Impact aliases
  hit_flesh: 'flesh_impact',
  hit_wall: 'damage_hit',
  critical_hit: 'energy_hit',
  bullet_impact: 'damage_hit',
  melee_hit: 'flesh_impact',

  // Player aliases
  player_death: 'scary_effect',
  dodge_roll: 'glitch_transition',
  heal: 'power_up_1',
  level_up: 'achievement',
  stamina_depleted: 'ui_negative',
  stamina_recovered: 'power_up_3',
  player_spawn: 'player_character',

  // Enemy aliases
  enemy_alert: 'alert_siren',
  enemy_hurt: 'damage_hit',
  enemy_death: 'explosion',
  boss_roar: 'scary_effect',

  // Item aliases
  gold_pickup: 'coin_pickup',
  rare_item: 'power_up_2',
  potion_drink: 'energy_drink',
  chest_locked: 'ui_negative',
  break_barrel: 'explosion',
  break_crate: 'damage_hit',

  // Environment aliases
  door_open: 'chest_open',
  portal_enter: 'teleport',
  secret_found: 'combo_clear',
  zone_transition: 'glitch_transition',
  weather_thunder: 'explosion',

  // UI aliases
  menu_hover: 'ui_popup',
  menu_back: 'ui_negative',
  game_start: 'combo_clear',
  pause: 'menu_click',
  unpause: 'menu_click',
  inventory_open: 'inventory_change',
  inventory_close: 'inventory_change',
  quest_accept: 'achievement',
  quest_complete: 'combo_clear',
  notification: 'ui_popup',

  // Music aliases
  music_menu: 'music_intro',
  music_battle: 'music_dungeon',
  music_boss: 'music_dungeon',

  // Ambient aliases
  amb_caves: 'amb_spooky',
  amb_dungeon: 'amb_horror',
  amb_ruins: 'amb_mystery',
};

// ── Audio Manager Class ──────────────────────────────────────

interface SFXOptions {
  volume?: number;
  loop?: boolean;
  cooldown?: number;
  randomPitch?: boolean;
  spatial?: boolean;
  sourceX?: number;
  sourceY?: number;
  listenerX?: number;
  listenerY?: number;
  maxDistance?: number;
  delay?: number;
}

interface MusicOptions {
  volume?: number;
  loop?: boolean;
  fadeIn?: number;
}

export class AudioManager {
  // Volume controls
  masterVolume = 0.7;
  musicVolume = 0.4;
  sfxVolume = 0.7;
  ambientVolume = 0.3;

  // State
  private audioCache = new Map<string, HTMLAudioElement>();
  private currentMusic: HTMLAudioElement | null = null;
  private currentMusicKey = '';
  private ambientLayers: { key: string; audio: HTMLAudioElement }[] = [];
  private cooldowns = new Map<string, number>();
  private muted = false;
  private initialized = false;

  constructor() {
    // Audio requires user interaction to start — we'll init on first play
  }

  /** Call once on first user click/keypress to unlock Web Audio */
  ensureInit(): void {
    if (this.initialized) return;
    this.initialized = true;
  }

  // ── Core: resolve a key to actual manifest key ──
  private resolveKey(key: string): string {
    // Direct match
    if (SOUND_MANIFEST[key]) return key;
    // Alias match
    if (KEY_ALIASES[key] && SOUND_MANIFEST[KEY_ALIASES[key]]) return KEY_ALIASES[key];
    // Fuzzy: check if any manifest key contains the query word
    const lk = key.toLowerCase().replace(/[_\-\s]/g, '');
    for (const mk of Object.keys(SOUND_MANIFEST)) {
      if (mk.toLowerCase().replace(/[_\-\s]/g, '').includes(lk)) return mk;
    }
    return '';
  }

  /** Load/cache an audio element for a given key */
  private getAudio(key: string): HTMLAudioElement | null {
    const resolved = this.resolveKey(key);
    if (!resolved) return null;

    if (this.audioCache.has(resolved)) {
      return this.audioCache.get(resolved)!;
    }

    const path = `${AUDIO_BASE}/${SOUND_MANIFEST[resolved]}`;
    const audio = new Audio(path);
    audio.preload = 'auto';
    this.audioCache.set(resolved, audio);
    return audio;
  }

  /** Create a fresh clone for overlapping playback */
  private cloneAudio(key: string): HTMLAudioElement | null {
    const resolved = this.resolveKey(key);
    if (!resolved) return null;
    const path = `${AUDIO_BASE}/${SOUND_MANIFEST[resolved]}`;
    return new Audio(path);
  }

  // ── SFX Playback ──────────────────────────────────────

  playSFX(key: string, opts: SFXOptions = {}): void {
    this.ensureInit();
    if (this.muted) return;

    const {
      volume = 0.5,
      cooldown = 0,
      randomPitch = false,
      spatial = false,
      sourceX, sourceY, listenerX, listenerY,
      maxDistance = 300,
      delay = 0,
    } = opts;

    // Cooldown check
    if (cooldown > 0) {
      const now = Date.now();
      const lastPlayed = this.cooldowns.get(key) || 0;
      if (now - lastPlayed < cooldown) return;
      this.cooldowns.set(key, now);
    }

    const play = () => {
      // Use clone for SFX so we can overlap
      const audio = this.cloneAudio(key);
      if (!audio) return;

      let finalVol = volume * this.sfxVolume * this.masterVolume;

      // Spatial volume falloff
      if (spatial && sourceX !== undefined && sourceY !== undefined &&
          listenerX !== undefined && listenerY !== undefined) {
        const dx = sourceX - listenerX;
        const dy = sourceY - listenerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const factor = Math.max(0, 1 - (dist / maxDistance));
        finalVol *= factor * factor;
      }

      audio.volume = Math.min(1, Math.max(0, finalVol));

      if (randomPitch) {
        // Use playbackRate to simulate pitch variation (0.9 - 1.1)
        audio.playbackRate = 0.9 + Math.random() * 0.2;
      }

      audio.play().catch(() => { /* user hasn't interacted yet */ });
    };

    if (delay > 0) {
      setTimeout(play, delay);
    } else {
      play();
    }
  }

  /** Play a random variant from a pool (e.g., power_up_1, power_up_2, power_up_3) */
  playRandomSFX(baseKey: string, opts: SFXOptions = {}): void {
    // Try to find numbered variants
    const variants: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const vk = `${baseKey}_${i}`;
      if (this.resolveKey(vk)) variants.push(vk);
    }
    // Fallback to base key
    if (variants.length === 0) {
      if (this.resolveKey(baseKey)) variants.push(baseKey);
    }
    if (variants.length === 0) return;

    const chosen = variants[Math.floor(Math.random() * variants.length)];
    this.playSFX(chosen, opts);
  }

  // ── Music Playback ────────────────────────────────────

  playMusic(key: string, opts: MusicOptions = {}): void {
    this.ensureInit();
    if (this.muted) return;

    const { volume = 0.5, loop = true, fadeIn = 0 } = opts;

    // Don't restart the same track
    if (this.currentMusicKey === key && this.currentMusic && !this.currentMusic.paused) return;

    // Stop current music
    this.stopMusic(fadeIn > 0 ? fadeIn / 2 : 0);

    const audio = this.getAudio(key);
    if (!audio) return;

    audio.loop = loop;
    const targetVol = Math.min(1, volume * this.musicVolume * this.masterVolume);

    if (fadeIn > 0) {
      audio.volume = 0;
      audio.currentTime = 0;
      audio.play().catch(() => {});
      this.fadeAudio(audio, 0, targetVol, fadeIn);
    } else {
      audio.volume = targetVol;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }

    this.currentMusic = audio;
    this.currentMusicKey = key;
  }

  stopMusic(fadeOut = 0): void {
    if (!this.currentMusic) return;

    const audio = this.currentMusic;
    this.currentMusic = null;
    this.currentMusicKey = '';

    if (fadeOut > 0) {
      this.fadeAudio(audio, audio.volume, 0, fadeOut, () => {
        audio.pause();
        audio.currentTime = 0;
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  // ── Ambient Layers ────────────────────────────────────

  playAmbient(key: string, opts: { volume?: number; fadeIn?: number } = {}): void {
    this.ensureInit();
    if (this.muted) return;

    const { volume = 0.3, fadeIn = 0 } = opts;

    // Don't stack the same ambient
    if (this.ambientLayers.some(l => l.key === key)) return;

    const audio = this.cloneAudio(key);
    if (!audio) return;

    audio.loop = true;
    const targetVol = Math.min(1, volume * this.ambientVolume * this.masterVolume);

    if (fadeIn > 0) {
      audio.volume = 0;
      audio.play().catch(() => {});
      this.fadeAudio(audio, 0, targetVol, fadeIn);
    } else {
      audio.volume = targetVol;
      audio.play().catch(() => {});
    }

    this.ambientLayers.push({ key, audio });
  }

  stopAmbient(key: string, fadeOut = 500): void {
    const idx = this.ambientLayers.findIndex(l => l.key === key);
    if (idx < 0) return;

    const layer = this.ambientLayers.splice(idx, 1)[0];
    if (fadeOut > 0) {
      this.fadeAudio(layer.audio, layer.audio.volume, 0, fadeOut, () => {
        layer.audio.pause();
      });
    } else {
      layer.audio.pause();
    }
  }

  stopAllAmbient(fadeOut = 500): void {
    for (const layer of [...this.ambientLayers]) {
      this.stopAmbient(layer.key, fadeOut);
    }
  }

  // ── Volume Controls ───────────────────────────────────

  setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.updateAllVolumes();
  }

  setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.updateAllVolumes();
  }

  setSFXVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.muted) {
      this.currentMusic?.pause();
      this.ambientLayers.forEach(l => l.audio.pause());
    } else {
      if (this.currentMusic) this.currentMusic.play().catch(() => {});
      this.ambientLayers.forEach(l => l.audio.play().catch(() => {}));
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }

  private updateAllVolumes(): void {
    if (this.currentMusic) {
      this.currentMusic.volume = Math.min(1, this.musicVolume * this.masterVolume);
    }
    for (const layer of this.ambientLayers) {
      layer.audio.volume = Math.min(1, this.ambientVolume * this.masterVolume);
    }
  }

  // ── Utility ───────────────────────────────────────────

  private fadeAudio(
    audio: HTMLAudioElement,
    from: number, to: number,
    duration: number,
    onComplete?: () => void,
  ): void {
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      audio.volume = Math.min(1, Math.max(0, from + (to - from) * t));
      if (t < 1) {
        requestAnimationFrame(tick);
      } else if (onComplete) {
        onComplete();
      }
    };
    requestAnimationFrame(tick);
  }

  /** Clean up everything */
  destroy(): void {
    this.stopMusic();
    this.stopAllAmbient(0);
    this.audioCache.clear();
    this.cooldowns.clear();
  }
}

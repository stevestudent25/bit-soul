# BIT-SOUL — Dungeon Crawler RPG

A 2D top-down dungeon crawler RPG built with TypeScript, React, and HTML5 Canvas.

## Play

Visit the [live game](https://stevestudent25.github.io/bit-soul/) on GitHub Pages.

## Features

- **5 Playable Classes** — Soldier, Hitman, Robot, Survivor, Scout — each with unique stats, abilities, and playstyle
- **9 Zones & 8 Bosses** — Haven Village, Darkwood Forest, Crystal Caves, Murkmire Swamp, Ancient Ruins, Iron Fortress, Scorching Desert, Magma Fortress, and The Dark Realm — each with a unique boss encounter
- **Procedural Dungeons** — Every floor is procedurally generated with rooms, corridors, and obstacles
- **Combat System** — Projectile-based shooting with 4 weapon types, muzzle flash, hitstop on crits, and 4 class abilities (Q/E/R/F)
- **AI Enemies** — Pathfinding enemies that chase, attack, and scale with floor difficulty
- **Loot & Inventory** — Breakable props, chests, enemy drops with rarity tiers (Common to Legendary), equipment slots, quick-use consumables, and an in-game store
- **Item Color System** — Rarity-based color coding for loot drops, inventory, and gold tier visualization
- **Checkpoint System** — Auto-save checkpoints across all 9 zones with death respawn, hidden checkpoints to discover, and Continue Game support
- **Audio System** — Dynamic music, ambient soundscapes, and spatial SFX with 70+ sound effects
- **Weather Effects** — Rain, fog, and atmospheric particles
- **Sprint & Physics** — Acceleration/deceleration movement with sprint stamina and dash ability

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move |
| Mouse | Aim |
| Left Click | Shoot |
| Shift | Sprint |
| Space | Dash |
| Q / E / R / F | Class Abilities |
| R | Reload |
| Tab / I | Inventory |
| 1-4 | Quick Slots |
| ESC | Pause |

## Tech Stack

- **TypeScript** + **React 19** — UI and game component
- **Vite 7** — Build tooling with single-file output
- **HTML5 Canvas** — Custom 2D rendering engine
- **Web Audio API** — Spatial audio and music system
- **Tailwind CSS 4** — UI styling
- **GitHub Pages** — Hosted via GitHub Actions CI/CD

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`.

## License

All rights reserved.

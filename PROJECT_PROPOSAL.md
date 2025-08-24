Got it—removed the dungeon-revealer import. Here’s the updated **RevealCraft** proposal (features-only).

# RevealCraft — Project Proposal

## Vision

A lightweight, self-hosted, table-ready tool that lets GMs **craft exactly what each player sees**—true per-player line-of-sight, beautiful lighting, and zero clutter.

## Feature Pillars

- **Immersion:** dynamic lighting, LoS, personal fog memory
- **Simplicity:** fast map prep, clean UI, projector mode
- **Control:** DM overrides, doors, initiative, encounter flow
- **Freedom:** self-hosted, offline-friendly, flexible imports/exports

---

## Core Table Features

- **Per-player Line of Sight:** each character sees only what they can perceive; persistent “dim memory” for explored areas
- **Lighting System:** ambient presets, token-carried light, static lights, vision cones, darkvision/low-light profiles
- **Walls & Doors:** draw/edit walls; door states (open/closed/locked/secret); quick toggles and reveals
- **Maps & Layers:** import image maps; grid calibration & snapping; layers for walls/doors/lights/tokens/notes; DM-only layer for traps and secrets
- **Tokens & Creatures:** sizes (S → Gargantuan), labels, auras, conditions, facing; ownership & control hand-off
- **Measurement & Tools:** ruler (grid or freeform), area templates, pings/markers, annotations, sticky notes
- **Initiative & Turn Tracker:** add combatants, sort, round counter, condition timers, lair/legendary reminders
- **Dice & Chat:** inline rolls, quick macros, GM whispers, player hand-raise and reactions

## DM Quality-of-Life

- **Override Reveal:** brush/box reveal, quick re-shroud, “bump reveal” as tokens explore
- **Scene/Campaign Management:** folders, favorites, encounter templates, session prep checklists
- **Projector/Second-Screen Mode:** instant player-facing view; hotkeys for doors, lights, scene swap
- **Session Log:** automatic timeline of reveals, doors, conditions, and rolls; exportable recap

## Player Experience

- **One-tap Join:** link or room code; character switcher; spectator mode
- **Status Board:** HP, conditions, inspiration/luck, resources and rests
- **Personal Notes:** private character notes and map pins (optional share with DM)

## Content Handling & Imports

- **Map & Asset Library:** organize maps, tokens, lights/doors setups; favorites and packs
- **Import/Export:** walls, doors, lights, tokens to/from common VTT-adjacent formats (no dungeon-revealer import)
- **Encounter Packs:** pre-placed enemies, hazards, read-aloud text, lair/legendary actions

## Accessibility

- **Color-safe Palettes & High Contrast**
- **Text Scaling & Reduced Motion** (per-user preferences)
- **Keyboard-First Controls** with remappable shortcuts; screen-reader-friendly labels

## Admin, Sharing & Privacy

- **Roles & Permissions:** DM, co-DM, player, observer; per-token control
- **Invites & Lobbies:** link-based join with optional approval; session lock
- **Local/LAN Mode:** offline play with exportable session state
- **Backups/Exports:** scenes, logs, and assets bundled for archiving

## Integrations (Opt-In)

- **D\&D Beyond Sync (if officially permitted):** connect a campaign to import character sheets and optionally sync HP/conditions/inspiration and roll logs
- **SRD/Reference Data:** rules lookups for classes/spells/items without depending on a single platform
- **Audio Ambience:** optional scene playlists and sound triggers
- **Share-outs:** export fog snapshots, final map reveals, and session summaries for recaps

## Stretch Features

- **Auto-Wall Assist:** fast “ink to walls” detection on imported maps
- **Advanced Lighting:** cones/windows, animated flicker, colored lights, environmental hazards
- **Exploration Replay:** ghost-trail of movement and reveal over time
- **Stealth & Senses Helpers:** passive perception pings, invisibility handling, tremorsense/blindsight profiles
- **Bridge Connectors:** export to popular VTT wall/light formats; optional webhooks for rolls/events

## Differentiators

- **True per-player LoS** with memory—not just manual fog painting
- **Door and light state as first-class scene elements**
- **Projector mode + hotkeys** for rapid, at-table control
- **Import/export focus** to fit any GM workflow (no dependency on a specific tool)

## MVP Scope (Feature-First)

1. Maps & grid; tokens with ownership; pings/ruler
2. Walls/doors authoring; per-player LoS with fog memory; basic lighting
3. DM overrides; initiative/conditions; session log
4. Library + imports/exports; projector mode; accessibility essentials

## Success Metrics

- New scene setup (with walls/lights) in **≤ 5 minutes**
- **One-keystroke** door toggles and scene swaps during play
- Players consistently report **“I only see what my character sees.”**
- Import/export covers **most** common VTT wall/light formats with minimal rework

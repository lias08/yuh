# ANIME BRAWL – ULTIMATE CLASH

A playable 3D anime arena brawler for the browser, phone or desktop: 3v3 top-down
fights with 60 fighters from Jujutsu Kaisen, Dragon Ball, Naruto, Bleach, One Piece, My Hero Academia and Demon Slayer. The
centrepiece is the **transformation system**. Every fighter changes model, moveset, stats and
playstyle when transformed, and seven fighters have a second stage (e.g. Goku: Super Saiyan Blue →
Ultra Instinct, Ichigo: True Bankai → Horn of Salvation).

> Non-commercial **fan prototype**. All characters belong to their respective rights holders.
> No original assets, music or animations are used. Models, effects, sounds and music are all
> generated procedurally in code. Game modes and systems are inspired by the 3v3 arena-brawler
> genre; names and visuals are original.

## Start

```bash
cd anime-brawl
npm install
npm run dev        # http://localhost:5173 (also reachable on your local network → phone)
npm run build      # production build in dist/ (static, can be hosted anywhere)
npm run check:data # validates all 50 character kits
```

**Desktop:** WASD to move · mouse to aim · left click to attack · right click / space for Super · E for gadget · F/Q to transform · 1–4 for pins · Esc to leave.
**Touch:** left joystick to move · drag the attack/Super button to aim manually, tap it for auto-aim · gadget and FORM buttons.

## Android APK

A signed release APK is in `release/AnimeBrawl-UltimateClash-v1.2.1.apk` (≈3.9 MB, Android 7+ / API 24+, landscape, fullscreen, fully offline).
Install it by copying it to your phone and opening it (allow "install from unknown sources").

Build it yourself (needs JDK 21 and the Android SDK, `ANDROID_HOME` set):
```bash
npm run android:sync                      # vite build + copy into android/
cd android && ./gradlew assembleRelease   # → android/app/build/outputs/apk/release/app-release.apk
```
For a signed build, create `android/keystore.properties` (storeFile, storePassword, keyAlias, keyPassword). Without it Gradle produces an unsigned APK. The keystore is deliberately not in the repository.

## Cutscenes, voices, difficulty

- Ultimates of Mythic/Legendary/Divine fighters (and every Super while transformed) play a short **cutscene**: time freezes, the camera moves in front of the fighter, with cinema bars, speed lines and the attack name. This can be switched off in Settings.
- **Voices:** the game contains no original voice actor audio from the anime (copyrighted). Under fighter → "Stimme" you can record your own 3-second lines for Super, transformation and victory with the microphone; they are stored on the device and played in battle. Attack names appear as speech bubbles.
- Bot difficulty is selectable in Settings (easy / normal / hard), and gameplay is about 15 % slower overall than in v1.1.

## Accounts & owner

- On first launch you create an account (name + optional PIN). Every account has its own save on the device, and several accounts can share one phone.
- Names are unique and case-insensitive; look-alikes such as `z1ias` or `ZLIAS` are blocked.
- The first account named **`zlias`** becomes the **owner**: 👑 title, crown in the name and the **admin panel** (crown button in the lobby). The panel covers currencies, unlocks, editing fighters, match cheats (invulnerable, instant Super, bot strength, FPS), custom codes, managing the device's accounts and messages to all of them. The owner account needs a PIN and cannot be deleted or renamed.
- ⚠ There is no server yet: uniqueness and ownership apply **per device**. Global names need a backend (`src/core/accounts.js` is the interface for one).

## Codes & training

- **Code `67`** (lobby → gadget icon in the top bar, or Settings → "Code einlösen"): unlocks all 50 fighters at level 11 with all gadgets, passive powers, gears, Overdrive and skins, plus unlimited coins, gems and credits, the premium pass and all cosmetics.
- **Training** (blue "Training" button in the lobby or "Testen" on any fighter): dummies, a moving dummy, an optional fighting bot, a damage/DPS meter, buttons to fill Super and the form meter instantly, an ability overview, and switching to any of the 50 fighters on the spot.

## What's included

| Area | Status |
|---|---|
| 50 fighters (10 per anime) | ✅ each with its own main attack, Super, 2 gadgets, 2 passive powers, stats, rarity, description, play style and sound profile |
| Transformations | ✅ all 50 change model, moveset, stats and passives; 7 two-stage forms; cinematic with slow motion, zoom and banner |
| Unique mechanics | ✅ e.g. Infinity (projectiles slow down), Boogie Woogie (swapping places), Minato's teleport markers, Law's ROOM, Gear 5 grab, Hakai execution, Future Sight, Mahoraga adaptation, Black Flash, Ratio 7:3, domain expansions |
| Modes | ✅ Crystal Rush, Spirit Ball, Survival (solo/duo), Vault Heist, Zone Control, Knockout, Boss Fight (co-op), Anime Tournament (3 rounds with rotating rules), Training |
| Arenas | ✅ 5 themes (Shibuya, Namek, Konoha, Soul Society, Wano) with bushes, water, crates, walls that Supers can destroy, and decoration |
| Combat | ✅ ammo system, auto-aim and manual aim, bushes, line of sight, knockback, stun, burn, slow, shields, summons, domains, traps, temporary walls |
| Bots | ✅ A* pathfinding, mode objectives, leading shots, dodging, use of Super, gadget and transformation |
| Lobby & menus | ✅ 3D lobby (character reacts to taps and can be rotated), fighter collection with filters, detail page with 3D model, stats, ability and form preview, training test |
| Progression | ✅ levels 1–11 (coins + power points), gadgets, passive powers, gears, Overdrive, skins, per-fighter trophies, trophy road, mastery, season reset |
| Shop & Battle Pass | ✅ daily offers, Soul Orbs, skins, fighters, pins/sprays/emotes/effects, free and premium track (premium bought with gems) |
| Profile & social | ✅ profile, titles, badges, stats, friends, team invites, clubs with club chat, leaderboards |
| Saving | ✅ localStorage (`animebrawl.save.v1`) |
| Sound | ✅ every sound effect and both music loops are synthesised live with WebAudio |

## Honest limitations

- **Online multiplayer is not implemented** — there is no backend. Matches run locally with bots.
  The simulation is driven by input commands; `src/net/transport.js` describes the protocol and has
  a prepared `WebSocketTransport` for an authoritative server.
- **Friends, clubs, club chat and leaderboards** are populated by generated bot players (labelled as such in-game).
- **Real-money purchases are disabled.** Gems come from the trophy road, the pass, orbs and gifts.
- Models are sculpted procedurally in code (signed-distance shapes merged into one continuous mesh, smooth normals, baked AO, skinned to a skeleton) and generated on device in web workers. They are not hand-modelled assets made by a 3D artist, and faces are painted textures. Animations are procedural.
- There is one map layout per mode; variety comes from 5 visual themes.
- No voice lines.

## Project structure

```
src/
  data/roster/*.js   50 character definitions (pure data, one file per anime)
  data/maps.js       map layouts (mirrored for fairness), themes, modes
  data/progression.js upgrade costs, trophy road, pass, quests, gears, cosmetics
  game/actions.js    ability building blocks (projectile, cone, dash, beam, aoe, nova, domain, summon, …)
  game/specials.js   unique mechanics (Gojo, Todo, Minato, Law, Gear 5, …)
  game/fighter.js    fighter/minion logic, statuses, transformations
  game/world.js      match simulation, damage pipeline, zones, camera, cinematics
  game/modes/        all game modes + boss
  game/ai.js         bot AI
  game/input.js, hud.js  controls and battle HUD
  render/            cel-shading materials, models, hair, faces, animation, VFX, arena, lobby stage
  ui/                app shell, screens, icons
  core/              save state/economy, audio
  net/transport.js   network interface
dev/gallery.html     character gallery for visual checks (/dev/gallery.html?ids=goku,luffy&form=trans)
```

Debug URL parameters: `?autoplay=1` (AI plays the player), `?sim=N` (N simulation steps per frame without rendering).

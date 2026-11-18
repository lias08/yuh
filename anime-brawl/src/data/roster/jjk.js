import { P, C, D, BM, A, N, DOM, SUM, BUF, BL, WALL, HOOK, SEQ, MULTI, CU, slow, stun, knock, pull, burn, fx, SKIN } from './helpers.js';

const UNIFORM = { type: 'jacket', color: 0x1a1e2e, collar: true, sleeves: 'long', buttons: true };
const UPANTS = { type: 'pants', color: 0x1a1e2e };

export default [
  // 1 ─ SATORU GOJO ───────────────────────────────────────────────────────────
  {
    id: 'gojo', name: 'Satoru Gojo', anime: 'jjk', rarity: 'divine', role: 'Kontrolleur',
    desc: 'Der stärkste Jujutsu-Zauberer. Infinity verlangsamt jedes Geschoss, das ihm zu nahe kommt.',
    playstyle: 'Wechselt automatisch zwischen Blue (zieht Gegner zusammen) und Red (schleudert sie fort). Setze Unlimited Void, wenn mehrere Gegner nah stehen.',
    stats: { hp: 3900, speed: 3.3, reload: 1.45, ammo: 3, superHits: 5 },
    sfx: 'space', victory: 'peace',
    passive: [{ type: 'infinity', reduce: 0.3, name: 'Infinity' }],
    look: { skin: SKIN.pale, hair: { style: 'gojo', color: 0xf3f6ff }, eyes: { type: 'sixeyes', color: 0x48b4ff }, marks: ['blindfold'], extras: ['blindfold'], top: UNIFORM, bottom: UPANTS, mouth: 'smirk', build: 'tall' },
    main: CU('gojoBlueRed', { name: 'Blue / Red', desc: 'Abwechselnd: Blue zieht Gegner in einen Wirbel, Red stößt sie mit einer Explosion weg.', dmg: 820, anim: 'point', sfx: 'space' }),
    super: DOM({ name: 'Domain Expansion: Unlimited Void', desc: 'Alle Gegner in der Domäne werden mit unendlicher Information überflutet: lange Betäubung und Dauerschaden.', title: 'DOMAIN EXPANSION', subtitle: 'Unlimited Void', r: 4.2, t: 3.6, dps: 420, onEnter: { stun: 2.2 }, color: 0x5a7dff, color2: 0xe8f1ff, particle: 0xbfd8ff, sfx: 'domain' }),
    gadgets: [
      BUF({ name: 'Reverse Cursed Technique', desc: 'Heilt 1400 LP und entfernt alle negativen Effekte.', buff: { heal: 1400, cleanse: true, color: 0x8fe8ff }, sfx: 'heal' }),
      BL({ name: 'Lapse: Blue Teleport', desc: 'Teleportiert Gojo sofort bis zu 5 Felder in Zielrichtung.', dist: 'aim', maxDist: 5, color: 0x5a9dff, sfx: 'teleport' }),
    ],
    starPowers: [
      { name: 'Six Eyes', desc: 'Super lädt 20 % schneller.', type: 'stat', superRate: 1.2 },
      { name: 'Unendliche Barriere', desc: 'Infinity reduziert zusätzlich 15 % jedes Schadens.', type: 'damageReduce', f: 0.15 },
    ],
    trans: {
      name: 'Shinjuku Gojo', duration: 15, aura: 0x7ad8ff, aura2: 0xffffff, auraStyle: 'flame',
      desc: 'Augenbinde ab, Six Eyes vollständig offen. Blue und Red werden kombiniert, Hollow Purple durchschlägt Wände.',
      look: { marksRemove: ['blindfold'], extrasRemove: ['blindfold'], eyes: { type: 'sixeyes', color: 0x5ad0ff }, mouth: 'grin', glow: 0x7ad8ff, hair: { style: 'gojoWild' }, top: { type: 'coat', color: 0x14161f, color2: 0x2a3550, collar: true, buttons: false, sleeves: 'long', replace: true }, bottom: { type: 'pants', color: 0x14161f } },
      stats: { speed: 1.12, dmg: 1.15, reload: 0.8 },
      passive: [{ type: 'infinity', reduce: 0.55 }],
      main: CU('gojoCombo', { name: 'Blue → Red Kombination', desc: 'Blue zieht Gegner zusammen, Red detoniert gleich danach am selben Punkt.', dmg: 760, anim: 'cast', sfx: 'space' }),
      super: P({ name: 'Hollow Technique: Purple', desc: 'Imaginäre Masse: riesige Kugel, die alles durchschlägt und Wände auslöscht.', shape: 'void', color: 0xb04cff, size: 1.0, w: 0.95, speed: 9, range: 13, dmg: 2700, pierce: true, pierceWalls: true, breakWalls: true, effects: knock(1.5), anim: 'clap', animDur: 0.6, sfx: 'purple', delay: 0.35 }),
      onEnter: N({ r: 3, dmg: 300, color: 0x7ad8ff, effects: knock(1.6) }),
    },
  },

  // 2 ─ RYOMEN SUKUNA ─────────────────────────────────────────────────────────
  {
    id: 'sukuna', name: 'Ryomen Sukuna', anime: 'jjk', rarity: 'divine', role: 'Assassine',
    desc: 'Der König der Flüche. Unsichtbare Schnitte zerlegen alles in Reichweite.',
    playstyle: 'Dismantle trifft mehrere Gegner hintereinander. Die Domäne verwandelt jede Engstelle in eine Todeszone.',
    stats: { hp: 4500, speed: 3.35, reload: 1.3, ammo: 3, superHits: 5 },
    sfx: 'slash', victory: 'laugh',
    look: { skin: SKIN.fair, hair: { style: 'yuji', color: 0xf3a0b0, color2: 0x3a2228 }, eyes: { type: 'demon', color: 0xc8202a }, marks: ['sukuna'], mouth: 'fangs', top: { type: 'jacket', color: 0x1a1e2e, color2: 0xc8202a, collar: true, sleeves: 'long' }, bottom: UPANTS, build: 'normal' },
    main: P({ name: 'Dismantle', desc: 'Drei unsichtbare Schnittwellen, die durch Gegner hindurchgehen.', shape: 'blade', color: 0xff3b55, count: 3, spread: 22, speed: 16, range: 6.5, dmg: 430, w: 0.3, pierce: true, anim: 'slash', sfx: 'slash' }),
    super: DOM({ name: 'Malevolent Shrine', desc: 'Domäne ohne Barriere: Cleave und Dismantle schneiden ununterbrochen alles in Reichweite.', title: 'DOMAIN EXPANSION', subtitle: 'Malevolent Shrine', r: 4.6, t: 4, dps: 1050, color: 0xc81830, color2: 0xff8090, particle: 0xff4060, slashFx: true, sfx: 'domain' }),
    gadgets: [
      C({ name: 'Cleave', desc: 'Ein einzelner schwerer Schnitt, der sich an der Stärke des Ziels ausrichtet.', range: 1.9, arc: 110, dmg: 1700, color: 0xff2a40, effects: knock(1), anim: 'overhead', sfx: 'heavySlash' }),
      P({ name: 'Fuga: Open', desc: 'Ein Flammenpfeil, der explodiert und den Boden in Brand setzt.', shape: 'spike', color: 0xff7a1a, color2: 0xffe08a, speed: 13, range: 8, dmg: 900, w: 0.35, explode: { r: 1.8, dmg: 900, effects: burn(400, 2) }, anim: 'throw', sfx: 'fire' }),
    ],
    starPowers: [
      { name: 'König der Flüche', desc: '+30 % Schaden unter 50 % LP.', type: 'lowHpDmg', below: 0.5, mult: 1.3 },
      { name: 'Reverse Cursed Technique', desc: '15 % des verursachten Schadens heilen Sukuna.', type: 'lifesteal', f: 0.15 },
    ],
    trans: {
      name: 'Heian-Form', duration: 14, aura: 0xff2a40, aura2: 0x220008, auraStyle: 'flame',
      desc: 'Vier Arme, vier Augen. Dismantle feuert doppelt, Fuga wird zur Super.',
      look: { extrasAdd: ['extraArms'], marksAdd: ['fourEyes'], hair: { style: 'sukunaHeian' }, top: { type: 'kimono', color: 0xf2efe6, color2: 0x1a1a1a, sleeves: 'wide' }, bottom: { type: 'hakama', color: 0x2a2a30 }, build: 'muscle', skin: 0xf0c8a8 },
      stats: { hp: 1.15, dmg: 1.2, speed: 1.05, reload: 0.85 },
      main: P({ name: 'Vierarmiges Dismantle', desc: 'Zwei Salven aus je drei Schnitten — die zweite Hand-Paar-Salve folgt sofort.', shape: 'blade', color: 0xff2a40, count: 3, spread: 30, speed: 17, range: 7, dmg: 380, w: 0.32, pierce: true, burst: { n: 2, gap: 0.14 }, anim: 'flurry', sfx: 'slash' }),
      super: P({ name: 'Fuga: Brennender Pfeil', desc: 'Riesiger Flammenpfeil: gewaltige Explosion und ein Flammenmeer, das 4 s brennt.', shape: 'spike', color: 0xff6a10, color2: 0xfff0a0, size: 0.7, speed: 15, range: 10, dmg: 1500, w: 0.5, explode: { r: 2.6, dmg: 1800, effects: burn(600, 3) }, onEnd: A({ self: false, r: 2.6, landDelay: 0, dmg: 0, fx: 'ring', color: 0xff6a10, linger: { t: 4, tick: 0.5, dmg: 260, color: 0xff6a10, effects: burn(300, 1) }, useTarget: true }), anim: 'throw', animDur: 0.6, sfx: 'fireBig', delay: 0.25 }),
      onEnter: N({ r: 3.2, dmg: 500, color: 0xff2a40, effects: knock(2) }),
    },
  },

  // 3 ─ YUJI ITADORI ──────────────────────────────────────────────────────────
  {
    id: 'yuji', name: 'Yuji Itadori', anime: 'jjk', rarity: 'common', role: 'Kämpfer',
    desc: 'Übermenschliche Kraft und Divergent Fist: Jeder Schlag trifft zweimal.',
    playstyle: 'Bleib nah dran. Jeder normale Treffer hat eine Chance auf Black Flash (2,5× Schaden).',
    stats: { hp: 5300, speed: 3.45, reload: 1.0, ammo: 3, superHits: 4 },
    sfx: 'punch', victory: 'fistUp',
    passive: [{ type: 'critChance', chance: 0.12, mult: 2.5, kinds: ['main', 'super'], name: 'Black Flash', color: 0x111111 }],
    look: { skin: SKIN.fair, hair: { style: 'yuji', color: 0xf3a0b0, color2: 0x3a2228 }, eyes: { color: 0x7a4a2a }, top: { type: 'hoodie', color: 0x1a1e2e, color2: 0xc8202a, collar: true, sleeves: 'long' }, bottom: UPANTS, mouth: 'grin' },
    main: C({ name: 'Divergent Fist', desc: 'Schlag mit verzögerter zweiter Fluchenergie-Welle.', range: 1.7, arc: 70, dmg: 640, hits: 2, gap: 0.16, lunge: 0.5, color: 0x6ab8ff, anim: 'punch', sfx: 'punch' }),
    super: D({ name: 'Black-Flash-Kombination', desc: 'Sprint zum Gegner und eine Kette aus fünf Schlägen — der letzte ist ein garantierter Black Flash.', dist: 'aim', maxDist: 5, speed: 20, dmg: 300, w: 0.8, color: 0x1a0a14, stopOnHit: true, end: C({ range: 1.8, arc: 120, dmg: 520, hits: 5, gap: 0.1, finisher: 2.5, color: 0xff2040, effects: knock(2), anim: 'flurry', animDur: 0.6, sfx: 'blackFlash' }), sfx: 'dash' }),
    gadgets: [
      BUF({ name: 'Fluchenergie-Schub', desc: '+35 % Tempo für 3 s.', buff: { speed: 0.35, t: 3, color: 0x6ab8ff }, sfx: 'powerup' }),
      C({ name: 'Manji-Tritt', desc: 'Weiter Tritt, der Gegner zurückstößt.', range: 2.0, arc: 140, dmg: 900, effects: knock(2.4), anim: 'kick', sfx: 'punch' }),
    ],
    starPowers: [
      { name: 'Im Flow', desc: 'Black-Flash-Chance +13 %.', type: 'critChance', chance: 0.13, mult: 2.5, kinds: ['main', 'super'] },
      { name: 'Gefäß des Königs', desc: 'Heilt 10 % des verursachten Schadens.', type: 'lifesteal', f: 0.1 },
    ],
    trans: {
      name: 'Erwachter Yuji', duration: 14, aura: 0x1a0812, aura2: 0xff1a3a, auraStyle: 'flame',
      desc: 'Nach dem Erwachen in Shinjuku: Black Flash kommt fast immer, und Yuji beherrscht Dismantle.',
      look: { eyes: { type: 'sharp', color: 0x7a1a2a }, mouth: 'flat', top: { type: 'hoodie', color: 0x2a0e14, color2: 0xc8202a }, angry: true, marksAdd: ['scarCheek'] },
      stats: { speed: 1.15, dmg: 1.1, reload: 0.75 },
      passive: [{ type: 'critChance', chance: 0.33, mult: 2.5, kinds: ['main', 'super'] }],
      main: C({ name: 'Schwarzer Funkenhagel', desc: 'Drei schnelle Schläge mit Vorwärtsschritt.', range: 1.9, arc: 80, dmg: 520, hits: 3, gap: 0.09, lunge: 0.8, color: 0xff1a3a, anim: 'flurry', sfx: 'punch' }),
      super: MULTI([
        D({ dist: 'aim', maxDist: 6, speed: 24, dmg: 500, w: 0.9, color: 0xff1a3a, stopOnHit: true, end: C({ range: 2, arc: 140, dmg: 700, hits: 4, gap: 0.09, finisher: 2.5, color: 0x111111, anim: 'flurry', sfx: 'blackFlash' }) }),
        P({ shape: 'blade', color: 0xff3b55, count: 3, spread: 30, speed: 17, range: 7, dmg: 500, pierce: true, delay: 0.55, sfx: 'slash' }),
      ], { name: 'Black Flash × Dismantle', desc: 'Black-Flash-Ansturm, gefolgt von drei Dismantle-Schnitten.', anim: 'dash' }),
      onEnter: N({ r: 2.6, dmg: 400, color: 0xff1a3a, effects: knock(1.5) }),
    },
  },

  // 4 ─ YUTA OKKOTSU ──────────────────────────────────────────────────────────
  {
    id: 'yuta', name: 'Yuta Okkotsu', anime: 'jjk', rarity: 'legendary', role: 'Beschwörer',
    desc: 'Sonderklasse. Kämpft mit dem Katana — und mit Rika, dem Königin der Flüche.',
    playstyle: 'Schwinge das Katana auf mittlere Distanz; beschwöre Rika, damit sie Gegner bindet.',
    stats: { hp: 4300, speed: 3.3, reload: 1.35, ammo: 3, superHits: 4 },
    sfx: 'slash', victory: 'swordUp',
    look: { skin: SKIN.light, hair: { style: 'yuta', color: 0x16161c }, eyes: { color: 0x2a2a3a }, top: { type: 'jacket', color: 0xf2f2f4, collar: true, sleeves: 'long', buttons: true }, bottom: { type: 'pants', color: 0x1a1e2e }, weapon: { type: 'katana' }, mouth: 'flat', build: 'slim' },
    main: C({ name: 'Fluchklinge', desc: 'Weiter Katana-Schnitt, mit Fluchenergie verstärkt.', range: 2.3, arc: 110, dmg: 880, color: 0xd0b8ff, sfx: 'slash' }),
    super: SUM({ name: 'Rika!', desc: 'Rika erscheint für 9 s und zerfetzt Gegner in der Nähe.', unit: { name: 'Rika', hp: 3600, life: 9, speed: 3.6, rate: 0.85, scale: 1.0, color: 0xb48cff, aura: 0x6a3aa8, ghost: true, look: { skin: 0xd8d2ea, build: 'giant', hair: { style: 'madara', color: 0x2a2440 }, eyes: { type: 'blank' }, mouth: 'fangs', top: { type: 'bare', color: 0xd8d2ea }, bottom: { type: 'robe', color: 0x3a2a5a }, extras: ['noEars'], claws: true }, attack: C({ range: 1.7, arc: 120, dmg: 780, color: 0xb48cff, effects: knock(1.2), anim: 'overhead', sfx: 'roar' }) }, sfx: 'roar' }),
    gadgets: [
      { kind: 'nova', name: 'Cursed Speech: „Beweg dich nicht“', desc: 'Kopierte Technik: Gegner in 4,5 Feldern werden 1 s betäubt.', r: 4.5, dmg: 100, color: 0xcfe0ff, effects: stun(1), anim: 'point', sfx: 'voice' },
      BUF({ name: 'Reverse Cursed Technique', desc: 'Heilt Yuta und Verbündete in der Nähe um 1100 LP.', allies: true, r: 3.5, buff: { heal: 1100, color: 0x8fe8ff }, sfx: 'heal' }),
    ],
    starPowers: [
      { name: 'Reine Liebe', desc: 'Rika lebt 4 s länger und hat 30 % mehr LP.', type: 'summonBoost', life: 4, hp: 1.3 },
      { name: 'Kopierer', desc: 'Super lädt 15 % schneller.', type: 'stat', superRate: 1.15 },
    ],
    trans: {
      name: 'Volle Rika-Manifestation', duration: 15, aura: 0xb48cff, aura2: 0xffffff,
      desc: 'Yuta und Rika kämpfen vereint. Rika begleitet ihn die ganze Form über; sein Katana feuert Fluchstrahlen.',
      look: { eyes: { type: 'glow', color: 0xb48cff }, mouth: 'flat', glow: 0xb48cff, weapon: { type: 'katana', color: 0xb48cff, emissive: 0x6a3aa8 } },
      stats: { dmg: 1.15, reload: 0.85 },
      onEnter: SUM({ unit: { name: 'Rika (vollständig)', hp: 5200, life: 15, speed: 3.8, rate: 0.75, follow: true, color: 0xb48cff, aura: 0x6a3aa8, ghost: true, look: { skin: 0xd8d2ea, build: 'titan', hair: { style: 'madara', color: 0x2a2440 }, eyes: { type: 'blank' }, mouth: 'fangs', top: { type: 'bare', color: 0xd8d2ea }, bottom: { type: 'robe', color: 0x3a2a5a }, extras: ['noEars'], claws: true }, attack: C({ range: 1.9, arc: 140, dmg: 900, color: 0xb48cff, effects: knock(1.5), anim: 'overhead' }) } }),
      main: P({ name: 'Fluchklingen-Welle', desc: 'Der Schnitt wird zu einer violetten Welle auf Distanz.', shape: 'slash', color: 0xb48cff, speed: 15, range: 7, dmg: 800, w: 0.55, pierce: true, anim: 'slash', sfx: 'slash' }),
      super: BM({ name: 'Reine Liebe: Kanonenstrahl', desc: 'Rika feuert einen gewaltigen Strahl aus reiner Fluchenergie durch alle Wände.', range: 11, w: 0.85, dmg: 330, ticks: 8, gap: 0.09, charge: 0.45, color: 0xb48cff, color2: 0xffffff, pierceWalls: true, breakWalls: true, effects: knock(1.5), anim: 'kame', animDur: 1.2, sfx: 'beamBig' }),
    },
  },

  // 5 ─ TOJI FUSHIGURO ────────────────────────────────────────────────────────
  {
    id: 'toji', name: 'Toji Fushiguro', anime: 'jjk', rarity: 'mythic', role: 'Assassine',
    desc: 'Himmlische Einschränkung: keinerlei Fluchenergie, dafür unmenschliche Physis. Verlangsamungen prallen an ihm ab.',
    playstyle: 'Der schnellste Kämpfer. Kurze, präzise Stiche mit vier Munitionsladungen — rein, töten, raus.',
    stats: { hp: 4200, speed: 3.8, reload: 0.85, ammo: 4, superHits: 4 },
    sfx: 'slash', victory: 'armsCrossed',
    passive: [{ type: 'immune', effects: ['slow'], name: 'Heavenly Restriction' }, { type: 'dodge', chance: 0.12 }],
    look: { skin: SKIN.fair, hair: { style: 'toji', color: 0x101014 }, eyes: { color: 0x2a3a2a, type: 'sharp' }, marks: ['scarCheek'], mouth: 'smirk', top: { type: 'shirt', color: 0x1c1c22, sleeves: 'short' }, bottom: { type: 'pants', color: 0xd8d4c8 }, weapon: { type: 'spear', color: 0xc9cfda }, build: 'muscle' },
    main: C({ name: 'Inverted Spear of Heaven', desc: 'Blitzschneller Stich mit Vorwärtsschritt. Ignoriert Schilde.', range: 1.7, arc: 45, dmg: 560, lunge: 0.8, color: 0xdfe6f0, effects: { breakShield: true }, anim: 'punch', sfx: 'slash' }),
    super: BL({ name: 'Heavenly Restriction Assault', desc: 'Erscheint hinter dem nächsten Gegner und schlägt dreimal zu.', dist: 'aim', maxDist: 7, behindTarget: true, color: 0xdfe6f0, then: C({ range: 1.9, arc: 160, dmg: 700, hits: 3, gap: 0.1, finisher: 1.5, color: 0xffffff, effects: stun(0.4), anim: 'flurry', sfx: 'slash' }), sfx: 'teleport' }),
    gadgets: [
      C({ name: 'Playful Cloud', desc: 'Dreigliedriger Stab: gewaltiger Schlag mit starkem Rückstoß.', range: 2.3, arc: 120, dmg: 1200, effects: knock(3), anim: 'overhead', sfx: 'heavySlash' }),
      HOOK({ name: 'Kettensprung', desc: 'Wirft die Kette und zieht sich zum getroffenen Gegner.', selfPull: true, shape: 'kunai', color: 0xc0c8d4, speed: 20, range: 7, dmg: 400, w: 0.3, sfx: 'kunai' }),
    ],
    starPowers: [
      { name: 'Zauberer-Mörder', desc: 'Jeder Kill heilt 40 % der LP.', type: 'killHeal', f: 0.4 },
      { name: 'Sinne eines Jägers', desc: '+20 % Tempo in Büschen.', type: 'bushSpeed', mult: 1.2 },
    ],
    trans: {
      name: 'Wiedergänger Toji', duration: 13, aura: 0x8a8a9a, aura2: 0xffffff, auraStyle: 'spark',
      desc: 'Shibuya-Toji, nur noch Instinkt. Zwei Waffen, rasende Kombos, und ein Splitterschwert, das Seelen durchtrennt.',
      look: { eyes: { type: 'blank' }, mouth: 'flat', top: { type: 'bare', color: 0x1c1c22 }, weapon: { type: 'katana', color: 0xd8dde8, dual: true } },
      stats: { speed: 1.22, reload: 0.7 },
      passive: [{ type: 'dodge', chance: 0.25 }],
      main: C({ name: 'Doppelklingen-Raserei', desc: 'Zwei Klingen, vier Treffer.', range: 1.9, arc: 90, dmg: 330, hits: 4, gap: 0.07, lunge: 0.6, color: 0xffffff, anim: 'flurry', sfx: 'slash' }),
      super: D({ name: 'Split Soul Katana', desc: 'Durchquert die Arena in einem Strich — Schaden ignoriert jeden Schutz.', dist: 8, speed: 30, dmg: 2400, w: 0.9, color: 0xffffff, invuln: true, ghost: true, effects: { breakShield: true, trueDmg: true }, anim: 'dash', sfx: 'slashBig' }),
      onEnter: N({ r: 2.2, dmg: 300, color: 0xd8d8e8, effects: knock(1) }),
    },
  },

  // 6 ─ MEGUMI FUSHIGURO ──────────────────────────────────────────────────────
  {
    id: 'megumi', name: 'Megumi Fushiguro', anime: 'jjk', rarity: 'rare', role: 'Beschwörer',
    desc: 'Ten Shadows Technique. Schattenwesen jagen für ihn — und am Ende wartet Mahoraga.',
    playstyle: 'Bleib hinten, schick Shikigami vor. In der Transformation wird die Super zu Mahoraga, der sich an jeden Schaden anpasst.',
    stats: { hp: 3700, speed: 3.25, reload: 1.4, ammo: 3, superHits: 4 },
    sfx: 'dark', victory: 'seal',
    look: { skin: SKIN.light, hair: { style: 'megumi', color: 0x14141c }, eyes: { color: 0x1a4a5a }, top: UNIFORM, bottom: UPANTS, mouth: 'flat', build: 'slim' },
    main: P({ name: 'Divine Dog: Totality', desc: 'Zwei Schattenwölfe springen auf den Gegner zu und verfolgen ihn leicht.', shape: 'bat', color: 0x2a2a3a, color2: 0xf0f0f0, trailColor: 0x4a4a6a, count: 2, spread: 14, speed: 13, range: 7, dmg: 520, w: 0.32, homing: 2.4, anim: 'seal', sfx: 'dark' }),
    super: SUM({ name: 'Divine Dogs', desc: 'Weißer und schwarzer Wolf kämpfen 10 s an Megumis Seite.', count: 2, unit: { name: 'Divine Dog', hp: 1700, life: 10, speed: 4.4, rate: 0.7, color: 0x6a6a8a, look: { rig: 'beast', color: 0xf2f2f4, color2: 0x1a1a22 }, attack: C({ range: 1.3, arc: 100, dmg: 480, color: 0xdddddd, anim: 'punch' }) }, sfx: 'roar' }),
    gadgets: [
      A({ name: 'Nue', desc: 'Der Schattenvogel schlägt mit einem Blitz an der Zielstelle ein.', range: 7, r: 1.4, dmg: 1000, landDelay: 0.45, fx: 'lightning', color: 0xbfe6ff, effects: slow(1, 0.4), sfx: 'electric' }),
      BUF({ name: 'Schattenschwimmen', desc: 'Taucht 2 s in den Schatten: unsichtbar und +30 % Tempo.', buff: { invis: 2, speed: 0.3, t: 2, color: 0x2a2a3a }, sfx: 'dark' }),
    ],
    starPowers: [
      { name: 'Schattenarsenal', desc: 'Beschwörungen leben 3 s länger.', type: 'summonBoost', life: 3, hp: 1 },
      { name: 'Max Elephant', desc: 'Hauptangriff verlangsamt Gegner.', type: 'onHitEffect', effects: slow(1, 0.25), kinds: ['main'] },
    ],
    trans: {
      name: 'Chimera Shadow Garden', duration: 14, aura: 0x1a1a2a, aura2: 0x6a5aa8,
      desc: 'Megumi flutet das Feld mit Schatten. Seine Super beschwört Mahoraga, das Wesen der acht Griffe, das sich an jeden Angriff anpasst.',
      look: { eyes: { type: 'glow', color: 0x7a6ad8 }, glow: 0x3a2a6a, top: { type: 'jacket', color: 0x0e0e16 } },
      stats: { speed: 1.1, reload: 0.85 },
      main: P({ name: 'Schattenflut', desc: 'Drei Schattenwölfe, schneller und hartnäckiger.', shape: 'bat', color: 0x1a1a2a, color2: 0x8a7ad8, count: 3, spread: 24, speed: 15, range: 8, dmg: 480, w: 0.34, homing: 3.2, anim: 'seal', sfx: 'dark' }),
      super: SUM({ name: 'Mahoraga', desc: 'Beschwört den Göttlichen General: riesig, adaptiert sich an jeden Treffer (bis −60 % Schaden).', unit: { name: 'Mahoraga', hp: 6500, life: 14, speed: 3.4, rate: 0.9, adapt: true, color: 0xd8c27a, r: 0.6, look: { skin: 0xf2efe6, build: 'titan', hair: { style: 'none' }, eyes: { type: 'blank' }, extras: ['wheel', 'noEars'], top: { type: 'bare', color: 0xf2efe6 }, bottom: { type: 'hakama', color: 0xf2efe6 }, weapon: { type: 'cleaver', color: 0xf0e8c8, rim: 0xffe9a0 }, mouth: 'flat' }, attack: C({ range: 2.2, arc: 140, dmg: 1300, color: 0xf0e0a0, effects: knock(2), anim: 'overhead', sfx: 'heavySlash' }) }, anim: 'seal', animDur: 0.8, sfx: 'roar' }),
    },
  },

  // 7 ─ MAHITO ────────────────────────────────────────────────────────────────
  {
    id: 'mahito', name: 'Mahito', anime: 'jjk', rarity: 'epic', role: 'Wandler',
    desc: 'Idle Transfiguration formt Seelen — auch seine eigene. Er wechselt seinen Kampfstil je nach Distanz.',
    playstyle: 'Nahe Gegner trifft er mit einer Klingenhand, ferne mit einem Seelenstachel. Positionierung entscheidet über deinen Angriff.',
    stats: { hp: 4400, speed: 3.35, reload: 1.3, ammo: 3, superHits: 4 },
    sfx: 'squish', victory: 'laugh',
    look: { skin: 0xe8e2ea, hair: { style: 'mahito', color: 0x8a9ab8 }, eyes: { color: 0x6ab0c8 }, marks: ['stitches'], mouth: 'grin', top: { type: 'shirt', color: 0x3a3a58, sleeves: 'short' }, bottom: { type: 'pants', color: 0x2a2a3a }, build: 'slim' },
    main: CU('mahitoMorph', { name: 'Idle Transfiguration', desc: 'Nah (<2,3 Felder): Klingenarm-Schnitt. Fern: verlängerter Seelenstachel mit Durchschlag.', dmg: 720, anim: 'slash', sfx: 'squish' }),
    super: SUM({ name: 'Polymorphic Soul Isomer', desc: 'Drei verwandelte Seelen stürmen los und explodieren.', count: 3, unit: { name: 'Verwandelter', hp: 900, life: 7, speed: 4.2, rate: 0.6, color: 0x8a9ab8, explodeOnDeath: { r: 1.5, dmg: 700 }, look: { skin: 0xc8c0d8, build: 'small', hair: { style: 'none' }, eyes: { type: 'blank' }, mouth: 'fangs', top: { type: 'bare' }, bottom: { type: 'pants', color: 0x4a4a5a } }, attack: C({ range: 1.2, arc: 90, dmg: 420, color: 0x9ab0d8 }) }, sfx: 'squish' }),
    gadgets: [
      BUF({ name: 'Körperumformung', desc: 'Formt den eigenen Körper neu: 1600 Schild für 3 s.', buff: { shield: 1600, t: 3, color: 0x9ab0d8 }, sfx: 'squish' }),
      HOOK({ name: 'Seelengriff', desc: 'Ein gedehnter Arm reißt den Gegner heran.', shape: 'fist', color: 0xe8e2ea, speed: 18, range: 6, dmg: 500, w: 0.35, sfx: 'squish' }),
    ],
    starPowers: [
      { name: 'Seelenkenner', desc: 'Treffer markieren die Seele: +15 % Schaden auf markierte Ziele.', type: 'onHitEffect', effects: { mark: { t: 3, amp: 0.15 } }, kinds: ['main'] },
      { name: 'Unförmig', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
    ],
    trans: {
      name: 'Instant Spirit Body of Distorted Killing', duration: 14, aura: 0x6a8ab8, aura2: 0xe0e8ff,
      desc: 'Seine wahre Gestalt: gepanzert, massiv, mit Klingen statt Händen. Rammt alles nieder.',
      look: { build: 'giant', skin: 0xdcd6e8, top: { type: 'bare' }, bottom: { type: 'hakama', color: 0x2a2a3a }, claws: true, extrasAdd: ['hornsBack', 'shoulderPads'], armorColor: 0x5a6a8a, hornColor: 0x3a4a6a, eyes: { type: 'demon', color: 0x6ab0c8 } },
      stats: { hp: 1.25, speed: 1.12, dmg: 1.15 },
      main: C({ name: 'Verzerrte Klingen', desc: 'Riesiger Klauenschlag mit zwei Treffern.', range: 2.3, arc: 130, dmg: 620, hits: 2, gap: 0.13, lunge: 0.7, color: 0x9ab0d8, effects: knock(1.2), anim: 'overhead', sfx: 'heavySlash' }),
      super: D({ name: 'Seelenzermalmer', desc: 'Sturmangriff, der Wände durchbricht und mit einem Bodenschlag endet.', dist: 6, speed: 18, dmg: 900, w: 0.9, color: 0x9ab0d8, breakWalls: true, end: N({ r: 2.6, dmg: 1200, color: 0x9ab0d8, effects: fx(knock(2), slow(1.5, 0.4)), anim: 'stomp' }), sfx: 'dash' }),
      onEnter: N({ r: 2.6, dmg: 400, color: 0x9ab0d8, effects: knock(1.5) }),
    },
  },

  // 8 ─ KENTO NANAMI ──────────────────────────────────────────────────────────
  {
    id: 'nanami', name: 'Kento Nanami', anime: 'jjk', rarity: 'super_rare', role: 'Präzision',
    desc: 'Ratio Technique: Er teilt jedes Ziel im Verhältnis 7:3 — trifft er den Punkt, ist es ein kritischer Treffer.',
    playstyle: 'Treffe Gegner am äußeren Drittel deiner Reichweite (ca. 70 %) für doppelten Schaden. Abstand halten ist alles.',
    stats: { hp: 4800, speed: 3.25, reload: 1.25, ammo: 3, superHits: 4 },
    sfx: 'blunt', victory: 'armsCrossed',
    passive: [{ type: 'sweetSpot', at: 0.7, width: 0.18, mult: 2.0, name: '7:3' }],
    look: { skin: SKIN.light, hair: { style: 'nanami', color: 0xf0d080 }, eyes: { color: 0x3a4a3a }, extras: ['sunglasses'], glassesColor: 0x2a3a2a, mouth: 'flat', top: { type: 'suit', color: 0xe8e0c8, color2: 0x4a6a3a, sleeves: 'long', buttons: true }, bottom: { type: 'pants', color: 0xe8e0c8 }, weapon: { type: 'cleaver', color: 0xd8d0b8, scale: 0.85 }, build: 'tall' },
    main: C({ name: 'Ratio Technique', desc: 'Breiter Klingenhieb. Trifft der 7:3-Punkt, verdoppelt sich der Schaden.', range: 2.4, arc: 75, dmg: 720, color: 0xf0e090, anim: 'slash', sfx: 'blunt' }),
    super: A({ name: 'Collapse', desc: 'Zerteilt den Boden an der Schwachstelle: großer Schaden und zerstört alle Wände im Bereich.', range: 5, r: 2.3, dmg: 1700, landDelay: 0.35, fx: 'explode', color: 0xf0e090, color2: 0x8a7a50, breakWalls: true, effects: knock(1.5), anim: 'overhead', sfx: 'rock' }),
    gadgets: [
      BUF({ name: 'Krawatte ums Schwert', desc: '3 s lang +35 % Schaden.', buff: { dmg: 0.35, t: 3, color: 0xf0e090 }, sfx: 'powerup' }),
      BUF({ name: 'Pflichtbewusst', desc: 'Lädt sofort 2 Munition nach.', buff: { ammo: 2, color: 0xf0e090 }, sfx: 'reload' }),
    ],
    starPowers: [
      { name: 'Präzision', desc: 'Der 7:3-Bereich ist 50 % breiter.', type: 'sweetSpot', at: 0.7, width: 0.27, mult: 2.0 },
      { name: 'Erfahrener Zauberer', desc: '−15 % erlittener Schaden über 70 % LP.', type: 'damageReduceHigh', above: 0.7, f: 0.15 },
    ],
    trans: {
      name: 'Overtime', duration: 15, aura: 0xf0e090, auraStyle: 'spark',
      desc: 'Nach Feierabend werden die Fesseln gelöst: Nanamis Fluchenergie steigt massiv, jeder Treffer zertrümmert.',
      look: { extrasRemove: ['sunglasses'], eyes: { type: 'sharp', color: 0x3a4a3a }, angry: true, top: { type: 'shirt', color: 0x3a5a7a, sleeves: 'long', buttons: true }, marksAdd: ['stubble'] },
      stats: { dmg: 1.3, reload: 0.75, speed: 1.08 },
      passive: [{ type: 'sweetSpot', at: 0.7, width: 0.3, mult: 2.2 }],
      main: C({ name: 'Überstunden-Hieb', desc: 'Zwei schnelle Hiebe; der zweite reißt Wände ein.', range: 2.5, arc: 85, dmg: 620, hits: 2, gap: 0.14, color: 0xf0e090, breakWalls: true, anim: 'slash', sfx: 'blunt' }),
      super: SEQ([
        { at: 0, do: A({ range: 5, r: 2.4, dmg: 1400, landDelay: 0.3, fx: 'explode', color: 0xf0e090, breakWalls: true, effects: knock(1.5) }) },
        { at: 0.5, do: A({ range: 6.5, r: 2.4, dmg: 1400, landDelay: 0.3, fx: 'explode', color: 0xf0e090, breakWalls: true, effects: stun(0.8) }) },
      ], { name: 'Collapse: Zeitverlängerung', desc: 'Zwei Collapse-Einschläge hintereinander — der zweite betäubt.', anim: 'overhead', sfx: 'rock' }),
    },
  },

  // 9 ─ AOI TODO ──────────────────────────────────────────────────────────────
  {
    id: 'todo', name: 'Aoi Todo', anime: 'jjk', rarity: 'rare', role: 'Taktiker',
    desc: 'Boogie Woogie: ein Klatschen, und zwei Positionen tauschen. Freund oder Feind — Todo bestimmt.',
    playstyle: 'Tausche Gegner in deine Mitspieler hinein oder rette Verbündete. Nach jedem Tausch ist das Ziel kurz verwirrt.',
    stats: { hp: 5800, speed: 3.2, reload: 1.25, ammo: 3, superHits: 4 },
    sfx: 'clap', victory: 'flex',
    look: { skin: SKIN.tan, hair: { style: 'todo', color: 0x161616 }, eyes: { color: 0x2a2a2a, type: 'sharp' }, marks: ['scarEye'], mouth: 'grin', top: { type: 'tank', color: 0x1a1e2e, sleeves: 'none' }, bottom: { type: 'pants', color: 0x1a1e2e }, build: 'giant' },
    main: C({ name: 'Brüderliche Faust', desc: 'Wuchtiger Schlag mit Rückstoß.', range: 1.7, arc: 75, dmg: 820, lunge: 0.4, color: 0xffe0a0, effects: knock(0.8), anim: 'punch', sfx: 'punch' }),
    super: CU('boogieWoogie', { name: 'Boogie Woogie', desc: 'Klatschen: tauscht mit dem anvisierten Gegner (oder Verbündeten). Getauschte Gegner sind 0,9 s betäubt.', range: 9, dmg: 400, anim: 'clap', sfx: 'clap' }),
    gadgets: [
      { kind: 'nova', name: 'Finte', desc: 'Ein Klatschen ohne Tausch: Gegner in der Nähe zögern (0,6 s Betäubung).', r: 3.2, dmg: 0, color: 0xffe0a0, effects: stun(0.6), anim: 'clap', sfx: 'clap' },
      CU('boogieAlly', { name: 'Rettungstausch', desc: 'Tauscht mit dem am stärksten verletzten Verbündeten.', anim: 'clap', sfx: 'clap' }),
    ],
    starPowers: [
      { name: 'Mein Bester Freund', desc: 'Nach jedem Tausch +40 % Tempo für 2 s.', type: 'swapSpeed', mult: 0.4 },
      { name: 'Massiver Körper', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
    ],
    trans: {
      name: 'Brüder im Geiste', duration: 14, aura: 0xffe0a0, aura2: 0x6ab8ff,
      desc: 'Todo ist im Flow mit seinem „Bruder“. Jeder dritte Schlag tauscht automatisch, die Super wird zur Tausch-Kettenreaktion.',
      look: { top: { type: 'bare' }, eyes: { type: 'sharp', color: 0x2a2a2a }, mouth: 'grin', glow: 0xffe0a0 },
      stats: { dmg: 1.15, speed: 1.1 },
      main: C({ name: 'Vibe-Schlagserie', desc: 'Zwei Schläge; trifft der zweite, wird das Ziel hinter Todo getauscht.', range: 1.8, arc: 90, dmg: 620, hits: 2, gap: 0.12, lunge: 0.5, color: 0xffe0a0, effects: knock(0.5), anim: 'flurry', sfx: 'punch', special: 'todoSwapHit' }),
      super: CU('boogieChain', { name: 'Boogie Woogie: Kettenreaktion', desc: 'Vier blitzschnelle Tausche zwischen allen Gegnern in Reichweite — jeder Tausch verursacht Schaden und Verwirrung.', range: 9, dmg: 650, anim: 'clap', sfx: 'clap' }),
      onEnter: N({ r: 2.4, dmg: 200, color: 0xffe0a0, effects: stun(0.4) }),
    },
  },

  // 10 ─ HAJIME KASHIMO ───────────────────────────────────────────────────────
  {
    id: 'kashimo', name: 'Hajime Kashimo', anime: 'jjk', rarity: 'epic', role: 'Blitz',
    desc: 'Ein Zauberer aus der Edo-Zeit, dessen Fluchenergie die Eigenschaften von Elektrizität hat.',
    playstyle: 'Geschosse springen auf weitere Gegner über. In Mythical Beast Amber wird er unaufhaltsam schnell — auf Kosten seines Körpers.',
    stats: { hp: 3900, speed: 3.45, reload: 1.3, ammo: 3, superHits: 4 },
    sfx: 'electric', victory: 'laugh',
    look: { skin: SKIN.light, hair: { style: 'kashimo', color: 0x9ad8e8 }, eyes: { color: 0x3a8aa8 }, mouth: 'grin', top: { type: 'kimono', color: 0x2a3a4a, color2: 0xf2d24a, sleeves: 'wide' }, bottom: { type: 'hakama', color: 0x3a3a44 }, weapon: { type: 'staff', color: 0x6a5a3a, tip: 0x9ad8ff }, build: 'slim' },
    main: P({ name: 'Elektrischer Stab', desc: 'Schneller Blitzstoß, der auf zwei weitere Gegner überspringt.', shape: 'orb', color: 0x8ad8ff, color2: 0xffffff, speed: 22, range: 6, dmg: 620, w: 0.28, chain: { n: 2, r: 3.5, dmg: 300, color: 0x8ad8ff }, anim: 'throw', sfx: 'electric' }),
    super: D({ name: 'Elektrischer Hochgeschwindigkeitsangriff', desc: 'Entlädt sich als Blitzschlag durch die Gegner und lähmt sie.', dist: 7, speed: 32, dmg: 1300, w: 1.0, color: 0x8ad8ff, invuln: true, effects: stun(0.7), end: N({ r: 2.2, dmg: 500, color: 0x8ad8ff, effects: slow(1.5, 0.4) }), sfx: 'thunder' }),
    gadgets: [
      BUF({ name: 'Statische Ladung', desc: '3 s lang springen Treffer auf 3 Ziele über.', buff: { dmg: 0.2, t: 3, color: 0x8ad8ff }, sfx: 'electric' }),
      A({ name: 'Blitzableiter', desc: 'Zieht einen Blitz an die Zielstelle.', range: 7, r: 1.5, dmg: 950, landDelay: 0.35, fx: 'lightning', color: 0x8ad8ff, effects: stun(0.5), sfx: 'thunder' }),
    ],
    starPowers: [
      { name: 'Leiter', desc: 'Kettenblitze springen 2 Felder weiter.', type: 'chainBoost', r: 2 },
      { name: '400 Jahre Hunger', desc: '+20 % Super-Ladung.', type: 'stat', superRate: 1.2 },
    ],
    trans: {
      name: 'Mythical Beast Amber', duration: 12, aura: 0x8ad8ff, aura2: 0xffffff, auraStyle: 'spark', auraIntensity: 1.6,
      desc: 'Sein Körper wird zu reiner Elektrizität. Blitzschnell und tödlich — aber die Form zerstört ihn: −2 % LP pro Sekunde.',
      look: { skin: 0xd8ecff, hair: { style: 'pain', color: 0xbff0ff }, eyes: { type: 'glow', color: 0x8ad8ff }, top: { type: 'bare' }, glow: 0x8ad8ff, extrasAdd: ['hornsBack'], hornColor: 0x8ad8ff },
      stats: { speed: 1.35, dmg: 1.25, reload: 0.6 },
      passive: [{ type: 'drain', perSec: 0.02 }, { type: 'dodge', chance: 0.2 }],
      main: BM({ name: 'Lichtgeschwindigkeits-Blitz', desc: 'Sofortiger Blitzstrahl, der auf drei Ziele überspringt.', range: 7, w: 0.3, dmg: 700, ticks: 1, color: 0x8ad8ff, color2: 0xffffff, effects: slow(0.6, 0.3), anim: 'point', sfx: 'thunder', chainOnHit: { n: 3, r: 4, dmg: 350 } }),
      super: A({ name: 'Donnergott-Schlag', desc: 'Ein gewaltiger Blitz aus dem Himmel: riesiger Schaden und lange Lähmung.', range: 8, r: 2.8, dmg: 2400, landDelay: 0.5, fx: 'lightning', color: 0xbff0ff, effects: stun(1.4), breakWalls: true, anim: 'raise', sfx: 'thunderBig' }),
      onEnter: N({ r: 3, dmg: 500, color: 0x8ad8ff, effects: stun(0.5) }),
    },
  },
];

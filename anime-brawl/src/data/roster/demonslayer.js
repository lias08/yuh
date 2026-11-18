import { P, C, D, BM, A, N, DOM, SUM, BUF, BL, WALL, HOOK, TRAP, SEQ, MULTI, CU, slow, stun, knock, pull, burn, fx, SKIN } from './helpers.js';

const CORPS = { type: 'jacket', color: 0x1a1a24, color2: 0xf2f2f4, collar: true, sleeves: 'long', buttons: true, belt: true };

export default [
  // 56 ─ TANJIRO KAMADO ───────────────────────────────────────────────────────
  {
    id: 'tanjiro', name: 'Tanjiro Kamado', anime: 'ds', rarity: 'common', role: 'Schwertkämpfer',
    desc: 'Dämonenjäger mit gutherzigem Willen. Wasser-Atmung, und tief in ihm die Sonnen-Atmung.',
    playstyle: 'Fließende Wasserschnitte auf mittlere Distanz. In der Hinokami-Kagura wird jeder Schnitt zu Feuer.',
    stats: { hp: 4600, speed: 3.35, reload: 1.25, ammo: 3, superHits: 4 },
    sfx: 'slash', victory: 'swordUp',
    look: { skin: SKIN.fair, hair: { style: 'tanjiro', color: 0x5a1a1a }, eyes: { color: 0x8a2a2a }, marks: ['scarEye'], mouth: 'smile', top: { ...CORPS }, bottom: { type: 'pants', color: 0x1a1a24 }, extras: ['haori', 'earrings'], capeColor: 0x2a6a4a, weapon: { type: 'katana', color: 0x1a1a1a, rim: 0x5ab8ff }, build: 'normal' },
    main: P({ name: 'Wasser-Atmung: Wasserflächenschnitt', desc: 'Eine fließende Wasserklinge, die durchschlägt.', shape: 'slash', color: 0x5ab8ff, color2: 0xffffff, speed: 15, range: 6.5, dmg: 700, w: 0.45, pierce: true, anim: 'slash', sfx: 'water' }),
    super: D({ name: 'Wasser-Atmung: Wasserrad', desc: 'Ein vertikaler Wasserrad-Schnitt im Sprung.', dist: 5, speed: 18, dmg: 1600, w: 1.0, color: 0x5ab8ff, jump: true, effects: knock(1.5), end: N({ r: 2, dmg: 600, color: 0x5ab8ff }), anim: 'spin', sfx: 'slashBig' }),
    gadgets: [
      BUF({ name: 'Volle Konzentration', desc: 'Atemtechnik: Heilt 900 LP und +20 % Tempo.', buff: { heal: 900, speed: 0.2, t: 3, color: 0x5ab8ff }, sfx: 'heal' }),
      SUM({ name: 'Nezuko', desc: 'Seine Schwester tritt 6 s lang mit brennendem Blut zu.', unit: { name: 'Nezuko', hp: 1800, life: 6, speed: 4.2, rate: 0.8, follow: true, color: 0xff7ab8, look: { skin: SKIN.light, build: 'small', hair: { style: 'hashirama', color: 0x1a1a1a }, eyes: { color: 0xff7ab8 }, mouth: 'flat', top: { type: 'kimono', color: 0xff9ac0, sleeves: 'wide' }, bottom: { type: 'hakama', color: 0x5a3a2a } }, attack: C({ range: 1.3, arc: 100, dmg: 450, effects: burn(250, 2), anim: 'kick' }) }, sfx: 'kick' }),
    ],
    starPowers: [
      { name: 'Geruchssinn', desc: 'Getroffene Gegner sind 2 s sichtbar.', type: 'onHitEffect', effects: { reveal: 2 }, kinds: ['main'] },
      { name: 'Ältester Bruder', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
    ],
    trans: {
      name: 'Sonnen-Atmung: Hinokami Kagura', duration: 14, aura: 0xff6a1a, aura2: 0xffe08a, auraIntensity: 1.4,
      desc: 'Das Mal des Dämonenjägers erscheint. Die Klinge wird rot, und jeder Tanz der Sonne brennt.',
      look: { marksAdd: ['tearLines'], eyes: { type: 'sharp', color: 0xc8302a }, glow: 0xff6a1a, weapon: { type: 'katana', color: 0xc8302a, emissive: 0xff3a1a } },
      stats: { dmg: 1.25, speed: 1.1, reload: 0.85 },
      main: P({ name: 'Tanz', desc: 'Zwei feurige Bogenschnitte.', shape: 'slash', color: 0xff6a1a, color2: 0xffe08a, count: 2, spread: 16, speed: 16, range: 7, dmg: 520, w: 0.5, pierce: true, effects: burn(300, 2), anim: 'slash', sfx: 'fire' }),
      super: D({ name: 'Sonnenhalo-Drachenkopf-Tanz', desc: 'Ein Feuerdrache aus Schnitten windet sich durch alle Gegner.', dist: 8, speed: 22, dmg: 2400, w: 1.2, color: 0xff6a1a, invuln: true, ghost: true, effects: fx(knock(1.5), burn(600, 3)), anim: 'spin', sfx: 'fireBig', cutscene: true }),
      onEnter: N({ r: 3, dmg: 400, color: 0xff6a1a, effects: burn(400, 2) }),
    },
  },

  // 57 ─ ZENITSU AGATSUMA ─────────────────────────────────────────────────────
  {
    id: 'zenitsu', name: 'Zenitsu Agatsuma', anime: 'ds', rarity: 'super_rare', role: 'Assassine',
    desc: 'Ängstlich und laut — bis er einschläft. Dann kennt er nur eine Technik, und die ist blitzschnell.',
    playstyle: 'Sein Angriff ist ein Blitzschritt durch die Gegner. Nutze ihn, um durch Lücken zu schlüpfen und zuzuschlagen.',
    stats: { hp: 3900, speed: 3.4, reload: 1.45, ammo: 3, superHits: 4 },
    sfx: 'electric', victory: 'bow',
    look: { skin: SKIN.light, hair: { style: 'zenitsu', color: 0xffd23a }, eyes: { color: 0xc8a020 }, mouth: 'open', top: { ...CORPS }, bottom: { type: 'pants', color: 0x1a1a24 }, extras: ['haori'], capeColor: 0xffc83a, weapon: { type: 'katana', color: 0xffe06a }, build: 'slim' },
    main: D({ name: 'Donnerschlag und Blitz', desc: 'Ein Blitzschritt mit Schnitt quer durch die Gegner.', dist: 4.5, speed: 30, dmg: 760, w: 0.75, color: 0xffe06a, invuln: true, anim: 'dash', sfx: 'thunder' }),
    super: SEQ([0, 0.18, 0.36, 0.54, 0.72, 0.9].map((t) => ({ at: t, do: BL({ dist: 'aim', maxDist: 6, behindTarget: true, lineDmg: 450, color: 0xffe06a, effects: stun(0.2) }) })), { name: 'Donnerschlag: Sechsfach', desc: 'Sechs Blitzschritte hintereinander zu den Gegnern.', anim: 'dash', sfx: 'thunder' }),
    gadgets: [
      BUF({ name: 'Ohnmacht', desc: 'Schläft vor Angst ein: 2 s unverwundbar.', buff: { invuln: 2, color: 0xffe06a }, sfx: 'whoosh' }),
      A({ name: 'Donnergroll', desc: 'Ein Blitz schlägt am Ziel ein.', range: 6, r: 1.4, dmg: 900, landDelay: 0.3, fx: 'lightning', color: 0xffe06a, effects: stun(0.5), sfx: 'thunder' }),
    ],
    starPowers: [
      { name: 'Schlafwandler', desc: '20 % Ausweichen.', type: 'dodge', chance: 0.2 },
      { name: 'Hörsinn', desc: 'Nachladen 15 % schneller.', type: 'stat', reload: 0.85 },
    ],
    trans: {
      name: 'Siebte Form: Flammendonnergott', duration: 12, aura: 0xffe06a, aura2: 0xff6a1a, auraStyle: 'spark', auraIntensity: 1.8,
      desc: 'Seine eigene Form: Ein Blitz, so schnell, dass er wie ein feuriger Donnerdrache aussieht.',
      look: { eyes: { type: 'closed' }, glow: 0xffe06a, mouth: 'flat' },
      stats: { speed: 1.3, dmg: 1.3, reload: 0.7 },
      passive: [{ type: 'dodge', chance: 0.25 }],
      main: D({ name: 'Achtfacher Donnerschlag', desc: 'Längerer, schnellerer Blitzschritt mit Lähmung.', dist: 6, speed: 36, dmg: 820, w: 0.9, color: 0xffe06a, invuln: true, effects: stun(0.3), anim: 'dash', sfx: 'thunder' }),
      super: D({ name: 'Honoikazuchi no Kami', desc: 'Ein feuriger Donnerdrache durchquert die Arena.', dist: 11, speed: 40, dmg: 3200, w: 1.4, color: 0xff8a2a, invuln: true, ghost: true, breakWalls: true, effects: fx(stun(0.8), burn(400, 2)), anim: 'dash', sfx: 'thunderBig', cutscene: true }),
      onEnter: N({ r: 3, dmg: 500, color: 0xffe06a, effects: stun(0.6) }),
    },
  },

  // 58 ─ KYOJURO RENGOKU ──────────────────────────────────────────────────────
  {
    id: 'rengoku', name: 'Kyojuro Rengoku', anime: 'ds', rarity: 'legendary', role: 'Schwertkämpfer',
    desc: 'Flammen-Säule. Laut, herzlich und mit einem Schwert, das wie ein Sonnenaufgang brennt.',
    playstyle: 'Breite Flammenhiebe mit Brand. Neunte Form: Rengoku ist ein flammender Sturmangriff.',
    stats: { hp: 5100, speed: 3.3, reload: 1.3, ammo: 3, superHits: 4 },
    sfx: 'fire', victory: 'swordUp',
    look: { skin: SKIN.fair, hair: { style: 'rengoku', color: 0xffc83a, color2: 0xd8401a }, eyes: { color: 0xff8a2a, type: 'sharp' }, mouth: 'grin', browColor: 0xd8401a, top: { ...CORPS }, bottom: { type: 'pants', color: 0x1a1a24 }, extras: ['haori'], capeColor: 0xf2f2f4, weapon: { type: 'katana', color: 0xff8a2a, emissive: 0xff4a1a }, build: 'muscle' },
    main: C({ name: 'Flammen-Atmung: Unbekanntes Feuer', desc: 'Ein breiter Flammenhieb nach vorn.', range: 2.5, arc: 130, dmg: 800, lunge: 0.6, color: 0xff6a1a, effects: burn(350, 2), anim: 'slash', sfx: 'fire' }),
    super: D({ name: 'Neunte Form: Rengoku', desc: 'Ein flammender Drache: Sturmangriff, der alles verbrennt.', dist: 7, speed: 24, dmg: 2600, w: 1.3, color: 0xff6a1a, invuln: true, breakWalls: true, effects: fx(knock(2.5), burn(700, 3)), anim: 'dash', sfx: 'fireBig', cutscene: true }),
    gadgets: [
      C({ name: 'Fünfte Form: Flammentiger', desc: 'Ein riesiger Hieb in Form eines Tigers.', range: 3, arc: 100, dmg: 1300, color: 0xff6a1a, effects: fx(knock(2), burn(300, 2)), anim: 'overhead', sfx: 'heavySlash' }),
      BUF({ name: 'Herz entflammen', desc: '+30 % Schaden und 20 % Schadensreduktion für 3 s.', buff: { dmg: 0.3, dr: 0.2, t: 3, color: 0xff6a1a }, sfx: 'powerup' }),
    ],
    starPowers: [
      { name: 'Unbeugsam', desc: 'Überlebt einmal einen tödlichen Treffer mit 30 % LP.', type: 'reviveOnce', hp: 0.3 },
      { name: 'Flammenaura', desc: 'Gegner in seiner Nähe brennen leicht.', type: 'burnAura', r: 1.6, dps: 140 },
    ],
    trans: {
      name: 'Setze dein Herz in Flammen', duration: 14, aura: 0xff6a1a, aura2: 0xffe08a, auraIntensity: 1.7,
      desc: 'Volle Konzentration, ganzes Herz. Seine Flammen wachsen über ihn hinaus.',
      look: { glow: 0xff6a1a, eyes: { type: 'glow', color: 0xffc83a }, extrasRemove: ['haori'], extrasAdd: ['cape'], capeColor: 0xff6a1a },
      stats: { dmg: 1.3, hp: 1.1, speed: 1.08 },
      passive: [{ type: 'burnAura', r: 2.2, dps: 300 }, { type: 'unstoppable' }],
      main: MULTI([
        C({ range: 2.6, arc: 140, dmg: 700, color: 0xff6a1a, effects: burn(400, 2) }),
        P({ shape: 'wave', color: 0xff6a1a, color2: 0xffe08a, size: 0.9, speed: 16, range: 7, dmg: 600, w: 0.8, pierce: true, effects: burn(300, 2) }),
      ], { name: 'Zweite Form: Aufsteigende Flammensonne', desc: 'Hieb plus Flammenwelle.', anim: 'slash', sfx: 'fire' }),
      super: MULTI([
        D({ dist: 9, speed: 26, dmg: 3000, w: 1.5, color: 0xff6a1a, invuln: true, breakWalls: true, effects: fx(knock(3), burn(800, 3)) }),
      ], { name: 'Neunte Form: Rengoku — Voller Ernst', desc: 'Der Flammendrache in voller Größe.', anim: 'dash', sfx: 'fireBig', cutscene: true }),
      onEnter: N({ r: 3.4, dmg: 500, color: 0xff6a1a, effects: burn(500, 2) }),
    },
  },

  // 59 ─ INOSUKE HASHIBIRA ────────────────────────────────────────────────────
  {
    id: 'inosuke', name: 'Inosuke Hashibira', anime: 'ds', rarity: 'rare', role: 'Berserker',
    desc: 'Im Wald von Wildschweinen aufgezogen. Kämpft mit zwei gezackten Klingen und Wildschweinmaske.',
    playstyle: 'Rasende Doppelklingen-Hiebe im Nahkampf. Tierische Instinkte lassen ihn Angriffe spüren.',
    stats: { hp: 4800, speed: 3.45, reload: 1.1, ammo: 3, superHits: 4 },
    sfx: 'slash', victory: 'flex',
    look: { skin: SKIN.fair, hair: { style: 'none' }, eyes: { color: 0x3a8a5a }, mouth: 'fangs', top: { type: 'bare' }, bottom: { type: 'pants', color: 0x2a3a5a }, extras: ['boarHead', 'pelt', 'noEars'], weapon: { type: 'katana', color: 0x8a9aaa, dual: true }, build: 'muscle' },
    main: C({ name: 'Bestien-Atmung: Zerfetzen', desc: 'Vier Hiebe mit zwei Klingen.', range: 1.9, arc: 120, dmg: 300, hits: 4, gap: 0.07, lunge: 0.6, color: 0x8ad8ff, anim: 'flurry', sfx: 'slash' }),
    super: D({ name: 'Bestien-Atmung: Wahnsinniger Schnitt', desc: 'Rast wild durch die Gegner und schneidet in alle Richtungen.', dist: 6, speed: 22, dmg: 1500, w: 1.1, color: 0x8ad8ff, effects: knock(1.5), end: C({ range: 2.2, arc: 360, dmg: 600, hits: 3, gap: 0.08, color: 0x8ad8ff, anim: 'spin' }), anim: 'spin', sfx: 'slashBig' }),
    gadgets: [
      BUF({ name: 'Raum-Wahrnehmung', desc: '40 % Ausweichen für 3 s.', buff: { dodge: 0.4, t: 3, color: 0x8ad8ff }, sfx: 'haki' }),
      D({ name: 'Wildschwein-Ansturm', desc: 'Ein Kopfstoß, der umwirft.', dist: 4, speed: 20, dmg: 700, w: 0.8, color: 0x8ad8ff, stopOnHit: true, effects: knock(2.5), sfx: 'dash' }),
    ],
    starPowers: [
      { name: 'Gelenkiger Körper', desc: '+12 % Tempo.', type: 'stat', speed: 1.12 },
      { name: 'König der Berge', desc: '+30 % Schaden unter 50 % LP.', type: 'lowHpDmg', below: 0.5, mult: 1.3 },
    ],
    trans: {
      name: 'Bestien-Atmung: Totale Raumwahrnehmung', duration: 13, aura: 0x8ad8ff, aura2: 0xffffff, auraStyle: 'spark', auraIntensity: 1.4,
      desc: 'Seine Haut spürt jede Bewegung. Er weicht aus, bevor der Angriff kommt, und wirft seine Klingen wie Bumerangs.',
      look: { glow: 0x8ad8ff },
      stats: { speed: 1.2, dmg: 1.2, reload: 0.8 },
      passive: [{ type: 'dodge', chance: 0.3 }],
      main: P({ name: 'Klingenwurf', desc: 'Zwei Klingen fliegen wie Bumerangs zurück.', shape: 'blade', color: 0x8ad8ff, count: 2, spread: 18, speed: 16, range: 6, dmg: 480, w: 0.4, pierce: true, boomerang: true, anim: 'throw', sfx: 'slash' }),
      super: SEQ([0, 0.25, 0.5].map((t) => ({ at: t, do: D({ dist: 4, speed: 26, dmg: 900, w: 1.1, color: 0x8ad8ff, invuln: true }) })), { name: 'Achte Fangzahn: Explosionsrausch', desc: 'Drei rasende Sturmangriffe hintereinander.', anim: 'dash', sfx: 'slashBig', cutscene: true }),
      onEnter: N({ r: 3, dmg: 400, color: 0x8ad8ff, effects: knock(1.8) }),
    },
  },

  // 60 ─ AKAZA ────────────────────────────────────────────────────────────────
  {
    id: 'akaza', name: 'Akaza', anime: 'ds', rarity: 'mythic', role: 'Kämpfer',
    desc: 'Oberer Mond Drei. Ein Dämon, der nur die Stärke respektiert, und dessen Fäuste Luft zerschlagen.',
    playstyle: 'Luftschläge aus der Distanz und brutaler Nahkampf. Regeneriert ständig. Kompassnadel macht seine Schläge zielsuchend.',
    stats: { hp: 4900, speed: 3.4, reload: 1.15, ammo: 3, superHits: 4 },
    sfx: 'punch', victory: 'armsCrossed',
    passive: [{ type: 'regen', amt: 160, delay: 0 }],
    look: { skin: 0xf2d8d8, hair: { style: 'akaza', color: 0xff7aa8 }, eyes: { type: 'demon', color: 0x6ad8e8 }, marks: ['tattoos'], mouth: 'smirk', top: { type: 'open', color: 0xc85a8a, sleeves: 'short' }, bottom: { type: 'pants', color: 0xf2f2f4 }, build: 'muscle' },
    main: P({ name: 'Zerstörungstod: Luftschlag', desc: 'Drei schnelle Druckschläge aus der Distanz.', shape: 'fist', color: 0x6ad8e8, color2: 0xffffff, size: 0.32, speed: 20, range: 6, dmg: 330, w: 0.3, burst: { n: 3, gap: 0.08 }, burstSpread: 6, trail: false, anim: 'flurry', sfx: 'punch' }),
    super: SEQ([0, 0.1, 0.2, 0.3, 0.4, 0.5].map((t, i) => ({ at: t, do: A({ range: 2 + (i % 3) * 1.5, fixed: true, r: 1.6, dmg: 520, landDelay: 0.05, fx: 'ring', color: 0x6ad8e8, effects: knock(0.6), scatter: 1.2 }) })), { name: 'Zerstörungstod: Chaostyp', desc: 'Ein Sturm aus Fausthieben, der den Bereich vor ihm zerschlägt.', anim: 'flurry', animDur: 0.8, sfx: 'punchBarrage' }),
    gadgets: [
      BL({ name: 'Fußtechnik: Flackern', desc: 'Ein blitzschneller Schritt hinter den Gegner.', dist: 'aim', maxDist: 5, behindTarget: true, color: 0x6ad8e8, then: C({ range: 1.8, arc: 120, dmg: 700, color: 0x6ad8e8 }), sfx: 'teleport' }),
      BUF({ name: 'Dämonenblut', desc: 'Regeneriert sofort 1500 LP.', buff: { heal: 1500, color: 0x6ad8e8 }, sfx: 'heal' }),
    ],
    starPowers: [
      { name: 'Kampfgeist', desc: 'Jeder Kill heilt 35 %.', type: 'killHeal', f: 0.35 },
      { name: 'Oberer Mond', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
    ],
    trans: {
      name: 'Zerstörungstod: Kompassnadel', duration: 14, aura: 0x6ad8e8, aura2: 0xff7aa8, auraIntensity: 1.5,
      desc: 'Ein Schneekristall-Muster am Boden: Er spürt jeden Kampfgeist. Seine Schläge suchen sich ihr Ziel.',
      look: { glow: 0x6ad8e8, eyes: { type: 'glow', color: 0x6ad8e8 }, top: { type: 'bare' } },
      stats: { dmg: 1.25, speed: 1.12, reload: 0.8 },
      passive: [{ type: 'regen', amt: 350, delay: 0 }, { type: 'dodge', chance: 0.15 }],
      main: P({ name: 'Kompass-Luftschlag', desc: 'Vier zielsuchende Druckschläge.', shape: 'fist', color: 0x6ad8e8, color2: 0xffffff, size: 0.34, count: 4, spread: 30, speed: 18, range: 7, dmg: 320, w: 0.32, homing: 3, trail: false, anim: 'flurry', sfx: 'punch' }),
      super: MULTI([
        BL({ dist: 'aim', maxDist: 7, behindTarget: true, color: 0x6ad8e8 }),
        N({ r: 3.2, dmg: 2600, color: 0x6ad8e8, color2: 0xff7aa8, breakWalls: true, effects: knock(3), delay: 0.15 }),
      ], { name: 'Letzte Technik: Blaue Silberpfeile', desc: 'Er erscheint beim Gegner und zerschlägt alles im Umkreis.', anim: 'punch', sfx: 'bajrang', cutscene: true }),
      onEnter: N({ r: 3, dmg: 400, color: 0x6ad8e8, effects: knock(2) }),
    },
  },
];

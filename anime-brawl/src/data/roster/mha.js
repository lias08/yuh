import { P, C, D, BM, A, N, DOM, SUM, BUF, BL, WALL, HOOK, TRAP, SEQ, MULTI, CU, slow, stun, knock, pull, burn, fx, SKIN } from './helpers.js';

const UA = { type: 'jacket', color: 0x3a4a6a, color2: 0xc8202a, collar: true, sleeves: 'long', buttons: true };

export default [
  // 51 ─ IZUKU MIDORIYA ───────────────────────────────────────────────────────
  {
    id: 'deku', name: 'Izuku Midoriya', anime: 'mha', rarity: 'rare', role: 'Kämpfer',
    desc: 'Erbe von One For All. Ein Fingerschnipp erzeugt Luftdruck wie eine Kanonenkugel.',
    playstyle: 'Delaware Smash trifft auf Distanz, Full Cowl macht ihn blitzschnell. Seine Supers sind kurze, gewaltige Schläge.',
    stats: { hp: 4600, speed: 3.4, reload: 1.3, ammo: 3, superHits: 4 },
    sfx: 'punch', victory: 'fistUp',
    look: { skin: SKIN.fair, hair: { style: 'deku', color: 0x1f4a3a }, eyes: { color: 0x2a8a5a }, mouth: 'smile', top: { type: 'suit', color: 0x2a6a5a, color2: 0x1a1a1a, sleeves: 'long', collar: true }, bottom: { type: 'pants', color: 0x2a6a5a }, gloves: 0xf2f2f4, shoes: 0xc8202a, boots: true, build: 'normal' },
    main: P({ name: 'Delaware Smash', desc: 'Ein Fingerschnipp feuert eine Druckwelle, die zurückstößt.', shape: 'orb', color: 0x7affa8, color2: 0xffffff, size: 0.4, speed: 18, range: 7, dmg: 760, w: 0.38, effects: knock(1.2), anim: 'point', sfx: 'wind' }),
    super: D({ name: 'Detroit Smash', desc: 'Sprint mit voller Kraft und ein Schlag, der Wände zerlegt.', dist: 5, speed: 22, dmg: 600, w: 0.9, color: 0x7affa8, stopOnHit: true, breakWalls: true, end: N({ r: 2.4, dmg: 1600, color: 0x7affa8, breakWalls: true, effects: knock(2.6), anim: 'punch' }), sfx: 'heavyPunch', cutscene: true }),
    gadgets: [
      HOOK({ name: 'Blackwhip', desc: 'Schwarze Ranken ziehen ihn zum Gegner.', selfPull: true, shape: 'string', color: 0x1a1a1a, speed: 22, range: 7, dmg: 400, w: 0.35, sfx: 'string' }),
      BUF({ name: 'Full Cowl 8 %', desc: '+35 % Tempo für 3 s.', buff: { speed: 0.35, t: 3, color: 0x7affa8 }, sfx: 'electric' }),
    ],
    starPowers: [
      { name: 'Analytiker', desc: '+15 % Super-Ladung.', type: 'stat', superRate: 1.15 },
      { name: 'Plus Ultra', desc: '+30 % Schaden unter 40 % LP.', type: 'lowHpDmg', below: 0.4, mult: 1.3 },
    ],
    trans: {
      name: 'One For All: Full Cowl 100 %', duration: 14, aura: 0x5aff8a, aura2: 0xffffff, auraStyle: 'spark', auraIntensity: 1.6,
      desc: 'Grüne Blitze über den ganzen Körper. Er springt über das Feld und jeder Schlag ist ein Smash.',
      look: { glow: 0x5aff8a, eyes: { type: 'glow', color: 0x7affa8 }, top: { type: 'suit', color: 0x1a3a2a, sleeves: 'long', collar: true }, angry: true, marksAdd: ['scarCheek'] },
      stats: { speed: 1.25, dmg: 1.25, reload: 0.75 },
      main: C({ name: 'St. Louis Smash', desc: 'Ein weiter Wirbeltritt mit Luftdruck.', range: 2.3, arc: 160, dmg: 900, lunge: 1.0, color: 0x7affa8, effects: knock(1.6), anim: 'kick', sfx: 'kick' }),
      super: MULTI([
        D({ dist: 6, speed: 28, dmg: 800, w: 1.0, color: 0x5aff8a, invuln: true }),
        P({ shape: 'fist', color: 0x5aff8a, color2: 0xffffff, size: 1.6, speed: 15, range: 10, dmg: 2400, w: 1.4, pierce: true, pierceWalls: true, breakWalls: true, effects: knock(3), trail: false, delay: 0.3 }),
      ], { name: 'Detroit Smash 100 %', desc: 'Ein Schlag mit voller Kraft, dessen Luftdruck die Arena durchquert.', anim: 'punch', sfx: 'bajrang', cutscene: true }),
      onEnter: N({ r: 3, dmg: 400, color: 0x5aff8a, effects: knock(2) }),
    },
  },

  // 52 ─ KATSUKI BAKUGO ───────────────────────────────────────────────────────
  {
    id: 'bakugo', name: 'Katsuki Bakugo', anime: 'mha', rarity: 'epic', role: 'Zerstörer',
    desc: 'Sein Schweiß ist Nitroglycerin. Explosionen sind Waffe und Antrieb zugleich.',
    playstyle: 'Explosionen auf kurze Distanz, Explosionssprünge zur Mobilität. Howitzer Impact ist eine rotierende Bombe.',
    stats: { hp: 4500, speed: 3.4, reload: 1.25, ammo: 3, superHits: 4 },
    sfx: 'explode', victory: 'armsCrossed',
    look: { skin: SKIN.fair, hair: { style: 'bakugo', color: 0xf0e8b8 }, eyes: { color: 0xc8202a, type: 'sharp' }, angry: true, mouth: 'fangs', top: { type: 'tank', color: 0x1a1a1a, sleeves: 'none' }, bottom: { type: 'pants', color: 0x1a1a1a }, gloves: 0xff8a2a, extras: ['wristbands'], wristColor: 0xff8a2a, build: 'muscle' },
    main: P({ name: 'Explosion', desc: 'Kurze Explosion aus der Handfläche mit Flächenschaden.', shape: 'orb', color: 0xffa040, color2: 0xffffff, speed: 16, range: 4.5, dmg: 620, w: 0.4, explode: { r: 1.3, dmg: 380 }, anim: 'punch', sfx: 'explode' }),
    super: D({ name: 'Howitzer Impact', desc: 'Dreht sich als Explosionswirbel ins Ziel und detoniert gewaltig.', dist: 'aim', maxDist: 7, speed: 18, dmg: 400, w: 1.0, color: 0xffa040, jump: true, end: N({ r: 3, dmg: 2100, color: 0xffa040, color2: 0xffffff, breakWalls: true, effects: knock(2.5) }), anim: 'spin', sfx: 'explodeBig', cutscene: true }),
    gadgets: [
      D({ name: 'Explosionssprung', desc: 'Springt mit einer Explosion über Hindernisse.', dist: 'aim', maxDist: 5, speed: 18, dmg: 0, color: 0xffa040, jump: true, end: N({ r: 1.4, dmg: 300, color: 0xffa040 }), sfx: 'explode' }),
      N({ name: 'Blendgranate', desc: 'Grelles Licht betäubt nahe Gegner.', r: 3, dmg: 200, color: 0xffffff, effects: stun(0.9), anim: 'clap', sfx: 'flash' }),
    ],
    starPowers: [
      { name: 'Nitro-Schweiß', desc: 'Nachladen 15 % schneller.', type: 'stat', reload: 0.85 },
      { name: 'Nummer Eins', desc: '+25 % Schaden über 70 % LP.', type: 'highHpDmg', above: 0.7, mult: 1.25 },
    ],
    trans: {
      name: 'Maximale Feuerkraft: Cluster', duration: 14, aura: 0xff8a2a, aura2: 0xffe08a, auraIntensity: 1.6,
      desc: 'Seine Handschuhe glühen. AP-Schüsse feuern wie ein Maschinengewehr, und Howitzer Impact zündet eine Kettenreaktion.',
      look: { glow: 0xff8a2a, top: { type: 'bare' }, eyes: { type: 'demon', color: 0xc8202a } },
      stats: { dmg: 1.25, reload: 0.7, speed: 1.1 },
      main: BM({ name: 'AP-Schuss: Autokanone', desc: 'Drei gebündelte Explosionsstrahlen hintereinander.', range: 8, w: 0.25, dmg: 360, ticks: 3, gap: 0.09, color: 0xffa040, color2: 0xffffff, root: false, anim: 'point', animDur: 0.4, sfx: 'beam' }),
      super: SEQ([0, 0.2, 0.4, 0.6].map((t, i) => ({ at: t, do: A({ range: 3 + i * 1.6, fixed: true, r: 2.0, dmg: 900, landDelay: 0.1, fx: 'explode', color: 0xffa040, breakWalls: true, effects: knock(1.5) }) })), { name: 'Howitzer Impact: Cluster', desc: 'Vier Explosionen hintereinander in Zielrichtung.', anim: 'spin', sfx: 'explodeBig', cutscene: true }),
      onEnter: N({ r: 3, dmg: 500, color: 0xff8a2a, effects: knock(2) }),
    },
  },

  // 53 ─ SHOTO TODOROKI ───────────────────────────────────────────────────────
  {
    id: 'todoroki', name: 'Shoto Todoroki', anime: 'mha', rarity: 'super_rare', role: 'Kontrolleur',
    desc: 'Halb Eis, halb Feuer. Lange nutzte er nur seine rechte Seite.',
    playstyle: 'Eiswellen verlangsamen, die Eismauer blockiert Wege. In seiner Transformation wechselt jeder Angriff zwischen Eis und Feuer.',
    stats: { hp: 4300, speed: 3.3, reload: 1.35, ammo: 3, superHits: 4 },
    sfx: 'ice', victory: 'armsCrossed',
    look: { skin: SKIN.light, hair: { style: 'deku', color: 0xf2f2f6, color2: 0xc8302a }, eyes: { color: 0x3a6adf }, marks: ['scarEye'], mouth: 'flat', top: { type: 'jacket', color: 0x2a3a5a, sleeves: 'long', collar: true }, bottom: { type: 'pants', color: 0x2a3a5a }, build: 'slim' },
    main: P({ name: 'Eisspur', desc: 'Eine Welle aus Eis am Boden, verlangsamt stark.', shape: 'ice', color: 0x9ae8ff, color2: 0xffffff, speed: 15, range: 7.5, dmg: 620, w: 0.45, pierce: true, effects: slow(1.4, 0.45), anim: 'stomp', sfx: 'ice' }),
    super: MULTI([
      WALL({ len: 7, range: 3.5, t: 6, color: 0xbfefff, style: 'ice' }),
      A({ range: 4, r: 2.4, dmg: 1200, landDelay: 0.3, fx: 'pillar', color: 0x9ae8ff, effects: { freeze: 1.4 } }),
    ], { name: 'Himmelhohe Eiswand', desc: 'Eine riesige Eiswand schießt empor und friert alles davor ein.', anim: 'stomp', sfx: 'ice', cutscene: true }),
    gadgets: [
      P({ name: 'Linke Seite', desc: 'Ein Feuerstoß, der brennt.', shape: 'orb', color: 0xff6a1a, color2: 0xffe08a, size: 0.5, speed: 14, range: 6, dmg: 700, w: 0.45, effects: burn(400, 2), anim: 'cast', sfx: 'fire' }),
      WALL({ name: 'Eisdeckung', desc: 'Eine kurze Eismauer zum Schutz.', len: 3, range: 1.6, t: 4, color: 0xbfefff, style: 'ice', sfx: 'ice' }),
    ],
    starPowers: [
      { name: 'Wärmeregulierung', desc: 'Immun gegen Verlangsamung.', type: 'immune', effects: ['slow'] },
      { name: 'Doppelte Begabung', desc: '+10 % Schaden.', type: 'stat', dmg: 1.1 },
    ],
    trans: {
      name: 'Flashfire', duration: 14, aura: 0xff5a2a, aura2: 0x9ae8ff, auraIntensity: 1.4,
      desc: 'Beide Seiten vereint. Blaue Hitze, die Eis zum Explodieren bringt.',
      look: { glow: 0xff5a2a, eyes: { type: 'sharp', color: 0x3a6adf }, top: { type: 'jacket', color: 0x1a2a4a, sleeves: 'long', collar: true } },
      stats: { dmg: 1.25, speed: 1.1, reload: 0.85 },
      main: P({ name: 'Eis & Feuer', desc: 'Eine Eisspitze und ein Feuerball zugleich.', shape: 'ice', color: 0x9ae8ff, count: 2, spread: 12, speed: 16, range: 8, dmg: 480, w: 0.4, effects: fx(slow(1, 0.35), burn(300, 1.5)), anim: 'cast', sfx: 'ice' }),
      super: D({ name: 'Flashfire-Faust: Jet Burn', desc: 'Raketenartiger Flammenantrieb durch die Gegner.', dist: 7, speed: 30, dmg: 2400, w: 1.0, color: 0x5ab8ff, invuln: true, breakWalls: true, effects: fx(knock(2), burn(600, 3)), anim: 'punch', sfx: 'fireBig', cutscene: true }),
      onEnter: N({ r: 3, dmg: 400, color: 0xff5a2a, effects: burn(300, 2) }),
    },
  },

  // 54 ─ ALL MIGHT ────────────────────────────────────────────────────────────
  {
    id: 'allmight', name: 'All Might', anime: 'mha', rarity: 'legendary', role: 'Panzer',
    desc: 'Das Symbol des Friedens. Ein einziger Schlag verändert das Wetter.',
    playstyle: 'Langsam, aber jeder Schlag ist eine Druckwelle. United States of Smash räumt das ganze Feld.',
    stats: { hp: 6400, speed: 3.15, reload: 1.4, ammo: 3, superHits: 4 },
    sfx: 'heavyPunch', victory: 'flex',
    look: { skin: SKIN.fair, hair: { style: 'allmight', color: 0xffe06a }, eyes: { color: 0x3a8adf, type: 'sharp' }, mouth: 'grin', top: { type: 'suit', color: 0x3a6adf, color2: 0xc8202a, sleeves: 'long' }, bottom: { type: 'pants', color: 0xc8202a }, gloves: 0xf2f2f4, shoes: 0xffd23f, boots: true, extras: ['cape'], capeColor: 0xc8202a, build: 'titan' },
    main: P({ name: 'Texas Smash', desc: 'Ein Schlag, dessen Druckwelle durch Gegner schlägt.', shape: 'wave', color: 0xbfe6ff, size: 0.8, speed: 15, range: 6.5, dmg: 950, w: 0.7, pierce: true, effects: knock(1.6), anim: 'punch', sfx: 'heavyPunch' }),
    super: N({ name: 'United States of Smash', desc: 'Der stärkste Schlag: eine Druckwelle, die alles im Umkreis wegfegt.', r: 4.4, dmg: 2600, color: 0xbfe6ff, color2: 0xffd23f, breakWalls: true, effects: knock(4), anim: 'punch', sfx: 'bajrang', cutscene: true }),
    gadgets: [
      BUF({ name: 'Ich bin hier!', desc: 'Lacht der Gefahr ins Gesicht: 40 % Schadensreduktion für 3 s.', buff: { dr: 0.4, t: 3, color: 0xffd23f }, sfx: 'laugh' }),
      D({ name: 'Detroit-Sprung', desc: 'Ein Sprung, der beim Landen alle umwirft.', dist: 'aim', maxDist: 6, speed: 16, dmg: 0, jump: true, color: 0xffd23f, end: N({ r: 2.2, dmg: 800, color: 0xffd23f, effects: knock(2) }), sfx: 'dash' }),
    ],
    starPowers: [
      { name: 'Symbol des Friedens', desc: 'Verbündete in der Nähe erhalten 10 % weniger Schaden (er selbst 20 %).', type: 'allyNearDR', f: 0.2, r: 4 },
      { name: 'Plus Ultra', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
    ],
    trans: {
      name: 'One For All 100 %: Last Smash', duration: 13, aura: 0xffd23f, aura2: 0xbfe6ff, auraIntensity: 1.8,
      desc: 'Sein letztes Feuer: Alle Kraft in eine Faust. Riesig, unaufhaltsam, jeder Schlag ein Sturm.',
      look: { glow: 0xffd23f, eyes: { type: 'glow', color: 0xbfe6ff }, top: { type: 'bare' }, extrasRemove: ['cape'], scale: 1.08 },
      stats: { dmg: 1.35, hp: 1.15, speed: 1.08 },
      passive: [{ type: 'unstoppable' }],
      main: MULTI([
        C({ range: 2.4, arc: 120, dmg: 900, color: 0xffd23f, effects: knock(2) }),
        P({ shape: 'wave', color: 0xffd23f, size: 1.0, speed: 16, range: 8, dmg: 700, w: 0.9, pierce: true, breakWalls: true }),
      ], { name: 'Carolina Smash', desc: 'Ein Kreuzschlag plus Sturmwelle.', anim: 'flurry', sfx: 'heavyPunch' }),
      super: P({ name: 'United States of Smash', desc: 'Eine Faust aus reinem Wind, die die ganze Arena überrollt.', shape: 'fist', color: 0xffd23f, color2: 0xffffff, size: 2.4, speed: 12, range: 14, dmg: 3200, w: 2.0, pierce: true, pierceWalls: true, breakWalls: true, effects: knock(3.5), trail: false, anim: 'punch', animDur: 0.8, sfx: 'bajrang', cutscene: true }),
      onEnter: N({ r: 3.8, dmg: 600, color: 0xffd23f, effects: knock(3) }),
    },
  },

  // 55 ─ TOMURA SHIGARAKI ─────────────────────────────────────────────────────
  {
    id: 'shigaraki', name: 'Tomura Shigaraki', anime: 'mha', rarity: 'mythic', role: 'Zerstörer',
    desc: 'Anführer der Schurkenliga. Alles, was er mit fünf Fingern berührt, zerfällt zu Staub.',
    playstyle: 'Berührung zerfällt Gegner langsam (Schaden über Zeit). Die Zerfallswelle frisst sich durch Wände und Boden.',
    stats: { hp: 4300, speed: 3.25, reload: 1.35, ammo: 3, superHits: 4 },
    sfx: 'dark', victory: 'laugh',
    look: { skin: 0xe8dcd8, hair: { style: 'shigaraki', color: 0xb8c4d0 }, eyes: { color: 0xc8202a, type: 'sharp' }, marks: ['scarCheek'], mouth: 'smirk', top: { type: 'hoodie', color: 0x1a1a22, sleeves: 'long', collar: true }, bottom: { type: 'pants', color: 0x2a2a30 }, build: 'slim' },
    main: C({ name: 'Zerfall', desc: 'Fünf Finger: Das Ziel zerfällt (starker Schaden über Zeit).', range: 1.8, arc: 80, dmg: 450, lunge: 0.6, color: 0xb8c4d0, effects: burn(500, 3), anim: 'point', sfx: 'squish' }),
    super: A({ name: 'Zerfallswelle', desc: 'Berührt den Boden: Zerfall breitet sich aus, zerstört Wände und frisst alle Gegner.', self: true, r: 4.2, landDelay: 0.4, dmg: 1200, fx: 'ring', color: 0x9a8a8a, breakWalls: true, effects: burn(500, 3), linger: { t: 3, tick: 0.5, dmg: 220, color: 0x7a6a6a }, anim: 'stomp', sfx: 'quake', cutscene: true }),
    gadgets: [
      BL({ name: 'Warp-Gate', desc: 'Ein Portal versetzt ihn an die Zielstelle.', dist: 'aim', maxDist: 6, color: 0x6a3aa8, sfx: 'space' }),
      SUM({ name: 'Nomu', desc: 'Ein Nomu kämpft 7 s für ihn.', unit: { name: 'Nomu', hp: 2600, life: 7, speed: 3.6, rate: 1, color: 0x2a2a2a, look: { skin: 0x2a2a30, build: 'giant', hair: { style: 'none' }, eyes: { type: 'blank' }, mouth: 'fangs', extras: ['noEars'], top: { type: 'bare' }, bottom: { type: 'pants', color: 0x4a4a4a } }, attack: C({ range: 1.6, arc: 110, dmg: 650, effects: knock(1.5), anim: 'overhead' }) }, sfx: 'roar' }),
    ],
    starPowers: [
      { name: 'Wachsende Wut', desc: 'Bis zu +40 % Schaden bei niedrigen LP.', type: 'rage', max: 0.4 },
      { name: 'Kettenreaktion', desc: 'Zerfall dauert 50 % länger.', type: 'burnBoost', mult: 1.5 },
    ],
    trans: {
      name: 'All For One: Verschmelzung', duration: 14, aura: 0x1a0a1a, aura2: 0xc8202a, auraIntensity: 1.5,
      desc: 'All For One in ihm erwacht: unzählige gestohlene Quirks. Er schießt Luftkanonen und Ranken aus seinen Fingern.',
      look: { skin: 0xd8c8c8, hair: { style: 'shigaraki', color: 0xf2f2f6 }, top: { type: 'bare' }, eyes: { type: 'demon', color: 0xc8202a }, glow: 0xc8202a, build: 'muscle', marksAdd: ['stitches'] },
      stats: { dmg: 1.3, hp: 1.15, speed: 1.1 },
      passive: [{ type: 'regen', amt: 200, delay: 0 }],
      main: P({ name: 'Luftkanone', desc: 'Drei Druckgeschosse aus gestohlenen Quirks.', shape: 'orb', color: 0xc8202a, color2: 0x1a0a1a, count: 3, spread: 20, speed: 18, range: 8, dmg: 420, w: 0.32, effects: burn(200, 2), anim: 'cast', sfx: 'kiBig' }),
      super: MULTI([
        A({ self: true, r: 5, landDelay: 0.3, dmg: 1600, fx: 'ring', color: 0x9a8a8a, breakWalls: true, effects: fx(pull(1.5), burn(600, 3)), linger: { t: 3, tick: 0.5, dmg: 300, color: 0x7a6a6a } }),
      ], { name: 'Totaler Zerfall', desc: 'Eine riesige Zerfallswelle, die Gegner heranzieht.', anim: 'stomp', sfx: 'quake', cutscene: true }),
      onEnter: N({ r: 3.4, dmg: 500, color: 0xc8202a, breakWalls: true, effects: knock(2) }),
    },
  },
];

import { P, C, D, BM, A, N, DOM, SUM, BUF, BL, WALL, HOOK, SEQ, MULTI, CU, slow, stun, knock, pull, burn, fx, SKIN } from './helpers.js';

const GI = (c = 0xff7a1a, c2 = 0x2a4adf) => ({ type: 'gi', color: c, color2: c2, under: c2, sleeves: 'none' });

export default [
  // 11 ─ GOKU ─────────────────────────────────────────────────────────────────
  {
    id: 'goku', name: 'Son Goku', anime: 'db', rarity: 'divine', role: 'Allrounder',
    desc: 'Saiyajin, der immer stärker werden will. Zweistufige Verwandlung: Super Saiyajin Blue, dann Ultra Instinct.',
    playstyle: 'Ki-Salven aus mittlerer Distanz, Kamehameha zum Abschluss. In Ultra Instinct weicht er automatisch aus und blitzt zwischen Gegnern hin und her.',
    stats: { hp: 4500, speed: 3.4, reload: 1.25, ammo: 3, superHits: 5 },
    sfx: 'ki', victory: 'fistUp',
    look: { skin: SKIN.fair, hair: { style: 'saiyan', color: 0x141418 }, eyes: { color: 0x1a1a1a }, top: GI(), bottom: { type: 'pants', color: 0xff7a1a }, extras: ['wristbands'], wristColor: 0x2a4adf, shoes: 0x2a4adf, build: 'muscle', mouth: 'grin' },
    main: P({ name: 'Ki-Salve', desc: 'Zwei schnelle Ki-Kugeln hintereinander.', shape: 'orb', color: 0xffd84a, color2: 0xffffff, speed: 17, range: 7.5, dmg: 460, w: 0.26, burst: { n: 2, gap: 0.11 }, burstSpread: 4, anim: 'punch', sfx: 'ki' }),
    super: BM({ name: 'Kamehameha', desc: 'Der berühmte Ki-Strahl: kurze Aufladung, dann ein durchgehender Strahl mit Rückstoß.', range: 10.5, w: 0.62, dmg: 270, ticks: 9, gap: 0.09, charge: 0.45, color: 0x4ac8ff, color2: 0xffffff, effects: knock(2.2), anim: 'kame', animDur: 1.3, sfx: 'kamehameha' }),
    gadgets: [
      BL({ name: 'Momentane Teleportation', desc: 'Erscheint direkt hinter dem nächsten Gegner.', dist: 'aim', maxDist: 7, behindTarget: true, color: 0xffd84a, sfx: 'teleport' }),
      BUF({ name: 'Magische Bohne', desc: 'Heilt sofort 50 % der LP.', buff: { healPct: 0.5, color: 0x7cff7a }, sfx: 'heal' }),
    ],
    starPowers: [
      { name: 'Saiyajin-Blut', desc: '+35 % Schaden unter 40 % LP.', type: 'lowHpDmg', below: 0.4, mult: 1.35 },
      { name: 'Kaioken', desc: 'Nach der Super +30 % Tempo für 3 s.', type: 'speedOnSuper', mult: 0.3, t: 3 },
    ],
    trans: {
      name: 'Super Saiyajin Blue', duration: 16, aura: 0x3ab8ff, aura2: 0xffffff, auraIntensity: 1.3,
      desc: 'Göttliches Ki mit Saiyajin-Kraft. Ki-Salven werden zu Dreifachsalven; die Form-Anzeige lädt weiter für Ultra Instinct.',
      look: { hair: { style: 'ssj', color: 0x3ad0ff }, eyes: { color: 0x2a9adf, type: 'sharp' }, browColor: 0x2a9adf, mouth: 'flat', angry: true },
      stats: { dmg: 1.2, speed: 1.1, reload: 0.85 },
      main: P({ name: 'Blaue Ki-Salve', desc: 'Drei göttliche Ki-Kugeln.', shape: 'orb', color: 0x3ab8ff, color2: 0xffffff, speed: 19, range: 8, dmg: 420, w: 0.28, burst: { n: 3, gap: 0.09 }, burstSpread: 5, anim: 'flurry', sfx: 'ki' }),
      super: BM({ name: 'Göttliches Kamehameha', desc: 'Breiterer, schnellerer Strahl, der Wände sprengt.', range: 11, w: 0.8, dmg: 320, ticks: 9, gap: 0.08, charge: 0.35, color: 0x3ab8ff, color2: 0xffffff, breakWalls: true, effects: knock(2.6), anim: 'kame', animDur: 1.2, sfx: 'kamehameha' }),
      onEnter: N({ r: 3, dmg: 300, color: 0x3ab8ff, effects: knock(1.8) }),
      next: {
        name: 'Ultra Instinct', duration: 14, aura: 0xd8e4ff, aura2: 0x9ab8ff, auraStyle: 'flame', auraIntensity: 1.4,
        desc: 'Der Körper bewegt sich von selbst: 45 % automatisches Ausweichen, lautlose Schlagfolgen, und die Super blitzt zwischen allen Gegnern hin und her.',
        look: { hair: { style: 'uiHair', color: 0xd8dce8 }, eyes: { type: 'glow', color: 0xc8d4f0 }, browColor: 0xb8c0d8, mouth: 'flat', top: { type: 'tank', color: 0x2a4adf, sleeves: 'none', replace: true }, angry: false, glow: 0xd8e4ff, marksAdd: ['scarCheek'], extrasAdd: ['wristbands'] },
        stats: { dmg: 1.35, speed: 1.25, reload: 0.7 },
        passive: [{ type: 'dodge', chance: 0.45, name: 'Selbstbewegung' }],
        main: C({ name: 'Lautloser Schlagwirbel', desc: 'Drei Schläge mit Vorwärtsdrang, jeder bricht durch Deckung.', range: 2.0, arc: 90, dmg: 560, hits: 3, gap: 0.08, lunge: 1.0, color: 0xd8e4ff, anim: 'flurry', sfx: 'punch' }),
        super: CU('uiAssault', { name: 'Silberner Drachenblitz', desc: 'Teleportiert sich nacheinander zu bis zu 5 Gegnern und trifft jeden schwer — dann ein abschließendes Kamehameha.', dmg: 1100, range: 9, anim: 'dash', sfx: 'teleport' }),
        onEnter: N({ r: 3.4, dmg: 500, color: 0xd8e4ff, effects: knock(2.2) }),
      },
    },
  },

  // 12 ─ VEGETA ───────────────────────────────────────────────────────────────
  {
    id: 'vegeta', name: 'Vegeta', anime: 'db', rarity: 'legendary', role: 'Schütze',
    desc: 'Prinz der Saiyajin. Stolz, präzise und unerbittlich. Super Saiyajin Blue, dann Ultra Ego.',
    playstyle: 'Feuert Ki-Sperrfeuer mit fünf Kugeln. In Ultra Ego wird er stärker, je mehr Schaden er einsteckt.',
    stats: { hp: 4200, speed: 3.35, reload: 1.35, ammo: 3, superHits: 5 },
    sfx: 'ki', victory: 'armsCrossed',
    look: { skin: SKIN.fair, hair: { style: 'vegeta', color: 0x121216 }, eyes: { color: 0x1a1a1a, type: 'sharp' }, angry: true, mouth: 'smirk', top: { type: 'shirt', color: 0x2a3a9a, sleeves: 'long' }, bottom: { type: 'pants', color: 0x2a3a9a }, extras: ['shoulderPads'], armorColor: 0xf2f2f2, gloves: 0xf2f2f2, shoes: 0xf2f2f2, build: 'muscle' },
    main: P({ name: 'Galick-Sperrfeuer', desc: 'Fünf kleine Ki-Kugeln in leichtem Fächer.', shape: 'orb', color: 0xff3ab8, color2: 0xffffff, count: 5, spread: 26, speed: 17, range: 7, dmg: 280, w: 0.22, anim: 'cast', sfx: 'ki' }),
    super: BM({ name: 'Final Flash', desc: 'Lange Aufladung, dann ein gewaltiger, breiter Strahl.', range: 12, w: 0.9, dmg: 330, ticks: 8, gap: 0.09, charge: 0.7, color: 0xffe84a, color2: 0xffffff, breakWalls: true, effects: knock(2.5), anim: 'beam', animDur: 1.5, sfx: 'beamBig' }),
    gadgets: [
      P({ name: 'Big Bang Attack', desc: 'Langsame Energiekugel mit großer Explosion.', shape: 'orb', color: 0x7ad8ff, color2: 0xffffff, size: 0.55, speed: 10, range: 8, dmg: 800, w: 0.45, explode: { r: 2.1, dmg: 900 }, anim: 'point', sfx: 'kiBig' }),
      BUF({ name: 'Saiyajin-Stolz', desc: '+30 % Schaden und 15 % Schadensreduktion für 4 s.', buff: { dmg: 0.3, dr: 0.15, t: 4, color: 0xffe84a }, sfx: 'powerup' }),
    ],
    starPowers: [
      { name: 'Ewiger Rivale', desc: '+12 % Schaden.', type: 'stat', dmg: 1.12 },
      { name: 'Unbeugsam', desc: 'Super lädt 15 % schneller.', type: 'stat', superRate: 1.15 },
    ],
    trans: {
      name: 'Super Saiyajin Blue', duration: 16, aura: 0x3ab8ff, aura2: 0xffffff, auraIntensity: 1.3,
      desc: 'Götterkraft unter Kontrolle. Das Sperrfeuer wird schneller und dichter; die Anzeige lädt weiter für Ultra Ego.',
      look: { hair: { style: 'vegeta', color: 0x3ad0ff }, eyes: { color: 0x2a9adf, type: 'sharp' }, browColor: 0x2a9adf },
      stats: { dmg: 1.2, reload: 0.85, speed: 1.08 },
      main: P({ name: 'Göttliches Sperrfeuer', desc: 'Zwei Salven aus je vier Kugeln.', shape: 'orb', color: 0x3ab8ff, color2: 0xffffff, count: 4, spread: 22, speed: 19, range: 7.5, dmg: 220, w: 0.24, burst: { n: 2, gap: 0.12 }, anim: 'flurry', sfx: 'ki' }),
      super: BM({ name: 'Final Flash (Blue)', desc: 'Schnellere Aufladung, größere Reichweite.', range: 13, w: 1.0, dmg: 360, ticks: 8, gap: 0.08, charge: 0.45, color: 0x3ab8ff, color2: 0xffffff, breakWalls: true, effects: knock(2.8), anim: 'beam', animDur: 1.3, sfx: 'beamBig' }),
      onEnter: N({ r: 3, dmg: 300, color: 0x3ab8ff, effects: knock(1.8) }),
      next: {
        name: 'Ultra Ego', duration: 15, aura: 0x9a3aff, aura2: 0xff3ab8, auraIntensity: 1.5,
        desc: 'Der Weg der Zerstörung: Kein Ausweichen, nur Vorwärts. Je mehr Schaden er nimmt, desto mehr Schaden macht er (bis +90 %).',
        look: { hair: { style: 'vegeta', color: 0x6a2ab8 }, eyes: { type: 'demon', color: 0x9a3aff }, browColor: 0x6a2ab8, skin: 0xe8c0b0, top: { type: 'bare' }, mouth: 'fangs' },
        stats: { dmg: 1.2, speed: 1.08, hp: 1.2 },
        passive: [{ type: 'rage', max: 0.9 }, { type: 'lifesteal', f: 0.12 }],
        main: C({ name: 'Hakai-Fäuste', desc: 'Zerstörerische Schläge mit Zerstörungsenergie.', range: 1.9, arc: 90, dmg: 640, hits: 2, gap: 0.11, lunge: 0.8, color: 0x9a3aff, effects: knock(0.8), anim: 'flurry', sfx: 'punch' }),
        super: SEQ([
          { at: 0, do: D({ dist: 5, speed: 22, dmg: 700, w: 0.9, color: 0x9a3aff, stopOnHit: true }) },
          { at: 0.35, do: N({ r: 3.2, dmg: 2000, color: 0x9a3aff, color2: 0xff3ab8, breakWalls: true, effects: knock(2.5) }) },
        ], { name: 'Hakai-Explosion', desc: 'Stürmt vor und entfesselt eine Zerstörungsexplosion.', anim: 'raise', sfx: 'explodeBig' }),
        onEnter: N({ r: 3.4, dmg: 500, color: 0x9a3aff, effects: knock(2.2) }),
      },
    },
  },

  // 13 ─ GOHAN ────────────────────────────────────────────────────────────────
  {
    id: 'gohan', name: 'Son Gohan', anime: 'db', rarity: 'mythic', role: 'Schütze',
    desc: 'Verborgenes Potenzial ohne Grenzen. Ultimate Form — und dann Beast.',
    playstyle: 'Durchschlagendes Masenko auf lange Distanz. Beast verwandelt ihn in einen Nahkampf-Berserker mit Special Beam Cannon.',
    stats: { hp: 4200, speed: 3.3, reload: 1.5, ammo: 3, superHits: 4 },
    sfx: 'ki', victory: 'fistUp',
    look: { skin: SKIN.fair, hair: { style: 'gohan', color: 0x141418 }, eyes: { color: 0x1a1a1a }, top: GI(0x6a2a9a, 0xff4a2a), bottom: { type: 'pants', color: 0x6a2a9a }, extras: ['wristbands'], wristColor: 0xff4a2a, build: 'normal', mouth: 'smile' },
    main: P({ name: 'Masenko', desc: 'Durchschlagender gelber Ki-Strahl auf lange Distanz.', shape: 'orb', color: 0xffe84a, color2: 0xffffff, speed: 20, range: 9, dmg: 900, w: 0.3, pierce: true, anim: 'cast', sfx: 'ki' }),
    super: BM({ name: 'Vater-Sohn-Kamehameha', desc: 'Ein mächtiger Strahl, den der Geist seines Vaters verstärkt.', range: 11, w: 0.75, dmg: 300, ticks: 9, gap: 0.09, charge: 0.4, color: 0x4ac8ff, color2: 0xffffff, effects: knock(2.2), anim: 'kame', animDur: 1.3, sfx: 'kamehameha' }),
    gadgets: [
      BUF({ name: 'Potenzialentfesselung', desc: 'Lädt sofort 40 % der Super.', buff: { superCharge: 0.4, color: 0xffe84a }, sfx: 'powerup' }),
      C({ name: 'Ellbogenkonter', desc: 'Schneller Nahkampfkonter mit Betäubung.', range: 1.6, arc: 100, dmg: 700, effects: stun(0.6), anim: 'punch', sfx: 'punch' }),
    ],
    starPowers: [
      { name: 'Verborgenes Potenzial', desc: 'Form-Anzeige lädt 30 % schneller.', type: 'stat', transRate: 1.3 },
      { name: 'Gelehrter', desc: 'Masenko +1 Feld Reichweite.', type: 'rangeBoost', add: 1 },
    ],
    trans: {
      name: 'Ultimate Gohan', duration: 15, aura: 0xf0f0ff, aura2: 0xffffff, auraIntensity: 1.1,
      desc: 'Mystische Form: Ruhe, Kontrolle, ungeheure Kraft. Die Anzeige lädt weiter für Beast.',
      look: { hair: { style: 'gohan', color: 0x141418 }, eyes: { type: 'sharp', color: 0x1a1a1a }, angry: true, mouth: 'flat' },
      stats: { dmg: 1.25, reload: 0.8 },
      main: P({ name: 'Ultimatives Masenko', desc: 'Zwei durchschlagende Masenkos.', shape: 'orb', color: 0xffe84a, color2: 0xffffff, speed: 22, range: 9.5, dmg: 700, w: 0.32, pierce: true, burst: { n: 2, gap: 0.12 }, anim: 'cast', sfx: 'ki' }),
      super: BM({ name: 'Ultimatives Kamehameha', desc: 'Breiter Strahl, durchbricht Wände.', range: 12, w: 0.85, dmg: 340, ticks: 9, gap: 0.08, charge: 0.35, color: 0x4ac8ff, color2: 0xffffff, breakWalls: true, effects: knock(2.4), anim: 'kame', animDur: 1.2, sfx: 'kamehameha' }),
      onEnter: N({ r: 3, dmg: 300, color: 0xffffff, effects: knock(1.6) }),
      next: {
        name: 'Gohan Beast', duration: 14, aura: 0xff3a3a, aura2: 0xffffff, auraIntensity: 1.6,
        desc: 'Sein Zorn sprengt jede Grenze: weißes, wildes Haar, rote Augen, Nahkampf-Raserei und ein Special Beam Cannon, der durch alles bohrt.',
        look: { hair: { style: 'beast', color: 0xeef0f8 }, eyes: { type: 'demon', color: 0xd8202a }, browColor: 0xd0d4e0, mouth: 'fangs', angry: true, build: 'muscle', top: { type: 'gi', color: 0x6a2a9a, color2: 0xff4a2a, under: 0xff4a2a, sleeves: 'none' } },
        stats: { dmg: 1.35, speed: 1.2, reload: 0.65, hp: 1.1 },
        passive: [{ type: 'rage', max: 0.4 }],
        main: C({ name: 'Bestienschläge', desc: 'Drei rasende Schläge mit großem Vorwärtsdrang.', range: 2.0, arc: 100, dmg: 560, hits: 3, gap: 0.08, lunge: 1.1, color: 0xff3a3a, anim: 'flurry', sfx: 'punch' }),
        super: BM({ name: 'Special Beam Cannon', desc: 'Spiralstrahl, der durch Wände und alle Gegner bohrt.', range: 14, w: 0.45, dmg: 3000, ticks: 1, charge: 0.55, color: 0xffe84a, color2: 0xff3ab8, pierceWalls: true, breakWalls: true, effects: knock(2), anim: 'point', animDur: 1.0, sfx: 'beamBig' }),
        onEnter: N({ r: 3.6, dmg: 600, color: 0xff3a3a, effects: knock(2.4) }),
      },
    },
  },

  // 14 ─ BROLY ────────────────────────────────────────────────────────────────
  {
    id: 'broly', name: 'Broly', anime: 'db', rarity: 'mythic', role: 'Panzer',
    desc: 'Ein Saiyajin mit unkontrollierbarer Kraft, der im Kampf immer weiter wächst.',
    playstyle: 'Langsam, aber riesig. Seine Kraft steigt mit jedem verlorenen Lebenspunkt. Der Legendary Super Saiyajin macht ihn fast unaufhaltsam.',
    stats: { hp: 6600, speed: 3.0, reload: 1.4, ammo: 3, superHits: 4 },
    sfx: 'punch', victory: 'flex',
    passive: [{ type: 'rage', max: 0.45 }],
    look: { skin: SKIN.tan, hair: { style: 'broly', color: 0x141418 }, eyes: { color: 0x1a1a1a }, mouth: 'flat', top: { type: 'bare' }, bottom: { type: 'pants', color: 0xf2f2f4 }, extras: ['wristbands', 'cape'], capeColor: 0x8a2a2a, wristColor: 0xd8b84a, build: 'giant' },
    main: C({ name: 'Titanenfaust', desc: 'Schwerer Schlag mit Rückstoß.', range: 1.9, arc: 90, dmg: 1050, lunge: 0.4, color: 0x7aff7a, effects: knock(1.4), anim: 'punch', sfx: 'heavyPunch' }),
    super: N({ name: 'Gigantischer Schrei', desc: 'Gewaltige Ki-Explosion um Broly herum, zerstört Wände.', r: 3.4, dmg: 1900, color: 0x7aff7a, color2: 0xffffff, breakWalls: true, effects: knock(3), anim: 'raise', sfx: 'roar' }),
    gadgets: [
      HOOK({ name: 'Packen', desc: 'Packt den nächsten Gegner und zieht ihn heran.', shape: 'fist', color: 0xebb68c, speed: 16, range: 5, dmg: 600, w: 0.4, sfx: 'punch' }),
      BUF({ name: 'Unbändiger Wille', desc: '25 % Schadensreduktion für 4 s.', buff: { dr: 0.25, t: 4, color: 0x7aff7a }, sfx: 'powerup' }),
    ],
    starPowers: [
      { name: 'Wachsender Zorn', desc: 'Wut-Bonus steigt auf bis zu +70 %.', type: 'rage', max: 0.25 },
      { name: 'Saiyajin-Körper', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
    ],
    trans: {
      name: 'Legendärer Super Saiyajin', duration: 16, aura: 0x6aff5a, aura2: 0xffe84a, auraIntensity: 1.7,
      desc: 'Grün-goldene Aura, der Körper wächst auf Riesenmaß. Unaufhaltsam: kein Rückstoß, keine Betäubung länger als einen Wimpernschlag.',
      look: { hair: { style: 'ssjLong', color: 0xd8ff6a }, eyes: { type: 'blank' }, build: 'titan', mouth: 'open', browColor: 0xb8e85a, skin: 0xe8b080 },
      stats: { hp: 1.3, dmg: 1.25, speed: 1.05 },
      passive: [{ type: 'unstoppable' }, { type: 'rage', max: 0.3 }],
      main: P({ name: 'Eraser Cannon', desc: 'Drei grüne Energiekugeln, die explodieren.', shape: 'orb', color: 0x6aff5a, color2: 0xffffff, count: 3, spread: 28, speed: 13, range: 7, dmg: 600, w: 0.38, explode: { r: 1.2, dmg: 350 }, anim: 'throw', sfx: 'kiBig' }),
      super: P({ name: 'Gigantischer Meteor', desc: 'Eine riesige, langsame Kugel, die alles verschlingt und gewaltig explodiert.', shape: 'orb', color: 0x6aff5a, color2: 0xffffff, size: 1.2, speed: 7, range: 10, dmg: 1200, w: 1.1, pierce: true, breakWalls: true, explode: { r: 3.4, dmg: 1800, breakWalls: true, effects: knock(2.5) }, anim: 'raise', animDur: 0.6, sfx: 'kiBig' }),
      onEnter: N({ r: 3.8, dmg: 600, color: 0x6aff5a, breakWalls: true, effects: knock(2.6) }),
    },
  },

  // 15 ─ FRIEZA ───────────────────────────────────────────────────────────────
  {
    id: 'frieza', name: 'Frieza', anime: 'db', rarity: 'legendary', role: 'Scharfschütze',
    desc: 'Der Imperator des Universums. Kalt, grausam, mit tödlicher Präzision. Golden Frieza, dann Black Frieza.',
    playstyle: 'Death Beam ist ein sofortiger, durchschlagender Laser auf große Distanz. Halte dich zurück und triff.',
    stats: { hp: 3500, speed: 3.25, reload: 1.6, ammo: 3, superHits: 4 },
    sfx: 'beam', victory: 'laugh',
    look: { skin: 0xf6f4fa, hair: { style: 'none' }, eyes: { color: 0xc81830, type: 'sharp' }, marks: ['friezaMarks'], noBlush: true, extras: ['dome', 'tail', 'noEars'], domeColor: 0x9a4fd0, tailColor: 0xf6f4fa, top: { type: 'bare' }, bottom: { type: 'bare' }, gloves: 0xf6f4fa, shoes: 0xf6f4fa, build: 'slim', mouth: 'smirk', brows: false },
    main: BM({ name: 'Death Beam', desc: 'Sofortiger, dünner Laser, der auf große Distanz durchschlägt.', range: 9.5, w: 0.16, dmg: 1050, ticks: 1, color: 0xff4ab8, color2: 0xffffff, anim: 'point', animDur: 0.3, sfx: 'beam' }),
    super: A({ name: 'Death Ball', desc: 'Eine gewaltige Todeskugel stürzt auf das Zielgebiet.', range: 8, r: 2.8, dmg: 2400, landDelay: 0.85, lob: true, shape: 'orb', size: 0.9, color: 0xff6a2a, color2: 0xffe84a, breakWalls: true, effects: knock(2), anim: 'raise', sfx: 'kiBig' }),
    gadgets: [
      P({ name: 'Todesscheibe', desc: 'Eine Energiesäge, die zurückkehrt.', shape: 'blade', color: 0xff4ab8, speed: 13, range: 6, dmg: 700, w: 0.4, pierce: true, boomerang: true, anim: 'raise', sfx: 'slash' }),
      { kind: 'nova', name: 'Telekinese', desc: 'Schleudert alle nahen Gegner weit weg.', r: 3, dmg: 300, color: 0xff4ab8, effects: knock(3.5), anim: 'point', sfx: 'space' },
    ],
    starPowers: [
      { name: 'Grausamkeit', desc: 'Tötungsschüsse laden 50 % Super.', type: 'killSuper', amt: 0.5 },
      { name: 'Imperator', desc: '+1,5 Felder Reichweite für Death Beam.', type: 'rangeBoost', add: 1.5 },
    ],
    trans: {
      name: 'Golden Frieza', duration: 15, aura: 0xffd84a, aura2: 0xffffff, auraIntensity: 1.2,
      desc: 'Goldener Glanz und göttliche Kraft. Death Beams feuern dreifach; die Anzeige lädt weiter für Black Frieza.',
      look: { skin: 0xffd84a, domeColor: 0x9a4fd0, tailColor: 0xffd84a, gloves: 0xffd84a, shoes: 0xffd84a },
      stats: { dmg: 1.2, reload: 0.85, speed: 1.1 },
      main: BM({ name: 'Goldene Death Beams', desc: 'Drei schnelle Laser hintereinander.', range: 10, w: 0.17, dmg: 480, ticks: 3, gap: 0.1, track: true, color: 0xffd84a, color2: 0xffffff, root: false, anim: 'point', animDur: 0.4, sfx: 'beam' }),
      super: A({ name: 'Golden Death Ball', desc: 'Größer, schneller, verbrennt den Boden.', range: 9, r: 3.2, dmg: 2600, landDelay: 0.7, lob: true, shape: 'orb', size: 1.1, color: 0xffd84a, color2: 0xffffff, breakWalls: true, effects: knock(2.4), linger: { t: 3, tick: 0.5, dmg: 220, color: 0xffd84a }, anim: 'raise', sfx: 'kiBig' }),
      onEnter: N({ r: 3, dmg: 300, color: 0xffd84a, effects: knock(1.8) }),
      next: {
        name: 'Black Frieza', duration: 14, aura: 0x2a1a3a, aura2: 0xff3ab8, auraIntensity: 1.6,
        desc: 'Die ultimative Evolution nach zehn Jahren Training: ein einziger Fingerzeig genügt.',
        look: { skin: 0x1e1a26, domeColor: 0xff3ab8, tailColor: 0x1e1a26, gloves: 0x1e1a26, shoes: 0x1e1a26, eyes: { type: 'glow', color: 0xff3ab8 }, glow: 0xff3ab8 },
        stats: { dmg: 1.4, reload: 0.7, speed: 1.15 },
        main: BM({ name: 'Schwarzer Todesstrahl', desc: 'Sofortiger Laser, der durch Wände geht und auf ein zweites Ziel überspringt.', range: 11, w: 0.2, dmg: 1250, ticks: 1, color: 0xff3ab8, color2: 0xffffff, pierceWalls: true, chainOnHit: { n: 1, r: 4, dmg: 600, color: 0xff3ab8 }, anim: 'point', animDur: 0.3, sfx: 'beam' }),
        super: MULTI([
          N({ r: 4.2, dmg: 1600, color: 0xff3ab8, color2: 0x2a1a3a, breakWalls: true, effects: fx(knock(3), stun(0.8)) }),
          BUF({ buff: { dr: 0.4, t: 3, color: 0xff3ab8 } }),
        ], { name: 'Ein Fingerzeig', desc: 'Eine schwarze Schockwelle zerreißt alles im Umkreis und betäubt.', anim: 'point', sfx: 'explodeBig' }),
        onEnter: N({ r: 3.6, dmg: 500, color: 0xff3ab8, effects: knock(2.4) }),
      },
    },
  },

  // 16 ─ PICCOLO ──────────────────────────────────────────────────────────────
  {
    id: 'piccolo', name: 'Piccolo', anime: 'db', rarity: 'common', role: 'Stratege',
    desc: 'Namekianischer Krieger und Mentor. Regeneriert, plant voraus und stellt Fallen aus Ki.',
    playstyle: 'Hellzone Grenade umzingelt ein Gebiet mit Ki-Kugeln, die sich gleichzeitig ins Zentrum stürzen. Gegner in der Falle können kaum entkommen.',
    stats: { hp: 4900, speed: 3.25, reload: 1.35, ammo: 3, superHits: 4 },
    sfx: 'ki', victory: 'armsCrossed',
    passive: [{ type: 'regen', amt: 120, delay: 1.5 }],
    look: { skin: SKIN.green, hair: { style: 'none' }, eyes: { color: 0x1a1a1a, type: 'sharp' }, noBlush: true, mouth: 'flat', extras: ['antennae', 'pointyEars', 'cape'], capeColor: 0xf2f2f4, top: { type: 'gi', color: 0x6a3aa8, color2: 0x4ac8ff, under: 0x6a3aa8, sleeves: 'none' }, bottom: { type: 'pants', color: 0x6a3aa8 }, wristColor: 0xc8202a, build: 'tall', browColor: 0x2a5a2a },
    main: BM({ name: 'Makankosappo (schwach)', desc: 'Kurz aufgeladener Spiralstrahl auf große Distanz.', range: 9, w: 0.22, dmg: 820, ticks: 1, charge: 0.15, color: 0xffe84a, color2: 0xff7ab8, anim: 'point', animDur: 0.4, sfx: 'beam' }),
    super: CU('hellzone', { name: 'Hellzone Grenade', desc: 'Acht Ki-Kugeln kreisen das Zielgebiet ein und stürzen sich dann gleichzeitig ins Zentrum.', dmg: 520, range: 7, r: 2.4, color: 0xffe84a, anim: 'cast', sfx: 'ki' }),
    gadgets: [
      BUF({ name: 'Regeneration', desc: 'Lässt einen Arm nachwachsen: heilt 1500 LP.', buff: { heal: 1500, color: 0x7cff7a }, sfx: 'heal' }),
      SUM({ name: 'Mehrfachform', desc: 'Eine Kopie Piccolos lenkt Gegner 5 s lang ab.', unit: { name: 'Piccolo-Kopie', hp: 1200, life: 5, speed: 3.2, rate: 1, look: 'owner', color: 0x7cff7a, attack: P({ shape: 'orb', color: 0xffe84a, speed: 15, range: 6, dmg: 300 }) }, sfx: 'ki' }),
    ],
    starPowers: [
      { name: 'Namekianische Zellen', desc: 'Regeneration verdoppelt.', type: 'regen', amt: 120, delay: 1.5 },
      { name: 'Mentor', desc: 'Super heilt Verbündete im Umkreis um 800.', type: 'superHealAllies', amt: 800, r: 4 },
    ],
    trans: {
      name: 'Orange Piccolo', duration: 15, aura: 0xff8a2a, aura2: 0xffffff,
      desc: 'Durch Shenlongs Wunsch erwacht: orange Haut, gewaltige Muskeln — und er kann gigantisch werden.',
      look: { skin: 0xff8a3a, build: 'giant', eyes: { type: 'sharp', color: 0x1a1a1a }, browColor: 0xa04a10, top: { type: 'bare' }, extrasRemove: ['cape'], extrasAdd: ['wristbands'], mouth: 'grin' },
      stats: { hp: 1.3, dmg: 1.2, speed: 1.05 },
      passive: [{ type: 'regen', amt: 250, delay: 0.5 }],
      main: C({ name: 'Riesenfaust', desc: 'Gedehnter Arm: Weitreichender Schlag mit Rückstoß.', range: 2.8, arc: 70, dmg: 900, lunge: 0.4, color: 0xff8a2a, effects: knock(1.6), anim: 'punch', sfx: 'heavyPunch' }),
      super: MULTI([
        BM({ range: 13, w: 0.5, dmg: 3200, ticks: 1, charge: 0.5, color: 0xffe84a, color2: 0xff3ab8, pierceWalls: true, breakWalls: true, effects: knock(2) }),
      ], { name: 'Special Beam Cannon (voll)', desc: 'Vollständig aufgeladener Spiralstrahl, durchbohrt alles.', anim: 'point', animDur: 1.0, sfx: 'beamBig' }),
      onEnter: N({ r: 3, dmg: 300, color: 0xff8a2a, effects: knock(1.8) }),
    },
  },

  // 17 ─ TRUNKS ───────────────────────────────────────────────────────────────
  {
    id: 'trunks', name: 'Future Trunks', anime: 'db', rarity: 'rare', role: 'Schwertkämpfer',
    desc: 'Krieger aus einer zerstörten Zukunft. Schwert und Ki verschmelzen zu einer Klinge der Hoffnung.',
    playstyle: 'Schnelle Schwertkombos auf kurze Distanz. Shining Sword Attack überbrückt Lücken und beendet Kämpfe.',
    stats: { hp: 4600, speed: 3.4, reload: 1.2, ammo: 3, superHits: 4 },
    sfx: 'slash', victory: 'swordUp',
    look: { skin: SKIN.fair, hair: { style: 'trunks', color: 0xb8a8e0 }, eyes: { color: 0x3a6ad8 }, mouth: 'flat', top: { type: 'jacket', color: 0x3a3a48, sleeves: 'long' }, bottom: { type: 'pants', color: 0x6a6a7a }, extras: ['swordBack'], backWeapon: 'katana', weapon: { type: 'katana' }, build: 'normal' },
    main: C({ name: 'Schwertkombination', desc: 'Zwei schnelle Hiebe.', range: 2.1, arc: 100, dmg: 560, hits: 2, gap: 0.12, color: 0xdfe6f0, anim: 'slash', sfx: 'slash' }),
    super: D({ name: 'Shining Sword Attack', desc: 'Sprint mit Klingenwirbel, endet in einem Ki-Stoß.', dist: 5, speed: 20, dmg: 900, w: 0.9, color: 0xffe84a, end: P({ shape: 'orb', color: 0xffe84a, size: 0.6, speed: 18, range: 6, dmg: 1100, w: 0.5, explode: { r: 1.6, dmg: 500 } }), sfx: 'slashBig' }),
    gadgets: [
      P({ name: 'Burning Attack', desc: 'Schnelle Handzeichen, dann eine explodierende Ki-Kugel.', shape: 'orb', color: 0xffe84a, speed: 16, range: 7, dmg: 800, w: 0.35, explode: { r: 1.5, dmg: 400 }, anim: 'seal', sfx: 'ki' }),
      BUF({ name: 'Zeitmaschine', desc: 'Kurz unverwundbar (0,8 s) und +20 % Tempo.', buff: { invuln: 0.8, speed: 0.2, t: 2, color: 0xffe84a }, sfx: 'teleport' }),
    ],
    starPowers: [
      { name: 'Hoffnung', desc: 'Unter 30 % LP: +25 % Tempo.', type: 'lowHpSpeed', below: 0.3, mult: 0.25 },
      { name: 'Klingenmeister', desc: '+10 % Schaden.', type: 'stat', dmg: 1.1 },
    ],
    trans: {
      name: 'Super Saiyajin Rage', duration: 15, aura: 0x6ad8ff, aura2: 0xffe84a, auraStyle: 'flame', auraIntensity: 1.3,
      desc: 'Zorn und Hoffnung vereint: Goldenes Haar mit blauen Funken. Schwerthiebe werden zu Energiewellen.',
      look: { hair: { style: 'ssj', color: 0xffe06a }, eyes: { type: 'sharp', color: 0x2a9adf }, browColor: 0xd8b84a, angry: true, weapon: { type: 'katana', color: 0xbfefff, emissive: 0x3a8aff } },
      stats: { dmg: 1.2, speed: 1.12, reload: 0.8 },
      main: P({ name: 'Energieklingen-Welle', desc: 'Zwei überkreuzte Schwertwellen.', shape: 'slash', color: 0x6ad8ff, count: 2, spread: 14, speed: 16, range: 7, dmg: 520, w: 0.45, pierce: true, anim: 'slash', sfx: 'slash' }),
      super: MULTI([
        A({ self: true, r: 2.2, landDelay: 0.3, dmg: 900, fx: 'pillar', color: 0x6ad8ff, effects: knock(1) }),
        P({ shape: 'wave', color: 0x6ad8ff, color2: 0xffffff, size: 1.4, speed: 16, range: 12, dmg: 2200, w: 1.1, pierce: true, pierceWalls: true, breakWalls: true, effects: knock(2), delay: 0.55 }),
      ], { name: 'Schwert der Hoffnung', desc: 'Sammelt die Energie aller Erdlinge und spaltet die Arena mit einer riesigen Klingenwelle.', anim: 'overhead', animDur: 0.9, sfx: 'slashBig' }),
      onEnter: N({ r: 3, dmg: 300, color: 0x6ad8ff, effects: knock(1.8) }),
    },
  },

  // 18 ─ CELL ─────────────────────────────────────────────────────────────────
  {
    id: 'cell', name: 'Cell', anime: 'db', rarity: 'epic', role: 'Absorbierer',
    desc: 'Biologische Waffe aus den Zellen der stärksten Kämpfer. Absorbiert, regeneriert, kopiert.',
    playstyle: 'Der Schwanzstich stiehlt Leben. Perfect Cell regeneriert so stark, dass er Kämpfe aussitzen kann — und überlebt einmal den Tod.',
    stats: { hp: 4900, speed: 3.25, reload: 1.35, ammo: 3, superHits: 4 },
    sfx: 'squish', victory: 'laugh',
    passive: [{ type: 'lifesteal', f: 0.2 }],
    look: { skin: 0x7ac06a, hair: { style: 'none' }, eyes: { color: 0xc81830, type: 'sharp' }, marks: ['cellSpots'], noBlush: true, extras: ['crest', 'wings', 'tail', 'noEars'], wingColor: 0x2a2a1a, tailColor: 0x5a9a4a, top: { type: 'armor', color: 0x2a6a3a }, bottom: { type: 'pants', color: 0x2a6a3a }, build: 'muscle', mouth: 'smirk', brows: false },
    main: C({ name: 'Absorptionsstich', desc: 'Der Schwanzstachel durchbohrt das Ziel und saugt 20 % als Leben ab.', range: 2.2, arc: 50, dmg: 760, lunge: 0.3, color: 0x7aff5a, anim: 'punch', sfx: 'squish' }),
    super: BM({ name: 'Solar-Kamehameha (Imperfekt)', desc: 'Ein kopierter Kamehameha mit Zellen-Energie.', range: 10, w: 0.62, dmg: 260, ticks: 8, gap: 0.09, charge: 0.4, color: 0x4ac8ff, color2: 0xffffff, effects: knock(2), anim: 'kame', animDur: 1.2, sfx: 'kamehameha' }),
    gadgets: [
      { kind: 'nova', name: 'Solar Flare', desc: 'Blendet alle Gegner im Umkreis (1,2 s verwirrt).', r: 3.5, dmg: 100, color: 0xffffff, effects: stun(1.2), anim: 'raise', sfx: 'flash' },
      BUF({ name: 'Zellregeneration', desc: 'Heilt 25 % der LP.', buff: { healPct: 0.25, color: 0x7aff5a }, sfx: 'heal' }),
    ],
    starPowers: [
      { name: 'Saiyajin-Zellen', desc: 'Jedes Mal, wenn Cell fast stirbt, stärkt er sich: +15 % Schaden unter 50 %.', type: 'lowHpDmg', below: 0.5, mult: 1.15 },
      { name: 'Namekianische Zellen', desc: 'Regeneriert ständig 80 LP/s.', type: 'regen', amt: 80, delay: 0 },
    ],
    trans: {
      name: 'Perfect Cell', duration: 16, aura: 0xffe84a, aura2: 0x7aff5a, auraStyle: 'spark',
      desc: 'Die perfekte Form. Gewaltige Regeneration, Cell Juniors als Super — und er übersteht einmal den Tod durch seinen Kern.',
      look: { skin: 0xd8e8c8, top: { type: 'armor', color: 0x3a8a4a }, marks: ['cellSpots'], eyes: { type: 'sharp', color: 0xb83aa8 }, build: 'tall', crestColor: 0x3a8a4a },
      stats: { hp: 1.2, dmg: 1.2, speed: 1.08 },
      passive: [{ type: 'regen', amt: 260, delay: 0 }, { type: 'reviveOnce', hp: 0.4 }],
      main: P({ name: 'Perfektes Ki', desc: 'Zwei Kugeln, die den Gegner verfolgen.', shape: 'orb', color: 0xffe84a, color2: 0xffffff, count: 2, spread: 18, speed: 15, range: 8, dmg: 560, w: 0.3, homing: 2.5, anim: 'cast', sfx: 'ki' }),
      super: SUM({ name: 'Cell Juniors', desc: 'Drei Cell Juniors stürzen sich 9 s lang auf Gegner.', count: 3, unit: { name: 'Cell Jr.', hp: 1300, life: 9, speed: 4.4, rate: 0.6, color: 0x5aa8ff, look: { skin: 0x5aa8ff, build: 'small', hair: { style: 'none' }, extras: ['crest', 'noEars'], crestColor: 0x2a6aa8, eyes: { type: 'blank' }, mouth: 'grin', top: { type: 'armor', color: 0x2a6aa8 }, bottom: { type: 'pants', color: 0x2a6aa8 }, scale: 0.8 }, attack: C({ range: 1.2, arc: 90, dmg: 450, color: 0x5aa8ff }) }, sfx: 'laugh' }),
      onEnter: N({ r: 3, dmg: 300, color: 0xffe84a, effects: knock(1.8) }),
    },
  },

  // 19 ─ MAJIN BUU ────────────────────────────────────────────────────────────
  {
    id: 'buu', name: 'Majin Buu', anime: 'db', rarity: 'super_rare', role: 'Panzer',
    desc: 'Gummiartiger, kindlicher Dämon. Verwandelt Gegner in Süßigkeiten und regeneriert aus jedem Fetzen.',
    playstyle: 'Der dicke Buu steckt alles ein und betäubt mit dem Süßigkeiten-Strahl. Kid Buu ist klein, rasend schnell und unberechenbar.',
    stats: { hp: 7000, speed: 2.95, reload: 1.5, ammo: 3, superHits: 4 },
    sfx: 'rubber', victory: 'laugh',
    passive: [{ type: 'regen', amt: 160, delay: 1 }],
    look: { skin: SKIN.pink, hair: { style: 'majin' }, eyes: { color: 0x1a1a1a, type: 'dots' }, marks: ['buuMarks'], mouth: 'grin', noBlush: true, extras: ['cape', 'noEars'], capeColor: 0x6a3aa8, top: { type: 'vest', color: 0x3a2a5a }, bottom: { type: 'hakama', color: 0xf2f2f4 }, build: 'chubby', gloves: 0xf2f2f4, shoes: 0xf2d24a, brows: false },
    main: BM({ name: 'Süßigkeiten-Strahl', desc: 'Antennenstrahl: Verwandelt das Ziel kurz in eine Süßigkeit (0,4 s betäubt).', range: 6.5, w: 0.25, dmg: 640, ticks: 1, color: 0xff7ac8, color2: 0xffffff, effects: stun(0.4), anim: 'point', animDur: 0.35, sfx: 'candy' }),
    super: D({ name: 'Bauch-Bounce', desc: 'Rollt als Gummiball los und schleudert alle Getroffenen weg.', dist: 6, speed: 15, dmg: 1300, w: 1.0, color: 0xff7ac8, effects: knock(2.6), end: N({ r: 2.2, dmg: 600, color: 0xff7ac8, effects: knock(1.5) }), anim: 'spin', sfx: 'rubber' }),
    gadgets: [
      BUF({ name: 'Gummikörper', desc: '35 % Schadensreduktion für 3 s.', buff: { dr: 0.35, t: 3, color: 0xff7ac8 }, sfx: 'rubber' }),
      BUF({ name: 'Schokolade!', desc: 'Isst eine Süßigkeit und heilt 1800 LP.', buff: { heal: 1800, color: 0xff7ac8 }, sfx: 'heal' }),
    ],
    starPowers: [
      { name: 'Unzerstörbar', desc: 'Überlebt einmal pro Leben einen tödlichen Treffer mit 30 % LP.', type: 'reviveOnce', hp: 0.3 },
      { name: 'Süßer Zahn', desc: 'Betäubung des Hauptangriffs +0,2 s.', type: 'onHitEffect', effects: stun(0.2), kinds: ['main'] },
    ],
    trans: {
      name: 'Kid Buu', duration: 15, aura: 0xff7ac8, aura2: 0xffffff, auraStyle: 'spark',
      desc: 'Die ursprüngliche, chaotische Form: klein, irrsinnig schnell und gnadenlos — sprengt Planeten aus Spaß.',
      look: { build: 'small', hair: { style: 'kidbuu' }, top: { type: 'bare' }, eyes: { type: 'demon', color: 0x1a1a1a }, mouth: 'fangs', extrasRemove: ['cape'], skin: 0xff9ad0 },
      stats: { hp: 0.8, speed: 1.35, dmg: 1.25, reload: 0.7 },
      passive: [{ type: 'regen', amt: 300, delay: 0 }, { type: 'dodge', chance: 0.15 }],
      main: P({ name: 'Wilder Ki-Hagel', desc: 'Vier chaotische Ki-Kugeln.', shape: 'orb', color: 0xff7ac8, color2: 0xffffff, count: 4, spread: 40, speed: 16, range: 6.5, dmg: 340, w: 0.26, anim: 'flurry', sfx: 'ki' }),
      super: A({ name: 'Planetensprenger', desc: 'Eine riesige Ki-Kugel fällt ins Ziel und hinterlässt ein brennendes Feld.', range: 9, r: 3.2, dmg: 2300, landDelay: 0.9, lob: true, shape: 'orb', size: 1.0, color: 0xff7ac8, color2: 0xffffff, breakWalls: true, effects: knock(2), linger: { t: 3, tick: 0.5, dmg: 200, color: 0xff7ac8 }, anim: 'raise', sfx: 'kiBig' }),
      onEnter: N({ r: 3, dmg: 400, color: 0xff7ac8, effects: knock(2) }),
    },
  },

  // 20 ─ BEERUS ───────────────────────────────────────────────────────────────
  {
    id: 'beerus', name: 'Beerus', anime: 'db', rarity: 'divine', role: 'Zerstörer',
    desc: 'Gott der Zerstörung. Launisch, verschlafen — und fähig, alles mit einem Wort auszulöschen.',
    playstyle: 'Hakai löscht geschwächte Gegner sofort aus. Setze Zerstörungskugeln ein, um Gegner unter 40 % LP zu bringen, dann richte sie hin.',
    stats: { hp: 4300, speed: 3.35, reload: 1.4, ammo: 3, superHits: 5 },
    sfx: 'dark', victory: 'armsCrossed',
    look: { skin: 0x8a6ac8, hair: { style: 'none' }, eyes: { color: 0xf2d24a, type: 'slit' }, mouth: 'flat', noBlush: true, extras: ['catEars', 'tail', 'earrings', 'noEars'], tailColor: 0x8a6ac8, top: { type: 'vest', color: 0x1a1a2a, color2: 0xf2d24a }, bottom: { type: 'hakama', color: 0xf2f2f4 }, shoes: 0xf2d24a, build: 'slim', brows: false },
    main: P({ name: 'Zerstörungskugel', desc: 'Kleine violette Kugel, die bei Kontakt implodiert.', shape: 'void', color: 0xb04cff, size: 0.35, speed: 15, range: 7.5, dmg: 780, w: 0.3, explode: { r: 1.0, dmg: 260 }, anim: 'point', sfx: 'dark' }),
    super: P({ name: 'Hakai', desc: 'Zerstörungsenergie: Ziele unter 40 % LP werden sofort ausgelöscht. Sonst massiver Schaden.', shape: 'void', color: 0xd04cff, size: 0.55, speed: 22, range: 9, dmg: 1800, w: 0.45, pierce: true, effects: { execute: 0.4 }, anim: 'point', animDur: 0.5, sfx: 'hakai' }),
    gadgets: [
      { kind: 'nova', name: 'Gähnen', desc: 'Ein fauler Klaps: stößt nahe Gegner zurück.', r: 2.2, dmg: 600, color: 0xb04cff, effects: knock(2.4), anim: 'point', sfx: 'whoosh' },
      BUF({ name: 'Göttlicher Schlaf', desc: '1 s unverwundbar, dann +25 % Schaden für 3 s.', buff: { invuln: 1, dmg: 0.25, t: 3, color: 0xb04cff }, sfx: 'powerup' }),
    ],
    starPowers: [
      { name: 'Zerstörer', desc: 'Hakai-Schwelle steigt auf 50 % LP.', type: 'executeBoost', add: 0.1 },
      { name: 'Gourmet', desc: 'Jeder Kill heilt 30 %.', type: 'killHeal', f: 0.3 },
    ],
    trans: {
      name: 'Gott der Zerstörung (Volle Kraft)', duration: 14, aura: 0xb04cff, aura2: 0xff4ab8, auraIntensity: 1.6,
      desc: 'Ohne Zurückhaltung: Jede Berührung ist Hakai. Die Super wird zur Kugel der Zerstörung, die alles in ihrem Weg auslöscht.',
      look: { eyes: { type: 'glow', color: 0xffe84a }, glow: 0xb04cff, mouth: 'fangs' },
      stats: { dmg: 1.3, speed: 1.12, reload: 0.75 },
      passive: [{ type: 'executeBoost', add: 0.1 }],
      main: P({ name: 'Hakai-Schnipser', desc: 'Drei Zerstörungsfunken; jeder richtet Ziele unter 20 % LP hin.', shape: 'void', color: 0xd04cff, size: 0.3, count: 3, spread: 16, speed: 18, range: 8, dmg: 480, w: 0.28, effects: { execute: 0.2 }, anim: 'point', sfx: 'dark' }),
      super: P({ name: 'Sphere of Destruction', desc: 'Eine gewaltige Zerstörungskugel, die Wände und Gegner auslöscht.', shape: 'void', color: 0xd04cff, size: 1.4, speed: 6.5, range: 12, dmg: 2600, w: 1.3, pierce: true, pierceWalls: true, breakWalls: true, effects: { execute: 0.5 }, anim: 'raise', animDur: 0.6, sfx: 'hakai' }),
      onEnter: N({ r: 3.8, dmg: 600, color: 0xb04cff, effects: knock(2.6) }),
    },
  },
];

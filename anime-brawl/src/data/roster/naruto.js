import { P, C, D, BM, A, N, DOM, SUM, BUF, BL, WALL, HOOK, TRAP, SEQ, MULTI, CU, slow, stun, knock, pull, burn, fx, SKIN } from './helpers.js';

const AKATSUKI = { type: 'cloak', color: 0x14141c, color2: 0xc8202a, pattern: 'akatsuki', collar: true, sleeves: 'wide' };
const FLAK = { type: 'vest', color: 0x4a5a3a, collar: true, collarColor: 0x4a5a3a, under: 0x2c3550 };

export default [
  // 21 ─ NARUTO ───────────────────────────────────────────────────────────────
  {
    id: 'naruto', name: 'Naruto Uzumaki', anime: 'naruto', rarity: 'legendary', role: 'Allrounder',
    desc: 'Siebter Hokage. Schattendoppelgänger, Rasengan — und zwei Verwandlungen: Sage Mode, dann Baryon Mode.',
    playstyle: 'Rasengan im Nahkampf, Doppelgänger als Super. Baryon Mode verbrennt sein Leben, um das des Gegners noch schneller zu verbrennen.',
    stats: { hp: 4700, speed: 3.4, reload: 1.25, ammo: 3, superHits: 4 },
    sfx: 'wind', victory: 'peace',
    look: { skin: SKIN.fair, hair: { style: 'naruto', color: 0xffd23a }, eyes: { color: 0x2a7aff }, marks: ['whiskers'], mouth: 'grin', top: { type: 'jacket', color: 0xff7a1a, color2: 0x1a1a1a, collar: true, sleeves: 'long' }, bottom: { type: 'pants', color: 0xff7a1a }, extras: ['headband'], build: 'normal' },
    main: P({ name: 'Rasengan', desc: 'Kurzreichweitige Chakra-Spirale, die beim Aufprall explodiert und zurückstößt.', shape: 'orb', color: 0x5ac8ff, color2: 0xffffff, size: 0.42, speed: 12, range: 3.6, dmg: 900, w: 0.42, explode: { r: 1.1, dmg: 250, effects: knock(1.2) }, anim: 'punch', sfx: 'wind' }),
    super: SUM({ name: 'Schattendoppelgänger', desc: 'Drei Doppelgänger kämpfen 8 s mit Rasengan.', count: 3, unit: { name: 'Doppelgänger', hp: 1300, life: 8, speed: 3.9, rate: 0.9, look: 'owner', color: 0xffffff, attack: P({ shape: 'orb', color: 0x5ac8ff, color2: 0xffffff, speed: 12, range: 2.8, dmg: 420, w: 0.35, explode: { r: 0.8, dmg: 150 }, anim: 'punch' }) }, anim: 'seal', sfx: 'poof' }),
    gadgets: [
      HOOK({ name: 'Doppelgänger-Wurf', desc: 'Ein Klon schleudert Naruto zum Gegner.', selfPull: true, shape: 'fist', color: 0xffd23a, speed: 18, range: 7, dmg: 500, w: 0.35, sfx: 'poof' }),
      BUF({ name: 'Kurama-Chakra', desc: 'Heilt 1000 LP und +20 % Tempo für 3 s.', buff: { heal: 1000, speed: 0.2, t: 3, color: 0xff7a1a }, sfx: 'heal' }),
    ],
    starPowers: [
      { name: 'Hartnäckig', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
      { name: 'Uzumaki-Chakra', desc: 'Doppelgänger leben 3 s länger.', type: 'summonBoost', life: 3, hp: 1.1 },
    ],
    trans: {
      name: 'Sage Mode', duration: 15, aura: 0xffb84a, aura2: 0xfff0a0,
      desc: 'Naturenergie: orange Augenschatten, Krötenaugen. Sein Hauptangriff wird zum Rasenshuriken — die Anzeige lädt weiter für Baryon Mode.',
      look: { eyes: { type: 'slit', color: 0xffc83a }, marksAdd: ['tearLines'], extrasAdd: ['cape'], capeColor: 0xc8202a },
      stats: { dmg: 1.2, reload: 0.85, speed: 1.05 },
      main: P({ name: 'Rasenshuriken', desc: 'Ein Windstern, der fliegt und in einem Feld aus Klingen explodiert.', shape: 'blade', color: 0xbfefff, size: 0.6, speed: 13, range: 8, dmg: 700, w: 0.45, explode: { r: 1.8, dmg: 500 }, onEnd: A({ r: 1.8, landDelay: 0, dmg: 0, fx: 'ring', color: 0xbfefff, useTarget: true, linger: { t: 1.5, tick: 0.25, dmg: 140, color: 0xbfefff } }), anim: 'throw', sfx: 'wind' }),
      super: SUM({ name: 'Weise Doppelgänger', desc: 'Vier Sage-Doppelgänger mit Rasenshuriken.', count: 4, unit: { name: 'Sage-Klon', hp: 1500, life: 9, speed: 4, rate: 1.1, look: 'owner', color: 0xffb84a, attack: P({ shape: 'blade', color: 0xbfefff, speed: 13, range: 6, dmg: 450, w: 0.4, explode: { r: 1.2, dmg: 250 } }) }, anim: 'seal', sfx: 'poof' }),
      onEnter: N({ r: 3, dmg: 300, color: 0xffb84a, effects: knock(1.8) }),
      next: {
        name: 'Baryon Mode', duration: 12, aura: 0xff5a8a, aura2: 0xffd0e0, auraStyle: 'flame', auraIntensity: 1.6,
        desc: 'Kernfusion mit Kurama: Jeder Treffer verbrennt die Lebenskraft des Gegners (Brandschaden), doch die Form kostet 2 % LP pro Sekunde.',
        look: { hair: { style: 'naruto', color: 0xffd23a }, eyes: { type: 'slit', color: 0xff5a8a }, top: { type: 'cloak', color: 0xffd23a, color2: 0x1a1a1a, sleeves: 'long', collar: true }, bottom: { type: 'pants', color: 0x1a1a1a }, glow: 0xff5a8a, extrasAdd: ['hornsBack'], hornColor: 0xff5a8a },
        stats: { dmg: 1.35, speed: 1.3, reload: 0.65 },
        passive: [{ type: 'drain', perSec: 0.02 }, { type: 'onHitEffect', effects: burn(500, 2), kinds: ['main', 'super'] }, { type: 'lifesteal', f: 0.1 }],
        main: C({ name: 'Baryon-Schläge', desc: 'Drei Schläge, die Lebenskraft verbrennen.', range: 2.0, arc: 100, dmg: 520, hits: 3, gap: 0.09, lunge: 1.2, color: 0xff5a8a, anim: 'flurry', sfx: 'punch' }),
        super: D({ name: 'Baryon-Ansturm', desc: 'Rast durch die Gegner und lässt eine Fusionsexplosion zurück.', dist: 7, speed: 26, dmg: 1500, w: 1.0, color: 0xff5a8a, invuln: true, end: N({ r: 3, dmg: 1400, color: 0xff5a8a, effects: fx(knock(2), burn(600, 3)) }), sfx: 'dash' }),
        onEnter: N({ r: 3.4, dmg: 500, color: 0xff5a8a, effects: knock(2.2) }),
      },
    },
  },

  // 22 ─ SASUKE ───────────────────────────────────────────────────────────────
  {
    id: 'sasuke', name: 'Sasuke Uchiha', anime: 'naruto', rarity: 'legendary', role: 'Assassine',
    desc: 'Der letzte Uchiha. Chidori, Amaterasu, Susanoo — Eternal Mangekyo Sharingan, dann das Rinnegan.',
    playstyle: 'Chidori-Dashes und Schwerthiebe. Mit dem Rinnegan tauscht Amenotejikara sofort Positionen — perfekt, um Gegner aus der Deckung zu reißen.',
    stats: { hp: 4200, speed: 3.45, reload: 1.25, ammo: 3, superHits: 4 },
    sfx: 'electric', victory: 'swordUp',
    look: { skin: SKIN.light, hair: { style: 'sasuke', color: 0x16162a }, eyes: { type: 'sharingan', color: 0xc8202a }, mouth: 'flat', top: { type: 'kimono', color: 0xf2f2f4, color2: 0x6a3aa8, sleeves: 'long' }, bottom: { type: 'pants', color: 0x2a2a3a }, weapon: { type: 'katana' }, extras: ['headband'], headbandColor: 0x1a1a1a, build: 'slim' },
    main: C({ name: 'Chidori-Klinge', desc: 'Schwerthieb mit Blitzentladung, verlangsamt.', range: 2.1, arc: 90, dmg: 780, color: 0x8ad8ff, effects: slow(0.8, 0.3), anim: 'slash', sfx: 'electric' }),
    super: D({ name: 'Chidori', desc: 'Blitzschneller Stoß, der durch den Gegner bricht und ihn lähmt.', dist: 6, speed: 26, dmg: 1800, w: 0.8, color: 0x8ad8ff, stopOnHit: true, effects: stun(0.8), anim: 'punch', sfx: 'chidori' }),
    gadgets: [
      P({ name: 'Feuerball-Jutsu', desc: 'Große Feuerkugel, die brennt.', shape: 'orb', color: 0xff6a1a, color2: 0xffe08a, size: 0.55, speed: 12, range: 7, dmg: 700, w: 0.5, effects: burn(300, 2), anim: 'seal', sfx: 'fire' }),
      BL({ name: 'Körperflimmern', desc: 'Kurzer Teleport in Zielrichtung.', dist: 'aim', maxDist: 4.5, color: 0x8ad8ff, sfx: 'teleport' }),
    ],
    starPowers: [
      { name: 'Sharingan', desc: '15 % Chance, Angriffen vorauszusehen und auszuweichen.', type: 'dodge', chance: 0.15 },
      { name: 'Kirin-Erbe', desc: 'Chidori-Super verursacht 20 % mehr Schaden.', type: 'superDmg', mult: 1.2 },
    ],
    trans: {
      name: 'Eternal Mangekyo Sharingan', duration: 15, aura: 0x6a3aa8, aura2: 0x1a1a1a,
      desc: 'Das ewige Mangekyo: Amaterasu setzt Gegner in schwarze Flammen, Susanoo spannt den Bogen — die Anzeige lädt weiter fürs Rinnegan.',
      look: { eyes: { type: 'emangekyo', color: 0xc8202a }, top: { type: 'kimono', color: 0x2a2a3a, color2: 0x6a3aa8 }, extrasAdd: ['cape'], capeColor: 0x2a2a3a },
      stats: { dmg: 1.2, reload: 0.85 },
      main: P({ name: 'Amaterasu', desc: 'Schwarze Flammen, die nicht erlöschen: starker Brandschaden.', shape: 'orb', color: 0x1a0a1a, color2: 0x8a2aa8, trailColor: 0x2a0a2a, speed: 15, range: 7.5, dmg: 520, w: 0.35, effects: burn(500, 3), anim: 'point', sfx: 'dark' }),
      super: P({ name: 'Susanoo: Pfeil', desc: 'Ein riesiger Chakra-Pfeil durchschlägt Wände und Gegner.', shape: 'spike', color: 0x9a5aff, color2: 0xffffff, size: 0.9, speed: 26, range: 13, dmg: 2400, w: 0.6, pierce: true, pierceWalls: true, breakWalls: true, effects: knock(2), anim: 'point', animDur: 0.6, sfx: 'beamBig', delay: 0.3 }),
      onEnter: N({ r: 3, dmg: 300, color: 0x9a5aff, effects: knock(1.8) }),
      next: {
        name: 'Rinnegan', duration: 14, aura: 0x9a5aff, aura2: 0xffffff, auraIntensity: 1.4,
        desc: 'Das Rinnegan im linken Auge: Amenotejikara tauscht Positionen ohne Verzögerung. Indra\'s Arrow als Super.',
        look: { eyes: { type: 'rinnegan', color: 0xb89aff }, glow: 0x9a5aff, top: { type: 'cloak', color: 0x2a2a3a, sleeves: 'wide' } },
        stats: { dmg: 1.3, reload: 0.75, speed: 1.12 },
        main: CU('amenotejikara', { name: 'Amenotejikara + Klinge', desc: 'Tauscht sofort die Position mit dem anvisierten Gegner (max. 6 Felder) und schlägt zu. Ohne Ziel: Blitzklinge.', range: 6, dmg: 720, anim: 'slash', sfx: 'teleport' }),
        super: BM({ name: 'Indra\'s Arrow', desc: 'Der stärkste Chidori: ein Susanoo-Pfeil aus Blitz, durch die ganze Arena.', range: 16, w: 0.8, dmg: 900, ticks: 4, gap: 0.08, charge: 0.6, color: 0x9a5aff, color2: 0xbfefff, pierceWalls: true, breakWalls: true, effects: knock(2.5), anim: 'point', animDur: 1.2, sfx: 'thunderBig' }),
        onEnter: N({ r: 3.4, dmg: 500, color: 0x9a5aff, effects: knock(2.2) }),
      },
    },
  },

  // 23 ─ MADARA ───────────────────────────────────────────────────────────────
  {
    id: 'madara', name: 'Madara Uchiha', anime: 'naruto', rarity: 'divine', role: 'Zerstörer',
    desc: 'Legendärer Uchiha und Mitbegründer Konohas. Bringt Meteore vom Himmel.',
    playstyle: 'Feuerwellen im weiten Bogen. Die Super lässt einen Meteor fallen — Six Paths verwandelt ihn in einen schwebenden Gott mit Wahrheitssuchenden Kugeln.',
    stats: { hp: 4600, speed: 3.3, reload: 1.45, ammo: 3, superHits: 5 },
    sfx: 'fire', victory: 'armsCrossed',
    look: { skin: SKIN.light, hair: { style: 'madara', color: 0x14141c }, eyes: { type: 'emangekyo', color: 0xc8202a }, mouth: 'smirk', top: { type: 'robe', color: 0x2a2a3a, sleeves: 'long' }, bottom: { type: 'pants', color: 0x2a2a3a }, extras: ['shoulderPads', 'armorPlates'], armorColor: 0xa3242a, weapon: { type: 'gunbai', color: 0xd8d0b8 }, build: 'tall' },
    main: P({ name: 'Große Feuerauslöschung', desc: 'Eine Wand aus fünf Flammenkugeln im weiten Bogen.', shape: 'orb', color: 0xff6a1a, color2: 0xffe08a, count: 5, spread: 50, speed: 12, range: 6, dmg: 300, w: 0.36, effects: burn(150, 1.5), anim: 'seal', sfx: 'fire' }),
    super: A({ name: 'Tengai Shinsei', desc: 'Ein Meteor stürzt vom Himmel: riesiger Schaden und zerstört Wände.', range: 9, r: 3.2, dmg: 2800, landDelay: 1.1, lob: true, arcH: 8, shape: 'rock', size: 1.2, color: 0x8a6a5a, color2: 0xffa040, breakWalls: true, effects: knock(2.4), anim: 'raise', sfx: 'meteor' }),
    gadgets: [
      { kind: 'nova', name: 'Uchiha-Gegenschlag', desc: 'Der Gunbai wirft Angriffe zurück: stößt Gegner weg und schützt.', r: 2.4, dmg: 500, color: 0xd8d0b8, effects: knock(2.4), selfBuff: { dr: 0.5, t: 1.5, fx: false }, anim: 'slash', sfx: 'whoosh' },
      SUM({ name: 'Holzklon', desc: 'Ein Holzklon täuscht 5 s die Gegner.', unit: { name: 'Holzklon', hp: 1500, life: 5, speed: 3.3, rate: 1, look: 'owner', color: 0x8a6a3a, attack: C({ range: 1.5, arc: 90, dmg: 400 }) }, sfx: 'wood' }),
    ],
    starPowers: [
      { name: 'Ewiges Mangekyo', desc: '+12 % Schaden.', type: 'stat', dmg: 1.12 },
      { name: 'Zweiter Meteor', desc: 'Die Super lässt einen kleineren zweiten Meteor folgen.', type: 'superEcho', delay: 1.0, mult: 0.5 },
    ],
    trans: {
      name: 'Six Paths Madara', duration: 15, aura: 0xd8d0ff, aura2: 0x1a1a1a, auraIntensity: 1.2,
      desc: 'Jinchuriki des Zehnschwänzigen: weißes Haar, Rinnegan, sechs schwebende Wahrheitssuchende Kugeln. Doppelter Meteor als Super.',
      look: { hair: { style: 'madara', color: 0xf2f2f6 }, eyes: { type: 'rinnegan', color: 0xb89aff }, skin: 0xe8e2ea, top: { type: 'robe', color: 0xf2f2f6 }, bottom: { type: 'pants', color: 0xf2f2f6 }, extrasRemove: ['shoulderPads', 'armorPlates'], extrasAdd: ['truthOrbs', 'hornsBack'], hornColor: 0xf2f2f6, weapon: { type: 'staff', color: 0x1a1a1a, tip: 0x9a5aff } },
      stats: { dmg: 1.25, reload: 0.8, speed: 1.1 },
      passive: [{ type: 'damageReduce', f: 0.15 }],
      main: P({ name: 'Wahrheitssuchende Kugeln', desc: 'Drei schwarze Kugeln, die Gegner verfolgen und Heilung verhindern.', shape: 'void', color: 0x9a5aff, size: 0.3, count: 3, spread: 24, speed: 14, range: 8, dmg: 480, w: 0.3, homing: 3, effects: { noHeal: 2 }, anim: 'cast', sfx: 'dark' }),
      super: SEQ([
        { at: 0, do: A({ range: 9, r: 3.2, dmg: 2400, landDelay: 1.0, lob: true, arcH: 8, shape: 'rock', size: 1.2, color: 0x8a6a5a, breakWalls: true, effects: knock(2) }) },
        { at: 0.6, do: A({ range: 9, r: 3.6, dmg: 2400, landDelay: 1.0, lob: true, arcH: 9, shape: 'rock', size: 1.5, color: 0x6a5a4a, breakWalls: true, effects: stun(1), useTarget: false }) },
      ], { name: 'Tengai Shinsei: Doppelmeteor', desc: 'Zwei gigantische Meteore, der zweite noch größer.', anim: 'raise', sfx: 'meteor' }),
      onEnter: N({ r: 3.6, dmg: 500, color: 0xd8d0ff, effects: knock(2.4) }),
    },
  },

  // 24 ─ OBITO ────────────────────────────────────────────────────────────────
  {
    id: 'obito', name: 'Obito Uchiha', anime: 'naruto', rarity: 'mythic', role: 'Geist',
    desc: 'Kamui macht ihn unberührbar: Angriffe gleiten durch ihn hindurch in eine andere Dimension.',
    playstyle: '25 % aller Geschosse gehen durch ihn hindurch. Die Super macht ihn kurz unangreifbar und versetzt ihn an einen neuen Ort.',
    stats: { hp: 4100, speed: 3.35, reload: 1.35, ammo: 3, superHits: 4 },
    sfx: 'space', victory: 'armsCrossed',
    passive: [{ type: 'intangible', chance: 0.25 }],
    look: { skin: SKIN.light, hair: { style: 'obito', color: 0x14141c }, eyes: { type: 'mangekyo', color: 0xc8202a }, marks: ['scarEye'], mouth: 'flat', top: { type: 'robe', color: 0x2a2a3a, sleeves: 'long' }, bottom: { type: 'pants', color: 0x2a2a3a }, build: 'normal' },
    main: P({ name: 'Kamui-Shuriken', desc: 'Zwei Shuriken, die aus einer Raumverzerrung erscheinen.', shape: 'shuriken', color: 0xb8c0cc, count: 2, spread: 10, speed: 18, range: 7.5, dmg: 520, w: 0.28, anim: 'throw', sfx: 'kunai' }),
    super: MULTI([
      BUF({ buff: { untargetable: 2.2, speed: 0.5, t: 2.2, color: 0xc8202a } }),
      A({ self: true, r: 2.2, landDelay: 2.1, dmg: 1600, fx: 'ring', color: 0xc8202a, effects: pull(1.5), needsAlive: true }),
    ], { name: 'Kamui-Phase', desc: '2,2 s unangreifbar und schneller — beim Wiederauftauchen saugt eine Raumverzerrung Gegner an.', anim: 'seal', sfx: 'space' }),
    gadgets: [
      BL({ name: 'Kamui-Teleport', desc: 'Teleportiert bis zu 6 Felder, auch durch Wände.', dist: 'aim', maxDist: 6, color: 0xc8202a, sfx: 'space' }),
      HOOK({ name: 'Kettenfessel', desc: 'Ketten ziehen den Gegner heran.', shape: 'kunai', color: 0xb8c0cc, speed: 18, range: 6.5, dmg: 450, w: 0.3, effects: slow(1, 0.3), sfx: 'kunai' }),
    ],
    starPowers: [
      { name: 'Andere Dimension', desc: 'Durchlässigkeit steigt auf 35 %.', type: 'intangible', chance: 0.1 },
      { name: 'Masken-Mann', desc: '+15 % Tempo in Büschen.', type: 'bushSpeed', mult: 1.15 },
    ],
    trans: {
      name: 'Jinchuriki des Zehnschwänzigen', duration: 15, aura: 0xeeeef6, aura2: 0x1a1a1a,
      desc: 'Weißes Haar, Rinnegan und Sharingan, Wahrheitssuchende Kugeln. Die Super wird zur Bijudama.',
      look: { hair: { style: 'obito', color: 0xf2f2f6 }, eyes: { type: 'rinnegan', color: 0xb89aff }, top: { type: 'robe', color: 0xf2f2f6 }, bottom: { type: 'pants', color: 0x1a1a1a }, extrasAdd: ['truthOrbs'], weapon: { type: 'staff', color: 0x1a1a1a, tip: 0x1a1a1a } },
      stats: { hp: 1.15, dmg: 1.2, speed: 1.08 },
      passive: [{ type: 'intangible', chance: 0.15 }],
      main: C({ name: 'Shakujo-Schwung', desc: 'Der Stab aus Wahrheitssuchender Kugel trifft weit und verlangsamt.', range: 2.6, arc: 120, dmg: 820, color: 0x1a1a1a, effects: slow(1.2, 0.35), anim: 'slash', sfx: 'heavySlash' }),
      super: P({ name: 'Bijudama', desc: 'Eine gigantische Bijū-Kugel, die eine Kraterexplosion auslöst.', shape: 'void', color: 0x7a5aff, size: 1.2, speed: 10, range: 11, dmg: 1200, w: 1.0, breakWalls: true, explode: { r: 3.4, dmg: 2000, breakWalls: true, effects: knock(2.5) }, anim: 'raise', animDur: 0.6, sfx: 'kiBig', delay: 0.3 }),
      onEnter: N({ r: 3.4, dmg: 400, color: 0xeeeef6, effects: knock(2.2) }),
    },
  },

  // 25 ─ ITACHI ───────────────────────────────────────────────────────────────
  {
    id: 'itachi', name: 'Itachi Uchiha', anime: 'naruto', rarity: 'mythic', role: 'Kontrolleur',
    desc: 'Genie der Uchiha. Gen-Jutsu, Krähen und Susanoo mit dem Schwert der Versiegelung.',
    playstyle: 'Tsukuyomi betäubt einen Gegner sehr lange. In Susanoo wird Itachi zu einer gepanzerten Festung mit Totsuka-Klinge.',
    stats: { hp: 3900, speed: 3.35, reload: 1.3, ammo: 3, superHits: 4 },
    sfx: 'dark', victory: 'bow',
    look: { skin: SKIN.light, hair: { style: 'itachi', color: 0x14141c }, eyes: { type: 'mangekyo', color: 0xc8202a }, marks: ['tearLines'], mouth: 'flat', top: AKATSUKI, bottom: { type: 'pants', color: 0x1a1a2a }, extras: ['headband'], headbandColor: 0x1a1a1a, build: 'slim' },
    main: P({ name: 'Shuriken-Fächer', desc: 'Drei Shuriken in engem Fächer.', shape: 'shuriken', color: 0xb8c0cc, count: 3, spread: 18, speed: 19, range: 7, dmg: 380, w: 0.25, anim: 'throw', sfx: 'kunai' }),
    super: P({ name: 'Tsukuyomi', desc: 'Ein Blick genügt: Das erste getroffene Ziel ist 2,4 s in der Illusion gefangen.', shape: 'orb', color: 0xc8202a, color2: 0x1a0a0a, size: 0.4, speed: 24, range: 8, dmg: 900, w: 0.45, effects: stun(2.4), anim: 'point', sfx: 'genjutsu' }),
    gadgets: [
      SUM({ name: 'Krähenklon', desc: 'Ein Krähenschwarm in Itachis Gestalt lenkt Gegner ab.', unit: { name: 'Krähenklon', hp: 1000, life: 5, speed: 3.4, rate: 0.9, look: 'owner', color: 0x1a1a1a, explodeOnDeath: { r: 1.6, dmg: 500 }, attack: P({ shape: 'shuriken', speed: 18, range: 6, dmg: 260 }) }, sfx: 'crow' }),
      P({ name: 'Großer Feuerball', desc: 'Feuerkugel mit Brand.', shape: 'orb', color: 0xff6a1a, color2: 0xffe08a, size: 0.55, speed: 12, range: 7, dmg: 700, w: 0.5, effects: burn(300, 2), anim: 'seal', sfx: 'fire' }),
    ],
    starPowers: [
      { name: 'Genie', desc: 'Super lädt 20 % schneller.', type: 'stat', superRate: 1.2 },
      { name: 'Izanami', desc: 'Überlebt einmal einen tödlichen Treffer mit 25 % LP.', type: 'reviveOnce', hp: 0.25 },
    ],
    trans: {
      name: 'Susanoo', duration: 15, aura: 0xff5a3a, aura2: 0xffa07a, auraIntensity: 1.5,
      desc: 'Eine riesige rote Chakra-Rüstung umgibt Itachi: −35 % Schaden, Totsuka-Schwert versiegelt, Yata-Spiegel reflektiert.',
      look: { build: 'muscle', eyes: { type: 'emangekyo', color: 0xc8202a }, glow: 0xff5a3a, extrasAdd: ['wings'], wingColor: 0xff5a3a, weapon: { type: 'katana', color: 0xffa07a, emissive: 0xff5a3a, scale: 1.5 } },
      stats: { hp: 1.15, speed: 0.95, dmg: 1.2 },
      passive: [{ type: 'damageReduce', f: 0.35 }],
      main: C({ name: 'Totsuka-Klinge', desc: 'Gewaltiger Hieb mit dem Geisterschwert, versiegelt kurz (Stille).', range: 2.8, arc: 130, dmg: 1000, color: 0xff7a5a, effects: { silence: 1.5 }, anim: 'slash', sfx: 'heavySlash' }),
      super: MULTI([
        BUF({ buff: { dr: 0.9, t: 2, color: 0xff7a5a } }),
        N({ r: 3.2, dmg: 1600, color: 0xff7a5a, effects: knock(2.5), delay: 0.4 }),
      ], { name: 'Yata-Spiegel', desc: 'Der Spiegel blockt 2 s fast jeden Schaden und schleudert dann alles zurück.', anim: 'raise', sfx: 'shield' }),
      onEnter: N({ r: 3, dmg: 400, color: 0xff5a3a, effects: knock(2) }),
    },
  },

  // 26 ─ KAKASHI ──────────────────────────────────────────────────────────────
  {
    id: 'kakashi', name: 'Kakashi Hatake', anime: 'naruto', rarity: 'rare', role: 'Assassine',
    desc: 'Der kopierende Ninja. Raikiri spaltet sogar Blitze.',
    playstyle: 'Kunai auf Distanz, dann Raikiri. Mit doppeltem Mangekyo öffnet er Kamui-Verzerrungen mitten unter Gegnern.',
    stats: { hp: 4100, speed: 3.4, reload: 1.25, ammo: 3, superHits: 4 },
    sfx: 'electric', victory: 'peace',
    look: { skin: SKIN.light, hair: { style: 'kakashi', color: 0xd8dce4 }, eyes: { color: 0x2a2a2a }, marks: ['mask', 'scarEye'], maskColor: 0x2c3550, mouth: 'flat', top: FLAK, bottom: { type: 'pants', color: 0x2c3550 }, extras: ['headband'], weapon: { type: 'kunai' }, build: 'tall' },
    main: P({ name: 'Kunai-Doppelwurf', desc: 'Zwei Kunai kurz nacheinander.', shape: 'kunai', color: 0x9aa4b4, speed: 20, range: 7.5, dmg: 470, w: 0.24, burst: { n: 2, gap: 0.1 }, anim: 'throw', sfx: 'kunai' }),
    super: D({ name: 'Raikiri', desc: 'Der Blitzschnitt: rasender Stoß mit enormem Schaden.', dist: 6.5, speed: 30, dmg: 2100, w: 0.8, color: 0xbfefff, stopOnHit: true, effects: stun(0.5), anim: 'punch', sfx: 'chidori' }),
    gadgets: [
      SUM({ name: 'Ninja-Hunde', desc: 'Pakkun und die Hunde halten den Gegner fest.', count: 2, unit: { name: 'Ninken', hp: 800, life: 5, speed: 4.5, rate: 0.7, look: { rig: 'beast', color: 0x8a6a4a, color2: 0x4a3a2a, scale: 0.8 }, attack: C({ range: 1.1, arc: 90, dmg: 200, effects: { root: 0.6 } }) }, sfx: 'roar' }),
      BUF({ name: 'Kopierter Ninjutsu', desc: 'Lädt 50 % der Super.', buff: { superCharge: 0.5, color: 0xbfefff }, sfx: 'powerup' }),
    ],
    starPowers: [
      { name: 'Sharingan-Kopie', desc: '+15 % Super-Ladung.', type: 'stat', superRate: 1.15 },
      { name: 'Erfahrener Jonin', desc: '+10 % Tempo.', type: 'stat', speed: 1.1 },
    ],
    trans: {
      name: 'Doppeltes Mangekyo Sharingan', duration: 14, aura: 0x6a3aa8, aura2: 0xbfefff,
      desc: 'Obitos Geschenk: beide Augen mit Mangekyo. Kamui-Shuriken verzerren den Raum; die Super ist eine Kamui-Implosion.',
      look: { eyes: { type: 'mangekyo', color: 0xc8202a }, marksRemove: ['scarEye'], glow: 0x6a3aa8, extrasAdd: ['wings'], wingColor: 0x6a3aa8 },
      stats: { dmg: 1.2, speed: 1.12, reload: 0.85 },
      main: P({ name: 'Kamui-Shuriken', desc: 'Raumverzerrende Geschosse, die durch Wände fliegen.', shape: 'shuriken', color: 0x6a3aa8, count: 2, spread: 12, speed: 18, range: 8, dmg: 560, w: 0.3, pierceWalls: true, anim: 'throw', sfx: 'space' }),
      super: A({ name: 'Kamui', desc: 'Eine Raumverzerrung saugt alle Gegner ins Zentrum und zerquetscht sie.', range: 8, r: 2.6, dmg: 2000, landDelay: 0.6, fx: 'ring', color: 0x6a3aa8, effects: pull(2), linger: { t: 1.5, tick: 0.3, dmg: 200, pull: true, color: 0x6a3aa8 }, anim: 'point', sfx: 'space' }),
      onEnter: N({ r: 3, dmg: 300, color: 0x6a3aa8, effects: knock(1.8) }),
    },
  },

  // 27 ─ MINATO ───────────────────────────────────────────────────────────────
  {
    id: 'minato', name: 'Minato Namikaze', anime: 'naruto', rarity: 'epic', role: 'Teleporter',
    desc: 'Der Gelbe Blitz von Konoha. Seine Kunai sind Teleport-Markierungen.',
    playstyle: 'Jeder Hauptangriff setzt eine Markierung (max. 3). Die Super teleportiert dich zur neuesten Markierung mit einem Rasengan. Plane deine Wege voraus!',
    stats: { hp: 4000, speed: 3.5, reload: 1.3, ammo: 3, superHits: 3 },
    sfx: 'teleport', victory: 'peace',
    look: { skin: SKIN.fair, hair: { style: 'minato', color: 0xffe06a }, eyes: { color: 0x2a6adf }, mouth: 'smile', top: FLAK, bottom: { type: 'pants', color: 0x2c3550 }, extras: ['headband', 'captainHaori'], capeColor: 0xf2f2f4, weapon: { type: 'trikunai' }, build: 'tall' },
    main: CU('minatoKunai', { name: 'Fliegender-Donnergott-Kunai', desc: 'Wirft ein dreizackiges Kunai, das im Boden stecken bleibt und als Markierung dient.', dmg: 600, range: 7.5, anim: 'throw', sfx: 'kunai' }),
    super: CU('minatoFTG', { name: 'Hiraishin: Rasengan', desc: 'Teleportiert zur neuesten Markierung und entlädt ein Rasengan.', dmg: 1500, anim: 'punch', sfx: 'teleport' }),
    gadgets: [
      CU('minatoRecall', { name: 'Hiraishin-Ausweichen', desc: 'Springt sofort zur ältesten Markierung zurück.', anim: 'seal', sfx: 'teleport' }),
      BUF({ name: 'Gelber Blitz', desc: '+40 % Tempo für 3 s.', buff: { speed: 0.4, t: 3, color: 0xffe06a }, sfx: 'powerup' }),
    ],
    starPowers: [
      { name: 'Siegel-Meister', desc: 'Bis zu 5 Markierungen.', type: 'markerCap', n: 5 },
      { name: 'Vorausplanung', desc: 'Super lädt 15 % schneller.', type: 'stat', superRate: 1.15 },
    ],
    trans: {
      name: 'Kurama-Chakra-Modus', duration: 14, aura: 0xffc83a, aura2: 0xffffff, auraIntensity: 1.4,
      desc: 'Goldener Chakra-Mantel. Drei Kunai pro Wurf; die Super springt zu JEDER Markierung und entlädt überall ein Rasengan.',
      look: { skin: 0xffe9a0, top: { type: 'cloak', color: 0xffc83a, color2: 0x1a1a1a, sleeves: 'long' }, bottom: { type: 'pants', color: 0xffc83a }, eyes: { type: 'slit', color: 0xff7a1a }, glow: 0xffc83a, extrasRemove: ['captainHaori'] },
      stats: { speed: 1.15, dmg: 1.15, reload: 0.8 },
      passive: [{ type: 'markerCap', n: 6 }],
      main: CU('minatoKunai', { name: 'Kunai-Dreifachwurf', desc: 'Drei Markierungs-Kunai im Fächer.', dmg: 480, range: 8, count: 3, anim: 'throw', sfx: 'kunai' }),
      super: CU('minatoChain', { name: 'Hiraishin: Teleportkette', desc: 'Springt nacheinander zu allen Markierungen — an jeder explodiert ein Rasengan.', dmg: 1100, anim: 'punch', sfx: 'teleport' }),
      onEnter: N({ r: 3, dmg: 300, color: 0xffc83a, effects: knock(1.8) }),
    },
  },

  // 28 ─ PAIN ─────────────────────────────────────────────────────────────────
  {
    id: 'pain', name: 'Pain (Deva-Pfad)', anime: 'naruto', rarity: 'epic', role: 'Kontrolleur',
    desc: 'Gott der Akatsuki. Shinra Tensei stößt alles ab, Bansho Ten\'in zieht alles an.',
    playstyle: 'Kontrolliere Raum: Schleudere Gegner weg oder ziehe sie in deine Reichweite. Six Paths ruft weitere Pfade auf das Feld.',
    stats: { hp: 4300, speed: 3.2, reload: 1.4, ammo: 3, superHits: 4 },
    sfx: 'space', victory: 'armsCrossed',
    look: { skin: SKIN.light, hair: { style: 'pain', color: 0xff8a2a }, eyes: { type: 'rinnegan', color: 0xb89aff }, marks: ['piercings'], mouth: 'flat', top: AKATSUKI, bottom: { type: 'pants', color: 0x1a1a2a }, extras: ['rods'], build: 'normal' },
    main: P({ name: 'Chakra-Stab', desc: 'Schwarzer Stab, der durchschlägt und verlangsamt.', shape: 'spike', color: 0x2a2a3a, color2: 0x9a5aff, speed: 17, range: 8, dmg: 620, w: 0.28, pierce: true, effects: slow(1, 0.3), anim: 'throw', sfx: 'kunai' }),
    super: N({ name: 'Shinra Tensei', desc: 'Eine gewaltige Abstoßungswelle schleudert alles weit weg und zerstört Wände.', r: 3.8, dmg: 1500, color: 0xe8e8ff, color2: 0x9a5aff, breakWalls: true, effects: knock(4.5), anim: 'raise', sfx: 'shinra' }),
    gadgets: [
      HOOK({ name: 'Bansho Ten\'in', desc: 'Zieht den ersten Gegner in Reichweite unaufhaltsam heran.', shape: 'void', color: 0x9a5aff, speed: 22, range: 8, dmg: 300, w: 0.45, anim: 'point', sfx: 'space' }),
      BUF({ name: 'Preta-Pfad', desc: 'Absorbiert Chakra: 50 % Schadensreduktion für 2 s.', buff: { dr: 0.5, t: 2, color: 0x9a5aff }, sfx: 'shield' }),
    ],
    starPowers: [
      { name: 'Gott', desc: 'Shinra Tensei hat +0,8 Radius.', type: 'superRadius', add: 0.8 },
      { name: 'Rinnegan', desc: 'Hauptangriff +1 Feld Reichweite.', type: 'rangeBoost', add: 1 },
    ],
    trans: {
      name: 'Sechs Pfade des Pain', duration: 15, aura: 0x9a5aff, aura2: 0xff8a2a,
      desc: 'Asura- und Tiergeist-Pfad erscheinen an seiner Seite. Hauptangriff: Asura-Raketen. Super: Chibaku Tensei.',
      look: { glow: 0x9a5aff },
      stats: { dmg: 1.15, reload: 0.85 },
      onEnter: SUM({ count: 2, unit: { name: 'Asura-Pfad', hp: 2200, life: 15, speed: 3.4, rate: 1.1, follow: true, color: 0x9a5aff, look: { skin: SKIN.light, hair: { style: 'pain', color: 0xff8a2a }, eyes: { type: 'rinnegan', color: 0xb89aff }, marks: ['piercings'], top: AKATSUKI, bottom: { type: 'pants', color: 0x1a1a2a }, build: 'muscle' }, attack: P({ shape: 'spike', color: 0xb8c0cc, speed: 15, range: 6, dmg: 380, explode: { r: 1, dmg: 200 } }) } }),
      main: P({ name: 'Asura-Raketen', desc: 'Vier Raketen, die explodieren.', shape: 'spike', color: 0xb8c0cc, color2: 0xff8a2a, count: 4, spread: 30, speed: 14, range: 8, dmg: 320, w: 0.3, explode: { r: 1.0, dmg: 180 }, anim: 'cast', sfx: 'explode' }),
      super: A({ name: 'Chibaku Tensei', desc: 'Eine schwarze Gravitationskugel reißt alles im Umkreis an sich und zerquetscht es.', range: 8, r: 3.2, dmg: 900, landDelay: 0.6, fx: 'ring', color: 0x9a5aff, effects: pull(2.5), linger: { t: 3, tick: 0.3, dmg: 220, pull: true, color: 0x6a3aa8 }, breakWalls: true, anim: 'raise', sfx: 'space' }),
    },
  },

  // 29 ─ MIGHT GUY ────────────────────────────────────────────────────────────
  {
    id: 'guy', name: 'Might Guy', anime: 'naruto', rarity: 'super_rare', role: 'Kämpfer',
    desc: 'Taijutsu-Meister. Öffnet die Acht Tore — selbst wenn es ihn das Leben kosten könnte.',
    playstyle: 'Schnelle Tritte und die Morning-Peacock-Salve. Das Achte Tor macht ihn zum stärksten Nahkämpfer im Spiel, aber es zehrt jede Sekunde an seinem Leben.',
    stats: { hp: 5000, speed: 3.5, reload: 1.05, ammo: 3, superHits: 4 },
    sfx: 'punch', victory: 'peace',
    look: { skin: SKIN.fair, hair: { style: 'bowl', color: 0x101014 }, eyes: { color: 0x1a1a1a, type: 'dots' }, mouth: 'grin', top: { type: 'shirt', color: 0x2a8a3a, sleeves: 'long' }, bottom: { type: 'pants', color: 0x2a8a3a }, extras: ['headband'], headbandColor: 0xc8202a, shoes: 0xff8a2a, build: 'muscle', browColor: 0x101014 },
    main: C({ name: 'Leaf Hurricane', desc: 'Doppelter Wirbeltritt.', range: 1.9, arc: 150, dmg: 560, hits: 2, gap: 0.12, lunge: 0.6, color: 0x7aff7a, anim: 'kick', sfx: 'punch' }),
    super: P({ name: 'Morning Peacock', desc: 'Ein Hagel aus brennenden Fausthieben in breitem Fächer.', shape: 'fist', color: 0xff7a2a, color2: 0xffe08a, count: 9, spread: 60, speed: 18, range: 5.5, dmg: 360, w: 0.32, effects: burn(150, 1), anim: 'flurry', animDur: 0.7, sfx: 'punchBarrage' }),
    gadgets: [
      D({ name: 'Dynamic Entry', desc: 'Fliegender Tritt mit Rückstoß.', dist: 5, speed: 22, dmg: 900, w: 0.8, color: 0x7aff7a, stopOnHit: true, effects: knock(2.5), anim: 'kick', sfx: 'punch' }),
      BUF({ name: 'Frühlingsjugend', desc: 'Heilt 900 LP und füllt 1 Munition.', buff: { heal: 900, ammo: 1, color: 0x7aff7a }, sfx: 'powerup' }),
    ],
    starPowers: [
      { name: 'Kraft der Jugend', desc: '+12 % Tempo.', type: 'stat', speed: 1.12 },
      { name: 'Ewiger Rivale', desc: 'Super-Treffer betäuben 0,3 s.', type: 'onHitEffect', effects: stun(0.3), kinds: ['super'] },
    ],
    trans: {
      name: 'Achtes Tor: Tor des Todes', duration: 13, aura: 0xff3a2a, aura2: 0xffa07a, auraIntensity: 2.0,
      desc: 'Blutroter Dampf. Unvorstellbare Kraft, doppelte Geschwindigkeit — und −3 % LP jede Sekunde. Night Guy durchbricht alles.',
      look: { skin: 0xff8a7a, top: { type: 'bare' }, eyes: { type: 'blank' }, mouth: 'open', glow: 0xff3a2a, browColor: 0xb81a1a },
      stats: { speed: 1.45, dmg: 1.5, reload: 0.6 },
      passive: [{ type: 'drain', perSec: 0.03 }, { type: 'unstoppable' }],
      main: P({ name: 'Evening Elephant', desc: 'Luftdruck-Fäuste, die alles weit zurückwerfen.', shape: 'fist', color: 0xffa07a, color2: 0xffffff, size: 0.55, speed: 18, range: 6, dmg: 900, w: 0.55, pierce: true, effects: knock(2.2), anim: 'punch', sfx: 'heavyPunch' }),
      super: D({ name: 'Night Guy', desc: 'Ein drachenförmiger Tritt, der die Arena durchquert und Raum-Zeit krümmt.', dist: 10, speed: 34, dmg: 4200, w: 1.2, color: 0xff3a2a, invuln: true, ghost: true, breakWalls: true, effects: knock(3), anim: 'kick', sfx: 'nightGuy' }),
      onEnter: N({ r: 3.6, dmg: 600, color: 0xff3a2a, effects: knock(2.6) }),
    },
  },

  // 30 ─ HASHIRAMA ────────────────────────────────────────────────────────────
  {
    id: 'hashirama', name: 'Hashirama Senju', anime: 'naruto', rarity: 'legendary', role: 'Unterstützer',
    desc: 'Erster Hokage, Gott der Shinobi. Holzversteck formt Wälder, Mauern und Riesen.',
    playstyle: 'Durchschlagende Holzspieße und heilende Holzmauern. Im Sage Mode schmettern riesige Holzhände das Schlachtfeld.',
    stats: { hp: 5200, speed: 3.25, reload: 1.4, ammo: 3, superHits: 4 },
    sfx: 'wood', victory: 'laugh',
    passive: [{ type: 'regen', amt: 140, delay: 1 }],
    look: { skin: SKIN.tan, hair: { style: 'hashirama', color: 0x14141c }, eyes: { color: 0x3a2a1a }, mouth: 'grin', top: { type: 'robe', color: 0xa3242a, sleeves: 'long' }, bottom: { type: 'pants', color: 0x4a2a2a }, extras: ['shoulderPads', 'armorPlates', 'headband'], armorColor: 0xa3242a, build: 'muscle' },
    main: P({ name: 'Holzspieße', desc: 'Zwei Holzspieße bohren sich durch alle Gegner.', shape: 'spike', color: 0x8a6a3a, color2: 0xc8a86a, count: 2, spread: 10, speed: 15, range: 7.5, dmg: 480, w: 0.3, pierce: true, anim: 'seal', sfx: 'wood' }),
    super: A({ name: 'Geburt eines tiefen Waldes', desc: 'Bäume schießen aus dem Boden, fesseln Gegner und heilen Verbündete.', range: 7, r: 2.8, dmg: 1100, landDelay: 0.4, fx: 'pillar', color: 0x6aaa3a, effects: { root: 1.6 }, healAllies: 1200, linger: { t: 4, tick: 0.5, dmg: 0, heal: 140, color: 0x6aaa3a }, anim: 'seal', sfx: 'wood' }),
    gadgets: [
      WALL({ name: 'Holzwand', desc: 'Eine Mauer aus Holz für 6 s.', len: 5, range: 2.5, t: 6, color: 0x8a6a3a, style: 'wood', sfx: 'wood' }),
      BUF({ name: 'Senju-Heilung', desc: 'Heilt Hashirama und Verbündete im Umkreis um 1200.', allies: true, r: 4, buff: { heal: 1200, color: 0x7cff7a }, sfx: 'heal' }),
    ],
    starPowers: [
      { name: 'Senju-Vitalität', desc: 'Regeneration verdoppelt.', type: 'regen', amt: 140, delay: 1 },
      { name: 'Gott der Shinobi', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
    ],
    trans: {
      name: 'Sage Mode', duration: 15, aura: 0xffb84a, aura2: 0x6aaa3a,
      desc: 'Weise Markierungen im Gesicht. Holzdrachen schlängeln sich über das Feld; die Super lässt Tausende Hände niederfahren.',
      look: { marksAdd: ['tearLines'], eyes: { type: 'sharp', color: 0x3a2a1a }, glow: 0xffb84a },
      stats: { dmg: 1.2, hp: 1.1, reload: 0.85 },
      passive: [{ type: 'regen', amt: 260, delay: 0 }],
      main: P({ name: 'Holzdrache', desc: 'Ein langer Holzdrache, der sich durch Gegner windet.', shape: 'spike', color: 0x8a6a3a, size: 0.55, speed: 13, range: 9, dmg: 750, w: 0.45, pierce: true, wave: { amp: 1.4, freq: 7 }, anim: 'seal', sfx: 'wood' }),
      super: SEQ([0, 0.25, 0.5, 0.75].map((t, i) => ({ at: t, do: A({ range: 3 + i * 1.8, fixed: true, r: 2.2, dmg: 1000, landDelay: 0.35, fx: 'pillar', color: 0xd8b878, breakWalls: true, effects: stun(0.4) }) })), { name: 'Wahre Tausend Hände', desc: 'Vier riesige Holzhände schmettern nacheinander entlang der Zielrichtung nieder.', anim: 'seal', sfx: 'rock' }),
      onEnter: N({ r: 3, dmg: 300, color: 0xffb84a, effects: knock(1.8) }),
    },
  },
];

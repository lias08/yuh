import { P, C, D, BM, A, N, DOM, SUM, BUF, BL, WALL, HOOK, TRAP, SEQ, MULTI, CU, slow, stun, knock, pull, burn, fx, SKIN } from './helpers.js';

const SHIHAKUSHO = { type: 'kimono', color: 0x16161c, color2: 0xf2f2f4, under: 0xf2f2f4, sleeves: 'wide' };
const HAKAMA = { type: 'hakama', color: 0x16161c };
const ARRANCAR = { type: 'coat', color: 0xf2f2f4, color2: 0x1a1a1a, sleeves: 'long', collar: true };

export default [
  // 31 ─ ICHIGO ───────────────────────────────────────────────────────────────
  {
    id: 'ichigo', name: 'Ichigo Kurosaki', anime: 'bleach', rarity: 'legendary', role: 'Schwertkämpfer',
    desc: 'Ersatz-Shinigami mit Hollow- und Quincy-Blut. True Bankai, dann das Horn der Erlösung.',
    playstyle: 'Getsuga Tensho trifft auf Distanz, Zangetsu im Nahkampf. Jede Form verändert seine Getsuga-Technik grundlegend.',
    stats: { hp: 4700, speed: 3.4, reload: 1.3, ammo: 3, superHits: 4 },
    sfx: 'slash', victory: 'swordUp',
    look: { skin: SKIN.fair, hair: { style: 'ichigo', color: 0xff8a2a }, eyes: { color: 0x6a3a1a, type: 'sharp' }, mouth: 'flat', top: SHIHAKUSHO, bottom: HAKAMA, weapon: { type: 'cleaver', color: 0xdfe6f0 }, build: 'normal', browColor: 0xd86a1a },
    main: C({ name: 'Zangetsu', desc: 'Breiter Hieb mit dem riesigen Schwert.', range: 2.3, arc: 120, dmg: 900, color: 0x8ad8ff, anim: 'slash', sfx: 'heavySlash' }),
    super: P({ name: 'Getsuga Tensho', desc: 'Eine blaue Mondsichel-Welle, die durch alle Gegner schneidet.', shape: 'wave', color: 0x6ac8ff, color2: 0xffffff, size: 1.0, speed: 17, range: 10, dmg: 1800, w: 0.85, pierce: true, effects: knock(1.5), anim: 'slash', animDur: 0.5, sfx: 'getsuga' }),
    gadgets: [
      BL({ name: 'Shunpo', desc: 'Blitzschritt mit Schnitt entlang des Weges.', dist: 'aim', maxDist: 5, lineDmg: 600, color: 0x8ad8ff, sfx: 'teleport' }),
      BUF({ name: 'Hollow-Maske', desc: '3 s lang +35 % Schaden und +15 % Tempo.', buff: { dmg: 0.35, speed: 0.15, t: 3, color: 0xf2f2f4 }, sfx: 'powerup' }),
    ],
    starPowers: [
      { name: 'Beschützer', desc: '−20 % Schaden, wenn ein Verbündeter in der Nähe ist.', type: 'allyNearDR', f: 0.2, r: 4 },
      { name: 'Hollow-Instinkt', desc: '+30 % Schaden unter 40 % LP.', type: 'lowHpDmg', below: 0.4, mult: 1.3 },
    ],
    trans: {
      name: 'Tensa Zangetsu (True Bankai)', duration: 15, aura: 0x1a0a14, aura2: 0xff2a3a, auraIntensity: 1.3,
      desc: 'Schwarzer Mantel, schwarze Klinge, extreme Geschwindigkeit. Getsuga wird schwarz-rot — die Anzeige lädt weiter fürs Horn der Erlösung.',
      look: { top: { type: 'coat', color: 0x111116, color2: 0xc8202a, sleeves: 'long', collar: true }, bottom: { type: 'pants', color: 0x111116 }, weapon: { type: 'tensa' }, eyes: { type: 'sharp', color: 0x6a3a1a } },
      stats: { speed: 1.2, dmg: 1.15, reload: 0.75 },
      main: C({ name: 'Bankai-Hiebfolge', desc: 'Drei blitzschnelle Hiebe mit Vorwärtsschritt.', range: 2.1, arc: 100, dmg: 460, hits: 3, gap: 0.08, lunge: 0.8, color: 0xff2a3a, anim: 'flurry', sfx: 'slash' }),
      super: P({ name: 'Schwarzes Getsuga Tensho', desc: 'Zwei schwarz-rote Wellen in einem Kreuz — größer, schneller, zerstört Wände.', shape: 'wave', color: 0x1a0a14, color2: 0xff2a3a, size: 1.2, count: 2, spread: 16, speed: 19, range: 11, dmg: 1300, w: 0.95, pierce: true, breakWalls: true, effects: knock(1.8), anim: 'slash', animDur: 0.5, sfx: 'getsuga' }),
      onEnter: N({ r: 3, dmg: 300, color: 0xff2a3a, effects: knock(1.8) }),
      next: {
        name: 'Horn der Erlösung', duration: 13, aura: 0xf2f2f4, aura2: 0xff2a3a, auraIntensity: 1.6,
        desc: 'Vollständige Hollow-Verwandlung: weiße Maske, lange Hörner, langes Haar. Cero aus den Hörnern, und ein Getsuga, das die ganze Arena spaltet.',
        look: { hair: { style: 'ichigoLong', color: 0xff8a2a }, marks: ['ichigoHollow'], extrasAdd: ['hornLong'], skin: 0xf2f0ec, top: { type: 'bare' }, bottom: { type: 'pants', color: 0x111116 }, claws: true, extrasRemove: [], weapon: { type: 'none' }, build: 'muscle' },
        stats: { speed: 1.25, dmg: 1.35, reload: 0.65, hp: 1.15 },
        passive: [{ type: 'regen', amt: 300, delay: 0 }, { type: 'unstoppable' }],
        main: BM({ name: 'Horn-Cero', desc: 'Ein roter Cero aus den Hörnern.', range: 9, w: 0.35, dmg: 980, ticks: 1, charge: 0.12, color: 0xff2a3a, color2: 0x1a0a14, anim: 'point', animDur: 0.35, sfx: 'cero' }),
        super: P({ name: 'Getsuga der Erlösung', desc: 'Eine gigantische Getsuga-Welle durch die gesamte Arena.', shape: 'wave', color: 0xff2a3a, color2: 0x1a0a14, size: 2.2, speed: 15, range: 16, dmg: 2600, w: 1.8, pierce: true, pierceWalls: true, breakWalls: true, effects: knock(3), anim: 'overhead', animDur: 0.6, sfx: 'getsuga' }),
        onEnter: N({ r: 3.8, dmg: 600, color: 0xff2a3a, effects: knock(2.6) }),
      },
    },
  },

  // 32 ─ AIZEN ────────────────────────────────────────────────────────────────
  {
    id: 'aizen', name: 'Sosuke Aizen', anime: 'bleach', rarity: 'divine', role: 'Illusionist',
    desc: 'Kyoka Suigetsu: vollständige Hypnose. Was du triffst, war vielleicht nie Aizen.',
    playstyle: 'Jeder erlittene Treffer hat eine Chance, nur eine Illusion zu treffen — Aizen erscheint daneben. Kurohitsugi versiegelt Gegner in einem schwarzen Sarg.',
    stats: { hp: 4200, speed: 3.3, reload: 1.4, ammo: 3, superHits: 5 },
    sfx: 'dark', victory: 'bow',
    passive: [{ type: 'illusion', chance: 0.22 }],
    look: { skin: SKIN.light, hair: { style: 'aizen', color: 0x5a3a2a }, eyes: { color: 0x5a3a2a, type: 'sharp' }, mouth: 'smirk', top: ARRANCAR, bottom: { type: 'hakama', color: 0xf2f2f4 }, weapon: { type: 'katana' }, build: 'tall' },
    main: BM({ name: 'Hado #4: Byakurai', desc: 'Ein sofortiger weißer Blitzstrahl.', range: 9, w: 0.2, dmg: 860, ticks: 1, color: 0xe8f0ff, color2: 0xffffff, anim: 'point', animDur: 0.3, sfx: 'beam' }),
    super: A({ name: 'Hado #90: Kurohitsugi', desc: 'Ein schwarzer Sarg aus Gravitation erscheint um das Ziel: hoher Schaden und Betäubung.', range: 8, r: 2.0, dmg: 2300, landDelay: 0.75, fx: 'pillar', color: 0x2a1a3a, color2: 0x9a5aff, effects: stun(1.2), anim: 'point', sfx: 'kurohitsugi' }),
    gadgets: [
      BUF({ name: 'Kyoka Suigetsu', desc: '2 s unsichtbar; hinterlässt eine Illusion.', buff: { invis: 2, speed: 0.25, t: 2, color: 0x9a5aff }, sfx: 'genjutsu' }),
      { kind: 'nova', name: 'Reiatsu-Druck', desc: 'Sein bloßer Druck verlangsamt alle Gegner im Umkreis stark.', r: 4, dmg: 300, color: 0x9a5aff, effects: slow(2, 0.5), anim: 'raise', sfx: 'haki' },
    ],
    starPowers: [
      { name: 'Alles nach Plan', desc: 'Illusionschance +10 %.', type: 'illusion', chance: 0.1 },
      { name: 'Kido-Meister', desc: 'Super lädt 20 % schneller.', type: 'stat', superRate: 1.2 },
    ],
    trans: {
      name: 'Hogyoku-Fusion', duration: 15, aura: 0xd8c8ff, aura2: 0x9a5aff, auraIntensity: 1.3,
      desc: 'Mit dem Hogyoku verschmolzen: weiße Haut, Schmetterlingsflügel, regeneriert ständig. Kurohitsugi wird mit voller Beschwörungsformel gewirkt.',
      look: { skin: 0xf2f0f6, hair: { style: 'ichigoLong', color: 0x6a4a3a }, eyes: { type: 'glow', color: 0xb89aff }, top: { type: 'bare' }, extrasAdd: ['wings'], wingColor: 0x9a5aff, glow: 0xb89aff },
      stats: { hp: 1.15, dmg: 1.25, reload: 0.8 },
      passive: [{ type: 'regen', amt: 300, delay: 0 }, { type: 'illusion', chance: 0.12 }],
      main: P({ name: 'Reiatsu-Kugeln', desc: 'Drei violette Energiekugeln, die explodieren.', shape: 'orb', color: 0x9a5aff, color2: 0xffffff, count: 3, spread: 20, speed: 16, range: 8, dmg: 480, w: 0.3, explode: { r: 0.9, dmg: 200 }, anim: 'cast', sfx: 'dark' }),
      super: MULTI([
        A({ range: 9, r: 3.4, dmg: 3000, landDelay: 0.9, fx: 'pillar', color: 0x2a1a3a, color2: 0x9a5aff, breakWalls: true, effects: stun(1.6) }),
      ], { name: 'Kurohitsugi (vollständige Formel)', desc: 'Riesiger schwarzer Sarg mit voller Kraft.', anim: 'seal', animDur: 0.9, sfx: 'kurohitsugi' }),
      onEnter: N({ r: 3.4, dmg: 500, color: 0xb89aff, effects: knock(2.2) }),
    },
  },

  // 33 ─ KENPACHI ─────────────────────────────────────────────────────────────
  {
    id: 'kenpachi', name: 'Kenpachi Zaraki', anime: 'bleach', rarity: 'epic', role: 'Berserker',
    desc: 'Kommandant der 11. Division. Lebt nur für den Kampf und wird mit jeder Wunde stärker.',
    playstyle: 'Nur zwei Munition, aber gewaltige Hiebe. Je weniger LP, desto mehr Schaden. Stürz dich mitten hinein.',
    stats: { hp: 6000, speed: 3.25, reload: 1.2, ammo: 2, superHits: 4 },
    sfx: 'heavySlash', victory: 'laugh',
    passive: [{ type: 'rage', max: 0.6 }],
    look: { skin: SKIN.tan, hair: { style: 'kenpachi', color: 0x16161c, color2: 0xf2d24a }, eyes: { color: 0x1a1a1a, type: 'sharp' }, marks: ['scarX'], mouth: 'fangs', top: { type: 'kimono', color: 0x16161c, color2: 0xf2f2f4, sleeves: 'wide' }, bottom: HAKAMA, extras: ['captainHaori'], weapon: { type: 'katana', color: 0xa8b0bc, scale: 1.2 }, build: 'giant' },
    main: C({ name: 'Wilder Hieb', desc: 'Ein brutaler, weiter Schwerthieb.', range: 2.5, arc: 140, dmg: 1350, color: 0xf2d24a, effects: knock(1), anim: 'overhead', sfx: 'heavySlash' }),
    super: C({ name: 'Kendo: Zweihändig', desc: 'Kenpachi greift das Schwert mit beiden Händen: ein Schlag, der Wände und Gegner spaltet.', range: 3.4, arc: 100, dmg: 3000, color: 0xf2d24a, breakWalls: true, effects: knock(2.5), anim: 'overhead', animDur: 0.6, sfx: 'slashBig' }),
    gadgets: [
      BUF({ name: 'Augenklappe ab', desc: 'Reiatsu explodiert: +40 % Schaden für 3 s.', buff: { dmg: 0.4, t: 3, color: 0xf2d24a }, sfx: 'powerup' }),
      D({ name: 'Ansturm', desc: 'Stürmt geradeaus und stößt Gegner um.', dist: 5, speed: 18, dmg: 700, w: 0.9, color: 0xf2d24a, effects: knock(1.5), sfx: 'dash' }),
    ],
    starPowers: [
      { name: 'Kampfrausch', desc: 'Jeder Kill heilt 35 %.', type: 'killHeal', f: 0.35 },
      { name: 'Glöckchen', desc: '+10 % Tempo.', type: 'stat', speed: 1.1 },
    ],
    trans: {
      name: 'Bankai', duration: 14, aura: 0xff2a1a, aura2: 0xf2d24a, auraIntensity: 1.8,
      desc: 'Rote Haut, Hörner, ein riesiges Schwert. Reine Zerstörung: Jeder Hieb erzeugt eine Schockwelle.',
      look: { skin: 0xd84a3a, eyes: { type: 'blank' }, extrasAdd: ['hornsBig'], hornColor: 0x2a1a1a, top: { type: 'bare' }, weapon: { type: 'cleaver', color: 0x8a8a9a, scale: 1.3 }, build: 'titan' },
      stats: { hp: 1.2, dmg: 1.35, speed: 1.08 },
      passive: [{ type: 'unstoppable' }, { type: 'rage', max: 0.3 }],
      main: MULTI([
        C({ range: 2.6, arc: 140, dmg: 1100, color: 0xff2a1a, effects: knock(1.2) }),
        P({ shape: 'wave', color: 0xff2a1a, size: 0.9, speed: 14, range: 6, dmg: 600, w: 0.7, pierce: true }),
      ], { name: 'Bankai-Hieb', desc: 'Hieb plus vorschießende Schockwelle.', anim: 'overhead', sfx: 'heavySlash' }),
      super: SEQ([
        { at: 0, do: D({ dist: 4, speed: 20, dmg: 800, w: 1.0, color: 0xff2a1a, breakWalls: true }) },
        { at: 0.3, do: A({ range: 3, r: 3.4, dmg: 3200, landDelay: 0.15, fx: 'explode', color: 0xff2a1a, color2: 0xf2d24a, breakWalls: true, effects: knock(3) }) },
      ], { name: 'Weltspalter', desc: 'Sprung nach vorn, dann ein Hieb, der die Erde aufreißt.', anim: 'overhead', sfx: 'slashBig' }),
      onEnter: N({ r: 3.6, dmg: 600, color: 0xff2a1a, effects: knock(2.6) }),
    },
  },

  // 34 ─ BYAKUYA ──────────────────────────────────────────────────────────────
  {
    id: 'byakuya', name: 'Byakuya Kuchiki', anime: 'bleach', rarity: 'super_rare', role: 'Kontrolleur',
    desc: 'Adelsoberhaupt und Kommandant. Senbonzakura zerteilt sich in tausend Klingen wie Kirschblüten.',
    playstyle: 'Blütenschwärme suchen sich selbst ihr Ziel. Kontrolliere Engstellen mit Klingenstürmen.',
    stats: { hp: 4100, speed: 3.3, reload: 1.35, ammo: 3, superHits: 4 },
    sfx: 'petal', victory: 'bow',
    look: { skin: SKIN.pale, hair: { style: 'byakuya', color: 0x14141c, color2: 0xf2f2f4 }, eyes: { color: 0x3a3a4a, type: 'sharp' }, mouth: 'flat', top: SHIHAKUSHO, bottom: HAKAMA, extras: ['captainHaori', 'scarf'], scarfColor: 0xe8f0e8, weapon: { type: 'katana' }, build: 'slim' },
    main: P({ name: 'Senbonzakura', desc: 'Ein Schwarm aus Klingenblüten, der leicht nachsteuert.', shape: 'petal', color: 0xffa8d0, count: 4, spread: 22, speed: 12, range: 7.5, dmg: 260, w: 0.32, homing: 2.2, anim: 'point', sfx: 'petal' }),
    super: DOM({ name: 'Senkei', desc: 'Säulen aus Schwertern umschließen das Gebiet: Gegner darin werden unaufhörlich zerschnitten.', title: 'SENKEI', subtitle: 'Senbonzakura Kageyoshi', r: 3.3, t: 3.5, dps: 900, color: 0xffa8d0, color2: 0xffffff, particle: 0xffa8d0, slashFx: true, sfx: 'petal' }),
    gadgets: [
      BL({ name: 'Senka', desc: 'Shunpo hinter den Gegner.', dist: 'aim', maxDist: 6, behindTarget: true, color: 0xffa8d0, then: C({ range: 1.8, arc: 90, dmg: 800, color: 0xffffff }), sfx: 'teleport' }),
      { kind: 'nova', name: 'Bakudo #61: Rikujokoro', desc: 'Sechs Lichtstäbe fesseln Gegner im Umkreis (Wurzeln 1,4 s).', r: 3.2, dmg: 200, color: 0xfff0a0, effects: { root: 1.4 }, anim: 'point', sfx: 'kido' },
    ],
    starPowers: [
      { name: 'Adelsstolz', desc: '−15 % erlittener Schaden über 70 % LP.', type: 'damageReduceHigh', above: 0.7, f: 0.15 },
      { name: 'Tausend Klingen', desc: 'Hauptangriff +1 Blüte.', type: 'extraProj', add: 1 },
    ],
    trans: {
      name: 'Senbonzakura Kageyoshi', duration: 15, aura: 0xffa8d0, aura2: 0xffffff, auraIntensity: 1.3,
      desc: 'Bankai: Ein Meer aus rosa Klingen. Hauptangriff wird ein wirbelnder Blütensturm; Super: Shukei Hakuteiken — weiße Flügel, ein einziger tödlicher Schnitt.',
      look: { glow: 0xffa8d0, weapon: { type: 'katana', color: 0xffe0f0, emissive: 0xff7ab8 } },
      stats: { dmg: 1.2, reload: 0.8, speed: 1.08 },
      main: A({ name: 'Blütensturm', desc: 'Ein Klingenwirbel an der Zielstelle, der 1,5 s weiterschneidet.', range: 7.5, r: 1.6, dmg: 500, landDelay: 0.2, fx: 'slashes', color: 0xffa8d0, linger: { t: 1.5, tick: 0.3, dmg: 140, color: 0xffa8d0 }, anim: 'point', sfx: 'petal' }),
      super: MULTI([
        BUF({ buff: { dr: 0.3, t: 1, color: 0xffffff, fx: false } }),
        BL({ dist: 'aim', maxDist: 8, lineDmg: 2800, color: 0xffffff, effects: knock(1.5) }),
      ], { name: 'Shukei: Hakuteiken', desc: 'Weiße Flügel aus gebündelten Klingen: ein einziger Durchgang durch alle Gegner mit gewaltigem Schaden.', anim: 'slash', sfx: 'slashBig' }),
      onEnter: N({ r: 3, dmg: 300, color: 0xffa8d0, effects: knock(1.8) }),
    },
  },

  // 35 ─ URAHARA ──────────────────────────────────────────────────────────────
  {
    id: 'urahara', name: 'Kisuke Urahara', anime: 'bleach', rarity: 'rare', role: 'Unterstützer',
    desc: 'Genie, Erfinder, ehemaliger Kommandant. Benihime schneidet, schützt und repariert.',
    playstyle: 'Rote Klingen auf Distanz, Barrieren zum Schutz. Sein Bankai heilt Verbündete und „baut“ Gegner kaputt.',
    stats: { hp: 4300, speed: 3.3, reload: 1.35, ammo: 3, superHits: 4 },
    sfx: 'slash', victory: 'bow',
    look: { skin: SKIN.light, hair: { style: 'urahara', color: 0xf0d890 }, eyes: { color: 0x5a6a3a }, marks: ['stubble'], mouth: 'smirk', top: { type: 'robe', color: 0x2a4a3a, color2: 0x1a1a1a, sleeves: 'wide' }, bottom: { type: 'pants', color: 0x1a1a22 }, extras: ['bucketHat', 'cape'], capeColor: 0x1a1a22, weapon: { type: 'cane', color: 0x8a6a3a }, build: 'tall' },
    main: P({ name: 'Nake, Benihime', desc: 'Eine rote Klingenwelle.', shape: 'slash', color: 0xff2a4a, color2: 0xffffff, speed: 16, range: 7.5, dmg: 720, w: 0.4, pierce: true, anim: 'slash', sfx: 'slash' }),
    super: A({ name: 'Shibari, Benihime', desc: 'Ein Netz aus Blut fesselt alle Gegner im Gebiet.', range: 7, r: 2.6, dmg: 1000, landDelay: 0.35, fx: 'ring', color: 0xff2a4a, effects: { root: 1.8 }, linger: { t: 2, tick: 0.5, dmg: 150, color: 0xff2a4a }, anim: 'point', sfx: 'kido' }),
    gadgets: [
      WALL({ name: 'Bakudo #81: Danku', desc: 'Eine durchsichtige Lichtwand blockiert alles für 5 s.', len: 5, range: 2.2, t: 5, color: 0xbfe6ff, style: 'light', sfx: 'shield' }),
      TRAP({ name: 'Erfindung: Sprengsatz', desc: 'Legt eine unsichtbare Mine.', range: 4, r: 1.6, dmg: 1200, effects: knock(2), t: 15, color: 0xff2a4a, sfx: 'reload' }),
    ],
    starPowers: [
      { name: 'Wissenschaftler', desc: 'Gadgets laden 30 % schneller (Abklingzeit).', type: 'gadgetCd', mult: 0.7 },
      { name: 'Gigai', desc: 'Überlebt einmal einen tödlichen Treffer mit 30 % LP.', type: 'reviveOnce', hp: 0.3 },
    ],
    trans: {
      name: 'Kannonbiraki Benihime Aratame', duration: 15, aura: 0xff2a4a, aura2: 0xffe0f0,
      desc: 'Bankai der Umstrukturierung: Eine riesige Frauengestalt näht Verbündete zusammen und Gegner auseinander.',
      look: { glow: 0xff2a4a, extrasRemove: ['bucketHat'], hair: { style: 'urahara', color: 0xf0d890 } },
      stats: { dmg: 1.15, reload: 0.85, hp: 1.1 },
      main: P({ name: 'Benihime: Kreuz', desc: 'Zwei rote Wellen, die Verbündete beim Durchflug heilen.', shape: 'slash', color: 0xff2a4a, count: 2, spread: 18, speed: 16, range: 8, dmg: 600, w: 0.45, pierce: true, anim: 'slash', sfx: 'slash', special: 'healAlliesOnPath' }),
      super: MULTI([
        N({ r: 4, dmg: 1200, color: 0xff2a4a, effects: fx(slow(2, 0.5), { mark: { t: 4, amp: 0.25 } }), healAllies: 2200 }),
      ], { name: 'Umstrukturierung', desc: 'Heilt Verbündete im Umkreis massiv; Gegner werden „umgebaut“: verlangsamt und nehmen +25 % Schaden.', anim: 'raise', sfx: 'heal' }),
      onEnter: N({ r: 3, dmg: 300, color: 0xff2a4a, effects: knock(1.8) }),
    },
  },

  // 36 ─ YHWACH ───────────────────────────────────────────────────────────────
  {
    id: 'yhwach', name: 'Yhwach', anime: 'bleach', rarity: 'divine', role: 'Herrscher',
    desc: 'Vater der Quincy. Er sieht die Zukunft — und mit The Almighty kann er sie umschreiben.',
    playstyle: 'Future Sight blockt regelmäßig einen Treffer vollständig. Auswählen stiehlt Kraft von Gegnern und gibt sie Verbündeten.',
    stats: { hp: 4400, speed: 3.25, reload: 1.4, ammo: 3, superHits: 5 },
    sfx: 'holy', victory: 'armsCrossed',
    passive: [{ type: 'futureSight', cd: 5 }],
    look: { skin: SKIN.light, hair: { style: 'yhwach', color: 0x14141c }, eyes: { color: 0x2a2a3a, type: 'sharp' }, marks: ['mustache', 'stubble'], beardColor: 0x14141c, mouth: 'flat', top: { type: 'coat', color: 0x14141c, color2: 0xf2f2f4, sleeves: 'long', collar: true }, bottom: { type: 'pants', color: 0x14141c }, extras: ['cape'], capeColor: 0x14141c, weapon: { type: 'katana', color: 0x9ad8ff, emissive: 0x3a8aff }, build: 'tall' },
    main: P({ name: 'Heilige Pfeile', desc: 'Drei blaue Reishi-Pfeile kurz nacheinander.', shape: 'spike', color: 0x8ad8ff, color2: 0xffffff, speed: 22, range: 9, dmg: 380, w: 0.22, burst: { n: 3, gap: 0.08 }, anim: 'point', sfx: 'holy' }),
    super: N({ name: 'Auswählen', desc: 'Entzieht allen Gegnern im Umkreis Kraft (−30 % Schaden, verlangsamt) und heilt Verbündete.', r: 4.2, dmg: 1400, color: 0x14141c, color2: 0x8ad8ff, effects: fx(slow(2.5, 0.4), { weaken: { t: 4, f: 0.3 } }), healAllies: 1400, anim: 'raise', sfx: 'holy' }),
    gadgets: [
      BUF({ name: 'Blut Vene', desc: '40 % Schadensreduktion für 3 s.', buff: { dr: 0.4, t: 3, color: 0x8ad8ff }, sfx: 'shield' }),
      A({ name: 'Heilige Säule', desc: 'Eine Säule aus Reishi schlägt ein.', range: 8, r: 1.6, dmg: 1100, landDelay: 0.5, fx: 'pillar', color: 0x8ad8ff, sfx: 'holy' }),
    ],
    starPowers: [
      { name: 'Vater der Quincy', desc: 'Future Sight lädt alle 3,5 s.', type: 'futureSight', cd: 3.5 },
      { name: 'Sanktion', desc: 'Super lädt 15 % schneller.', type: 'stat', superRate: 1.15 },
    ],
    trans: {
      name: 'The Almighty', duration: 15, aura: 0x1a1a2a, aura2: 0x8ad8ff, auraIntensity: 1.5,
      desc: 'Unzählige Pupillen in seinen Augen. Er sieht jede Zukunft: Future Sight lädt alle 1,5 s, und seine Super schreibt die Zukunft um.',
      look: { eyes: { type: 'rinnegan', color: 0x2a2a3a }, marksAdd: ['fourEyes'], extrasAdd: ['wings'], wingColor: 0x14141c, glow: 0x8ad8ff },
      stats: { dmg: 1.25, reload: 0.8, speed: 1.08 },
      passive: [{ type: 'futureSight', cd: 1.5 }],
      main: P({ name: 'Reishi-Sturm', desc: 'Fünf Pfeile im Fächer, die leicht nachsteuern.', shape: 'spike', color: 0x8ad8ff, color2: 0xffffff, count: 5, spread: 30, speed: 22, range: 9, dmg: 320, w: 0.24, homing: 1.6, anim: 'point', sfx: 'holy' }),
      super: MULTI([
        N({ r: 5, dmg: 1800, color: 0x8ad8ff, color2: 0x14141c, effects: stun(1.2) }),
        BUF({ buff: { healPct: 0.35, cleanse: true, color: 0x8ad8ff } }),
      ], { name: 'Die Zukunft umschreiben', desc: 'Betäubt alle Gegner im großen Umkreis und stellt 35 % der LP wieder her.', anim: 'raise', sfx: 'holy' }),
      onEnter: N({ r: 3.6, dmg: 500, color: 0x8ad8ff, effects: knock(2.4) }),
    },
  },

  // 37 ─ ULQUIORRA ────────────────────────────────────────────────────────────
  {
    id: 'ulquiorra', name: 'Ulquiorra Cifer', anime: 'bleach', rarity: 'mythic', role: 'Schütze',
    desc: 'Cuarta Espada. Emotionslos, präzise — und als Einziger mit einer zweiten Resurrección.',
    playstyle: 'Cero ist ein schneller, durchschlagender Strahl. In der Segunda Etapa fliegt er mit Lanzen aus grünem Licht.',
    stats: { hp: 3900, speed: 3.35, reload: 1.45, ammo: 3, superHits: 4 },
    sfx: 'cero', victory: 'armsCrossed',
    passive: [{ type: 'regen', amt: 100, delay: 2 }],
    look: { skin: 0xf2f2f6, hair: { style: 'ulquiorra', color: 0x14141c }, eyes: { color: 0x2aa86a }, marks: ['ulquiorra'], noBlush: true, mouth: 'flat', top: ARRANCAR, bottom: { type: 'hakama', color: 0xf2f2f4 }, extras: ['halfHelmet'], build: 'slim' },
    main: BM({ name: 'Cero', desc: 'Ein grüner Cero aus dem Finger.', range: 9, w: 0.32, dmg: 900, ticks: 1, charge: 0.1, color: 0x3aff8a, color2: 0xffffff, anim: 'point', animDur: 0.35, sfx: 'cero' }),
    super: BM({ name: 'Gran Rey Cero', desc: 'Ein massiver, breiter Cero, der Wände sprengt.', range: 11, w: 0.85, dmg: 330, ticks: 8, gap: 0.09, charge: 0.45, color: 0x3aff8a, color2: 0xffffff, breakWalls: true, effects: knock(2.2), anim: 'beam', animDur: 1.2, sfx: 'beamBig' }),
    gadgets: [
      BL({ name: 'Sonido', desc: 'Lautloser Blitzschritt.', dist: 'aim', maxDist: 5, color: 0x3aff8a, sfx: 'sonido' }),
      BUF({ name: 'Hochgeschwindigkeits-Regeneration', desc: 'Heilt 1600 LP.', buff: { heal: 1600, color: 0x3aff8a }, sfx: 'heal' }),
    ],
    starPowers: [
      { name: 'Nihilismus', desc: '+10 % Schaden und +10 % LP.', type: 'stat', dmg: 1.1, hp: 1.1 },
      { name: 'Hierro', desc: '−12 % erlittener Schaden.', type: 'damageReduce', f: 0.12 },
    ],
    trans: {
      name: 'Resurrección: Segunda Etapa', duration: 15, aura: 0x1a1a1a, aura2: 0x3aff8a, auraIntensity: 1.4,
      desc: 'Die zweite Freilassung: schwarze Flügel, Schwanz, dämonische Gestalt. Wirft Lanzen aus Licht und durchbohrt alles mit Lanza del Relámpago.',
      look: { skin: 0x1e1e24, hair: { style: 'pantera', color: 0x14141c }, eyes: { type: 'glow', color: 0x3aff8a }, top: { type: 'bare' }, bottom: { type: 'pants', color: 0x14141c }, extrasAdd: ['wings', 'tail', 'hornLong'], extrasRemove: ['halfHelmet'], wingColor: 0x111114, tailColor: 0x1e1e24, hornColor: 0xf2f2f6, claws: true, weapon: { type: 'lance', color: 0x3aff8a } },
      stats: { dmg: 1.3, speed: 1.2, reload: 0.8, hp: 1.1 },
      passive: [{ type: 'regen', amt: 300, delay: 0 }],
      main: P({ name: 'Luz de la Luna', desc: 'Zwei grüne Lichtlanzen, die explodieren.', shape: 'spike', color: 0x3aff8a, color2: 0xffffff, size: 0.45, count: 2, spread: 10, speed: 20, range: 9, dmg: 560, w: 0.3, explode: { r: 1.0, dmg: 260 }, anim: 'throw', sfx: 'cero' }),
      super: P({ name: 'Lanza del Relámpago', desc: 'Eine Lanze, deren Explosion einen Turm zerstören könnte.', shape: 'spike', color: 0x3aff8a, color2: 0xffffff, size: 0.8, speed: 26, range: 12, dmg: 1500, w: 0.5, pierce: true, explode: { r: 3.4, dmg: 2400, breakWalls: true, effects: knock(2.6) }, anim: 'throw', animDur: 0.6, sfx: 'thunderBig', delay: 0.3 }),
      onEnter: N({ r: 3.4, dmg: 500, color: 0x3aff8a, effects: knock(2.2) }),
    },
  },

  // 38 ─ GRIMMJOW ─────────────────────────────────────────────────────────────
  {
    id: 'grimmjow', name: 'Grimmjow Jaegerjaquez', anime: 'bleach', rarity: 'super_rare', role: 'Kämpfer',
    desc: 'Sexta Espada. Ein wilder Panther, der nur den Stärksten bekämpfen will.',
    playstyle: 'Schnelle Klauenhiebe im Nahkampf. Pantera feuert Klauen als Geschosse und reißt mit Desgarrón alles auf.',
    stats: { hp: 4800, speed: 3.45, reload: 1.1, ammo: 3, superHits: 4 },
    sfx: 'claw', victory: 'laugh',
    look: { skin: SKIN.fair, hair: { style: 'grimmjow', color: 0x3ac8e8 }, eyes: { color: 0x3ac8e8, type: 'sharp' }, marks: ['grimmjow'], mouth: 'fangs', top: { type: 'open', color: 0xf2f2f4, sleeves: 'short', collar: true }, bottom: { type: 'hakama', color: 0xf2f2f4 }, extras: ['jawBone'], weapon: { type: 'katana' }, build: 'muscle' },
    main: C({ name: 'Klauenhiebe', desc: 'Zwei schnelle Krallenschläge.', range: 1.8, arc: 110, dmg: 560, hits: 2, gap: 0.1, lunge: 0.6, color: 0x3ac8e8, anim: 'flurry', sfx: 'claw' }),
    super: BM({ name: 'Gran Rey Cero', desc: 'Ein blauer Gran Rey Cero.', range: 10, w: 0.7, dmg: 300, ticks: 7, gap: 0.09, charge: 0.35, color: 0x3ac8e8, color2: 0xffffff, effects: knock(2), anim: 'beam', animDur: 1.0, sfx: 'beamBig' }),
    gadgets: [
      BL({ name: 'Sonido', desc: 'Blitzschritt nach vorne.', dist: 'aim', maxDist: 5, color: 0x3ac8e8, sfx: 'sonido' }),
      P({ name: 'Bala', desc: 'Drei schnelle Reiatsu-Geschosse.', shape: 'orb', color: 0x3ac8e8, speed: 22, range: 7, dmg: 320, w: 0.25, burst: { n: 3, gap: 0.07 }, anim: 'punch', sfx: 'ki' }),
    ],
    starPowers: [
      { name: 'König', desc: '+25 % Schaden über 70 % LP.', type: 'highHpDmg', above: 0.7, mult: 1.25 },
      { name: 'Raubtier', desc: 'Jeder Kill: +30 % Tempo für 4 s.', type: 'killSpeed', mult: 0.3, t: 4 },
    ],
    trans: {
      name: 'Resurrección: Pantera', duration: 15, aura: 0x3ac8e8, aura2: 0xffffff, auraIntensity: 1.4,
      desc: 'Langes, wildes Haar, Pantherohren, Klingen an den Armen. Ein Raubtier aus purer Geschwindigkeit.',
      look: { hair: { style: 'pantera', color: 0x3ac8e8 }, top: { type: 'armor', color: 0xf2f2f4 }, bottom: { type: 'pants', color: 0xf2f2f4 }, extrasAdd: ['catEars', 'tail'], extrasRemove: ['jawBone'], tailColor: 0xf2f2f4, claws: true, weapon: { type: 'none' }, eyes: { type: 'slit', color: 0x3ac8e8 } },
      stats: { speed: 1.25, dmg: 1.25, reload: 0.75 },
      main: P({ name: 'Garra de la Pantera', desc: 'Fünf Klingen schießen aus den Armen.', shape: 'spike', color: 0x3ac8e8, color2: 0xffffff, count: 5, spread: 34, speed: 20, range: 7.5, dmg: 300, w: 0.25, anim: 'cast', sfx: 'claw' }),
      super: MULTI([
        D({ dist: 5, speed: 26, dmg: 900, w: 1.0, color: 0x3ac8e8 }),
        P({ shape: 'slash', color: 0x3ac8e8, color2: 0xffffff, size: 1.3, count: 5, spread: 40, speed: 18, range: 9, dmg: 700, w: 0.7, pierce: true, pierceWalls: true, delay: 0.3 }),
      ], { name: 'Desgarrón', desc: 'Sprung nach vorn, dann fünf gigantische Klauenwellen aus Reiatsu.', anim: 'slash', sfx: 'slashBig' }),
      onEnter: N({ r: 3.2, dmg: 400, color: 0x3ac8e8, effects: knock(2) }),
    },
  },

  // 39 ─ TOSHIRO HITSUGAYA ────────────────────────────────────────────────────
  {
    id: 'hitsugaya', name: 'Toshiro Hitsugaya', anime: 'bleach', rarity: 'common', role: 'Kontrolleur',
    desc: 'Jüngster Kommandant. Hyorinmaru: stärkstes Eis-Zanpakuto, das den Himmel beherrscht.',
    playstyle: 'Eisgeschosse verlangsamen. Die Super friert Gegner in Eissäulen ein. Als Erwachsener beherrscht er das Eis vollkommen.',
    stats: { hp: 3800, speed: 3.35, reload: 1.35, ammo: 3, superHits: 4 },
    sfx: 'ice', victory: 'swordUp',
    look: { skin: SKIN.light, hair: { style: 'hitsugaya', color: 0xeef2f8 }, eyes: { color: 0x3aa8c8, type: 'sharp' }, mouth: 'frown', top: SHIHAKUSHO, bottom: HAKAMA, extras: ['captainHaori'], weapon: { type: 'katana', color: 0xbfefff }, build: 'small' },
    main: P({ name: 'Hyorinmaru', desc: 'Eissplitter an der Kette: verlangsamt stark.', shape: 'ice', color: 0x9ae8ff, color2: 0xffffff, speed: 17, range: 7.5, dmg: 640, w: 0.3, effects: slow(1.5, 0.4), anim: 'slash', sfx: 'ice' }),
    super: A({ name: 'Sennen Hyoro', desc: 'Tausend Eissäulen umschließen das Gebiet und frieren Gegner ein.', range: 7, r: 2.6, dmg: 1400, landDelay: 0.5, fx: 'pillar', color: 0x9ae8ff, effects: { freeze: 1.6 }, anim: 'raise', sfx: 'ice' }),
    gadgets: [
      WALL({ name: 'Eiswand', desc: 'Eine Eiswand für 5 s.', len: 4, range: 2, t: 5, color: 0x9ae8ff, style: 'ice', sfx: 'ice' }),
      { kind: 'nova', name: 'Hyoten', desc: 'Eisige Kälte: Gegner im Umkreis werden verlangsamt.', r: 3.2, dmg: 400, color: 0x9ae8ff, effects: slow(2.5, 0.5), anim: 'raise', sfx: 'ice' },
    ],
    starPowers: [
      { name: 'Wunderkind', desc: 'Super lädt 20 % schneller.', type: 'stat', superRate: 1.2 },
      { name: 'Eispanzer', desc: '−15 % erlittener Schaden.', type: 'damageReduce', f: 0.15 },
    ],
    trans: {
      name: 'Daiguren Hyorinmaru (Erwachsen)', duration: 15, aura: 0x9ae8ff, aura2: 0xffffff, auraIntensity: 1.3,
      desc: 'Vollendetes Bankai: Hitsugaya ist erwachsen, mit Eisflügeln und Eisblumen. Hyoten Hyakkaso lässt Schneeblüten erblühen, die alles einfrieren.',
      look: { build: 'tall', hair: { style: 'hitsugayaAdult', color: 0xeef2f8 }, extrasAdd: ['wings', 'tail'], wingColor: 0xbfefff, tailColor: 0xbfefff, glow: 0x9ae8ff, mouth: 'flat' },
      stats: { hp: 1.2, dmg: 1.25, speed: 1.1, reload: 0.85 },
      main: P({ name: 'Eisdrachen-Welle', desc: 'Eine Eiswelle, die durchschlägt und verlangsamt.', shape: 'wave', color: 0x9ae8ff, color2: 0xffffff, speed: 16, range: 8.5, dmg: 720, w: 0.6, pierce: true, effects: slow(1.8, 0.45), anim: 'slash', sfx: 'ice' }),
      super: MULTI([
        A({ range: 8, r: 3.4, dmg: 1600, landDelay: 0.6, fx: 'pillar', color: 0xbfefff, effects: { freeze: 2.2 } }),
        A({ range: 8, r: 3.4, dmg: 0, landDelay: 0.6, fx: 'ring', color: 0xffffff, linger: { t: 3, tick: 0.5, dmg: 180, color: 0xbfefff, effects: slow(0.6, 0.5) } }),
      ], { name: 'Hyoten Hyakkaso', desc: 'Hundert Eisblumen erblühen: langes Einfrieren und ein eisiges Feld.', anim: 'raise', sfx: 'ice' }),
      onEnter: N({ r: 3.2, dmg: 400, color: 0x9ae8ff, effects: slow(2, 0.5) }),
    },
  },

  // 40 ─ YAMAMOTO ─────────────────────────────────────────────────────────────
  {
    id: 'yamamoto', name: 'Genryusai Yamamoto', anime: 'bleach', rarity: 'mythic', role: 'Zerstörer',
    desc: 'Generalkommandant. Ryujin Jakka ist das älteste und stärkste Feuer-Zanpakuto.',
    playstyle: 'Flammenhiebe mit Brand, eine Feuer-Aura um ihn. Im Bankai verschwinden die Flammen — und alles in seiner Nähe verdampft.',
    stats: { hp: 5100, speed: 3.1, reload: 1.45, ammo: 3, superHits: 4 },
    sfx: 'fire', victory: 'armsCrossed',
    passive: [{ type: 'burnAura', r: 1.8, dps: 140 }],
    look: { skin: SKIN.tan, hair: { style: 'none' }, eyes: { type: 'closed' }, marks: ['beard', 'yamamotoScar'], beardColor: 0xe8e8ee, browColor: 0xe8e8ee, mouth: 'flat', top: SHIHAKUSHO, bottom: HAKAMA, extras: ['captainHaori'], weapon: { type: 'katana', color: 0xff8a3a, emissive: 0xff5a1a }, build: 'muscle' },
    main: C({ name: 'Ryujin Jakka', desc: 'Flammenhieb, der in Brand setzt.', range: 2.4, arc: 120, dmg: 780, color: 0xff6a1a, effects: burn(320, 2), anim: 'slash', sfx: 'fire' }),
    super: DOM({ name: 'Jokaku Enjo', desc: 'Eine Feuerwand umschließt das Gebiet: Wer drin ist, verbrennt und kann nicht entkommen.', title: 'JOKAKU ENJO', subtitle: 'Ryujin Jakka', r: 4, t: 4, dps: 700, color: 0xff6a1a, color2: 0xffe08a, particle: 0xff6a1a, trap: true, sfx: 'fireBig' }),
    gadgets: [
      P({ name: 'Ikkotsu', desc: 'Ein Faustschlag aus purer Kraft.', shape: 'fist', color: 0xebb68c, color2: 0xffe08a, size: 0.5, speed: 16, range: 4, dmg: 1200, w: 0.5, effects: knock(3), anim: 'punch', sfx: 'heavyPunch' }),
      A({ name: 'Taimatsu', desc: 'Eine Flammenexplosion an der Schnittstelle.', range: 6, r: 1.8, dmg: 1000, landDelay: 0.4, fx: 'explode', color: 0xff6a1a, effects: burn(400, 2), sfx: 'fire' }),
    ],
    starPowers: [
      { name: 'Generalkommandant', desc: 'Feuer-Aura doppelt so stark.', type: 'burnAura', r: 1.8, dps: 140 },
      { name: 'Tausend Jahre', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
    ],
    trans: {
      name: 'Bankai: Zanka no Tachi', duration: 14, aura: 0xffe08a, aura2: 0xff6a1a, auraIntensity: 1.4,
      desc: 'Alle Flammen ziehen sich in die Klinge zurück: 15 Millionen Grad. Die Aura verbrennt alles im Umkreis, jeder Hieb löscht aus.',
      look: { top: { type: 'bare' }, extrasRemove: ['captainHaori'], weapon: { type: 'katana', color: 0x3a2a1a, emissive: 0xff3a1a }, eyes: { type: 'sharp', color: 0x1a1a1a }, skin: 0xd8956a },
      stats: { dmg: 1.4, speed: 1.08, hp: 1.1 },
      passive: [{ type: 'burnAura', r: 2.8, dps: 420 }],
      main: C({ name: 'Zanka no Tachi: Ost — Kyokujitsujin', desc: 'Ein flammenloser Hieb, der alles auf seiner Bahn auslöscht.', range: 3.0, arc: 70, dmg: 1500, color: 0xffe08a, breakWalls: true, effects: burn(500, 2), anim: 'slash', sfx: 'slashBig' }),
      super: N({ name: 'Zanka no Tachi: West — Zanjitsu Gokui', desc: 'Die gesamte Hitze bricht aus: eine gewaltige Feuerexplosion um Yamamoto.', r: 5, dmg: 3200, color: 0xff6a1a, color2: 0xffe08a, breakWalls: true, effects: fx(knock(3), burn(700, 3)), anim: 'raise', sfx: 'explodeBig' }),
      onEnter: N({ r: 3.6, dmg: 600, color: 0xff6a1a, effects: burn(400, 2) }),
    },
  },
];

import { P, C, D, BM, A, N, DOM, SUM, BUF, BL, WALL, HOOK, TRAP, SEQ, MULTI, CU, slow, stun, knock, pull, burn, fx, SKIN } from './helpers.js';

export default [
  // 41 ─ LUFFY ────────────────────────────────────────────────────────────────
  {
    id: 'luffy', name: 'Monkey D. Luffy', anime: 'op', rarity: 'divine', role: 'Gummi-Kämpfer',
    desc: 'Kapitän der Strohhut-Piraten. Sein Gummikörper dehnt sich — und Gear 5 macht ihn zum Krieger der Befreiung.',
    playstyle: 'Gum-Gum Pistol trifft auf Distanz und kehrt zurück. Gear 5 bricht alle Regeln: Luffy packt Gegner, schleudert sie wie Gummi und verwandelt den Boden in Trampolin.',
    stats: { hp: 4800, speed: 3.45, reload: 1.2, ammo: 3, superHits: 4 },
    sfx: 'rubber', victory: 'laugh',
    passive: [{ type: 'rubber', name: 'Gummikörper' }],
    look: { skin: SKIN.fair, hair: { style: 'luffy', color: 0x101014 }, eyes: { color: 0x1a1a1a }, marks: ['scarCheek'], mouth: 'grin', top: { type: 'open', color: 0xd2232a, sleeves: 'short' }, bottom: { type: 'shorts', color: 0x3a5ab8 }, extras: ['strawhat'], shoes: 0xc8a06a, build: 'normal' },
    main: P({ name: 'Gum-Gum Pistol', desc: 'Der Arm schnellt vor und kehrt zurück — trifft auf dem Hin- und Rückweg.', shape: 'fist', color: 0xffd2ad, color2: 0xffffff, size: 0.36, speed: 22, range: 6.5, dmg: 640, w: 0.36, boomerang: true, pierce: true, trail: false, anim: 'punch', sfx: 'rubber' }),
    super: P({ name: 'Gum-Gum Gatling', desc: 'Ein Hagel aus elf Faustschlägen im Fächer.', shape: 'fist', color: 0xffd2ad, size: 0.3, count: 11, spread: 46, speed: 21, range: 5.5, dmg: 340, w: 0.3, trail: false, anim: 'flurry', animDur: 0.7, sfx: 'punchBarrage' }),
    gadgets: [
      BUF({ name: 'Gear Second', desc: 'Dampf steigt auf: +40 % Tempo und +20 % Schaden für 3 s.', buff: { speed: 0.4, dmg: 0.2, t: 3, color: 0xff7a7a }, sfx: 'steam' }),
      P({ name: 'Gear Third: Elephant Gun', desc: 'Eine riesige aufgeblasene Faust mit Rückstoß.', shape: 'fist', color: 0x2a2a2a, color2: 0xff3a3a, size: 0.9, speed: 15, range: 6, dmg: 1400, w: 0.8, pierce: true, breakWalls: true, effects: knock(2.5), trail: false, anim: 'punch', sfx: 'heavyPunch' }),
    ],
    starPowers: [
      { name: 'Haki des Königs', desc: 'Super-Treffer betäuben 0,3 s.', type: 'onHitEffect', effects: stun(0.3), kinds: ['super'] },
      { name: 'Fleisch!', desc: 'Jeder Kill heilt 40 %.', type: 'killHeal', f: 0.4 },
    ],
    trans: {
      name: 'Gear 5', duration: 16, aura: 0xffffff, aura2: 0xffe8a0, auraStyle: 'flame', auraIntensity: 1.5,
      desc: 'Der Sonnengott Nika. Weißes Wolkenhaar, ein Lachen, das die Welt erschüttert. Cartoon-Physik: Er greift Gegner und schleudert sie, sein Körper federt, seine Faust wird gigantisch.',
      look: { hair: { style: 'gear5', color: 0xf8f8ff }, skin: 0xfff4ea, top: { type: 'open', color: 0xf8f8ff, sleeves: 'short' }, bottom: { type: 'shorts', color: 0xf8f8ff }, eyes: { type: 'normal', color: 0xffcf3a }, mouth: 'grin', marksAdd: ['gear5'], extrasRemove: ['strawhat'], extrasAdd: ['strawhatBack', 'cape'], capeColor: 0xf8f8ff, glow: 0xffffff, browColor: 0xf0f0f8 },
      stats: { speed: 1.22, dmg: 1.2, reload: 0.75, hp: 1.1 },
      passive: [{ type: 'rubber' }, { type: 'unstoppable' }, { type: 'dodge', chance: 0.12 }],
      main: CU('gear5Grab', { name: 'Gum-Gum Griff & Schleuder', desc: 'Die Hand dehnt sich, packt den ersten Gegner, zieht ihn heran und schmettert ihn mit Cartoon-Wucht in den Boden.', dmg: 820, range: 7, anim: 'throw', sfx: 'rubber' }),
      super: P({ name: 'Gum-Gum Bajrang Gun', desc: 'Eine Faust so groß wie ein Haus: walzt alles nieder, durchbricht jede Wand.', shape: 'fist', color: 0xfff4ea, color2: 0xffe8a0, size: 2.2, speed: 11, range: 13, dmg: 3000, w: 1.9, pierce: true, pierceWalls: true, breakWalls: true, effects: fx(knock(3), stun(0.6)), trail: false, anim: 'raise', animDur: 0.8, sfx: 'bajrang', delay: 0.35 }),
      onEnter: MULTI([N({ r: 3.6, dmg: 400, color: 0xffffff, effects: fx(knock(2.4), stun(0.4)) })]),
    },
  },

  // 42 ─ ZORO ─────────────────────────────────────────────────────────────────
  {
    id: 'zoro', name: 'Roronoa Zoro', anime: 'op', rarity: 'legendary', role: 'Schwertkämpfer',
    desc: 'Drei-Schwerter-Stil. Will der größte Schwertkämpfer der Welt werden — und verläuft sich trotzdem ständig.',
    playstyle: 'Drei Hiebe pro Angriff im Nahkampf. Im King-of-Hell-Modus werden seine Schnitte zu fliegenden Klingen, die Wände zerschneiden.',
    stats: { hp: 5000, speed: 3.35, reload: 1.25, ammo: 3, superHits: 4 },
    sfx: 'slash', victory: 'swordUp',
    look: { skin: SKIN.tan, hair: { style: 'zoro', color: 0x4a9a4a }, eyes: { color: 0x1a1a1a, type: 'sharp' }, marks: ['scarEye'], mouth: 'smirk', top: { type: 'kimono', color: 0x2a5a3a, color2: 0xc8202a, sleeves: 'long' }, bottom: { type: 'pants', color: 0x2a3a2a }, extras: ['sheaths', 'earrings'], sheathCount: 3, weapon: { type: 'katana', dual: true, mouth: true }, build: 'muscle' },
    main: C({ name: 'Drei-Schwerter-Stil: Tatsumaki', desc: 'Drei schnelle Hiebe in weitem Bogen.', range: 2.1, arc: 130, dmg: 380, hits: 3, gap: 0.08, color: 0xdfe6f0, anim: 'flurry', sfx: 'slash' }),
    super: D({ name: 'Oni Giri', desc: 'Durchquert die Gegner mit einem Dreifach-Kreuzschnitt.', dist: 6, speed: 24, dmg: 2000, w: 1.0, color: 0xdfe6f0, invuln: true, effects: knock(1), anim: 'dash', sfx: 'slashBig' }),
    gadgets: [
      P({ name: '36 Pfund-Kanone', desc: 'Eine fliegende Schwertwelle.', shape: 'slash', color: 0xbfe6ff, speed: 18, range: 8, dmg: 900, w: 0.5, pierce: true, anim: 'slash', sfx: 'slash' }),
      BUF({ name: 'Verlaufen', desc: 'Zoro „verläuft“ sich: 2 s unsichtbar und schneller.', buff: { invis: 2, speed: 0.3, t: 2, color: 0x4a9a4a }, sfx: 'whoosh' }),
    ],
    starPowers: [
      { name: 'Kein Schmerz', desc: 'Überlebt einmal einen tödlichen Treffer mit 25 % LP.', type: 'reviveOnce', hp: 0.25 },
      { name: 'Haki-Klingen', desc: '+12 % Schaden.', type: 'stat', dmg: 1.12 },
    ],
    trans: {
      name: 'King of Hell', duration: 15, aura: 0x1a0a14, aura2: 0xff2a3a, auraIntensity: 1.6,
      desc: 'Enma saugt sein Haki: eine dunkle, rote Höllenaura. Fliegende Schnitte zerteilen Wände; die Super ist Ashura — neun Schwerter, drei Köpfe.',
      look: { eyes: { type: 'glow', color: 0xff2a3a }, glow: 0xff2a3a, top: { type: 'open', color: 0x2a5a3a, sleeves: 'long' }, weapon: { type: 'katana', color: 0x2a1a2a, emissive: 0xff2a3a, dual: true, mouth: true } },
      stats: { dmg: 1.3, speed: 1.1, reload: 0.8 },
      passive: [{ type: 'lifesteal', f: 0.1 }],
      main: P({ name: 'Höllen-Schnittwellen', desc: 'Drei fliegende Schnitte, die durch Wände gehen.', shape: 'slash', color: 0xff2a3a, color2: 0x1a0a14, count: 3, spread: 24, speed: 18, range: 8, dmg: 460, w: 0.45, pierce: true, pierceWalls: true, anim: 'flurry', sfx: 'slash' }),
      super: SEQ([
        { at: 0, do: SUM({ count: 2, dist: 0.6, unit: { name: 'Ashura-Spiegelbild', hp: 1500, life: 2.5, speed: 6, rate: 0.35, ghost: true, look: 'owner', color: 0xff2a3a, attack: C({ range: 2.2, arc: 140, dmg: 600, color: 0xff2a3a }) } }) },
        { at: 0.1, do: D({ dist: 7, speed: 26, dmg: 3000, w: 1.3, color: 0xff2a3a, invuln: true, breakWalls: true, effects: knock(2) }) },
      ], { name: 'Ashura: Ichibugin', desc: 'Neun Schwerter, drei Köpfe: Zoro und zwei Höllenspiegelbilder schneiden durch alles.', anim: 'dash', sfx: 'slashBig' }),
      onEnter: N({ r: 3.4, dmg: 500, color: 0xff2a3a, effects: knock(2.2) }),
    },
  },

  // 43 ─ SANJI ────────────────────────────────────────────────────────────────
  {
    id: 'sanji', name: 'Vinsmoke Sanji', anime: 'op', rarity: 'epic', role: 'Kämpfer',
    desc: 'Koch der Strohhüte. Kämpft nur mit den Beinen — seine Hände sind für die Küche.',
    playstyle: 'Schnelle Tritte mit weitem Radius. Diable Jambe entzündet die Beine, Ifrit Jambe macht die Flammen blau und brennt durch alles.',
    stats: { hp: 4500, speed: 3.55, reload: 1.1, ammo: 3, superHits: 4 },
    sfx: 'kick', victory: 'bow',
    look: { skin: SKIN.fair, hair: { style: 'sanji', color: 0xffe06a }, eyes: { color: 0x3a6adf }, mouth: 'smirk', top: { type: 'suit', color: 0x1a1a24, color2: 0x3a6adf, sleeves: 'long', buttons: true }, bottom: { type: 'pants', color: 0x1a1a24 }, build: 'slim', browColor: 0xffc83a },
    main: C({ name: 'Collier Shoot', desc: 'Weiter Tritt, der zwei Mal trifft.', range: 2.0, arc: 140, dmg: 520, hits: 2, gap: 0.1, lunge: 0.5, color: 0xffe0a0, anim: 'kick', sfx: 'kick' }),
    super: D({ name: 'Diable Jambe: Flanchet Shoot', desc: 'Brennender Flugtritt, der Gegner in Brand setzt.', dist: 6, speed: 22, dmg: 1400, w: 0.9, color: 0xff6a1a, effects: fx(knock(2), burn(400, 2)), anim: 'kick', sfx: 'fire' }),
    gadgets: [
      BUF({ name: 'Sky Walk', desc: 'Läuft durch die Luft: +45 % Tempo für 2,5 s.', buff: { speed: 0.45, t: 2.5, color: 0xffe0a0 }, sfx: 'whoosh' }),
      BUF({ name: 'Bento', desc: 'Heilt Sanji und Verbündete im Umkreis um 1200.', allies: true, r: 4, buff: { heal: 1200, color: 0x7cff7a }, sfx: 'heal' }),
    ],
    starPowers: [
      { name: 'Raid Suit', desc: '15 % Ausweichchance.', type: 'dodge', chance: 0.15 },
      { name: 'Koch', desc: 'Heilungen +25 %.', type: 'healBoost', mult: 1.25 },
    ],
    trans: {
      name: 'Ifrit Jambe', duration: 15, aura: 0x3a8aff, aura2: 0xffffff, auraIntensity: 1.6,
      desc: 'Blaue Flammen aus dem ganzen Körper — nicht nur aus den Beinen. Die Hitze brennt jeden Treffer tief ein.',
      look: { glow: 0x3a8aff, eyes: { type: 'sharp', color: 0x3a6adf }, top: { type: 'shirt', color: 0x1a1a24, sleeves: 'long', buttons: true }, skin: 0xffd8b8 },
      stats: { speed: 1.18, dmg: 1.25, reload: 0.75 },
      passive: [{ type: 'onHitEffect', effects: burn(450, 2), kinds: ['main'] }, { type: 'burnAura', r: 1.4, dps: 160 }],
      main: C({ name: 'Blauer Flammentritt', desc: 'Drei blaue Flammentritte mit großem Vorwärtsschwung.', range: 2.2, arc: 140, dmg: 440, hits: 3, gap: 0.08, lunge: 0.9, color: 0x3a8aff, anim: 'kick', sfx: 'fire' }),
      super: SEQ([
        { at: 0, do: D({ dist: 5, speed: 26, dmg: 900, w: 1.0, color: 0x3a8aff }) },
        { at: 0.25, do: N({ r: 3.4, dmg: 2200, color: 0x3a8aff, color2: 0xffffff, effects: fx(knock(2.6), burn(700, 3)) }) },
      ], { name: 'Hell Memories', desc: 'Sturm vorwärts, dann eine Explosion aus blauen Höllenflammen.', anim: 'kick', sfx: 'fireBig' }),
      onEnter: N({ r: 3, dmg: 400, color: 0x3a8aff, effects: burn(400, 2) }),
    },
  },

  // 44 ─ SHANKS ───────────────────────────────────────────────────────────────
  {
    id: 'shanks', name: 'Shanks', anime: 'op', rarity: 'mythic', role: 'Haki-Meister',
    desc: 'Einer der vier Kaiser. Einarmig, mit dem stärksten Königshaki der Welt.',
    playstyle: 'Sein Haki lässt Gegner bei jedem Treffer kurz erstarren. Die Super lähmt schwache Gegner sofort — der stärkste Druck im Spiel.',
    stats: { hp: 4700, speed: 3.3, reload: 1.3, ammo: 3, superHits: 4 },
    sfx: 'haki', victory: 'laugh',
    passive: [{ type: 'onHitEffect', effects: stun(0.15), kinds: ['main'], chance: 0.35 }],
    look: { skin: SKIN.fair, hair: { style: 'shanks', color: 0xc8202a }, eyes: { color: 0x1a1a1a }, marks: ['scarEye', 'stubble'], mouth: 'smile', top: { type: 'open', color: 0xf2f2f4, sleeves: 'long' }, bottom: { type: 'pants', color: 0x6a5a4a }, extras: ['shoulderCape'], capeColor: 0x14141c, weapon: { type: 'katana', color: 0x1a1a1a, rim: 0xff3a3a }, build: 'muscle' },
    main: C({ name: 'Gryphon-Hieb', desc: 'Ein von Haki umhüllter Schnitt.', range: 2.3, arc: 110, dmg: 840, color: 0xff3a3a, anim: 'slash', sfx: 'slash' }),
    super: N({ name: 'Königshaki', desc: 'Der Wille eines Kaisers: Alle Gegner im großen Umkreis sind 1,6 s gelähmt.', r: 5, dmg: 700, color: 0x1a0a0a, color2: 0xff3a3a, effects: stun(1.6), anim: 'raise', sfx: 'haki' }),
    gadgets: [
      P({ name: 'Fliegender Haki-Schnitt', desc: 'Eine durchschlagende Haki-Welle.', shape: 'slash', color: 0xff3a3a, color2: 0x1a0a0a, speed: 19, range: 8.5, dmg: 950, w: 0.5, pierce: true, anim: 'slash', sfx: 'slash' }),
      BUF({ name: 'Vorahnung', desc: 'Observationshaki: 40 % Ausweichen für 3 s.', buff: { dodge: 0.4, t: 3, color: 0xff3a3a }, sfx: 'haki' }),
    ],
    starPowers: [
      { name: 'Kaiser', desc: 'Super lädt 15 % schneller.', type: 'stat', superRate: 1.15 },
      { name: 'Ruhige Hand', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
    ],
    trans: {
      name: 'Haki-Entfesselung', duration: 15, aura: 0x1a0a0a, aura2: 0xff3a3a, auraStyle: 'spark', auraIntensity: 1.8,
      desc: 'Rote Blitze aus Königshaki zucken um Shanks. Jeder Schnitt trägt Haki über weite Distanzen — Kamusari spaltet die Arena.',
      look: { eyes: { type: 'sharp', color: 0x1a1a1a }, glow: 0xff3a3a, weapon: { type: 'katana', color: 0x1a1a1a, emissive: 0xff1a1a } },
      stats: { dmg: 1.3, speed: 1.1, reload: 0.8 },
      passive: [{ type: 'onHitEffect', effects: stun(0.25), kinds: ['main'], chance: 0.6 }],
      main: P({ name: 'Haki-Klingenwelle', desc: 'Eine rot-schwarze Welle mit Kaiser-Druck.', shape: 'wave', color: 0xff3a3a, color2: 0x1a0a0a, speed: 19, range: 9, dmg: 820, w: 0.6, pierce: true, anim: 'slash', sfx: 'slash' }),
      super: MULTI([
        N({ r: 5.5, dmg: 600, color: 0xff3a3a, effects: stun(1.2) }),
        P({ shape: 'wave', color: 0xff3a3a, color2: 0x1a0a0a, size: 1.8, speed: 20, range: 14, dmg: 2600, w: 1.4, pierce: true, pierceWalls: true, breakWalls: true, effects: knock(2.5), delay: 0.4 }),
      ], { name: 'Kamusari', desc: 'Königshaki lähmt alle, dann spaltet ein göttlicher Schnitt die Arena.', anim: 'overhead', sfx: 'slashBig' }),
      onEnter: N({ r: 4, dmg: 400, color: 0xff3a3a, effects: stun(0.8) }),
    },
  },

  // 45 ─ KAIDO ────────────────────────────────────────────────────────────────
  {
    id: 'kaido', name: 'Kaido', anime: 'op', rarity: 'legendary', role: 'Panzer',
    desc: 'Das stärkste Geschöpf der Welt. Ein Kaiser, der sich in einen gewaltigen blauen Drachen verwandelt.',
    playstyle: 'Massiver Kanabo im Nahkampf. Als Drache verändert sich alles: Er fliegt über Wasser, speit Feuer und wirbelt Windklingen.',
    stats: { hp: 7200, speed: 3.0, reload: 1.45, ammo: 3, superHits: 4 },
    sfx: 'heavyPunch', victory: 'laugh',
    look: { skin: SKIN.tan, hair: { style: 'kaido', color: 0x14141c }, eyes: { color: 0x1a1a1a, type: 'sharp' }, mouth: 'grin', top: { type: 'open', color: 0x6a3aa8, sleeves: 'none' }, bottom: { type: 'pants', color: 0xf2f2f4 }, extras: ['hornsBig', 'cape'], hornColor: 0xf2f2f4, capeColor: 0x6a3aa8, weapon: { type: 'club', color: 0x4a3a5a }, build: 'titan' },
    main: C({ name: 'Kanabo-Schwung', desc: 'Massiver Keulenschlag mit Rückstoß.', range: 2.5, arc: 120, dmg: 1150, color: 0xd8b84a, effects: knock(1.5), anim: 'overhead', sfx: 'heavyPunch' }),
    super: D({ name: 'Thunder Bagua', desc: 'Sturm vorwärts, dann ein vernichtender Keulenschlag.', dist: 5, speed: 18, dmg: 600, w: 1.0, color: 0xd8b84a, stopOnHit: true, end: A({ self: true, r: 2.6, landDelay: 0, dmg: 2200, fx: 'lightning', color: 0xffe84a, breakWalls: true, effects: fx(knock(2.5), stun(0.6)) }), sfx: 'dash' }),
    gadgets: [
      BUF({ name: 'Sake', desc: 'Betrunkener Zustand: 30 % Schadensreduktion für 4 s.', buff: { dr: 0.3, t: 4, color: 0xd8b84a }, sfx: 'powerup' }),
      { kind: 'nova', name: 'Brüllen', desc: 'Ein Gebrüll, das nahe Gegner betäubt.', r: 2.8, dmg: 400, color: 0xd8b84a, effects: stun(0.7), anim: 'raise', sfx: 'roar' },
    ],
    starPowers: [
      { name: 'Unsterblich', desc: '−15 % erlittener Schaden.', type: 'damageReduce', f: 0.15 },
      { name: 'Drachenschuppen', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
    ],
    trans: {
      name: 'Drachenform', duration: 16, aura: 0x6a8aff, aura2: 0xffe84a, auraIntensity: 1.2,
      desc: 'Ein gigantischer blauer Drache. Fliegt über Wasser und Seile, speit Bolo Breath und entfesselt Windklingen.',
      look: { rig: 'dragon', color: 0x4a6ad8, belly: 0xe8d9a8 },
      stats: { hp: 1.2, dmg: 1.2, speed: 1.15 },
      passive: [{ type: 'flying' }, { type: 'unstoppable' }],
      main: P({ name: 'Kaifu (Windklingen)', desc: 'Drei Windsicheln, die durch Gegner schneiden.', shape: 'slash', color: 0xd8f0ff, count: 3, spread: 30, speed: 16, range: 8, dmg: 480, w: 0.5, pierce: true, anim: 'cast', sfx: 'wind' }),
      super: BM({ name: 'Bolo Breath', desc: 'Ein gewaltiger Hitzestrahl aus dem Maul.', range: 11, w: 1.0, dmg: 380, ticks: 8, gap: 0.09, charge: 0.4, color: 0xff7a2a, color2: 0xffe84a, breakWalls: true, effects: fx(knock(2), burn(400, 2)), anim: 'beam', animDur: 1.2, sfx: 'fireBig' }),
      onEnter: N({ r: 3.8, dmg: 600, color: 0x6a8aff, breakWalls: true, effects: knock(2.6) }),
    },
  },

  // 46 ─ KATAKURI ─────────────────────────────────────────────────────────────
  {
    id: 'katakuri', name: 'Charlotte Katakuri', anime: 'op', rarity: 'epic', role: 'Kontrolleur',
    desc: 'Süßer Kommandant. Mochi-Kräfte und ein Observationshaki, das wenige Sekunden in die Zukunft blickt.',
    playstyle: 'Future Sight blockt alle 5 s einen Treffer. Mochi verlangsamt und fesselt — als Erwachter wird der Boden selbst zu Mochi.',
    stats: { hp: 5000, speed: 3.2, reload: 1.35, ammo: 3, superHits: 4 },
    sfx: 'mochi', victory: 'armsCrossed',
    passive: [{ type: 'futureSight', cd: 5 }],
    look: { skin: SKIN.fair, hair: { style: 'katakuri', color: 0x8a1a3a }, eyes: { color: 0x8a1a3a, type: 'sharp' }, marks: ['mask'], maskColor: 0x2a1a2a, mouth: 'flat', top: { type: 'coat', color: 0x2a1a2a, color2: 0x8a1a3a, sleeves: 'long', collar: true }, bottom: { type: 'pants', color: 0x2a1a2a }, extras: ['scarf'], scarfColor: 0x3a1a2a, weapon: { type: 'spear', color: 0xf2f0ea }, build: 'giant' },
    main: P({ name: 'Mochi-Speer', desc: 'Ein Speer aus Mochi, der festklebt und verlangsamt.', shape: 'spike', color: 0xf8f4ea, color2: 0xffffff, speed: 17, range: 7.5, dmg: 700, w: 0.32, effects: slow(1.5, 0.4), trail: false, anim: 'throw', sfx: 'mochi' }),
    super: A({ name: 'Mochi-Falle', desc: 'Ein Mochi-Netz fesselt alle Gegner im Gebiet.', range: 7, r: 2.4, dmg: 1000, landDelay: 0.4, fx: 'ring', color: 0xf8f4ea, effects: { root: 2 }, anim: 'point', sfx: 'mochi' }),
    gadgets: [
      BUF({ name: 'Mochi-Körper', desc: '−40 % Schaden für 3 s.', buff: { dr: 0.4, t: 3, color: 0xf8f4ea }, sfx: 'mochi' }),
      HOOK({ name: 'Mochi-Peitsche', desc: 'Zieht den Gegner heran.', shape: 'fist', color: 0xf8f4ea, speed: 18, range: 6.5, dmg: 500, w: 0.4, sfx: 'mochi' }),
    ],
    starPowers: [
      { name: 'Perfektion', desc: 'Future Sight alle 3,5 s.', type: 'futureSight', cd: 3.5 },
      { name: 'Ältester Bruder', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
    ],
    trans: {
      name: 'Erwachen: Mochi-Welt', duration: 15, aura: 0xf8f4ea, aura2: 0x8a1a3a,
      desc: 'Der Boden selbst wird zu Mochi: Fäuste schießen aus der Erde, und der Mochi-Donut walzt alles platt.',
      look: { glow: 0xf8f4ea, marksRemove: ['mask'], mouth: 'fangs', eyes: { type: 'demon', color: 0x8a1a3a } },
      stats: { dmg: 1.2, speed: 1.1, reload: 0.8 },
      passive: [{ type: 'futureSight', cd: 2.5 }],
      main: A({ name: 'Mochi-Erdfaust', desc: 'Eine Mochi-Faust schießt an der Zielstelle aus dem Boden.', range: 8, r: 1.5, dmg: 900, landDelay: 0.25, fx: 'pillar', color: 0xf8f4ea, effects: fx(knock(1), slow(1, 0.4)), anim: 'point', sfx: 'mochi' }),
      super: D({ name: 'Buzz Cut Mochi', desc: 'Ein rotierender Mochi-Donut aus Klingen walzt durch die Gegner.', dist: 8, speed: 16, dmg: 2400, w: 1.3, color: 0xf8f4ea, invuln: true, breakWalls: true, effects: knock(2), anim: 'spin', sfx: 'mochi' }),
      onEnter: N({ r: 3.2, dmg: 400, color: 0xf8f4ea, effects: slow(2, 0.5) }),
    },
  },

  // 47 ─ TRAFALGAR LAW ────────────────────────────────────────────────────────
  {
    id: 'law', name: 'Trafalgar Law', anime: 'op', rarity: 'super_rare', role: 'Taktiker',
    desc: 'Chirurg des Todes. In seinem ROOM kann er alles schneiden, tauschen und neu anordnen.',
    playstyle: 'Die Super öffnet einen ROOM. Darin wird dein Hauptangriff zu Amputate (durch Wände) und das Gadget Shambles tauscht Positionen. Außerhalb kämpfst du mit dem Nodachi.',
    stats: { hp: 4200, speed: 3.35, reload: 1.3, ammo: 3, superHits: 3 },
    sfx: 'slash', victory: 'armsCrossed',
    look: { skin: SKIN.tan, hair: { style: 'law', color: 0x14141c }, eyes: { color: 0xc8a020, type: 'sharp' }, marks: ['tattoos', 'stubble'], mouth: 'smirk', top: { type: 'hoodie', color: 0xf2d24a, color2: 0x1a1a1a, sleeves: 'long' }, bottom: { type: 'pants', color: 0x6a5a4a }, extras: ['furHat', 'earrings'], weapon: { type: 'nodachi' }, build: 'tall' },
    main: CU('lawCut', { name: 'Kikoku / Amputate', desc: 'Außerhalb des ROOM: weiter Nodachi-Schnitt. Im ROOM: Amputate — ein Schnitt bis zum ROOM-Rand durch Wände.', dmg: 760, anim: 'slash', sfx: 'slash' }),
    super: CU('lawRoom', { name: 'ROOM', desc: 'Öffnet einen blauen Raum (Radius 5) für 7 s. Darin: Amputate, Shambles und Gegner sind verlangsamt.', r: 5, t: 7, anim: 'raise', sfx: 'room' }),
    gadgets: [
      CU('shambles', { name: 'Shambles', desc: 'Tauscht die Position mit dem nächsten Gegner (nur im ROOM, sonst Mini-ROOM).', anim: 'point', sfx: 'room' }),
      BUF({ name: 'Scan', desc: 'Operiert sich selbst: heilt 1300 LP.', buff: { heal: 1300, color: 0x6ac8ff }, sfx: 'heal' }),
    ],
    starPowers: [
      { name: 'Chirurg', desc: 'ROOM-Radius +1.', type: 'roomBoost', add: 1 },
      { name: 'Unsterblichkeits-OP', desc: 'Überlebt einmal einen tödlichen Treffer mit 25 % LP.', type: 'reviveOnce', hp: 0.25 },
    ],
    trans: {
      name: 'Erwachen: K-ROOM', duration: 14, aura: 0x6ac8ff, aura2: 0xffffff, auraStyle: 'spark',
      desc: 'Das Erwachen: Der ROOM wird zur Klinge selbst. Puncture Wille durchbohrt alles; Shock Wille zerstört von innen.',
      look: { glow: 0x6ac8ff, weapon: { type: 'nodachi', color: 0xbfefff, emissive: 0x3a8aff } },
      stats: { dmg: 1.25, speed: 1.1, reload: 0.8 },
      main: BM({ name: 'Puncture Wille', desc: 'Der ROOM verdichtet sich zu einem Stich, der alles durchbohrt.', range: 10, w: 0.35, dmg: 1050, ticks: 1, charge: 0.12, color: 0x6ac8ff, color2: 0xffffff, pierceWalls: true, anim: 'point', animDur: 0.35, sfx: 'beam' }),
      super: D({ name: 'Shock Wille', desc: 'Ein Stoß, dessen Schockwelle innerlich zerstört: ignoriert Schilde, betäubt lang.', dist: 6, speed: 26, dmg: 2600, w: 1.0, color: 0x6ac8ff, stopOnHit: true, effects: fx(stun(1.5), { breakShield: true, trueDmg: true }), end: N({ r: 2.4, dmg: 800, color: 0x6ac8ff, effects: stun(0.6) }), anim: 'punch', sfx: 'thunderBig' }),
      onEnter: CU('lawRoom', { r: 6, t: 14 }),
    },
  },

  // 48 ─ DOFLAMINGO ───────────────────────────────────────────────────────────
  {
    id: 'doflamingo', name: 'Donquixote Doflamingo', anime: 'op', rarity: 'mythic', role: 'Kontrolleur',
    desc: 'Himmelsdrache und Marionettenspieler. Seine Fäden schneiden Stahl und kontrollieren Körper.',
    playstyle: 'Fünf Fäden im Fächer. Birdcage sperrt Gegner ein und schneidet sie langsam. Als Erwachter wird die ganze Arena zu Fäden.',
    stats: { hp: 4400, speed: 3.35, reload: 1.35, ammo: 3, superHits: 4 },
    sfx: 'string', victory: 'laugh',
    look: { skin: SKIN.tan, hair: { style: 'doflamingo', color: 0xffe06a }, eyes: { color: 0x1a1a1a }, mouth: 'grin', top: { type: 'open', color: 0xf2f2f4, sleeves: 'short' }, bottom: { type: 'pants', color: 0xff8a3a }, extras: ['featherCoat', 'sunglasses', 'cape'], capeColor: 0xff5fae, glassesColor: 0xc83a6a, build: 'tall' },
    main: P({ name: 'Goshikito', desc: 'Fünf Fäden schneiden im Fächer.', shape: 'string', color: 0xffffff, count: 5, spread: 34, speed: 22, range: 7.5, dmg: 260, w: 0.2, pierce: true, anim: 'point', sfx: 'string' }),
    super: DOM({ name: 'Birdcage', desc: 'Ein Käfig aus Fäden: Gegner können nicht hinaus und werden ständig geschnitten.', title: 'BIRDCAGE', subtitle: 'Torikago', r: 4.2, t: 4.5, dps: 650, color: 0xffffff, color2: 0xff5fae, particle: 0xffffff, trap: true, slashFx: true, sfx: 'string' }),
    gadgets: [
      HOOK({ name: 'Parasite', desc: 'Ein Faden kontrolliert den Körper: Ziel wird herangezogen und 1 s betäubt.', shape: 'string', color: 0xffffff, speed: 22, range: 7, dmg: 300, w: 0.3, effects: stun(1), sfx: 'string' }),
      BL({ name: 'Wolkenfaden', desc: 'Zieht sich an Fäden durch die Luft.', dist: 'aim', maxDist: 5.5, color: 0xff5fae, sfx: 'whoosh' }),
    ],
    starPowers: [
      { name: 'Himmelsdrache', desc: '+12 % Schaden.', type: 'stat', dmg: 1.12 },
      { name: 'Fadenchirurgie', desc: 'Heilt 70 LP/s.', type: 'regen', amt: 70, delay: 0 },
    ],
    trans: {
      name: 'Erwachen: Fadenwelt', duration: 15, aura: 0xffffff, aura2: 0xff5fae, auraStyle: 'spark',
      desc: 'Die Umgebung wird zu Fäden. Fadenwellen walzen über den Boden; God Thread durchbohrt die Arena.',
      look: { glow: 0xff5fae, mouth: 'fangs' },
      stats: { dmg: 1.2, reload: 0.8, speed: 1.1 },
      main: P({ name: 'Fadenwelle', desc: 'Eine Welle aus Fäden rollt über den Boden und verlangsamt.', shape: 'wave', color: 0xffffff, color2: 0xff5fae, speed: 14, range: 8.5, dmg: 760, w: 0.75, pierce: true, effects: slow(1.2, 0.4), anim: 'raise', sfx: 'string' }),
      super: BM({ name: 'God Thread', desc: 'Hundert verdrillte Fäden zu einem Bohrer: durch alles.', range: 13, w: 0.7, dmg: 420, ticks: 6, gap: 0.1, charge: 0.5, color: 0xff5fae, color2: 0xffffff, pierceWalls: true, breakWalls: true, effects: knock(2), anim: 'point', animDur: 1.1, sfx: 'beamBig' }),
      onEnter: N({ r: 3.2, dmg: 400, color: 0xff5fae, effects: slow(2, 0.4) }),
    },
  },

  // 49 ─ BLACKBEARD ───────────────────────────────────────────────────────────
  {
    id: 'blackbeard', name: 'Marshall D. Teach', anime: 'op', rarity: 'rare', role: 'Kontrolleur',
    desc: 'Blackbeard. Besitzt zwei Teufelsfrüchte: Finsternis, die alles verschlingt, und Beben, das die Welt erschüttert.',
    playstyle: 'Finsternis zieht Gegner heran. In der Transformation kommt das Beben dazu: zerbricht Wände und Luft gleichermaßen.',
    stats: { hp: 5600, speed: 3.1, reload: 1.45, ammo: 3, superHits: 4 },
    sfx: 'dark', victory: 'laugh',
    passive: [{ type: 'lifesteal', f: 0.1 }],
    look: { skin: SKIN.tan, hair: { style: 'blackbeard', color: 0x14141c }, eyes: { color: 0x1a1a1a }, marks: ['beard'], beardColor: 0x14141c, mouth: 'grin', top: { type: 'open', color: 0xf2f2f4, sleeves: 'long' }, bottom: { type: 'pants', color: 0x4a3a3a }, extras: ['bandana', 'cape'], bandanaColor: 0xc8202a, capeColor: 0x14141c, build: 'chubby' },
    main: P({ name: 'Schwarzes Loch', desc: 'Eine Kugel Finsternis, die Gegner heranzieht.', shape: 'void', color: 0x3a1a5a, size: 0.4, speed: 13, range: 7, dmg: 700, w: 0.4, effects: pull(1.4), anim: 'cast', sfx: 'dark' }),
    super: A({ name: 'Kurouzu', desc: 'Ein Wirbel der Finsternis zieht alle Gegner im Umkreis zu sich und hält sie fest.', range: 7, r: 3, dmg: 1200, landDelay: 0.4, fx: 'ring', color: 0x3a1a5a, effects: fx(pull(2.5), { silence: 2 }), linger: { t: 2.5, tick: 0.3, dmg: 160, pull: true, color: 0x3a1a5a }, anim: 'raise', sfx: 'dark' }),
    gadgets: [
      BUF({ name: 'Liberation', desc: 'Verschlingt Schaden: 50 % Schadensreduktion für 2,5 s.', buff: { dr: 0.5, t: 2.5, color: 0x3a1a5a }, sfx: 'dark' }),
      { kind: 'nova', name: 'Black Road', desc: 'Finsternis breitet sich am Boden aus: Gegner im Umkreis werden gefesselt.', r: 3, dmg: 300, color: 0x3a1a5a, effects: { root: 1.2 }, anim: 'stomp', sfx: 'dark' },
    ],
    starPowers: [
      { name: 'Schicksal', desc: '+10 % LP.', type: 'stat', hp: 1.1 },
      { name: 'Gieriger Pirat', desc: 'Jeder Kill lädt 40 % Super.', type: 'killSuper', amt: 0.4 },
    ],
    trans: {
      name: 'Finsternis & Beben', duration: 15, aura: 0x3a1a5a, aura2: 0xf2f2f4, auraIntensity: 1.4,
      desc: 'Zwei Teufelskräfte gleichzeitig. Jede Hand verursacht Beben; die Super zerschlägt die Luft selbst.',
      look: { glow: 0x3a1a5a, top: { type: 'open', color: 0x1a1a24, sleeves: 'long' }, build: 'giant' },
      stats: { dmg: 1.25, hp: 1.15 },
      main: MULTI([
        C({ range: 2.2, arc: 110, dmg: 800, color: 0xf2f2f4, breakWalls: true, effects: knock(1.6) }),
        P({ shape: 'wave', color: 0xf2f2f4, size: 0.9, speed: 15, range: 6, dmg: 500, w: 0.7, pierce: true, breakWalls: true }),
      ], { name: 'Beben-Faust', desc: 'Ein Bebenschlag mit Schockwelle, die Wände sprengt.', anim: 'punch', sfx: 'quake' }),
      super: SEQ([
        { at: 0, do: A({ self: true, r: 4, landDelay: 0, dmg: 600, fx: 'ring', color: 0x3a1a5a, effects: pull(3) }) },
        { at: 0.45, do: N({ r: 4, dmg: 2600, color: 0xf2f2f4, color2: 0x3a1a5a, breakWalls: true, effects: knock(3) }) },
      ], { name: 'Kaishin', desc: 'Zieht alle mit Finsternis heran — und zertrümmert sie mit einem Beben.', anim: 'raise', sfx: 'quake' }),
      onEnter: N({ r: 3.6, dmg: 500, color: 0xf2f2f4, breakWalls: true, effects: knock(2.4) }),
    },
  },

  // 50 ─ AKAINU ───────────────────────────────────────────────────────────────
  {
    id: 'akainu', name: 'Akainu', anime: 'op', rarity: 'super_rare', role: 'Zerstörer',
    desc: 'Flottenadmiral der Marine. Magma ist heißer als Feuer — und seine „absolute Gerechtigkeit“ kennt kein Erbarmen.',
    playstyle: 'Magmafäuste brennen lange. Als Logia gehen manche Geschosse durch ihn hindurch. Seine Transformation lässt Magma vom Himmel regnen.',
    stats: { hp: 5000, speed: 3.2, reload: 1.4, ammo: 3, superHits: 4 },
    sfx: 'magma', victory: 'armsCrossed',
    passive: [{ type: 'intangible', chance: 0.18 }],
    look: { skin: SKIN.tan, hair: { style: 'none' }, eyes: { color: 0x1a1a1a, type: 'sharp' }, mouth: 'frown', angry: true, top: { type: 'suit', color: 0xa3242a, sleeves: 'long', buttons: true }, bottom: { type: 'pants', color: 0xa3242a }, extras: ['marineCap', 'marineCoat'], build: 'giant' },
    main: P({ name: 'Dai Funka', desc: 'Eine Magmafaust, die lange brennt.', shape: 'fist', color: 0xff4a1a, color2: 0xffc04a, size: 0.45, speed: 15, range: 7, dmg: 700, w: 0.42, effects: burn(400, 2.5), anim: 'punch', sfx: 'magma' }),
    super: D({ name: 'Meigo', desc: 'Ein Magmafaust-Stoß, der durch den Gegner bricht.', dist: 5, speed: 22, dmg: 2200, w: 0.9, color: 0xff4a1a, stopOnHit: true, effects: fx(knock(2), burn(600, 3)), anim: 'punch', sfx: 'magma' }),
    gadgets: [
      A({ name: 'Magmapfütze', desc: 'Ein Magmafeld, das 4 s lang brennt.', range: 5, r: 1.8, dmg: 300, landDelay: 0.3, fx: 'ring', color: 0xff4a1a, linger: { t: 4, tick: 0.5, dmg: 220, color: 0xff4a1a, effects: burn(200, 1) }, sfx: 'magma' }),
      BUF({ name: 'Absolute Gerechtigkeit', desc: '+30 % Schaden für 3 s.', buff: { dmg: 0.3, t: 3, color: 0xff4a1a }, sfx: 'powerup' }),
    ],
    starPowers: [
      { name: 'Magma-Logia', desc: 'Durchlässigkeit +10 %.', type: 'intangible', chance: 0.1 },
      { name: 'Hitzewelle', desc: 'Brände dauern 50 % länger.', type: 'burnBoost', mult: 1.5 },
    ],
    trans: {
      name: 'Magmaherrscher', duration: 15, aura: 0xff4a1a, aura2: 0xffc04a, auraIntensity: 1.6,
      desc: 'Sein Körper wird zu flüssigem Magma. Ryusei Kazan lässt brennende Fäuste wie Meteore vom Himmel fallen.',
      look: { skin: 0xd8501a, glow: 0xff4a1a, top: { type: 'bare' }, extrasRemove: ['marineCoat'], eyes: { type: 'glow', color: 0xffc04a } },
      stats: { dmg: 1.25, hp: 1.1, speed: 1.08 },
      passive: [{ type: 'intangible', chance: 0.15 }, { type: 'burnAura', r: 1.8, dps: 220 }],
      main: P({ name: 'Magma-Fausthagel', desc: 'Drei Magmafäuste mit Brand.', shape: 'fist', color: 0xff4a1a, color2: 0xffc04a, size: 0.42, count: 3, spread: 22, speed: 16, range: 7.5, dmg: 420, w: 0.38, effects: burn(350, 2), anim: 'flurry', sfx: 'magma' }),
      super: SEQ([0, 0.18, 0.36, 0.54, 0.72].map((t, i) => ({ at: t, do: A({ range: 8, r: 1.9, dmg: 900, landDelay: 0.55, lob: true, arcH: 7, shape: 'fist', size: 0.6, color: 0xff4a1a, color2: 0xffc04a, fx: 'explode', effects: burn(400, 2), scatter: 2.4 }) })), { name: 'Ryusei Kazan', desc: 'Fünf Magmameteore regnen um die Zielstelle herab.', anim: 'raise', sfx: 'magma' }),
      onEnter: N({ r: 3.4, dmg: 500, color: 0xff4a1a, effects: burn(500, 3) }),
    },
  },
];

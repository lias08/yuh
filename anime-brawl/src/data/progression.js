// Progression tables: upgrade costs, unlock levels, gears, trophy road,
// battle pass, quests, shop and cosmetics. No paid advantages: gems only buy
// cosmetics, the premium pass track and brawlers that are also earnable.
export const MAX_LEVEL = 11;
// cost to go from level i to i+1 (index = current level)
export const LEVEL_COST = [0, { coins: 20, pp: 20 }, { coins: 35, pp: 30 }, { coins: 75, pp: 50 }, { coins: 140, pp: 80 }, { coins: 290, pp: 130 }, { coins: 480, pp: 210 }, { coins: 800, pp: 340 }, { coins: 1250, pp: 550 }, { coins: 1875, pp: 890 }, { coins: 2800, pp: 1440 }];
export const UNLOCK = { gadget: 5, gear: 6, starPower: 7, gear2: 8, overdrive: 9 };
export const PRICES = { gadget: 1000, starPower: 2000, gear: 1000, overdrive: 5000 };

export const GEARS = [
  { id: 'speed', name: 'Tempo-Gear', desc: '+15 % Tempo in Büschen.', icon: '⚡', hook: { type: 'bushSpeed', mult: 1.15 } },
  { id: 'shield', name: 'Schild-Gear', desc: 'Nach 3 s ohne Schaden: 600 Schild.', icon: '🛡', hook: { type: 'idleShield', amt: 600, delay: 3 } },
  { id: 'damage', name: 'Schaden-Gear', desc: '+15 % Schaden unter 50 % LP.', icon: '✦', hook: { type: 'lowHpDmg', below: 0.5, mult: 1.15 } },
  { id: 'health', name: 'Heil-Gear', desc: 'Regeneration +50 %.', icon: '✚', hook: { type: 'regen', amt: 60, delay: 3 } },
  { id: 'vision', name: 'Sicht-Gear', desc: 'Getroffene Gegner werden 2 s sichtbar.', icon: '◉', hook: { type: 'onHitEffect', effects: { reveal: 2 }, kinds: ['main'] } },
  { id: 'aura', name: 'Form-Gear', desc: 'Form-Anzeige lädt 15 % schneller.', icon: '✺', hook: { type: 'stat', transRate: 1.15 } },
];

// ---- trophy road -------------------------------------------------------------
// reward kinds: coins, gems, pp, credits, orb (rare/epic/mythic/legendary), brawler (id), skin (brawler:skin), title, pin, spray, effect
export const TROPHY_ROAD = [
  { t: 10, r: { kind: 'coins', n: 100 } },
  { t: 30, r: { kind: 'brawler', id: 'megumi' } },
  { t: 60, r: { kind: 'pp', n: 50 } },
  { t: 100, r: { kind: 'coins', n: 200 } },
  { t: 150, r: { kind: 'orb', tier: 'rare' } },
  { t: 200, r: { kind: 'brawler', id: 'trunks' } },
  { t: 250, r: { kind: 'brawler', id: 'todo' } },
  { t: 300, r: { kind: 'credits', n: 200 } },
  { t: 350, r: { kind: 'pp', n: 120 } },
  { t: 400, r: { kind: 'spray', id: 'hollow' } },
  { t: 450, r: { kind: 'orb', tier: 'epic' } },
  { t: 500, r: { kind: 'skin', id: 'yuji:shadow' } },
  { t: 550, r: { kind: 'brawler', id: 'kakashi' } },
  { t: 600, r: { kind: 'gems', n: 30 } },
  { t: 650, r: { kind: 'coins', n: 500 } },
  { t: 700, r: { kind: 'title', id: 'jujutsu' } },
  { t: 750, r: { kind: 'brawler', id: 'nanami' } },
  { t: 800, r: { kind: 'credits', n: 500 } },
  { t: 900, r: { kind: 'orb', tier: 'mythic' } },
  { t: 1000, r: { kind: 'effect', id: 'goldAura' } },
  { t: 1100, r: { kind: 'brawler', id: 'mahito' } },
  { t: 1250, r: { kind: 'pp', n: 400 } },
  { t: 1400, r: { kind: 'pin', id: 'kame' } },
  { t: 1500, r: { kind: 'brawler', id: 'minato' } },
  { t: 1750, r: { kind: 'orb', tier: 'legendary' } },
  { t: 2000, r: { kind: 'brawler', id: 'toji' } },
  { t: 2250, r: { kind: 'gems', n: 80 } },
  { t: 2500, r: { kind: 'credits', n: 1500 } },
  { t: 3000, r: { kind: 'brawler', id: 'zoro' } },
  { t: 3500, r: { kind: 'title', id: 'legend' } },
  { t: 4000, r: { kind: 'orb', tier: 'legendary' } },
  { t: 5000, r: { kind: 'brawler', id: 'gojo' } },
];

// ---- battle pass ---------------------------------------------------------------
export const PASS = {
  season: 1, name: 'Saison 1: Erwachen der Legenden', tiers: 30, xpPerTier: 300, premiumGems: 169,
  free: i => [
    { kind: 'coins', n: 100 }, { kind: 'pp', n: 40 }, { kind: 'coins', n: 150 }, { kind: 'orb', tier: 'rare' }, { kind: 'pp', n: 60 },
    { kind: 'credits', n: 100 }, { kind: 'coins', n: 200 }, { kind: 'pp', n: 80 }, { kind: 'gems', n: 10 }, { kind: 'orb', tier: 'epic' },
  ][i % 10],
  premium: i => (i === 0 ? { kind: 'skin', id: 'goku:gold' } : i === 9 ? { kind: 'skin', id: 'ichigo:shadow' } : i === 19 ? { kind: 'skin', id: 'luffy:gold' } : i === 29 ? { kind: 'skin', id: 'gojo:gold' } :
    [{ kind: 'coins', n: 300 }, { kind: 'pp', n: 120 }, { kind: 'gems', n: 15 }, { kind: 'pin', id: 'gg' }, { kind: 'orb', tier: 'mythic' }, { kind: 'credits', n: 300 }, { kind: 'spray', id: 'nika' }, { kind: 'emote', id: 'laugh' }, { kind: 'effect', id: 'sakuraTrail' }][i % 9]),
};

// ---- quests ---------------------------------------------------------------------
export const QUEST_TEMPLATES = [
  { id: 'wins', text: 'Gewinne {n} Matches', n: [2, 3, 4], xp: 250, stat: 'wins' },
  { id: 'dmg', text: 'Verursache {n} Schaden', n: [20000, 35000, 50000], xp: 200, stat: 'dmg' },
  { id: 'kills', text: 'Besiege {n} Gegner', n: [5, 8, 12], xp: 200, stat: 'kills' },
  { id: 'trans', text: 'Verwandle dich {n}-mal', n: [2, 3, 5], xp: 220, stat: 'transforms' },
  { id: 'supers', text: 'Setze {n} Supers ein', n: [5, 8, 12], xp: 180, stat: 'supers' },
  { id: 'play', text: 'Spiele {n} Matches', n: [3, 5], xp: 150, stat: 'matches' },
  { id: 'anime', text: 'Gewinne {n} Matches mit {anime}', n: [1, 2], xp: 260, stat: 'animeWins' },
];

// ---- shop cosmetics -----------------------------------------------------------------
export const PINS = [
  { id: 'gg', name: 'GG', icon: '👍' }, { id: 'kame', name: 'Kame', icon: '🐢' }, { id: 'rage', name: 'Wut', icon: '💢' }, { id: 'cry', name: 'Weinen', icon: '😭' },
  { id: 'laugh', name: 'Lachen', icon: '😂' }, { id: 'fire', name: 'Feuer', icon: '🔥' }, { id: 'heart', name: 'Herz', icon: '💖' }, { id: 'skull', name: 'Totenkopf', icon: '💀' },
];
export const SPRAYS = [
  { id: 'hollow', name: 'Hollow-Maske', color: '#f2f2f4' }, { id: 'nika', name: 'Sonnengott', color: '#ffe08a' }, { id: 'leaf', name: 'Blattsymbol', color: '#5aaa3a' },
  { id: 'kanji', name: 'Kanji: Stärke', color: '#ff3a3a' }, { id: 'dragon', name: 'Drachenkugel', color: '#ffaa2a' }, { id: 'void', name: 'Unendliche Leere', color: '#6a5aff' },
];
export const TITLES = {
  owner: '👑 Besitzer', admin: 'Admin',
  rookie: 'Anfänger', jujutsu: 'Jujutsu-Zauberer', legend: 'Lebende Legende', hokage: 'Möchtegern-Hokage', captain: 'Kommandant', pirate: 'Piratenkönig', saiyan: 'Saiyajin-Elite', champion: 'Turnier-Champion',
};
export const EFFECTS = [
  { id: 'none', name: 'Keiner' }, { id: 'goldAura', name: 'Goldene Aura' }, { id: 'sakuraTrail', name: 'Sakura-Spur' }, { id: 'voidTrail', name: 'Leere-Spur' },
];
export const EMOTES = [{ id: 'laugh', name: 'Lachen' }, { id: 'flex', name: 'Posen' }, { id: 'bow', name: 'Verbeugen' }];

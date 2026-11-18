// Persistent local save (localStorage) + economy helpers. Everything here is
// offline: friends, clubs and leaderboards are populated by generated bot
// players and labelled as such in the UI.
import { ROSTER, BY_ID, RARITIES, skinsFor } from '../data/index.js';
import { TROPHY_ROAD, PASS, QUEST_TEMPLATES, LEVEL_COST, MAX_LEVEL, PRICES, UNLOCK, GEARS, PINS, SPRAYS, TITLES, EFFECTS } from '../data/progression.js';
import { ANIME } from '../data/index.js';

const KEY = 'animebrawl.save.v1';
const STARTERS = ['yuji', 'piccolo', 'hitsugaya'];

const BOT_NAMES = ['Kaito', 'Sora', 'Rin', 'Haru', 'Yuki', 'Ren', 'Aoi', 'Mika', 'Taro', 'Nami', 'Kenji', 'Hana', 'Riku', 'Emi', 'Daiki', 'Saki', 'Shin', 'Yumi', 'Takeshi', 'Akira', 'Kira', 'Noa', 'Mei', 'Jin', 'Luca', 'Mila', 'Finn', 'Lea', 'Noah', 'Emma', 'Ben', 'Lina', 'Tom', 'Sara', 'Max', 'Ida', 'Leo', 'Zoe', 'Paul', 'Nina'];
const BOT_SUFFIX = ['', '_x', 'Senpai', '99', 'GG', 'Pro', '-chan', 'Kun', 'TV', 'Z', '07', 'One'];

export function seeded(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function botName(r) { return BOT_NAMES[Math.floor(r() * BOT_NAMES.length)] + BOT_SUFFIX[Math.floor(r() * BOT_SUFFIX.length)]; }

function newBrawler() { return { level: 1, pp: 0, trophies: 0, highest: 0, gadgets: [], sps: [], gears: [], overdrive: false, skins: ['default'], skin: 'default', gadget: -1, sp: -1, gear: [], mastery: 0, wins: 0, unlockedAt: Date.now() }; }

function defaults() {
  const r = seeded(Date.now());
  const brawlers = {};
  for (const id of STARTERS) brawlers[id] = newBrawler();
  const friends = Array.from({ length: 8 }, () => ({ name: botName(r), trophies: Math.floor(200 + r() * 3000), fav: ROSTER[Math.floor(r() * ROSTER.length)].id, online: r() < 0.6 }));
  return {
    v: 1,
    player: { name: 'Spieler' + Math.floor(1000 + r() * 9000), icon: 'yuji', title: 'rookie', created: Date.now() },
    coins: 400, gems: 80, pp: 60, credits: 0,
    brawlers, selected: 'yuji', mode: 'crystal',
    roadClaimed: [], pass: { season: PASS.season, xp: 0, premium: false, free: [], prem: [] },
    stats: { wins: 0, losses: 0, draws: 0, matches: 0, kills: 0, deaths: 0, dmg: 0, transforms: 0, supers: 0, soloWins: 0, duoWins: 0, bossWins: 0, highest: 0, tournamentWins: 0 },
    quests: { day: '', list: [] },
    cos: { pins: ['gg', 'laugh', 'rage', 'fire'], sprays: [], titles: ['rookie'], effects: ['none'], emotes: [], effect: 'none' },
    settings: { sfx: 0.8, music: 0.45, quality: 'high', autoAim: true, showFps: false },
    shop: { day: '', offers: [], bought: [] },
    friends, club: null, team: [],
    notes: [{ t: Date.now(), text: 'Willkommen bei ANIME BRAWL! Wähle einen Kämpfer und drück auf SPIELEN.' }],
    seasonEnd: Date.now() + 1000 * 60 * 60 * 24 * 28,
    tutorial: false,
  };
}

export const Save = {
  data: null,
  load() {
    try { const raw = localStorage.getItem(KEY); this.data = raw ? { ...defaults(), ...JSON.parse(raw) } : defaults(); }
    catch { this.data = defaults(); }
    // migrate: make sure every unlocked brawler has all fields
    for (const id in this.data.brawlers) this.data.brawlers[id] = { ...newBrawler(), ...this.data.brawlers[id] };
    this.refreshDaily();
    return this.data;
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* storage may be unavailable (private mode) */ } },
  reset() { try { localStorage.removeItem(KEY); } catch {} this.data = defaults(); this.refreshDaily(); this.save(); },
  refreshDaily() {
    const d = this.data, day = new Date().toISOString().slice(0, 10);
    if (d.quests.day !== day) { d.quests = { day, list: genQuests(day) }; }
    if (d.shop.day !== day) { d.shop = { day, offers: genOffers(day), bought: [] }; }
  },
};

// ---- helpers ----------------------------------------------------------------
export const owned = (id) => !!Save.data.brawlers[id];
export const bData = (id) => Save.data.brawlers[id];
export function totalTrophies() { return Object.values(Save.data.brawlers).reduce((s, b) => s + b.trophies, 0); }
export function note(text) { Save.data.notes.unshift({ t: Date.now(), text, unread: true }); Save.data.notes = Save.data.notes.slice(0, 30); }
export function unreadNotes() { return Save.data.notes.filter(n => n.unread).length; }

export function unlockBrawler(id) {
  if (owned(id)) return false;
  Save.data.brawlers[id] = newBrawler();
  note(`Neuer Kämpfer freigeschaltet: ${BY_ID[id].name}!`);
  return true;
}

export function upgradeCost(lvl) { return lvl >= MAX_LEVEL ? null : LEVEL_COST[lvl]; }
export function canUpgrade(id) { const b = bData(id); const c = upgradeCost(b.level); return c && Save.data.coins >= c.coins && b.pp >= c.pp; }
export function upgrade(id) {
  const b = bData(id); const c = upgradeCost(b.level);
  if (!c || Save.data.coins < c.coins || b.pp < c.pp) return false;
  Save.data.coins -= c.coins; b.pp -= c.pp; b.level++;
  if (b.level === UNLOCK.gadget) note(`${BY_ID[id].name} kann jetzt Gadgets nutzen!`);
  Save.save(); return true;
}
export function buyItem(id, kind, idx) {
  const b = bData(id); const price = PRICES[kind];
  if (Save.data.coins < price) return false;
  if (kind === 'gadget' && (b.level < UNLOCK.gadget || b.gadgets.includes(idx))) return false;
  if (kind === 'starPower' && (b.level < UNLOCK.starPower || b.sps.includes(idx))) return false;
  if (kind === 'gear' && (b.level < UNLOCK.gear || b.gears.includes(idx))) return false;
  if (kind === 'overdrive' && (b.level < UNLOCK.overdrive || b.overdrive)) return false;
  Save.data.coins -= price;
  if (kind === 'gadget') { b.gadgets.push(idx); if (b.gadget < 0) b.gadget = idx; }
  if (kind === 'starPower') { b.sps.push(idx); if (b.sp < 0) b.sp = idx; }
  if (kind === 'gear') { b.gears.push(idx); if (b.gear.length < (b.level >= UNLOCK.gear2 ? 2 : 1)) b.gear.push(idx); }
  if (kind === 'overdrive') b.overdrive = true;
  Save.save(); return true;
}

// ---- rewards -------------------------------------------------------------------
export function rewardLabel(r) {
  switch (r.kind) {
    case 'coins': return { icon: '🪙', text: `${r.n} Münzen` };
    case 'gems': return { icon: '💠', text: `${r.n} Juwelen` };
    case 'pp': return { icon: '⚡', text: `${r.n} Power-Punkte` };
    case 'credits': return { icon: '✦', text: `${r.n} Seelen-Credits` };
    case 'orb': return { icon: '🔮', text: `${({ rare: 'Seltener', epic: 'Epischer', mythic: 'Mythischer', legendary: 'Legendärer' })[r.tier]} Seelen-Orb` };
    case 'brawler': return { icon: '★', text: `Kämpfer: ${BY_ID[r.id]?.name}` };
    case 'skin': { const [b, s] = r.id.split(':'); const sk = skinsFor(BY_ID[b]).find(x => x.id === s); return { icon: '👘', text: `Skin: ${sk?.name ?? s}` }; }
    case 'title': return { icon: '🏷', text: `Titel: ${TITLES[r.id]}` };
    case 'pin': return { icon: PINS.find(p => p.id === r.id)?.icon ?? '📌', text: `Pin: ${PINS.find(p => p.id === r.id)?.name}` };
    case 'spray': return { icon: '🎨', text: `Spray: ${SPRAYS.find(p => p.id === r.id)?.name}` };
    case 'effect': return { icon: '✨', text: `Effekt: ${EFFECTS.find(p => p.id === r.id)?.name}` };
    case 'emote': return { icon: '😄', text: `Emote` };
    default: return { icon: '?', text: r.kind };
  }
}
/** grant a reward; returns list of resulting rewards (orbs expand) */
export function grant(r) {
  const d = Save.data;
  const out = [r];
  switch (r.kind) {
    case 'coins': d.coins += r.n; break;
    case 'gems': d.gems += r.n; break;
    case 'credits': d.credits += r.n; break;
    case 'pp': {
      // distribute power points to the selected brawler
      const b = bData(d.selected) || Object.values(d.brawlers)[0]; b.pp += r.n; break;
    }
    case 'brawler': if (!unlockBrawler(r.id)) { d.credits += 300; out[0] = { kind: 'credits', n: 300, dupe: r.id }; } break;
    case 'skin': { const [b, s] = r.id.split(':'); if (!owned(b)) unlockBrawler(b); const bd = bData(b); if (!bd.skins.includes(s)) bd.skins.push(s); break; }
    case 'title': if (!d.cos.titles.includes(r.id)) d.cos.titles.push(r.id); break;
    case 'pin': if (!d.cos.pins.includes(r.id)) d.cos.pins.push(r.id); break;
    case 'spray': if (!d.cos.sprays.includes(r.id)) d.cos.sprays.push(r.id); break;
    case 'effect': if (!d.cos.effects.includes(r.id)) d.cos.effects.push(r.id); break;
    case 'emote': if (!d.cos.emotes.includes(r.id)) d.cos.emotes.push(r.id); break;
    case 'orb': return openOrb(r.tier);
  }
  Save.save();
  return out;
}
/** Seelen-Orb: several random drops; higher tiers can unlock brawlers */
export function openOrb(tier) {
  const r = Math.random;
  const tierN = { rare: 0, epic: 1, mythic: 2, legendary: 3 }[tier] ?? 0;
  const res = [];
  res.push(grant({ kind: 'coins', n: Math.floor(40 + r() * 60) * (tierN + 1) })[0]);
  res.push(grant({ kind: 'pp', n: Math.floor(25 + r() * 40) * (tierN + 1) })[0]);
  if (r() < 0.25 + tierN * 0.1) res.push(grant({ kind: 'credits', n: 50 * (tierN + 1) })[0]);
  const brawlerChance = [0.06, 0.15, 0.3, 0.6][tierN];
  if (r() < brawlerChance) {
    const rarOrder = ['rare', 'super_rare', 'epic', 'mythic', 'legendary', 'divine'];
    const maxR = Math.min(rarOrder.length - 1, tierN + 2);
    const pool = ROSTER.filter(c => !owned(c.id) && RARITIES[c.rarity].order <= maxR + 1);
    if (pool.length) { const c = pool[Math.floor(r() * pool.length)]; res.push(grant({ kind: 'brawler', id: c.id })[0]); }
  } else if (r() < 0.2) res.push(grant({ kind: 'gems', n: 5 + tierN * 5 })[0]);
  return res;
}
export function buyBrawler(id, currency) {
  const c = BY_ID[id]; const R = RARITIES[c.rarity];
  if (owned(id)) return false;
  if (currency === 'credits') { if (Save.data.credits < R.price) return false; Save.data.credits -= R.price; }
  else { if (Save.data.gems < R.gemPrice) return false; Save.data.gems -= R.gemPrice; }
  unlockBrawler(id); Save.save(); return true;
}

// ---- trophies & match results ---------------------------------------------------------
export function trophyDelta(mode, res, trophies) {
  if (mode === 'training' || mode === 'boss') return 0;
  if (mode === 'showdown') return [10, 8, 6, 4, 2, 0, -1, -2, -3, -4][Math.max(0, Math.min(9, (res.rank ?? 10) - 1))] - (trophies > 600 && res.rank > 3 ? 2 : 0);
  if (mode === 'duo') return [9, 5, 0, -2, -4][Math.max(0, Math.min(4, (res.rank ?? 5) - 1))];
  if (res.draw) return 0;
  if (res.won) return Math.max(4, 9 - Math.floor(trophies / 150));
  return -Math.min(10, Math.floor(trophies / 60));
}
export function applyMatch(brawlerId, res) {
  const d = Save.data; const b = bData(brawlerId);
  const mode = res.mode;
  const before = b.trophies;
  const delta = trophyDelta(mode, res, b.trophies);
  b.trophies = Math.max(0, b.trophies + delta);
  b.highest = Math.max(b.highest, b.trophies);
  d.stats.highest = Math.max(d.stats.highest, totalTrophies());
  const won = res.won || (mode === 'showdown' && res.rank <= 4) || (mode === 'duo' && res.rank <= 2);
  const st = d.stats; st.matches++;
  if (mode !== 'training') { if (res.draw) st.draws++; else if (won) st.wins++; else st.losses++; }
  if (mode === 'showdown' && res.rank === 1) st.soloWins++;
  if (mode === 'duo' && res.rank === 1) st.duoWins++;
  if (mode === 'boss' && res.won) st.bossWins++;
  const p = res.player || {};
  st.kills += p.kills ?? 0; st.deaths += p.deaths ?? 0; st.dmg += Math.round(p.dmg ?? 0); st.transforms += p.transforms ?? 0; st.supers += p.supers ?? 0;
  if (won) b.wins++;
  // rewards
  const coins = mode === 'training' ? 0 : won ? 24 : res.draw ? 14 : 9;
  const pp = mode === 'training' ? 0 : won ? 18 : 7;
  const xp = mode === 'training' ? 0 : (won ? 70 : 30) + (p.kills ?? 0) * 6;
  d.coins += coins; b.pp += pp;
  b.mastery += mode === 'training' ? 0 : won ? 30 : 10;
  const passBefore = d.pass.xp; d.pass.xp += xp;
  // quests
  const questDone = [];
  for (const q of d.quests.list) {
    if (q.done) continue;
    let add = 0;
    if (q.stat === 'wins' && won && mode !== 'training') add = 1;
    if (q.stat === 'matches' && mode !== 'training') add = 1;
    if (q.stat === 'kills') add = p.kills ?? 0;
    if (q.stat === 'dmg') add = Math.round(p.dmg ?? 0);
    if (q.stat === 'transforms') add = p.transforms ?? 0;
    if (q.stat === 'supers') add = p.supers ?? 0;
    if (q.stat === 'animeWins' && won && BY_ID[brawlerId].anime === q.anime) add = 1;
    q.prog = Math.min(q.n, q.prog + add);
    if (q.prog >= q.n) { q.done = true; d.pass.xp += q.xp; questDone.push(q); note(`Quest erfüllt: ${q.text} (+${q.xp} Pass-XP)`); }
  }
  Save.save();
  return { delta, before, after: b.trophies, coins, pp, xp, questDone, passTierBefore: Math.floor(passBefore / PASS.xpPerTier), passTierAfter: Math.floor(d.pass.xp / PASS.xpPerTier) };
}

// ---- quests & shop --------------------------------------------------------------------------
function genQuests(day) {
  const r = seeded([...day].reduce((s, c) => s * 31 + c.charCodeAt(0), 7));
  const pool = [...QUEST_TEMPLATES];
  const out = [];
  for (let i = 0; i < 4 && pool.length; i++) {
    const t = pool.splice(Math.floor(r() * pool.length), 1)[0];
    const n = t.n[Math.floor(r() * t.n.length)];
    const animeKeys = Object.keys(ANIME); const anime = animeKeys[Math.floor(r() * animeKeys.length)];
    out.push({ id: t.id + i, stat: t.stat, n, prog: 0, xp: t.xp, anime, text: t.text.replace('{n}', n.toLocaleString('de-DE')).replace('{anime}', ANIME[anime].name), done: false });
  }
  return out;
}
function genOffers(day) {
  const r = seeded([...day].reduce((s, c) => s * 17 + c.charCodeAt(0), 3));
  const offers = [];
  offers.push({ id: 'free', kind: 'orb', tier: 'rare', price: 0, cur: 'free', title: 'Gratis-Geschenk' });
  const pp = ROSTER[Math.floor(r() * ROSTER.length)];
  offers.push({ id: 'pp', kind: 'pp', n: 120, price: 240, cur: 'coins', title: 'Power-Punkte' });
  offers.push({ id: 'orbEpic', kind: 'orb', tier: 'epic', price: 30, cur: 'gems', title: 'Epischer Orb' });
  offers.push({ id: 'orbMythic', kind: 'orb', tier: 'mythic', price: 60, cur: 'gems', title: 'Mythischer Orb' });
  // featured skins of the day
  for (let i = 0; i < 3; i++) {
    const c = ROSTER[Math.floor(r() * ROSTER.length)];
    const sk = skinsFor(c).filter(s => s.id !== 'default');
    const s = sk[Math.floor(r() * sk.length)];
    if (s) offers.push({ id: 'skin' + i, kind: 'skin', skin: `${c.id}:${s.id}`, price: s.price, cur: 'gems', title: s.name });
  }
  const notOwned = ROSTER.filter(c => !Save.data?.brawlers?.[c.id]);
  if (notOwned.length) { const c = notOwned[Math.floor(r() * notOwned.length)]; offers.push({ id: 'brawler', kind: 'brawler', brawler: c.id, price: Math.floor(RARITIES[c.rarity].gemPrice * 0.8), cur: 'gems', title: 'Kämpfer-Angebot', sale: 20 }); }
  return offers;
}

// ---- leaderboard (offline, generated) -------------------------------------------------------
export function leaderboard(kind = 'global', brawlerId = null) {
  const r = seeded(kind === 'brawler' ? brawlerId.length * 977 + brawlerId.charCodeAt(0) : kind === 'club' ? 4242 : 1234);
  const rows = Array.from({ length: 60 }, (_, i) => {
    const base = kind === 'brawler' ? 1200 : kind === 'club' ? 60000 : 42000;
    const t = Math.floor(base * Math.pow(0.965, i) * (0.95 + r() * 0.1));
    return { name: kind === 'club' ? ['Hidden Leaf', 'Gotei 13', 'Straw Hats', 'Capsule Corp', 'Jujutsu High', 'Akatsuki', 'Espada', 'Red Hair', 'Z Fighters', 'Shinsengumi'][i % 10] + (i >= 10 ? ' ' + (i + 1) : '') : botName(r), trophies: t, icon: ROSTER[Math.floor(r() * ROSTER.length)].id, bot: true };
  });
  if (kind === 'global') rows.push({ name: Save.data.player.name, trophies: totalTrophies(), icon: Save.data.player.icon, me: true });
  if (kind === 'brawler') rows.push({ name: Save.data.player.name, trophies: bData(brawlerId)?.trophies ?? 0, icon: brawlerId, me: true });
  if (kind === 'club' && Save.data.club) rows.push({ name: Save.data.club.name, trophies: Save.data.club.members.reduce((s, m) => s + m.trophies, 0) + totalTrophies(), icon: Save.data.player.icon, me: true });
  return rows.sort((a, b) => b.trophies - a.trophies);
}

export { STARTERS, newBrawler, defaults, GEARS, UNLOCK, PRICES, MAX_LEVEL, TROPHY_ROAD, PASS };

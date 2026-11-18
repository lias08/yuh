// Validates the 50-character roster: unique ids, complete kits, valid
// rarities, existing custom specials, and that transformations change moves.
import { readFileSync } from 'node:fs';
import { ROSTER, RARITIES, ANIME } from '../src/data/index.js';

const specials = new Set([...readFileSync(new URL('../src/game/specials.js', import.meta.url), 'utf8').matchAll(/^  (\w+): \{/gm)].map(m => m[1]));
const kinds = new Set(['proj', 'cone', 'dash', 'beam', 'aoe', 'nova', 'domain', 'summon', 'buff', 'blink', 'wall', 'hook', 'trap', 'seq', 'multi', 'custom']);
const errors = [];
const ids = new Set();
function checkAct(c, where, a) {
  if (!a) { errors.push(`${c.id}: missing ${where}`); return; }
  if (!kinds.has(a.kind)) errors.push(`${c.id}: ${where} unknown kind ${a.kind}`);
  if (a.kind === 'custom' && !specials.has(a.fn)) errors.push(`${c.id}: ${where} missing special ${a.fn}`);
  if (a.special && !specials.has(a.special)) errors.push(`${c.id}: ${where} missing special ${a.special}`);
  for (const sub of a.list || []) checkAct(c, where + '>list', sub);
  for (const st of a.steps || []) checkAct(c, where + '>step', st.do);
  for (const k of ['end', 'then', 'onEnd', 'onHitAction', 'after']) if (a[k]) checkAct(c, where + '>' + k, a[k]);
  if (a.unit?.attack) checkAct(c, where + '>unit', a.unit.attack);
}
const sig = (a) => JSON.stringify(a);
for (const c of ROSTER) {
  if (ids.has(c.id)) errors.push('duplicate id ' + c.id); ids.add(c.id);
  if (!RARITIES[c.rarity]) errors.push(`${c.id}: bad rarity`);
  if (!ANIME[c.anime]) errors.push(`${c.id}: bad anime`);
  for (const k of ['name', 'desc', 'playstyle', 'stats', 'look', 'role']) if (!c[k]) errors.push(`${c.id}: missing ${k}`);
  checkAct(c, 'main', c.main); checkAct(c, 'super', c.super);
  if (c.gadgets?.length !== 2) errors.push(`${c.id}: needs 2 gadgets`); else c.gadgets.forEach((g, i) => { checkAct(c, 'gadget' + i, g); if (!g.name || !g.desc) errors.push(`${c.id}: gadget ${i} name/desc`); });
  if (c.starPowers?.length !== 2) errors.push(`${c.id}: needs 2 star powers`); else c.starPowers.forEach((s, i) => { if (!s.name || !s.desc || !s.type) errors.push(`${c.id}: sp ${i} incomplete`); });
  if (!c.main.name || !c.super.name) errors.push(`${c.id}: main/super need names`);
  const T = c.trans;
  if (!T) { errors.push(`${c.id}: missing transformation`); continue; }
  for (const F of [T, T.next].filter(Boolean)) {
    if (!F.name || !F.look || !F.main || !F.super) errors.push(`${c.id}: form ${F.name} incomplete`);
    checkAct(c, 'trans.main', F.main); checkAct(c, 'trans.super', F.super);
    if (sig(F.main) === sig(c.main)) errors.push(`${c.id}: form main identical to base`);
    if (sig(F.super) === sig(c.super)) errors.push(`${c.id}: form super identical to base`);
  }
}
// no two characters may share an identical main attack
const mains = new Map();
for (const c of ROSTER) { const s = sig({ ...c.main, name: '', desc: '' }); if (mains.has(s)) errors.push(`${c.id}: main identical to ${mains.get(s)}`); mains.set(s, c.id); }
const byAnime = {}; for (const c of ROSTER) byAnime[c.anime] = (byAnime[c.anime] || 0) + 1;
console.log(`characters: ${ROSTER.length}`, byAnime);
console.log('rarities:', Object.fromEntries(Object.keys(RARITIES).map(r => [r, ROSTER.filter(c => c.rarity === r).length])));
console.log('two-stage forms:', ROSTER.filter(c => c.trans?.next).map(c => c.id).join(', '));
if (ROSTER.length !== 50) errors.push('expected 50 characters, got ' + ROSTER.length);
if (errors.length) { console.error('ERRORS:\n' + errors.join('\n')); process.exit(1); }
console.log('roster OK');

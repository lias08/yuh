import jjk from './roster/jjk.js';
import db from './roster/db.js';
import naruto from './roster/naruto.js';
import bleach from './roster/bleach.js';
import op from './roster/onepiece.js';
import mha from './roster/mha.js';
import ds from './roster/demonslayer.js';

export const ANIME = {
  jjk: { name: 'Jujutsu Kaisen', short: 'JJK', color: '#6a5aff' },
  db: { name: 'Dragon Ball', short: 'DB', color: '#ff8a2a' },
  naruto: { name: 'Naruto', short: 'Naruto', color: '#ff6a1a' },
  bleach: { name: 'Bleach', short: 'Bleach', color: '#3aa8ff' },
  op: { name: 'One Piece', short: 'One Piece', color: '#e8323a' },
  mha: { name: 'My Hero Academia', short: 'MHA', color: '#2ea86a' },
  ds: { name: 'Demon Slayer', short: 'Demon Slayer', color: '#2ab8a8' },
};

export const RARITIES = {
  common: { name: 'Common', de: 'Gewöhnlich', color: '#9fb4c8', glow: '#cfe0f0', order: 0, price: 0, gemPrice: 0 },
  rare: { name: 'Rare', de: 'Selten', color: '#3ddc84', glow: '#a8ffcf', order: 1, price: 160, gemPrice: 30 },
  super_rare: { name: 'Super Rare', de: 'Super Selten', color: '#3b9cff', glow: '#a8d4ff', order: 2, price: 430, gemPrice: 80 },
  epic: { name: 'Epic', de: 'Episch', color: '#b45cff', glow: '#e0b8ff', order: 3, price: 925, gemPrice: 150 },
  mythic: { name: 'Mythic', de: 'Mythisch', color: '#ff3b5c', glow: '#ffb0c0', order: 4, price: 1900, gemPrice: 250 },
  legendary: { name: 'Legendary', de: 'Legendär', color: '#ffd23f', glow: '#fff0a8', order: 5, price: 3800, gemPrice: 400 },
  divine: { name: 'Divine', de: 'Göttlich', color: '#ffffff', glow: '#fff6d8', order: 6, price: 6000, gemPrice: 600 },
};

export const ROSTER = [...jjk, ...db, ...naruto, ...bleach, ...op, ...mha, ...ds];
export const BY_ID = Object.fromEntries(ROSTER.map(c => [c.id, c]));
export const getChar = (id) => BY_ID[id];

// default skin set: each fighter gets 2 recolour skins + the season skin for some
const SKIN_PALETTES = [
  { id: 'shadow', name: 'Schatten', price: 79, rarity: 'rare', tint: { top: 0x1a1a24, bottom: 0x24242e }, desc: 'Ganz in Schwarz gehüllt.' },
  { id: 'gold', name: 'Gold', price: 149, rarity: 'epic', tint: { top: 0xd8a83a, bottom: 0x8a6a2a }, desc: 'Ein goldener Champion.' },
  { id: 'sakura', name: 'Sakura-Fest', price: 99, rarity: 'super_rare', tint: { top: 0xffa8d0, bottom: 0xf2f2f4 }, desc: 'Zum Kirschblütenfest.' },
];
export function skinsFor(c) {
  const out = [{ id: 'default', name: 'Standard', price: 0, rarity: c.rarity, look: null }];
  SKIN_PALETTES.forEach((s, i) => {
    out.push({ id: s.id, name: `${s.name} ${c.name.split(' ').slice(-1)[0]}`, price: s.price, rarity: s.rarity, desc: s.desc, look: { top: { color: s.tint.top }, bottom: { color: s.tint.bottom } }, transLook: null });
  });
  return out;
}

// Shorthands for roster definitions. Every helper just builds plain data.
export const P = (o) => ({ kind: 'proj', anim: 'cast', ...o });          // projectile(s)
export const C = (o) => ({ kind: 'cone', anim: 'slash', ...o });         // melee arc
export const D = (o) => ({ kind: 'dash', anim: 'dash', ...o });          // dash strike
export const BM = (o) => ({ kind: 'beam', anim: 'beam', ...o });         // beam / laser
export const A = (o) => ({ kind: 'aoe', anim: 'throw', ...o });          // targeted area
export const N = (o) => ({ kind: 'nova', anim: 'raise', ...o });         // burst around self
export const DOM = (o) => ({ kind: 'domain', anim: 'seal', ...o });      // domain expansion
export const SUM = (o) => ({ kind: 'summon', anim: 'seal', ...o });      // summon
export const BUF = (o) => ({ kind: 'buff', anim: 'raise', ...o });       // self/ally buff
export const BL = (o) => ({ kind: 'blink', anim: 'dash', ...o });        // teleport
export const WALL = (o) => ({ kind: 'wall', anim: 'seal', ...o });       // temporary walls
export const HOOK = (o) => ({ kind: 'hook', anim: 'throw', ...o });      // grab / pull
export const TRAP = (o) => ({ kind: 'trap', anim: 'throw', ...o });
export const SEQ = (steps, o = {}) => ({ kind: 'seq', steps, ...o });
export const MULTI = (list, o = {}) => ({ kind: 'multi', list, ...o });
export const CU = (fn, o = {}) => ({ kind: 'custom', fn, ...o });

// effects
export const slow = (t = 1.5, f = 0.35) => ({ slow: { t, f } });
export const stun = (t = 1) => ({ stun: t });
export const knock = (d = 1.5) => ({ knock: d });
export const pull = (d = 1.5) => ({ pull: d });
export const burn = (dps = 300, t = 2) => ({ burn: { dps, t } });
export const fx = (...objs) => Object.assign({}, ...objs);

// skin tones & palette
export const SKIN = { pale: 0xffe6d6, light: 0xffdcc2, fair: 0xffd2ad, tan: 0xebb68c, brown: 0xc68a5e, dark: 0x8d5a3a, green: 0x6fbf5a, white: 0xf4f2f0, pink: 0xffa8cc, purple: 0x9b7bd8, gray: 0xb9c0c8, gold: 0xf7cf4a, red: 0xd2513c };

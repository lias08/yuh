// Character generator v2: look descriptor → sculpted SDF parts + skeleton.
// Pure data/maths (no three.js) so it can run inside a Web Worker.
import { P, Field, surfaceNets, bakeAO, skinWeights, sphereUV, v3, add, sub, mul, dot, norm, lerp3, cross, rotMat, mApply, matFromY, prep } from './sdf.js';
import { HAIR_STYLES } from './hairStyles.js';

const BUILDS = {
  normal: { s: 1, legT: 0.22, legS: 0.2, torsoH: 0.4, shW: 0.185, waistW: 0.128, hipW: 0.13, chestD: 0.11, armU: 0.2, armF: 0.185, armR: 0.046, legR: 0.066, R: 0.235, neck: 0.055, muscle: 0 },
  slim: { s: 1, legT: 0.23, legS: 0.21, torsoH: 0.4, shW: 0.168, waistW: 0.112, hipW: 0.118, chestD: 0.1, armU: 0.2, armF: 0.19, armR: 0.04, legR: 0.058, R: 0.235, neck: 0.058, muscle: 0 },
  tall: { s: 1.05, legT: 0.25, legS: 0.24, torsoH: 0.43, shW: 0.18, waistW: 0.12, hipW: 0.125, chestD: 0.108, armU: 0.22, armF: 0.21, armR: 0.043, legR: 0.062, R: 0.225, neck: 0.062, muscle: 0 },
  muscle: { s: 1.05, legT: 0.22, legS: 0.2, torsoH: 0.42, shW: 0.215, waistW: 0.14, hipW: 0.138, chestD: 0.128, armU: 0.205, armF: 0.19, armR: 0.058, legR: 0.075, R: 0.225, neck: 0.06, muscle: 1 },
  giant: { s: 1.22, legT: 0.23, legS: 0.21, torsoH: 0.45, shW: 0.24, waistW: 0.16, hipW: 0.15, chestD: 0.145, armU: 0.215, armF: 0.2, armR: 0.068, legR: 0.085, R: 0.215, neck: 0.065, muscle: 1.4 },
  titan: { s: 1.38, legT: 0.24, legS: 0.22, torsoH: 0.48, shW: 0.26, waistW: 0.175, hipW: 0.16, chestD: 0.155, armU: 0.225, armF: 0.21, armR: 0.074, legR: 0.09, R: 0.205, neck: 0.068, muscle: 1.6 },
  small: { s: 0.9, legT: 0.18, legS: 0.17, torsoH: 0.36, shW: 0.16, waistW: 0.112, hipW: 0.115, chestD: 0.1, armU: 0.17, armF: 0.16, armR: 0.042, legR: 0.06, R: 0.245, neck: 0.05, muscle: 0 },
  chubby: { s: 1.05, legT: 0.19, legS: 0.18, torsoH: 0.42, shW: 0.2, waistW: 0.2, hipW: 0.16, chestD: 0.17, armU: 0.19, armF: 0.17, armR: 0.06, legR: 0.08, R: 0.235, neck: 0.05, muscle: 0, belly: 1 },
};
export function buildDims(look) { return { ...(BUILDS[look.build] || BUILDS.normal) }; }

// ---- skeleton -----------------------------------------------------------------------
export const A_POSE = 0.32;
function skeleton(B, extraArms) {
  const ankleY = 0.072, kneeY = ankleY + B.legS, hipJY = kneeY + B.legT, hipY = hipJY + 0.03;
  const torsoY = hipY + 0.03, H = B.torsoH, neckY = torsoY + H, headY = neckY + B.neck, shY = torsoY + H * 0.86;
  const bones = [];
  const add = (name, parent, local, rz = 0) => { bones.push({ name, parent, local, rz }); return bones.length - 1; };
  const hips = add('hips', -1, [0, hipY, 0]);
  const torso = add('torso', hips, [0, torsoY - hipY, 0]);
  const head = add('head', torso, [0, H + B.neck, 0]);
  const arm = (side, dy = 0, scale = 1, pre = '') => {
    const sh = add(pre + 'sh' + side, torso, [side * B.shW, H * 0.86 + dy, 0], side * A_POSE);
    const el = add(pre + 'el' + side, sh, [0, -B.armU * scale, 0]);
    const ha = add(pre + 'ha' + side, el, [0, -B.armF * scale, 0]);
    return { sh, el, ha, side, scale };
  };
  const arms = [arm(-1), arm(1)];
  const leg = (side) => { const hp = add('hip' + side, hips, [side * B.hipW * 0.55, hipJY - hipY, 0]); const kn = add('kn' + side, hp, [0, -B.legT, 0]); return { hp, kn, side }; };
  const legs = [leg(-1), leg(1)];
  const xArms = extraArms ? [arm(-1, -0.13, 0.92, 'x'), arm(1, -0.13, 0.92, 'x')] : [];
  // world transforms
  for (const b of bones) {
    const c = Math.cos(b.rz), s = Math.sin(b.rz);
    const lr = [c, -s, 0, s, c, 0, 0, 0, 1];
    if (b.parent < 0) { b.R = lr; b.T = b.local.slice(); }
    else { const p = bones[b.parent]; b.R = mul33(p.R, lr); b.T = add3(p.T, mApply(p.R, b.local)); }
  }
  return { bones, arms, legs, xArms, hips, torso, head, y: { ankleY, kneeY, hipJY, hipY, torsoY, neckY, headY, shY, H } };
}
const mul33 = (a, b) => { const o = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]); return o; };
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const W = (sk, bi, p) => add3(sk.bones[bi].T, mApply(sk.bones[bi].R, p)); // bone-local → body space
const WR = (sk, bi) => sk.bones[bi].R;

// ---- body primitives (bone tagged) -------------------------------------------------------------
function bodyPrims(B, sk, look) {
  const y = sk.y, m = B.muscle || 0;
  const pr = { pelvis: [], torso: [], neck: [], upper: [], fore: [], hands: [], thigh: [], shin: [], feet: [] };
  const T = sk.torso, Hb = sk.hips;
  pr.pelvis.push(P.ellipsoid([0, y.hipY - 0.012, -0.004], [B.hipW * 1.08, 0.085, B.chestD * 0.95], null, { bone: Hb }));
  pr.torso.push(P.ellipsoid([0, y.torsoY + y.H * 0.27, 0], [B.waistW, y.H * 0.34, B.chestD * 0.93], null, { bone: T }));
  pr.torso.push(P.ellipsoid([0, y.torsoY + y.H * 0.66, 0.004], [B.shW * (0.8 + m * 0.04), y.H * 0.33, B.chestD * (1.04 + m * 0.06)], null, { bone: T }));
  pr.torso.push(P.capsule([-B.shW * 0.82, y.shY + 0.008, -0.004], [B.shW * 0.82, y.shY + 0.008, -0.004], B.armR * 1.15, { bone: T }));
  if (m > 0) {
    for (const s of [-1, 1]) pr.torso.push(P.ellipsoid([s * B.shW * 0.4, y.torsoY + y.H * 0.72, B.chestD * 0.5], [B.shW * 0.44, y.H * 0.15, 0.055 + m * 0.01], null, { bone: T }));
    pr.torso.push(P.ellipsoid([0, y.neckY - 0.015, -0.03], [B.shW * 0.55, 0.05, 0.06], null, { bone: T }));
  }
  if (B.belly) pr.torso.push(P.ellipsoid([0, y.torsoY + y.H * 0.3, 0.04], [B.waistW * 1.05, y.H * 0.36, B.chestD], null, { bone: T }));
  const nr = 0.04 * (B.R / 0.235) * (1 + m * 0.15);
  pr.neck.push(P.capsule([0, y.neckY - 0.035, -0.006], [0, y.headY + 0.03, 0.004], nr, { bone: T }));
  const arms = [...sk.arms, ...sk.xArms];
  for (const a of arms) {
    const r = B.armR * (a.scale ?? 1);
    pr.upper.push(P.sphere(W(sk, a.sh, [0, -0.012, 0]), r * (1.32 + m * 0.12), { bone: a.sh }));
    pr.upper.push(P.roundCone(W(sk, a.sh, [0, -0.01, 0]), W(sk, a.el, [0, 0, 0]), r * (1.1 + m * 0.1), r * 0.92, { bone: a.sh }));
    if (m) pr.upper.push(P.ellipsoid(W(sk, a.sh, [0, -B.armU * 0.45, 0.012]), [r * 1.05, B.armU * 0.32, r * 1.15], WR(sk, a.sh), { bone: a.sh }));
    pr.fore.push(P.roundCone(W(sk, a.el, [0, 0, 0]), W(sk, a.ha, [0, 0.006, 0]), r * 0.98, r * 0.76, { bone: a.el }));
    if (m) pr.fore.push(P.ellipsoid(W(sk, a.el, [0, -B.armF * 0.3, 0]), [r * 1.05, B.armF * 0.28, r * 1.0], WR(sk, a.el), { bone: a.el }));
    // mitten hand with thumb
    const hs = r / 0.046, R = WR(sk, a.ha), s = a.side;
    pr.hands.push(P.ellipsoid(W(sk, a.ha, [0, -0.04 * hs, 0.004]), [0.03 * hs, 0.045 * hs, 0.038 * hs], R, { bone: a.ha }));
    pr.hands.push(P.box(W(sk, a.ha, [0, -0.085 * hs, 0.01 * hs]), [0.022 * hs, 0.03 * hs, 0.03 * hs], 0.012 * hs, mul33(R, rotMat(0.35, 0, 0)), { bone: a.ha }));
    pr.hands.push(P.roundCone(W(sk, a.ha, [-s * 0.012 * hs, -0.03 * hs, 0.03 * hs]), W(sk, a.ha, [-s * 0.004 * hs, -0.072 * hs, 0.05 * hs]), 0.014 * hs, 0.011 * hs, { bone: a.ha }));
  }
  for (const l of sk.legs) {
    const r = B.legR;
    pr.thigh.push(P.roundCone(W(sk, l.hp, [0, 0.01, 0]), W(sk, l.kn, [0, 0, 0]), r * (1.2 + m * 0.08), r * 0.9, { bone: l.hp }));
    pr.shin.push(P.roundCone(W(sk, l.kn, [0, 0, 0]), W(sk, l.kn, [0, -B.legS, 0]), r * 0.9, r * 0.6, { bone: l.kn }));
    pr.shin.push(P.ellipsoid(W(sk, l.kn, [0, -B.legS * 0.3, -r * 0.22]), [r * 0.78, B.legS * 0.3, r * 0.74], null, { bone: l.kn }));
    // shoe
    const fs = Math.max(0.9, r / 0.066), ank = W(sk, l.kn, [0, -B.legS, 0]);
    pr.feet.push(P.ellipsoid(add(ank, [0, -0.026, 0.048 * fs]), [0.05 * fs, 0.04 * fs, 0.082 * fs], null, { bone: l.kn }));
    pr.feet.push(P.ellipsoid(add(ank, [0, -0.022, -0.01]), [0.047 * fs, 0.046 * fs, 0.052 * fs], null, { bone: l.kn }));
    pr.feet.push(P.box(add(ank, [0, -0.06, 0.022 * fs]), [0.047 * fs, 0.007, 0.088 * fs], 0.012, null, { bone: l.kn }));
    if (look.boots) pr.feet.push(P.roundCone(W(sk, l.kn, [0, -B.legS * 0.45, 0]), add(ank, [0, 0.0, 0]), r * 0.95, r * 0.8, { bone: l.kn }));
  }
  return pr;
}

// ---- meshing helpers ----------------------------------------------------------------------
function boundsOf(prims, pad = 0.05) {
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const p of prims) { if (!p.lo) prep(p); for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p.lo[i]); hi[i] = Math.max(hi[i], p.hi[i]); } }
  return [sub(lo, [pad, pad, pad]), add(hi, [pad, pad, pad])];
}
/** build a mesh from an op list: [{p, k, op}] | {offset} | {clip:[n,c,k]} */
function meshOps(ops, step, extraBoundsPrims = []) {
  const prims = ops.filter(o => o.p && o.op !== 's').map(o => o.p).concat(extraBoundsPrims);
  if (!prims.length) return null;
  const [lo, hi] = boundsOf(prims, 0.04 + step * 2);
  const F = new Field(lo, hi, step);
  for (const o of ops) {
    if (o.p) F.stamp(o.p, o.k ?? 0, o.op ?? 'u');
    else if (o.offset) F.offset(o.offset);
    else if (o.clip) F.clip(o.clip[0], o.clip[1], o.clip[2] ?? 0);
  }
  const m = surfaceNets(F, 1);
  if (!m.index.length) return null;
  return m;
}
const U = (list, k) => list.map(p => ({ p, k }));
const inflate = (p, t) => { const q = { ...p }; delete q.lo; delete q.hi; if (q.t === 0) q.r += t; else if (q.t === 1) q.r = q.r.map(r => r + t); else if (q.t === 2) { q.ra += t; q.rb += t; } else if (q.t === 3) q.r += t; else if (q.t === 4) q.rr += t; return q; };

// ---- hair --------------------------------------------------------------------------------------
const D = Math.PI / 180;
function onSphere(az, el) { const a = az * D, e = el * D; return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; }
function hairOps(style, R, hc, q) {
  const parts = (HAIR_STYLES[style] || HAIR_STYLES.short)();
  const ops = [], extra = { bells: [], kenseikan: [], cap: null };
  const k = 0.03 * q;
  const capPart = parts.find(p => p.t === 'cap');
  if (capPart) {
    const s = (capPart.scale ?? 1.045) * 0.99;
    const c = add(hc, [0, R * 0.03, -R * 0.04]);
    ops.push({ p: P.ellipsoid(c, [R * s, R * s * 0.97, R * s * 1.06]), k: 0 });
    // hairline: keep y > b + m z  (front high, back low)
    const line = capPart.line ?? 0;
    const yF = R * (0.3 + line * 1.6), yB = capPart.bowl ? R * 0.05 : -R * 0.45;
    const mz = (yF - yB) / (2 * R), b = (yF + yB) / 2;
    const n = norm([0, -1, mz]);
    ops.push({ clip: [n, dot(n, [0, hc[1] + b, hc[2]]), 0.01] });
    if (capPart.bowl) ops.push({ p: P.ring(add(hc, [0, R * 0.36, 0]), R * 1.0, 0.012, R * 0.12, 0.01), k: 0.01 });
    extra.cap = { c, s, line };
  }
  for (const p of parts) {
    if (p.t === 'spike') {
      const base0 = onSphere(p.az, p.el);
      let dir;
      const hanging = (p.lift ?? 0) < 0;
      if (hanging) {
        const a = p.az * D, e = p.el * D;
        dir = add([Math.sin(a) * Math.sin(e), -Math.cos(e), Math.cos(a) * Math.sin(e)], mul(base0, 0.3 + Math.max(0, -(p.lift) - 0.8) * 0.12));
        dir[2] += -(p.sweep ?? 0) * 0.3;
      } else {
        dir = base0.slice(); dir[1] += p.lift * 0.62; dir[2] -= (p.sweep ?? 0) * 0.85;
      }
      if (p.tiltX) dir[0] += p.tiltX;
      dir = norm(dir);
      const L = p.len * q * (hanging ? 1.15 : 1.3);
      const base = add(hc, mul(base0, R * (hanging ? 1.0 : 0.8)));
      const tip = add(base, mul(dir, L + (hanging ? 0 : R * 0.14)));
      let bend = sub([0, -0.35, -1], mul(dir, dot(dir, [0, -0.35, -1])));
      bend = len3(bend) > 1e-3 ? norm(bend) : [0, 0, -1];
      const mid = add(lerp3(base, tip, 0.45), mul(bend, L * (hanging ? 0.05 : 0.14)));
      if (hanging) { // keep strands in front of the face surface
        const out = norm(sub(mid, hc)); mid[0] += out[0] * 0.012; mid[2] += out[2] * 0.012;
      }
      const r0 = p.rad * q * (hanging ? 1.25 : 1.75);
      ops.push({ p: P.roundCone(base, mid, r0, r0 * 0.62), k });
      ops.push({ p: P.roundCone(mid, tip, r0 * 0.62, 0.005 * q), k: k * 0.6 });
      if (p.bell) extra.bells.push(tip);
    } else if (p.t === 'drape') {
      const Lr = p.len * R * 2.0, w = p.w * q;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const a = (i / (n - 1) - 0.5) * 2.3;
        const base = add(hc, [Math.sin(a) * R * 0.75, R * 0.35, -Math.cos(a) * R * 0.7]);
        const tip = add(base, [Math.sin(a) * w * 0.55, -Lr, -Math.cos(a) * w * 0.25 - 0.06 * q]);
        const mid = add(lerp3(base, tip, 0.45), [Math.sin(a) * 0.04 * q, 0, -0.05 * q]);
        const rr = w * 0.3;
        ops.push({ p: P.roundCone(base, mid, rr, rr * 0.85), k: k * 1.4 });
        ops.push({ p: P.roundCone(mid, tip, rr * 0.85, p.spiky ? 0.006 * q : rr * 0.45), k: k * 1.4 });
      }
    } else if (p.t === 'puff') {
      for (let i = 0; i < p.n; i++) {
        const a = i * 2.399, yy = 0.25 + (i / p.n) * 0.65, rr = Math.sqrt(1 - yy * yy);
        const pos = add(hc, mul([Math.cos(a) * rr, yy, Math.sin(a) * rr], R * (0.95 + p.spread * 0.45)));
        if (pos[2] - hc[2] > R * 0.5 && pos[1] - hc[1] < R * 0.6) pos[2] -= 0.06 * q;
        ops.push({ p: P.sphere(pos, p.r * q * (0.85 + (i % 3) * 0.12)), k: k * 1.6 });
      }
    } else if (p.t === 'bun') {
      ops.push({ p: P.sphere(add(hc, mul(onSphere(p.az, p.el), R * 1.08)), p.r * q), k });
    } else if (p.t === 'tail') {
      const b0 = add(hc, [0, -R * 0.2, -R * 0.95]);
      const t1 = add(b0, [0, -p.len * q * 0.55, -0.05 * q]), t2 = add(t1, [0, -p.len * q * 0.5, 0.02 * q]);
      ops.push({ p: P.roundCone(b0, t1, p.w * q * 1.1, p.w * q), k });
      ops.push({ p: P.roundCone(t1, t2, p.w * q, 0.008 * q), k: k * 0.6 });
    } else if (p.t === 'kenseikan') {
      for (const s of [-1, 1]) extra.kenseikan.push([add(hc, [s * R * 0.32, R * 0.78, R * 0.05]), add(hc, [s * R * 0.62, R * 0.7, R * 0.1])]);
    } else if (p.t === 'antenna') {
      const b0 = add(hc, [0, R * 0.95, -R * 0.2]);
      const t = add(b0, [0, p.long ? 0.1 : 0.06, -(p.long ? 0.3 : 0.22)]);
      ops.push({ p: P.roundCone(b0, t, 0.05 * q, 0.03 * q), k });
    }
  }
  return { ops, extra };
}
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
function toLocal(m, T) { const Pp = m.position; for (let i = 0; i < Pp.length; i += 3) { Pp[i] -= T[0]; Pp[i + 1] -= T[1]; Pp[i + 2] -= T[2]; } return m; }
function cylUV(m) { const Pp = m.position, n = Pp.length / 3, Uv = new Float32Array(n * 2); for (let v = 0; v < n; v++) { let u = Math.atan2(Pp[v * 3], Pp[v * 3 + 2]) / (Math.PI * 2); if (u < 0) u += 1; Uv[v * 2] = u * 2; Uv[v * 2 + 1] = Pp[v * 3 + 1] * 2.2; } m.uv = Uv; return m; }

// ---- main ---------------------------------------------------------------------------------------
/**
 * Returns { dims, skeleton:{bones}, parts:[{name, kind:'skinned'|'rigid', bone, mesh, color, mat}] , anchors }
 * Colours are resolved later by the model builder (we return semantic material keys).
 */
export function generate(look, quality = 1) {
  const B = buildDims(look);
  const ex = new Set(look.extras || []);
  const sk = skeleton(B, ex.has('extraArms'));
  const pr = bodyPrims(B, sk, look);
  const top = look.top || { type: 'shirt' }, bottom = look.bottom || { type: 'pants' };
  const tt = top.type;
  const sleeves = tt === 'bare' ? 'none' : tt === 'vest' || tt === 'tank' ? 'none' : (top.sleeves ?? 'long');
  const vneck = ['gi', 'kimono', 'robe', 'haori'].includes(tt);
  const openFront = ['open', 'vest', 'coat', 'cloak', 'haori'].includes(tt) && !(tt === 'cloak' && top.collar);
  const skirt = ['robe', 'coat', 'cloak', 'haori'].includes(tt) ? (tt === 'robe' || tt === 'cloak' ? 1.0 : tt === 'coat' ? 0.85 : 0.7) : 0;
  const st = 0.016 / quality, fine = 0.011 / quality;
  const parts = [];
  const all = Object.values(pr).flat();
  const y = sk.y;

  // ---- skin body: only what clothing leaves visible (garments are solid) ----
  const skinList = [...pr.neck];
  const underShirt = !!top.under && (tt === 'vest' || tt === 'open');
  const torsoVisible = !underShirt && (tt === 'bare' || tt === 'vest' || tt === 'open' || vneck);
  if (torsoVisible) skinList.push(...pr.torso);
  if (tt === 'bare' && bottom.type === 'bare') skinList.push(...pr.pelvis);
  if (!underShirt && sleeves !== 'long' && sleeves !== 'wide') skinList.push(...pr.fore);
  if (!underShirt && (sleeves === 'none' || sleeves === 'short')) skinList.push(...pr.upper);
  if (!look.gloves) skinList.push(...pr.hands);
  if (bottom.type === 'bare') skinList.push(...pr.thigh, ...pr.shin, ...pr.pelvis);
  if (bottom.type === 'shorts') skinList.push(...pr.shin);
  const skin = meshOps(U(skinList, 0.03), st);
  if (skin) parts.push({ name: 'skin', kind: 'skinned', mesh: skin, mat: 'skin' });
  if (look.gloves) { const g = meshOps(U(pr.hands, 0.012), fine * 0.9); if (g) parts.push({ name: 'gloves', kind: 'skinned', mesh: g, mat: 'gloves' }); }
  if (underShirt) { // long-sleeved shirt under a vest / open jacket
    const u = meshOps([...U(pr.torso.map(p => inflate(p, 0.006)), 0.035), ...U(pr.upper.map(p => inflate(p, 0.006)), 0.03), ...U(pr.fore.map(p => inflate(p, 0.005)), 0.025), { p: P.box([0, y.torsoY - 0.17, 0], [B.waistW * 1.55, 0.15, B.chestD * 1.8], 0), k: 0.012, op: 's' }], st);
    if (u) parts.push({ name: 'undershirt', kind: 'skinned', mesh: u, mat: 'under' });
  }

  // ---- top garment ----
  if (tt !== 'bare') {
    const t = skirt ? 0.016 : 0.012;
    const ops = U(pr.torso.map(p => inflate(p, t)), 0.035);
    if (skirt || tt === 'coat' || tt === 'jacket' || tt === 'hoodie' || tt === 'suit') ops.push({ p: inflate(pr.pelvis[0], t + 0.004), k: 0.04 });
    const arms = [...sk.arms, ...sk.xArms];
    for (const a of arms) {
      const r = B.armR * (a.scale ?? 1);
      if (sleeves === 'none') continue;
      const sh = W(sk, a.sh, [0, -0.01, 0]);
      if (sleeves === 'short') ops.push({ p: P.roundCone(sh, W(sk, a.sh, [0, -B.armU * 0.62, 0]), r * 1.45 + t, r * 1.12 + t), k: 0.03 });
      else if (sleeves === 'wide') {
        ops.push({ p: P.roundCone(sh, W(sk, a.el, [0, 0, 0]), r * 1.4 + t, r * 1.55 + t), k: 0.03 });
        ops.push({ p: P.roundCone(W(sk, a.el, [0, 0, 0]), W(sk, a.ha, [0, 0.03, 0]), r * 1.55 + t, r * 2.0), k: 0.03 });
        ops.push({ p: P.box(W(sk, a.el, [0, -B.armF * 0.45, 0]), [r * 1.15, B.armF * 0.42, r * 1.9], 0.02, WR(sk, a.el)), k: 0.04 });
      } else {
        ops.push({ p: inflate(pr.upper[arms.indexOf(a) * (B.muscle ? 3 : 2)], t), k: 0.03 });
        ops.push({ p: P.roundCone(sh, W(sk, a.el, [0, 0, 0]), r * 1.12 + t, r * 0.95 + t), k: 0.03 });
        ops.push({ p: P.roundCone(W(sk, a.el, [0, 0, 0]), W(sk, a.ha, [0, 0.012, 0]), r * 1.0 + t, r * 0.86 + t), k: 0.025 });
      }
    }
    if (skirt) {
      for (const l of sk.legs) {
        const hip = W(sk, l.hp, [0, 0.03, 0]);
        const L = (y.hipJY - y.ankleY) * skirt;
        const end = add(hip, [l.side * 0.05, -L, -0.01]);
        ops.push({ p: P.roundCone(hip, end, B.hipW * 0.95 + t, B.legR * 2.0 + 0.02 * skirt), k: 0.07 });
      }
    }
    // straight hem for shirts (keeps sleeves untouched: box only spans the torso width)
    const hemY = skirt ? -1 : (tt === 'jacket' || tt === 'hoodie' || tt === 'suit' || tt === 'coat') ? y.hipY - 0.05 : y.torsoY - 0.02;
    if (hemY > 0) ops.push({ p: P.box([0, hemY - 0.15, 0], [B.waistW * 1.55, 0.15, B.chestD * 1.8], 0), k: 0.012, op: 's' });
    if (vneck) ops.push({ p: P.box([0, y.neckY + 0.045, B.chestD * 0.95], [0.065, 0.065, 0.12], 0.004, rotMat(0, 0, Math.PI / 4)), k: 0.012, op: 's' });
    if (openFront) {
      const w = tt === 'open' ? 0.045 : 0.03;
      ops.push({ p: P.box([0, y.torsoY + y.H * 0.4 - (skirt ? 0.3 : 0), B.chestD + 0.06], [w, y.H * 0.75 + (skirt ? 0.32 : 0), 0.08], 0.01), k: 0.01, op: 's' });
      if (tt === 'open') ops.push({ p: P.box([0, y.neckY + 0.02, B.chestD * 0.9], [0.06, 0.06, 0.12], 0.004, rotMat(0, 0, Math.PI / 4)), k: 0.01, op: 's' });
    }
    const m = meshOps(ops, st, pr.torso);
    if (m) { cylUV(m); parts.push({ name: 'top', kind: 'skinned', mesh: m, mat: top.pattern ? 'topPattern' : 'top' }); }
    // under layer visible in the V
    if (vneck && top.under) {
      const u = meshOps([...U([pr.torso[1], pr.torso[2]].map(p => inflate(p, 0.005)), 0.035), { p: P.box([0, y.torsoY + y.H * 0.35 - 0.15, 0], [B.waistW * 1.6, 0.15, B.chestD * 1.8], 0), k: 0.01, op: 's' }], st);
      if (u) parts.push({ name: 'under', kind: 'skinned', mesh: u, mat: 'under' });
    }
    // collar
    if (top.collar) {
      const c = meshOps([{ p: P.ring([0, y.neckY + 0.018, -0.008], 0.058 * (B.R / 0.235) * (1 + (B.muscle || 0) * 0.15), 0.011, 0.034, 0.006, rotMat(-0.12, 0, 0)), k: 0 }], fine * 0.8);
      if (c) parts.push({ name: 'collar', kind: 'rigid', bone: sk.torso, mesh: toLocal(c, sk.bones[sk.torso].T), mat: 'collar' });
    }
    if (vneck) { // kimono/gi lapel band along the V
      const lap = [];
      for (const s of [-1, 1]) lap.push({ p: P.capsule([s * 0.055, y.neckY + 0.0, B.chestD * 0.55], [s * 0.005, y.neckY - 0.11, B.chestD * 1.02], 0.016), k: 0.01 });
      const l = meshOps(lap, fine * 0.9);
      if (l) parts.push({ name: 'lapel', kind: 'rigid', bone: sk.torso, mesh: toLocal(l, sk.bones[sk.torso].T), mat: top.under ? 'under' : 'lapel' });
    }
    // belt / sash
    if (['gi', 'robe', 'kimono', 'haori', 'coat', 'cloak'].includes(tt) || top.belt) {
      const ops2 = [{ p: P.ring([0, y.torsoY + 0.012, 0], B.waistW * 1.13, 0.014, 0.026, 0.006, null, 1, (B.chestD * 1.0) / B.waistW), k: 0 }];
      if (tt === 'gi') ops2.push({ p: P.ellipsoid([0, y.torsoY + 0.012, B.chestD * 1.0], [0.03, 0.024, 0.02]), k: 0.01 });
      const b = meshOps(ops2, fine);
      if (b) parts.push({ name: 'belt', kind: 'skinned', mesh: b, mat: 'accent' });
    }
  }

  // ---- bottom garment ----
  if (bottom.type !== 'bare') {
    const t = 0.012;
    const ops = [{ p: inflate(pr.pelvis[0], t), k: 0 }];
    const wide = bottom.type === 'hakama' || bottom.type === 'robe';
    for (const l of sk.legs) {
      const i = sk.legs.indexOf(l);
      if (wide) {
        const hip = W(sk, l.hp, [0, 0.02, 0]);
        const ank = W(sk, l.kn, [0, -B.legS + (bottom.type === 'robe' ? -0.02 : 0.015), 0]);
        ops.push({ p: P.roundCone(hip, add(ank, [l.side * 0.035, 0, 0]), B.hipW * 0.85 + t, B.legR * 2.0 + t), k: 0.06 });
      } else {
        ops.push({ p: inflate(pr.thigh[i], t), k: 0.03 });
        if (bottom.type !== 'shorts') ops.push({ p: P.roundCone(W(sk, l.kn, [0, 0, 0]), W(sk, l.kn, [0, -B.legS + 0.035, 0]), B.legR * 0.92 + t, B.legR * 0.7 + t + (bottom.flare ? 0.02 : 0)), k: 0.025 });
        else ops.push({ p: P.roundCone(W(sk, l.kn, [0, 0.03, 0]), W(sk, l.kn, [0, -0.01, 0]), B.legR * 0.98 + t + 0.01, B.legR * 0.95 + t + 0.012), k: 0.02 });
      }
    }
    const m = meshOps(ops, st);
    if (m) parts.push({ name: 'bottom', kind: 'skinned', mesh: m, mat: 'bottom' });
  }
  // ---- shoes ----
  const shoes = meshOps(U(pr.feet, 0.025), fine);
  if (shoes) parts.push({ name: 'shoes', kind: 'skinned', mesh: shoes, mat: 'shoes' });
  // ---- wristbands ----
  if (ex.has('wristbands')) {
    const ops = [];
    for (const a of sk.arms) ops.push({ p: P.ring(W(sk, a.el, [0, -B.armF * 0.72, 0]), B.armR * 0.95, 0.012, 0.028, 0.006, WR(sk, a.el)), k: 0 });
    const m = meshOps(ops, fine * 0.8);
    if (m) parts.push({ name: 'wrist', kind: 'skinned', mesh: m, mat: 'wrist' });
  }

  // ---- head (rigid, head-bone space) ----
  const R = B.R, hc = [0, R * 0.92, 0.012], q = R / 0.3;
  const jaw = look.jaw ?? (B.muscle >= 1 ? 'square' : look.build === 'slim' || look.build === 'tall' ? 'sharp' : 'round');
  const hops = [];
  hops.push({ p: P.ellipsoid(add(hc, [0, R * 0.04, -R * 0.02]), [R * 1.0, R * 0.98, R * 1.0]), k: 0 });
  const jw = jaw === 'square' ? 0.86 : jaw === 'sharp' ? 0.68 : 0.78;
  hops.push({ p: P.ellipsoid(add(hc, [0, -R * 0.36, R * 0.16]), [R * jw, R * 0.6, R * 0.76]), k: R * 0.42 });
  hops.push({ p: P.ellipsoid(add(hc, [0, -R * (jaw === 'sharp' ? 0.82 : 0.76), R * 0.48]), [R * (jaw === 'square' ? 0.34 : 0.22), R * 0.16, R * 0.24]), k: R * 0.3 });
  for (const s of [-1, 1]) hops.push({ p: P.ellipsoid(add(hc, [s * R * 0.5, -R * 0.36, R * 0.6]), [R * 0.3, R * 0.22, R * 0.26]), k: R * 0.25 });
  hops.push({ p: P.ellipsoid(add(hc, [0, -R * 0.3, R * 0.98]), [R * 0.07, R * 0.11, R * 0.08]), k: R * 0.06 });
  if (!ex.has('noEars')) for (const s of [-1, 1]) {
    if (ex.has('pointyEars') || ex.has('catEars')) {
      if (ex.has('pointyEars')) hops.push({ p: P.roundCone(add(hc, [s * R * 0.92, -R * 0.12, -R * 0.02]), add(hc, [s * R * 1.42, R * 0.18, -R * 0.08]), R * 0.12, R * 0.02), k: R * 0.1 });
    } else hops.push({ p: P.ellipsoid(add(hc, [s * R * 0.97, -R * 0.12, -R * 0.06]), [R * 0.1, R * 0.19, R * 0.14]), k: R * 0.08 });
  }
  for (const s of [-1, 1]) hops.push({ p: P.ellipsoid(add(hc, [s * R * 0.36, -R * 0.06, R * 1.0]), [R * 0.24, R * 0.16, R * 0.1]), k: R * 0.1, op: 's' });
  const head = meshOps(hops, fine * 0.95);
  if (head) { sphereUV(head, hc); parts.push({ name: 'head', kind: 'rigid', bone: sk.head, mesh: head, mat: 'face' }); }

  // ---- hair ----
  const hs = look.hair?.style;
  let hairExtra = null;
  if (hs && hs !== 'none' && hs !== 'bald') {
    const { ops, extra } = hairOps(hs, R, hc, q);
    hairExtra = extra;
    const h = meshOps(ops, fine * 1.05);
    if (h) parts.push({ name: 'hair', kind: 'rigid', bone: sk.head, mesh: h, mat: 'hair' });
    if (look.hair.color2 !== undefined && extra.cap) {
      const c = extra.cap.c;
      const u = meshOps([{ p: P.ellipsoid(c, [R * 1.03, R * 1.0, R * 1.05]), k: 0 }, { clip: [[0, 0, 1], hc[2] + R * 0.25, 0.02] }, { clip: [[0, -1, 0], -(hc[1] - R * 0.35), 0.02] }], fine * 1.1);
      if (u) parts.push({ name: 'hair2', kind: 'rigid', bone: sk.head, mesh: u, mat: 'hair2' });
    }
    if (extra.bells.length) { const b = meshOps(extra.bells.map(p => ({ p: P.sphere(p, 0.022 * q * 1.4), k: 0 })), fine * 0.6); if (b) parts.push({ name: 'bells', kind: 'rigid', bone: sk.head, mesh: b, mat: 'hair2' }); }
    if (extra.kenseikan.length) { const kk = meshOps(extra.kenseikan.map(([a, b]) => ({ p: P.capsule(a, b, 0.018), k: 0 })), fine * 0.7); if (kk) parts.push({ name: 'kenseikan', kind: 'rigid', bone: sk.head, mesh: kk, mat: 'white' }); }
  }
  // head bands that wrap the actual skull shape
  if (ex.has('blindfold') || ex.has('headband')) {
    const bf = ex.has('blindfold');
    const yb = bf ? hc[1] - R * 0.08 : hc[1] + R * 0.42;
    const band = meshOps([{ p: P.ellipsoid(add(hc, [0, bf ? -R * 0.04 : R * 0.04, bf ? 0.004 : -R * 0.02]), [R * 1.04, R * 1.02, R * (bf ? 1.07 : 1.04)]), k: 0 }, { clip: [[0, 1, 0], yb + R * (bf ? 0.14 : 0.13), 0.006] }, { clip: [[0, -1, 0], -(yb - R * (bf ? 0.14 : 0.1)), 0.006] }], fine * 0.85);
    if (band) parts.push({ name: bf ? 'blindfold' : 'headband', kind: 'rigid', bone: sk.head, mesh: band, mat: bf ? 'blindfold' : 'headband' });
  }

  // ---- AO (whole-character occlusion field, coarse) + skin weights ----
  const [olo, ohi] = boundsOf(all, 0.15);
  const occ = new Field(olo, ohi, 0.03);
  for (const p of all) occ.stamp(p, 0.03, 'u');
  // head occluder in body space (head bone translation only)
  const ht = sk.bones[sk.head].T;
  occ.stamp(P.ellipsoid(add(ht, hc), [R, R, R]), 0.03, 'u');
  const weightPrims = all.filter(p => p.bone !== undefined);
  for (const pt of parts) {
    const m = pt.mesh;
    if (pt.kind === 'skinned') { bakeAO(m, occ, pt.name === 'skin' ? 0.9 : 0.6); skinWeights(m, weightPrims, 0.028); }
    else {
      // rigid parts: AO in their own bone space (shift into body space for sampling)
      const bt = sk.bones[pt.bone];
      const Pp = m.position, n = Pp.length / 3, tmp = { position: new Float32Array(Pp.length), normal: m.normal };
      for (let v = 0; v < n; v++) { const w = add3(bt.T, mApply(bt.R, [Pp[v * 3], Pp[v * 3 + 1], Pp[v * 3 + 2]])); tmp.position.set(w, v * 3); }
      bakeAO(tmp, occ, pt.name === 'head' || pt.name === 'hair' ? 0.4 : 0.7);
      m.color = tmp.color;
    }
  }
  return {
    dims: B, y: sk.y,
    bones: sk.bones.map(b => ({ name: b.name, parent: b.parent, local: b.local, rz: b.rz, T: b.T })),
    arms: sk.arms.map(a => ({ ...a })), xArms: sk.xArms.map(a => ({ ...a })), legs: sk.legs.map(l => ({ ...l })),
    hips: sk.hips, torso: sk.torso, head: sk.head, hc,
    parts: parts.map(p => ({ name: p.name, kind: p.kind, bone: p.bone, mat: p.mat, mesh: p.mesh })),
  };
}

/** transferable buffers of a generated model (for worker → main thread) */
export function transferables(g) {
  const out = [];
  for (const p of g.parts) for (const k of ['position', 'normal', 'index', 'color', 'uv', 'skinIndex', 'skinWeight']) if (p.mesh[k]) out.push(p.mesh[k].buffer);
  return out;
}

// Character model builder v2: sculpted SDF meshes (charGen.js) skinned to a
// bone skeleton, with baked AO, cel shading, ink outlines and accessories.
import * as THREE from 'three';
import { toonUnique, outlineMaterial, glowUnique, darken, lighten } from './toon.js';
import { faceTexture } from './face.js';
import { generate } from './charGen.js';

// ---- quality + cache + worker prewarm -----------------------------------------------------
const Q = { lo: 0.62, hi: 1.0 };
export function setLowEnd(on) { Q.lo = on ? 0.48 : 0.62; }
let defaultQuality = 'lo';
export function setModelQuality(q) { defaultQuality = q; }
const genCache = new Map();   // key -> generated data
const geoCache = new Map();   // key -> Map(partName -> BufferGeometry)
const lookKey = (look, q) => q + '|' + JSON.stringify(look);

let workers = null, reqId = 0;
const pending = new Map();
function pool() {
  if (workers !== null) return workers;
  workers = [];
  try {
    const n = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 2) - 1));
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL('./charWorker.js', import.meta.url), { type: 'module' });
      w.onmessage = (e) => { const p = pending.get(e.data.id); if (p) { pending.delete(e.data.id); p(e.data.g); } };
      w.onerror = () => {};
      workers.push(w);
    }
  } catch { workers = []; }
  return workers;
}
let rr = 0;
/** generate looks in background workers; resolves when all are cached */
export function prewarmLooks(looks, q = defaultQuality) {
  const ws = pool();
  const jobs = [];
  const seen = new Set();
  for (const look of looks) {
    if (!look || look.rig === 'dragon' || look.rig === 'beast') continue;
    const key = lookKey(look, q);
    if (genCache.has(key) || seen.has(key)) continue;
    seen.add(key);
    if (!ws.length) { genCache.set(key, generate(look, Q[q])); continue; }
    const id = ++reqId;
    jobs.push(new Promise(res => { pending.set(id, (g) => { genCache.set(key, g); res(); }); ws[rr++ % ws.length].postMessage({ id, look, quality: Q[q] }); }));
  }
  return Promise.all(jobs);
}
export function isLookReady(look, q = defaultQuality) { return !look || look.rig === 'dragon' || look.rig === 'beast' || genCache.has(lookKey(look, q)); }

function getGen(look, q) {
  const key = lookKey(look, q);
  let g = genCache.get(key);
  if (!g) { g = generate(look, Q[q]); genCache.set(key, g); }
  let geos = geoCache.get(key);
  if (!geos) {
    geos = new Map();
    for (const p of g.parts) {
      const geo = new THREE.BufferGeometry();
      const m = p.mesh;
      geo.setAttribute('position', new THREE.BufferAttribute(m.position, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(m.normal, 3));
      if (m.color) geo.setAttribute('color', new THREE.BufferAttribute(m.color, 3));
      if (m.uv) geo.setAttribute('uv', new THREE.BufferAttribute(m.uv, 2));
      if (m.skinIndex) { geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(m.skinIndex, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(m.skinWeight, 4)); }
      geo.setIndex(new THREE.BufferAttribute(m.index, 1));
      geo.computeBoundingSphere();
      geo.userData.shared = true;
      geos.set(p.name, geo);
    }
    geoCache.set(key, geos);
  }
  return { g, geos };
}

// ---- builder --------------------------------------------------------------------------------
export function buildHumanV2(look, opts, helpers) {
  const { patternTexture, buildWeapon } = helpers;
  const q = opts.quality || defaultQuality;
  const { g, geos } = getGen(look, q);
  const B = g.dims;
  const flash = { value: 0 };
  const matCache = new Map();
  const M = (color, o = {}) => {
    const k = [color, o.map ? o.map.uuid : '', o.side ?? '', o.rim ?? '', o.rimColor ?? '', o.emissive ?? '', o.vc ? 1 : 0, o.shine ?? ''].join('|');
    if (matCache.has(k)) return matCache.get(k);
    const m = toonUnique(color, o);
    m.userData.flash = flash;
    if (o.side) m.side = o.side;
    matCache.set(k, m);
    return m;
  };
  const OL = opts.outline ?? 0.016;
  const ink = (geo, mat, th = OL) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    if (th > 0) { const o = new THREE.Mesh(geo, outlineMaterial(th)); o.userData.isOutline = true; mesh.add(o); }
    return mesh;
  };
  const skin = look.skin ?? 0xffd9bd;
  const top = look.top || { type: 'shirt', color: 0x333344 };
  const bottom = look.bottom || { type: 'pants', color: 0x222233 };
  const extras = new Set(look.extras || []);
  const topColor = top.type === 'bare' ? skin : top.color;
  const faceDesc = { skin, eyes: look.eyes || {}, mouth: look.mouth, marks: look.marks || [], brows: look.brows, browColor: look.browColor ?? (look.hair?.color ?? 0x2a1a14), beardColor: look.beardColor, maskColor: look.maskColor, angry: look.angry, noBlush: look.noBlush };
  const matFor = (key) => {
    switch (key) {
      case 'skin': return M(skin, { vc: true, rim: 0.35 });
      case 'gloves': return M(look.gloves, { vc: true });
      case 'top': return M(topColor, { vc: true });
      case 'topPattern': return M(0xffffff, { vc: true, map: patternTexture(top.pattern, top.color, top.color2 ?? 0xcc2222) });
      case 'under': return M(top.under ?? 0xf2f2f4, { vc: true });
      case 'lapel': return M(top.color2 ?? lighten(topColor, 0.25), { vc: true });
      case 'collar': return M(top.collarColor ?? topColor, { vc: true });
      case 'accent': return M(top.color2 ?? darken(topColor, 0.35), { vc: true });
      case 'bottom': return M(bottom.color, { vc: true });
      case 'shoes': return M(look.shoes ?? 0x1e1a22, { vc: true, rim: 0.3 });
      case 'wrist': return M(look.wristColor ?? 0x2a5adf, { vc: true });
      case 'face': return M(0xffffff, { vc: true, map: faceTexture(faceDesc), rim: 0.25 });
      case 'hair': return M(look.hair?.color ?? 0x1a1a1a, { vc: true, rim: 0.5, shine: 0.32 });
      case 'hair2': return M(look.hair?.color2 ?? darken(look.hair?.color ?? 0x1a1a1a, 0.45), { vc: true, shine: 0.3 });
      case 'white': return M(0xf2f2f4, { vc: true });
      case 'blindfold': return M(0x15151c, { vc: true, rim: 0.4 });
      case 'headband': return M(look.headbandColor ?? 0x1c2a55, { vc: true });
      default: return M(0xff00ff);
    }
  };

  // skeleton
  const group = new THREE.Group();
  const root = new THREE.Group(); group.add(root);
  const body = new THREE.Group(); root.add(body);
  const scale = B.s * (look.scale ?? 1);
  body.scale.setScalar(scale);
  const bones = g.bones.map(b => { const o = new THREE.Bone(); o.name = b.name; o.position.fromArray(b.local); o.rotation.z = b.rz; return o; });
  g.bones.forEach((b, i) => { if (b.parent >= 0) bones[b.parent].add(bones[i]); });
  body.add(bones[0]);
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const noOutline = new Set(['belt', 'wrist', 'lapel', 'under', 'bells', 'kenseikan']);
  for (const p of g.parts) {
    const geo = geos.get(p.name);
    const mat = matFor(p.mat);
    const th = noOutline.has(p.name) ? 0 : p.name === 'hair' ? OL * 0.9 : p.name === 'head' ? OL * 0.85 : OL;
    if (p.kind === 'skinned') {
      const mesh = new THREE.SkinnedMesh(geo, mat);
      mesh.castShadow = true; mesh.frustumCulled = false;
      body.add(mesh); mesh.updateMatrixWorld(true); mesh.bind(skeleton, mesh.matrixWorld);
      if (th > 0) { const o = new THREE.SkinnedMesh(geo, outlineMaterial(th)); o.userData.isOutline = true; o.frustumCulled = false; body.add(o); o.updateMatrixWorld(true); o.bind(skeleton, o.matrixWorld); }
    } else {
      bones[p.bone].add(ink(geo, mat, th));
    }
  }

  // rig handles expected by the animator / accessories
  const y = g.y, R = B.R, H = y.H, Wd = B.shW * 0.95, TD = B.chestD;
  const hips = bones[g.hips], torso = bones[g.torso], headBone = bones[g.head];
  const headG = new THREE.Group(); headG.position.fromArray(g.hc); headBone.add(headG);
  const mkArm = (a) => {
    const grip = new THREE.Group(); grip.position.set(0, -0.06 * (B.armR / 0.046), 0.012); bones[a.ha].add(grip);
    return { shoulder: bones[a.sh], elbow: bones[a.el], hand: grip, side: a.side };
  };
  const arms = g.arms.map(mkArm);
  const extraArms = g.xArms.map(mkArm);
  const legs = g.legs.map(l => ({ hip: bones[l.hp], knee: bones[l.kn] }));

  // ---------- accessories ----------
  const ex = (k) => extras.has(k);
  const skinM = M(skin);
  if (ex('headband')) {
    const plate = ink(new THREE.BoxGeometry(0.17, 0.065, 0.03, 1, 1, 1), M(0xc9d0da, { rim: 0.8 }), 0.008);
    plate.position.set(0, R * 0.42, R * 1.03); plate.rotation.x = -0.12; headG.add(plate);
  }
  if (ex('strawhat')) {
    const hatM = M(0xf2cf5a); const band = M(0xc8202a);
    const brim = ink(new THREE.CylinderGeometry(R * 1.85, R * 1.9, 0.026, 40), hatM, 0.01); brim.position.y = R * 0.62; brim.rotation.x = -0.14; headG.add(brim);
    const dome = ink(new THREE.SphereGeometry(R * 1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), hatM, 0.012); dome.position.y = R * 0.58; dome.scale.y = 0.78; dome.rotation.x = -0.14; headG.add(dome);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.11, R * 1.11, 0.055, 32, 1, true), band); b.position.y = R * 0.68; b.rotation.x = -0.14; headG.add(b);
  }
  if (ex('strawhatBack')) {
    const brim = ink(new THREE.CylinderGeometry(R * 1.6, R * 1.65, 0.026, 32), M(0xf2cf5a), 0.01); brim.position.set(0, H * 0.75, -Wd * 1.1); brim.rotation.x = 1.3; torso.add(brim);
  }
  if (ex('bucketHat')) {
    const hm = M(0xffffff, { map: patternTexture('stripes', 0x2f6b3a, 0xf0f0e0) });
    const brim = ink(new THREE.CylinderGeometry(R * 1.45, R * 1.5, 0.026, 32), hm, 0.01); brim.position.y = R * 0.55; headG.add(brim);
    const dome = ink(new THREE.CylinderGeometry(R * 0.95, R * 1.1, R * 0.6, 28), hm, 0.012); dome.position.y = R * 0.82; headG.add(dome);
  }
  if (ex('furHat')) {
    const hm = M(0xffffff, { map: patternTexture('spots', 0xf3f0e6, 0x6b4a2a) });
    const dome = ink(new THREE.SphereGeometry(R * 1.14, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hm, 0.012); dome.position.y = R * 0.25; headG.add(dome);
    const rim = ink(new THREE.TorusGeometry(R * 1.1, 0.045, 10, 32), M(0xf3f0e6), 0.008); rim.rotation.x = Math.PI / 2; rim.position.y = R * 0.3; headG.add(rim);
  }
  if (ex('marineCap')) {
    const dome = ink(new THREE.CylinderGeometry(R * 1.0, R * 1.06, R * 0.5, 28), M(0xe8e8ee), 0.012); dome.position.y = R * 0.74; headG.add(dome);
    const visor = ink(new THREE.CylinderGeometry(R * 0.62, R * 0.62, 0.02, 20, 1, false, -0.9, 1.8), M(0x1e2a44), 0.008); visor.position.set(0, R * 0.5, R * 0.55); headG.add(visor);
  }
  if (ex('bandana')) { const b = ink(new THREE.SphereGeometry(R * 1.1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.45), M(look.bandanaColor ?? 0x1c1c1c), 0.012); b.rotation.x = -0.35; headG.add(b); }
  if (ex('sunglasses')) {
    const gm = M(look.glassesColor ?? 0x1a1a24, { rim: 0.9, rimColor: 0xff66cc });
    for (const s of [-1, 1]) { const l = ink(new THREE.SphereGeometry(1, 16, 10), gm, 0.1); l.scale.set(R * 0.27, R * 0.15, R * 0.08); l.position.set(s * R * 0.36, -R * 0.06, R * 0.98); headG.add(l); }
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, R * 0.25, 6), gm); br.rotation.z = Math.PI / 2; br.position.set(0, -R * 0.04, R * 1.02); headG.add(br);
  }
  if (ex('horns') || ex('hornsBig') || ex('hornsBack')) {
    const hm = M(look.hornColor ?? 0xeeeadf, { rim: 0.7 });
    for (const s of [-1, 1]) {
      const big = ex('hornsBig');
      const h = ink(curvedHorn(big ? 0.06 : 0.04, big ? 0.5 : 0.22, s), hm, 0.01);
      h.position.set(s * R * 0.55, R * 0.72, ex('hornsBack') ? -0.05 : 0.03);
      h.rotation.z = -s * (big ? 0.3 : 0.55); h.rotation.x = ex('hornsBack') ? -0.7 : -0.15;
      headG.add(h);
    }
  }
  if (ex('hornLong')) { const hm = M(look.hornColor ?? 0xf4f2ee, { rim: 0.7 }); for (const s of [-1, 1]) { const h = ink(curvedHorn(0.045, 0.62, s), hm, 0.01); h.position.set(s * R * 0.6, R * 0.85, -0.04); h.rotation.set(-0.45, 0, -s * 0.45); headG.add(h); } }
  if (ex('boarHead')) { // Inosuke's boar mask
    const bm = M(0x8a8a96, { rim: 0.6 }), fur = M(0x5a5a64);
    const sk = ink(new THREE.SphereGeometry(R * 1.12, 28, 18), bm, 0.014); sk.scale.set(1, 1.05, 1.1); headG.add(sk);
    const sn = ink(new THREE.CylinderGeometry(R * 0.36, R * 0.46, R * 0.7, 20), bm, 0.012); sn.rotation.x = Math.PI / 2; sn.position.set(0, -R * 0.2, R * 1.05); headG.add(sn);
    const nose = new THREE.Mesh(new THREE.CircleGeometry(R * 0.34, 18), M(0x2a2a30)); nose.position.set(0, -R * 0.2, R * 1.41); headG.add(nose);
    for (const s2 of [-1, 1]) {
      const e = ink(new THREE.ConeGeometry(R * 0.2, R * 0.45, 10), fur, 0.01); e.position.set(s2 * R * 0.62, R * 0.9, 0); e.rotation.z = -s2 * 0.5; headG.add(e);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(R * 0.11, 10, 8), M(0x111116, { rim: 1, rimColor: 0xffffff })); eye.position.set(s2 * R * 0.38, R * 0.22, R * 1.0); headG.add(eye);
      const tusk = ink(new THREE.ConeGeometry(R * 0.06, R * 0.32, 8), M(0xf2eee0), 0.008); tusk.position.set(s2 * R * 0.32, -R * 0.42, R * 1.2); tusk.rotation.set(0.6, 0, s2 * 0.4); headG.add(tusk);
    }
    const mane = ink(new THREE.SphereGeometry(R * 1.0, 18, 12), fur, 0.012); mane.position.set(0, R * 0.2, -R * 0.5); mane.scale.set(1.05, 1, 0.8); headG.add(mane);
  }
  if (ex('pelt')) { const pm = M(0x8a6a4a); for (const s2 of [-1, 1]) { const p2 = ink(new THREE.SphereGeometry(0.1, 12, 8), pm, 0.01); p2.position.set(s2 * B.hipW * 0.9, -0.03, 0.02); p2.scale.set(1, 1.3, 0.8); hips.add(p2); } }
  if (ex('catEars')) for (const s of [-1, 1]) { const e = ink(new THREE.ConeGeometry(0.085, 0.24, 12), skinM, 0.01); e.position.set(s * R * 0.6, R * 0.85, 0); e.rotation.z = -s * 0.32; headG.add(e); }
  if (ex('halfHelmet')) {
    const h = ink(new THREE.SphereGeometry(R * 1.1, 24, 14, 0, Math.PI, 0, Math.PI * 0.4), M(0xf2f0ea), 0.01); h.rotation.y = -Math.PI / 2 + 0.3; headG.add(h);
    const horn = ink(curvedHorn(0.035, 0.28, -1), M(0xf2f0ea), 0.008); horn.position.set(-R * 0.5, R * 0.85, 0); horn.rotation.z = 0.4; headG.add(horn);
  }
  if (ex('jawBone')) { const j = ink(new THREE.SphereGeometry(R * 0.55, 16, 10, 0, Math.PI, 0, Math.PI * 0.5), M(0xf2f0ea), 0.008); j.rotation.set(Math.PI, 0, 0); j.position.set(0.08, -R * 0.42, R * 0.72); j.scale.set(0.7, 0.5, 0.6); headG.add(j); }
  if (ex('crest')) { const cm = M(look.crestColor ?? 0x2f6a3a); for (const s of [-1, 1]) { const c = ink(new THREE.ConeGeometry(0.075, 0.4, 8), cm, 0.01); c.position.set(s * R * 0.55, R * 0.8, -0.05); c.rotation.set(-0.4, 0, -s * 0.45); c.scale.z = 0.45; headG.add(c); } }
  if (ex('dome')) { const d = ink(new THREE.SphereGeometry(R * 1.06, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), M(look.domeColor ?? 0x9a4fd0, { rim: 0.8 }), 0.012); d.rotation.x = -0.3; d.position.y = R * 0.03; headG.add(d); }
  if (ex('antennae')) for (const s of [-1, 1]) { const a = ink(new THREE.CapsuleGeometry(0.016, 0.2, 4, 8), skinM, 0.008); a.position.set(s * 0.07, R * 1.08, 0.06); a.rotation.set(-0.3, 0, -s * 0.25); headG.add(a); }
  if (ex('earrings')) for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 16), M(0xf3c542)); e.position.set(s * R * 1.0, -R * 0.36, -R * 0.06); headG.add(e); }
  if (ex('scarf')) {
    const sm = M(look.scarfColor ?? 0xe8eaf4);
    const s = ink(new THREE.TorusGeometry(Wd * 0.48, 0.045, 10, 26), sm, 0.008); s.rotation.x = Math.PI / 2; s.position.y = H * 1.0; torso.add(s);
    const tail = ink(new THREE.CapsuleGeometry(0.04, 0.42, 4, 10), sm, 0.008); tail.position.set(0.1, H * 0.75, -TD * 1.05); tail.rotation.z = 0.2; torso.add(tail);
  }
  if (ex('featherCoat')) {
    const fm = M(look.featherColor ?? 0xff5fae, { rim: 0.6 });
    for (let i = 0; i < 16; i++) { const a = (i / 15) * Math.PI * 1.25 + Math.PI * 0.875; const f = ink(new THREE.SphereGeometry(0.085, 12, 10), fm, 0.01); f.position.set(Math.cos(a) * Wd * 1.12, H * (0.95 + (i % 2) * 0.05), Math.sin(a) * TD * 1.3); torso.add(f); }
  }
  if (ex('shoulderPads')) for (const s of [-1, 1]) { const p = ink(new THREE.SphereGeometry(0.13, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), M(look.armorColor ?? 0xa3242a), 0.01); p.position.set(s * (Wd + 0.03), H * 0.9, 0); p.scale.set(1, 0.7, 0.9); torso.add(p); }
  if (ex('armorPlates')) { const am = M(look.armorColor ?? 0xa3242a); for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const p = ink(new THREE.CylinderGeometry(0.075, 0.08, 0.11, 12, 1, false, -0.8, 1.6), am, 0.008); p.position.set(s * B.hipW * 1.0, -0.08 - i * 0.1, 0.02); p.rotation.y = s * 1.2; hips.add(p); } }
  if (ex('rods')) for (let i = 0; i < 4; i++) { const r = ink(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 6), M(0x22222a), 0.005); r.position.set(-Wd * 0.45 + i * 0.07, H * 0.6, TD * 0.95); r.rotation.x = 1.2; torso.add(r); }
  if (top.buttons && top.type !== 'bare') for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), M(0xd8b84a, { rim: 0.9 })); b.position.set(0, H * (0.3 + i * 0.2), TD * 0.98 + 0.012); torso.add(b); }
  let cape = null;
  if (ex('cape') || ex('haori') || ex('captainHaori') || ex('shoulderCape') || ex('marineCoat')) {
    const capeColor = look.capeColor ?? (ex('captainHaori') || ex('marineCoat') ? 0xf4f4f6 : 0x2a1a3a);
    const L = ex('shoulderCape') ? y.hipY * 0.7 + H * 0.5 : y.hipY * 0.92 + H * 0.85;
    const geo = new THREE.CylinderGeometry(Wd * 1.12, Wd * 1.55, L, 28, 8, true, Math.PI * 0.55, Math.PI * 0.9);
    geo.translate(0, -L / 2, 0);
    const pos = geo.attributes.position; // gentle cloth folds
    for (let i = 0; i < pos.count; i++) { const a = Math.atan2(pos.getX(i), pos.getZ(i)); const t = -pos.getY(i) / L; pos.setX(i, pos.getX(i) * (1 + Math.sin(a * 9) * 0.04 * t)); pos.setZ(i, pos.getZ(i) * (1 + Math.sin(a * 9) * 0.04 * t)); }
    geo.computeVertexNormals();
    const cm = M(capeColor, { side: THREE.DoubleSide });
    cape = ink(geo, cm, 0.01);
    cape.position.set(0, H * 0.98, -0.01); cape.scale.z = (TD / Wd) * 1.2;
    torso.add(cape);
    if (ex('haori') || ex('captainHaori') || ex('marineCoat')) for (const s of [-1, 1]) { const shp = ink(new THREE.SphereGeometry(0.12, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), cm, 0.01); shp.position.set(s * (Wd + 0.02), H * 0.9, 0); shp.scale.set(1, 0.6, 1.05); torso.add(shp); }
  }
  if (ex('wings')) {
    const wm = M(look.wingColor ?? 0x141414, { side: THREE.DoubleSide, rim: 0.7, rimColor: 0x55ffaa });
    for (const s of [-1, 1]) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0); shape.quadraticCurveTo(0.5, 0.5, 1.0, 0.25); shape.quadraticCurveTo(0.85, 0.0, 0.95, -0.2); shape.quadraticCurveTo(0.6, -0.1, 0.65, -0.45); shape.quadraticCurveTo(0.35, -0.25, 0, -0.1);
      const w = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2, curveSegments: 12 }), wm);
      w.scale.set(s * 0.85, 0.85, 1); w.position.set(s * 0.05, H * 0.8, -TD * 0.9); w.rotation.y = s * 0.5; w.userData.wing = s; torso.add(w);
    }
  }
  let tail = null;
  if (ex('tail')) {
    const tm = M(look.tailColor ?? skin);
    tail = new THREE.Group(); tail.position.set(0, -0.02, -B.chestD * 0.85); hips.add(tail);
    let prev = tail;
    for (let i = 0; i < 6; i++) { const seg = new THREE.Group(); seg.position.set(0, 0, -0.09); prev.add(seg); const m = ink(new THREE.SphereGeometry(0.06 - i * 0.007, 12, 10), tm, 0.008); m.scale.z = 1.6; seg.add(m); seg.rotation.x = 0.22; prev = seg; }
  }
  if (ex('wheel')) {
    const wg = new THREE.Group(); wg.position.y = R * 1.7; headG.add(wg);
    const wm = M(0xd8c27a, { rim: 0.8 });
    wg.add(ink(new THREE.TorusGeometry(0.26, 0.022, 10, 36), wm, 0.008));
    for (let i = 0; i < 8; i++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.52, 6), wm); sp.rotation.z = i * Math.PI / 8; wg.add(sp); const k = ink(new THREE.SphereGeometry(0.035, 10, 8), wm, 0.006); k.position.set(Math.cos(i * Math.PI / 4) * 0.28, Math.sin(i * Math.PI / 4) * 0.28, 0); wg.add(k); }
    wg.userData.spin = true;
  }
  if (ex('sheaths')) for (let i = 0; i < (look.sheathCount ?? 2); i++) { const s = ink(new THREE.CapsuleGeometry(0.018, 0.55, 4, 8), M([0xf2f2f2, 0x2a2a2a, 0xa3242a][i % 3]), 0.006); s.position.set(-B.hipW * 1.15, -0.02 - i * 0.035, -0.05 + i * 0.05); s.rotation.set(0.2, 0, 1.2); hips.add(s); }
  if (ex('swordBack')) { const s = buildWeapon({ type: look.backWeapon ?? 'katana', color: look.backWeaponColor }, M, ink); s.position.set(0.1, H * 0.85, -TD * 1.05); s.rotation.set(0, 0, 2.6); torso.add(s); }
  if (ex('truthOrbs')) {
    const og = new THREE.Group(); og.position.set(0, H * 1.0, -TD * 1.6); torso.add(og);
    for (let i = 0; i < 6; i++) { const o = ink(new THREE.SphereGeometry(0.065, 14, 12), M(0x16121c, { rim: 1, rimColor: 0xb47cff }), 0.008); const a = Math.PI + (i / 5) * Math.PI; o.position.set(Math.cos(a) * 0.42, Math.sin(a) * 0.42 + 0.33, 0); og.add(o); }
    og.userData.orbs = true;
  }
  let weapon = null;
  if (look.weapon && look.weapon.type !== 'none') {
    weapon = buildWeapon(look.weapon, M, ink);
    arms[1].hand.add(weapon);
    if (look.weapon.dual) arms[0].hand.add(buildWeapon(look.weapon, M, ink));
    if (look.weapon.mouth) { const w3 = buildWeapon(look.weapon, M, ink); w3.scale.setScalar(0.85); w3.rotation.set(0, 0, Math.PI / 2); w3.position.set(0, -R * 0.42, R * 0.92); headG.add(w3); }
  }
  if (look.glow) { const gm = glowUnique(look.glow, 0.45); for (const a of arms) a.hand.add(new THREE.Mesh(new THREE.SphereGeometry(B.armR * 1.35, 12, 10), gm)); }
  if (look.claws) for (const a of arms) for (let i = -1; i <= 1; i++) { const cl = ink(new THREE.ConeGeometry(0.016, 0.13, 6), M(0xf0f0f0), 0.006); cl.position.set(i * 0.024, -0.05, 0.03); cl.rotation.x = Math.PI; a.hand.add(cl); }

  const auraAnchor = new THREE.Group(); auraAnchor.position.y = (y.hipY + H * 0.5) * scale; root.add(auraAnchor);
  const height = (y.headY + g.hc[1] + R * 1.05) * scale;
  const rig = {
    type: 'human', root, body, hips, torso, head: headBone, headCenter: headG, arms, legs, extraArms, cape, tail, weapon, flash, auraAnchor,
    height, build: { head: R, ...B }, scale, spinners: [], wings: [], t: Math.random() * 10, v2: true,
  };
  group.traverse(o => { if (o.userData.spin || o.userData.orbs) rig.spinners.push(o); if (o.userData.wing) rig.wings.push(o); });
  group.userData.rig = rig;
  return { group, rig };
}

/** smooth tapered, slightly curved horn */
function curvedHorn(r, L, side) {
  const pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector3(side * Math.sin(t * 1.2) * L * 0.18, t * L, -Math.sin(t * 1.4) * L * 0.12)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 16, r, 10, false);
  const pos = geo.attributes.position; const nrm = geo.attributes.normal;
  // taper towards the tip
  for (let i = 0; i < pos.count; i++) {
    const seg = Math.floor(i / 11) / 16; const c = curve.getPointAt(Math.min(1, seg));
    const k = 1 - seg * 0.92;
    pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * k, c.y + (pos.getY(i) - c.y) * k, c.z + (pos.getZ(i) - c.z) * k);
  }
  geo.computeVertexNormals();
  return geo;
}

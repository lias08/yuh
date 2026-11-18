// Procedural stylised anime fighter models: smooth capsules, lathed torsos and
// robes, painted faces, procedural hair, accessories and weapons. Every model
// owns its own material set so hit-flash / tints can be animated per fighter.
import * as THREE from 'three';
import { toonUnique, outlineMaterial, glowUnique, fresnelMaterial, lighten, darken } from './toon.js';
import { faceTexture } from './face.js';
import { buildHair } from './hair.js';

const BUILDS = {
  normal: { leg: 0.36, th: 0.42, tw: 0.25, td: 0.75, arm: 0.40, ar: 0.07, lr: 0.088, head: 0.30, s: 1 },
  slim: { leg: 0.38, th: 0.42, tw: 0.22, td: 0.75, arm: 0.40, ar: 0.06, lr: 0.078, head: 0.30, s: 1 },
  muscle: { leg: 0.37, th: 0.46, tw: 0.31, td: 0.78, arm: 0.42, ar: 0.092, lr: 0.1, head: 0.285, s: 1.07 },
  giant: { leg: 0.4, th: 0.5, tw: 0.35, td: 0.8, arm: 0.46, ar: 0.105, lr: 0.115, head: 0.27, s: 1.28 },
  titan: { leg: 0.44, th: 0.54, tw: 0.38, td: 0.82, arm: 0.5, ar: 0.115, lr: 0.125, head: 0.26, s: 1.45 },
  small: { leg: 0.3, th: 0.38, tw: 0.22, td: 0.75, arm: 0.35, ar: 0.062, lr: 0.078, head: 0.31, s: 0.9 },
  chubby: { leg: 0.33, th: 0.44, tw: 0.36, td: 0.95, arm: 0.38, ar: 0.09, lr: 0.11, head: 0.29, s: 1.08 },
  tall: { leg: 0.44, th: 0.46, tw: 0.25, td: 0.75, arm: 0.45, ar: 0.068, lr: 0.085, head: 0.28, s: 1.08 },
};

const patternCache = new Map();
function patternTexture(kind, base, accent) {
  const key = kind + base + accent;
  if (patternCache.has(key)) return patternCache.get(key);
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
  const c = cv.getContext('2d');
  c.fillStyle = '#' + base.toString(16).padStart(6, '0'); c.fillRect(0, 0, 256, 256);
  const ac = '#' + accent.toString(16).padStart(6, '0');
  if (kind === 'akatsuki') {
    const cloud = (x, y, s) => {
      c.fillStyle = '#ffffff'; c.beginPath();
      for (const [dx, dy, r] of [[0, 0, 14], [16, -6, 12], [30, 2, 13], [14, 8, 12]]) { c.moveTo(x + dx * s + r * s, y + dy * s); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); }
      c.fill(); c.fillStyle = ac; c.beginPath();
      for (const [dx, dy, r] of [[0, 0, 11], [16, -6, 9], [30, 2, 10], [14, 8, 9]]) { c.moveTo(x + dx * s + r * s, y + dy * s); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); }
      c.fill();
    };
    cloud(20, 60, 1); cloud(150, 40, 0.9); cloud(80, 160, 1.1); cloud(190, 200, 0.9); cloud(10, 230, 0.8);
  } else if (kind === 'stripes') {
    c.fillStyle = ac; for (let i = 0; i < 256; i += 32) c.fillRect(0, i, 256, 14);
  } else if (kind === 'spots') {
    c.fillStyle = ac; for (let i = 0; i < 26; i++) { c.beginPath(); c.arc((i * 73) % 256, (i * 131) % 256, 9, 0, Math.PI * 2); c.fill(); }
  } else if (kind === 'flames') {
    c.fillStyle = ac; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(i * 32, 256); c.quadraticCurveTo(i * 32 + 8, 160, i * 32 + 16, 120); c.quadraticCurveTo(i * 32 + 24, 180, i * 32 + 32, 256); c.fill(); }
  } else if (kind === 'sakura') {
    c.fillStyle = ac; for (let i = 0; i < 30; i++) { c.beginPath(); c.ellipse((i * 97) % 256, (i * 57) % 256, 6, 3, i, 0, Math.PI * 2); c.fill(); }
  } else if (kind === 'diamond') {
    c.fillStyle = ac; for (let x = 0; x < 256; x += 64) for (let y = 0; y < 256; y += 64) { c.beginPath(); c.moveTo(x + 32, y); c.lineTo(x + 64, y + 32); c.lineTo(x + 32, y + 64); c.lineTo(x, y + 32); c.fill(); }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  patternCache.set(key, t);
  return t;
}

/**
 * Build a fighter model from a look descriptor.
 * Returns { group, rig } — rig holds pivots for the procedural animator.
 */
export function buildCharacter(look, opts = {}) {
  if (look.rig === 'dragon') return buildDragon(look);
  if (look.rig === 'beast') return buildBeast(look);
  const B = { ...(BUILDS[look.build] || BUILDS.normal) };
  const flash = { value: 0 };
  const matCache = new Map();
  const M = (color, o = {}) => {
    const k = [color, o.map ? o.map.uuid : '', o.side ?? '', o.rim ?? '', o.rimColor ?? '', o.emissive ?? '', o.emissiveIntensity ?? ''].join('|');
    if (matCache.has(k)) return matCache.get(k);
    const m = toonUnique(color, o);
    m.userData.flash = flash;
    if (o.side) m.side = o.side;
    matCache.set(k, m);
    return m;
  };
  const OL = opts.outline ?? 0.02;
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
  const skinM = M(skin);
  const topColor = top.type === 'bare' ? skin : top.color;
  const topM = top.pattern ? M(0xffffff, { map: patternTexture(top.pattern, top.color, top.color2 ?? 0xcc2222) }) : M(topColor);
  const accentM = M(top.color2 ?? darken(topColor, 0.35));
  const bottomM = M(bottom.type === 'bare' ? skin : bottom.color);
  const shoeM = M(look.shoes ?? 0x1e1a22);
  const hairM = M(look.hair?.color ?? 0x1a1a1a, { rim: 0.6 });
  const hairM2 = M(look.hair?.color2 ?? darken(look.hair?.color ?? 0x1a1a1a, 0.45));

  const group = new THREE.Group();
  const root = new THREE.Group(); group.add(root);
  const body = new THREE.Group(); root.add(body);
  body.scale.setScalar(B.s * (look.scale ?? 1));

  // ---------- legs ----------
  const hipY = B.leg + 0.06;
  const hips = new THREE.Group(); hips.position.y = hipY; body.add(hips);
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(side * B.tw * 0.45, 0, 0); hips.add(hip);
    const ul = B.leg * 0.5;
    const thighM = bottom.type === 'shorts' ? bottomM : bottomM;
    const thigh = ink(new THREE.CapsuleGeometry(B.lr, ul, 4, 12), thighM); thigh.position.y = -ul / 2; hip.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -ul; hip.add(knee);
    const shinM = bottom.type === 'shorts' ? skinM : bottomM;
    const shin = ink(new THREE.CapsuleGeometry(B.lr * 0.88, ul * 0.92, 4, 12), shinM); shin.position.y = -ul / 2; knee.add(shin);
    const foot = ink(new THREE.SphereGeometry(1, 14, 10), shoeM); foot.scale.set(B.lr * 1.05, 0.055, B.lr * 1.6); foot.position.set(0, -ul - 0.03, 0.035); knee.add(foot);
    legs.push({ hip, knee });
  }
  if (bottom.type === 'hakama' || bottom.type === 'robe') {
    const L = bottom.type === 'robe' ? B.leg * 0.98 : B.leg * 0.85;
    const pts = [new THREE.Vector2(B.tw * 0.95, 0.02), new THREE.Vector2(B.tw * 1.05, -L * 0.3), new THREE.Vector2(B.tw * 1.25, -L * 0.75), new THREE.Vector2(B.tw * 1.38, -L)];
    const skirt = ink(new THREE.LatheGeometry(pts, 24), M(bottom.color, { side: THREE.DoubleSide }), 0.012);
    skirt.scale.z = 0.85; hips.add(skirt);
  }
  // pelvis
  const pelvis = ink(new THREE.SphereGeometry(1, 18, 12), bottomM); pelvis.scale.set(B.tw * 0.95, 0.12, B.tw * B.td * 0.95); hips.add(pelvis);

  // ---------- torso ----------
  const torso = new THREE.Group(); torso.position.y = 0.02; hips.add(torso);
  const H = B.th, W = B.tw;
  const prof = [[0.001, -0.02], [W * 0.8, 0], [W * 0.84, H * 0.18], [W * 0.92, H * 0.48], [W, H * 0.78], [W * 0.86, H * 0.96], [W * 0.4, H * 1.04], [0.001, H * 1.05]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const torsoMesh = ink(new THREE.LatheGeometry(prof, 26), top.type === 'bare' ? skinM : topM);
  torsoMesh.scale.z = B.td; torso.add(torsoMesh);
  if (top.type === 'bare' || top.type === 'vest' || top.type === 'open') {
    // subtle ab line for exposed torsos
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, H * 0.5, 4), M(darken(skin, 0.25)));
    line.position.set(0, H * 0.4, W * B.td * 0.95); torso.add(line);
  }
  if (top.type === 'vest' || top.type === 'open') {
    const vest = ink(new THREE.LatheGeometry(prof.map(v => new THREE.Vector2(v.x * 1.06, v.y)), 26, 0.55, Math.PI * 2 - 1.1), M(top.color, { side: THREE.DoubleSide }), 0.01);
    vest.scale.z = B.td; torso.add(vest);
    torsoMesh.material = skinM;
  }
  if (top.type === 'gi' || top.type === 'robe' || top.type === 'kimono' || top.type === 'haori' || top.type === 'coat' || top.type === 'cloak') {
    // sash / belt
    const belt = ink(new THREE.TorusGeometry(W * 0.86, 0.035, 8, 26), accentM, 0.008); belt.rotation.x = Math.PI / 2; belt.scale.y = B.td; belt.position.y = H * 0.08; torso.add(belt);
    if (top.type === 'gi') {
      const knot = ink(new THREE.SphereGeometry(0.045, 10, 8), accentM, 0.008); knot.position.set(0, H * 0.08, W * B.td * 0.86); torso.add(knot);
    }
    // V collar
    const col = new THREE.Mesh(new THREE.ConeGeometry(W * 0.32, H * 0.42, 3, 1), top.under ? M(top.under) : skinM);
    col.rotation.x = Math.PI; col.position.set(0, H * 0.8, W * B.td * 0.72); col.scale.z = 0.25; torso.add(col);
  }
  if (top.type === 'coat' || top.type === 'cloak' || top.type === 'haori' || top.type === 'robe' || top.type === 'kimono') {
    const L = top.type === 'robe' || top.type === 'cloak' ? B.leg * 1.0 : top.type === 'coat' ? B.leg * 0.85 : B.leg * 0.7;
    const gap = top.type === 'robe' || top.type === 'kimono' ? 0.25 : 0.7;
    const pts = [new THREE.Vector2(W * 0.9, 0.06), new THREE.Vector2(W * 1.0, -L * 0.3), new THREE.Vector2(W * 1.18, -L * 0.75), new THREE.Vector2(W * 1.3, -L)];
    const mat = top.pattern ? topM : M(top.color, { side: THREE.DoubleSide });
    if (top.pattern) mat.side = THREE.DoubleSide;
    const skirt = ink(new THREE.LatheGeometry(pts, 24, gap / 2, Math.PI * 2 - gap), mat, 0.012);
    skirt.scale.z = B.td * 1.1; torso.add(skirt);
  }
  if (top.collar) { // high collar (JJK uniform, Akatsuki cloak, captain coats)
    const c = ink(new THREE.CylinderGeometry(W * 0.5, W * 0.62, 0.16, 18, 1, true), M(top.collarColor ?? top.color, { side: THREE.DoubleSide }), 0.01);
    c.position.y = H * 1.02; c.scale.z = 0.9; torso.add(c);
  }
  if (top.buttons) {
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), M(0xd8b84a)); b.position.set(0, H * (0.3 + i * 0.22), W * B.td * 0.95); torso.add(b); }
  }

  // ---------- head ----------
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), skinM); neck.position.y = H * 1.05; torso.add(neck);
  const headG = new THREE.Group(); headG.position.y = H * 1.05 + B.head * 0.92; torso.add(headG);
  const faceDesc = { skin, eyes: look.eyes || {}, mouth: look.mouth, marks: look.marks || [], brows: look.brows, browColor: look.browColor ?? (look.hair?.color ?? 0x2a1a14), beardColor: look.beardColor, maskColor: look.maskColor, angry: look.angry, noBlush: look.noBlush };
  const faceM = M(0xffffff, { map: faceTexture(faceDesc), rim: 0.3 });
  const head = ink(new THREE.SphereGeometry(B.head, 32, 22), faceM, 0.022);
  head.scale.set(1, 0.96, 0.98);
  headG.add(head);
  if (!extras.has('noEars')) for (const s of [-1, 1]) {
    const ear = ink(new THREE.SphereGeometry(1, 10, 8), skinM, 0.01);
    if (extras.has('pointyEars')) { ear.geometry = new THREE.ConeGeometry(0.05, 0.18, 8); ear.rotation.z = -s * 1.1; ear.position.set(s * B.head * 1.0, 0.02, 0); }
    else { ear.scale.set(0.045, 0.07, 0.04); ear.position.set(s * B.head * 0.97, -0.01, 0); }
    headG.add(ear);
  }
  if (look.hair && look.hair.style !== 'none') {
    const hair = buildHair(look.hair.style, B.head, hairM, hairM2, (g, m, th = 0.014) => ink(g, m, th));
    headG.add(hair);
  }

  // ---------- arms ----------
  const arms = [];
  const makeArm = (side, yOff = 0, scale = 1, sleeveM = null) => {
    const sh = new THREE.Group(); sh.position.set(side * (W + B.ar * 0.4), H * 0.86 + yOff, 0); torso.add(sh);
    const ua = B.arm * 0.5 * scale;
    const sleeve = sleeveM || (top.sleeves === 'none' || top.type === 'bare' || top.type === 'vest' ? skinM : topM);
    const wide = top.sleeves === 'wide';
    const upper = ink(new THREE.CapsuleGeometry(B.ar * (wide ? 1.5 : 1.05), ua, 4, 12), sleeve); upper.position.y = -ua / 2; sh.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -ua; sh.add(elbow);
    const lowerM = top.sleeves === 'short' || top.sleeves === 'none' || top.type === 'bare' || top.type === 'vest' ? skinM : sleeve;
    const lower = ink(new THREE.CapsuleGeometry(B.ar * (wide ? 1.55 : 0.92), ua * 0.9, 4, 12), wide ? sleeve : lowerM); lower.position.y = -ua / 2; elbow.add(lower);
    const hand = new THREE.Group(); hand.position.y = -ua * 0.98; elbow.add(hand);
    const fist = ink(new THREE.SphereGeometry(B.ar * 1.18, 12, 10), look.gloves ? M(look.gloves) : skinM, 0.012); hand.add(fist);
    if (extras.has('wristbands')) { const wb = ink(new THREE.CylinderGeometry(B.ar * 1.05, B.ar * 1.05, 0.07, 12), M(look.wristColor ?? 0x2a5adf), 0.008); wb.position.y = -ua * 0.75; elbow.add(wb); }
    if (look.claws) { for (let i = -1; i <= 1; i++) { const cl = ink(new THREE.ConeGeometry(0.02, 0.14, 6), M(0xf0f0f0), 0.006); cl.position.set(i * 0.03, -0.09, 0.04); cl.rotation.x = Math.PI; hand.add(cl); } }
    const arm = { shoulder: sh, elbow, hand, side };
    return arm;
  };
  arms.push(makeArm(-1), makeArm(1));
  const extraArms = [];
  if (extras.has('extraArms')) { extraArms.push(makeArm(-1, -0.14, 0.92), makeArm(1, -0.14, 0.92)); }

  // ---------- accessories ----------
  const ex = (k) => extras.has(k);
  if (ex('blindfold')) { const b = ink(new THREE.CylinderGeometry(B.head * 1.04, B.head * 1.04, 0.1, 28, 1, true), M(0x16161c, { side: THREE.DoubleSide }), 0.008); b.position.y = 0.04; headG.add(b); }
  if (ex('headband')) {
    const b = ink(new THREE.CylinderGeometry(B.head * 1.05, B.head * 1.05, 0.08, 28, 1, true), M(look.headbandColor ?? 0x1c2a55, { side: THREE.DoubleSide }), 0.008); b.position.y = B.head * 0.45; headG.add(b);
    const plate = ink(new THREE.BoxGeometry(0.2, 0.075, 0.03), M(0xc9d0da, { rim: 0.8 }), 0.008); plate.position.set(0, B.head * 0.45, B.head * 1.02); headG.add(plate);
  }
  if (ex('strawhat')) {
    const hatM = M(0xf2cf5a); const band = M(0xc8202a);
    const brim = ink(new THREE.CylinderGeometry(B.head * 1.9, B.head * 1.95, 0.03, 32), hatM, 0.01); brim.position.y = B.head * 0.62; brim.rotation.x = -0.12; headG.add(brim);
    const dome = ink(new THREE.SphereGeometry(B.head * 1.08, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hatM, 0.012); dome.position.y = B.head * 0.58; dome.scale.y = 0.75; dome.rotation.x = -0.12; headG.add(dome);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(B.head * 1.09, B.head * 1.09, 0.06, 24, 1, true), band); b.position.y = B.head * 0.68; b.rotation.x = -0.12; headG.add(b);
  }
  if (ex('strawhatBack')) {
    const hatM = M(0xf2cf5a);
    const brim = ink(new THREE.CylinderGeometry(B.head * 1.6, B.head * 1.65, 0.03, 28), hatM, 0.01); brim.position.set(0, H * 0.75, -W * 1.0); brim.rotation.x = 1.3; torso.add(brim);
  }
  if (ex('bucketHat')) {
    const tex = patternTexture('stripes', 0x2f6b3a, 0xf0f0e0);
    const hm = M(0xffffff, { map: tex });
    const brim = ink(new THREE.CylinderGeometry(B.head * 1.45, B.head * 1.5, 0.03, 28), hm, 0.01); brim.position.y = B.head * 0.52; headG.add(brim);
    const dome = ink(new THREE.CylinderGeometry(B.head * 0.95, B.head * 1.08, B.head * 0.55, 24), hm, 0.012); dome.position.y = B.head * 0.78; headG.add(dome);
  }
  if (ex('furHat')) {
    const hm = M(0xffffff, { map: patternTexture('spots', 0xf3f0e6, 0x6b4a2a) });
    const dome = ink(new THREE.SphereGeometry(B.head * 1.12, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hm, 0.012); dome.position.y = B.head * 0.25; dome.scale.y = 1.05; headG.add(dome);
    const rim = ink(new THREE.TorusGeometry(B.head * 1.08, 0.05, 8, 24), M(0xf3f0e6), 0.008); rim.rotation.x = Math.PI / 2; rim.position.y = B.head * 0.3; headG.add(rim);
  }
  if (ex('marineCap')) {
    const cm = M(0xe8e8ee);
    const dome = ink(new THREE.CylinderGeometry(B.head * 1.0, B.head * 1.05, B.head * 0.5, 24), cm, 0.012); dome.position.y = B.head * 0.72; headG.add(dome);
    const visor = ink(new THREE.CylinderGeometry(B.head * 0.6, B.head * 0.6, 0.02, 16, 1, false, -0.9, 1.8), M(0x1e2a44), 0.008); visor.position.set(0, B.head * 0.5, B.head * 0.55); headG.add(visor);
  }
  if (ex('bandana')) { const b = ink(new THREE.SphereGeometry(B.head * 1.08, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), M(look.bandanaColor ?? 0x1c1c1c), 0.012); b.rotation.x = -0.4; headG.add(b); }
  if (ex('sunglasses')) {
    const gm = M(look.glassesColor ?? 0x1a1a24, { rim: 0.9, rimColor: 0xff66cc });
    for (const s of [-1, 1]) { const l = ink(new THREE.SphereGeometry(1, 12, 8), gm, 0.006); l.scale.set(0.085, 0.045, 0.03); l.position.set(s * 0.085, 0.02, B.head * 0.96); headG.add(l); }
  }
  if (ex('horns') || ex('hornsBig') || ex('hornsBack')) {
    const hm = M(look.hornColor ?? 0xeeeadf);
    for (const s of [-1, 1]) {
      const big = ex('hornsBig');
      const h = ink(new THREE.ConeGeometry(big ? 0.07 : 0.045, big ? 0.5 : 0.22, 10), hm, 0.01);
      h.position.set(s * B.head * 0.55, B.head * 0.7, ex('hornsBack') ? -0.05 : 0.05);
      h.rotation.z = -s * (big ? 0.35 : 0.6); h.rotation.x = ex('hornsBack') ? -0.7 : -0.2;
      headG.add(h);
    }
  }
  if (ex('hornLong')) { // Horn of Salvation / Ulquiorra-like long horns
    const hm = M(look.hornColor ?? 0xf4f2ee);
    for (const s of [-1, 1]) { const h = ink(new THREE.ConeGeometry(0.05, 0.6, 10), hm, 0.01); h.position.set(s * B.head * 0.6, B.head * 0.9, -0.05); h.rotation.set(-0.5, 0, -s * 0.5); headG.add(h); }
  }
  if (ex('catEars')) {
    for (const s of [-1, 1]) { const e = ink(new THREE.ConeGeometry(0.1, 0.3, 4), skinM, 0.01); e.position.set(s * B.head * 0.6, B.head * 0.85, 0); e.rotation.z = -s * 0.3; headG.add(e); }
  }
  if (ex('halfHelmet')) {
    const h = ink(new THREE.SphereGeometry(B.head * 1.08, 20, 12, 0, Math.PI, 0, Math.PI * 0.4), M(0xf2f0ea), 0.01); h.rotation.y = -Math.PI / 2 + 0.3; headG.add(h);
    const horn = ink(new THREE.ConeGeometry(0.04, 0.3, 8), M(0xf2f0ea), 0.008); horn.position.set(-B.head * 0.5, B.head * 0.85, 0); horn.rotation.z = 0.4; headG.add(horn);
  }
  if (ex('jawBone')) { // Grimmjow mask fragment
    const j = ink(new THREE.SphereGeometry(B.head * 0.55, 14, 8, 0, Math.PI, 0, Math.PI * 0.5), M(0xf2f0ea), 0.008); j.rotation.set(Math.PI, 0, 0); j.position.set(0.1, -0.06, B.head * 0.7); j.scale.set(0.7, 0.5, 0.6); headG.add(j);
  }
  if (ex('crest')) { // Perfect Cell crown
    const cm = M(look.crestColor ?? 0x2f6a3a);
    for (const s of [-1, 1]) { const c = ink(new THREE.ConeGeometry(0.08, 0.42, 4), cm, 0.01); c.position.set(s * B.head * 0.55, B.head * 0.8, -0.05); c.rotation.set(-0.4, 0, -s * 0.45); c.scale.z = 0.4; headG.add(c); }
  }
  if (ex('dome')) { // Frieza style head dome
    const d = ink(new THREE.SphereGeometry(B.head * 1.04, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), M(look.domeColor ?? 0x9a4fd0, { rim: 0.8 }), 0.012); d.rotation.x = -0.3; headG.add(d);
  }
  if (ex('antennae')) {
    for (const s of [-1, 1]) { const a = ink(new THREE.CapsuleGeometry(0.018, 0.22, 3, 6), skinM, 0.008); a.position.set(s * 0.08, B.head * 1.05, 0.08); a.rotation.set(-0.3, 0, -s * 0.25); headG.add(a); }
  }
  if (ex('topknotMask')) { /* placeholder for skins */ }
  if (ex('earrings')) {
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 12), M(0xf3c542)); e.position.set(s * B.head * 0.98, -0.09, 0); headG.add(e); }
  }
  if (ex('potara')) {
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), M(0x4ad6ff)); e.position.set(s * B.head * 0.98, -0.1, 0); headG.add(e); }
  }
  if (ex('kenpachiBells')) { /* bells are hair spikes */ }
  if (ex('scarf')) {
    const s = ink(new THREE.TorusGeometry(W * 0.55, 0.05, 8, 20), M(look.scarfColor ?? 0xe8eaf4), 0.008); s.rotation.x = Math.PI / 2; s.position.y = H * 1.0; torso.add(s);
    const tail = ink(new THREE.CapsuleGeometry(0.045, 0.45, 3, 8), M(look.scarfColor ?? 0xe8eaf4), 0.008); tail.position.set(0.12, H * 0.75, -W * 0.7); tail.rotation.z = 0.2; torso.add(tail);
  }
  if (ex('featherCoat')) {
    const fm = M(look.featherColor ?? 0xff5fae, { rim: 0.6 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 15) * Math.PI * 1.6 + Math.PI * 0.2 + Math.PI * 0.5;
      const f = ink(new THREE.SphereGeometry(0.11, 10, 8), fm, 0.01);
      f.position.set(Math.cos(a) * W * 1.05, H * (0.95 + (i % 2) * 0.05), Math.sin(a) * W * 0.85 - 0.02);
      if (Math.sin(a) > 0.6) f.position.z -= 0.0;
      torso.add(f);
    }
  }
  if (ex('shoulderPads')) {
    for (const s of [-1, 1]) { const p = ink(new THREE.SphereGeometry(0.14, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), M(look.armorColor ?? 0xa3242a), 0.01); p.position.set(s * (W + 0.03), H * 0.92, 0); p.scale.set(1, 0.7, 0.9); torso.add(p); }
  }
  if (ex('armorPlates')) {
    const am = M(look.armorColor ?? 0xa3242a);
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const p = ink(new THREE.BoxGeometry(0.12, 0.13, 0.04), am, 0.008); p.position.set(s * W * 0.75, -0.08 - i * 0.12, W * 0.6); p.rotation.y = s * 0.4; hips.add(p); }
  }
  if (ex('rods')) {
    for (let i = 0; i < 4; i++) { const r = ink(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6), M(0x22222a), 0.005); r.position.set(-W * 0.5 + i * 0.08, H * 0.6, W * B.td * 0.9); r.rotation.x = 1.2; torso.add(r); }
  }
  let cape = null;
  if (ex('cape') || ex('haori') || ex('captainHaori') || ex('shoulderCape') || ex('marineCoat')) {
    const isHaori = ex('haori') || ex('captainHaori');
    const capeColor = look.capeColor ?? (ex('captainHaori') ? 0xf4f4f6 : ex('marineCoat') ? 0xf4f4f6 : 0x2a1a3a);
    const L = ex('shoulderCape') ? B.leg + H * 0.6 : B.leg + H * 0.95;
    const geo = new THREE.CylinderGeometry(W * 1.05, W * 1.45, L, 20, 6, true, Math.PI * 0.55, Math.PI * 0.9);
    geo.translate(0, -L / 2, 0);
    const cm = M(capeColor, { side: THREE.DoubleSide });
    cape = ink(geo, cm, 0.01);
    cape.position.set(0, H * 1.0, -0.02); cape.scale.z = B.td * 1.1;
    torso.add(cape);
    if (isHaori || ex('marineCoat')) { // sleeveless coat sides
      for (const s of [-1, 1]) { const shp = ink(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), cm, 0.01); shp.position.set(s * (W + 0.02), H * 0.92, 0); shp.scale.set(1, 0.6, 1); torso.add(shp); }
    }
  }
  if (ex('wings')) {
    const wm = M(look.wingColor ?? 0x141414, { side: THREE.DoubleSide, rim: 0.7, rimColor: 0x55ffaa });
    for (const s of [-1, 1]) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0); shape.quadraticCurveTo(0.5, 0.5, 1.0, 0.25); shape.quadraticCurveTo(0.85, 0.0, 0.95, -0.2); shape.quadraticCurveTo(0.6, -0.1, 0.65, -0.45); shape.quadraticCurveTo(0.35, -0.25, 0, -0.1);
      const geo = new THREE.ShapeGeometry(shape, 10);
      const w = new THREE.Mesh(geo, wm); w.scale.set(s * 0.9, 0.9, 1); w.position.set(s * 0.06, H * 0.8, -W * 0.7); w.rotation.y = s * 0.5; w.userData.wing = s; torso.add(w);
    }
  }
  let tail = null;
  if (ex('tail')) {
    const tm = M(look.tailColor ?? skin);
    tail = new THREE.Group(); tail.position.set(0, -0.02, -W * 0.6); hips.add(tail);
    let prev = tail;
    for (let i = 0; i < 5; i++) { const seg = new THREE.Group(); seg.position.set(0, -0.0, -0.11); prev.add(seg); const m = ink(new THREE.SphereGeometry(0.07 - i * 0.008, 10, 8), tm, 0.008); m.scale.z = 1.5; seg.add(m); seg.rotation.x = 0.25; prev = seg; }
  }
  if (ex('wheel')) { // Mahoraga dharma wheel
    const wg = new THREE.Group(); wg.position.y = B.head * 1.6; headG.add(wg);
    const wm = M(0xd8c27a, { rim: 0.8 });
    wg.add(ink(new THREE.TorusGeometry(0.28, 0.025, 8, 30), wm, 0.008));
    for (let i = 0; i < 8; i++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.56, 6), wm); sp.rotation.z = i * Math.PI / 8; wg.add(sp); const k = ink(new THREE.SphereGeometry(0.04, 8, 6), wm, 0.006); k.position.set(Math.cos(i * Math.PI / 4) * 0.3, Math.sin(i * Math.PI / 4) * 0.3, 0); wg.add(k); }
    wg.userData.spin = true;
  }
  if (ex('gourdBelt')) { /* reserved for skins */ }
  if (ex('sheaths')) {
    for (let i = 0; i < (look.sheathCount ?? 2); i++) { const s = ink(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), M([0xf2f2f2, 0x2a2a2a, 0xa3242a][i % 3]), 0.006); s.position.set(-W * 0.9, -0.02 - i * 0.04, -0.05 + i * 0.05); s.rotation.set(0.2, 0, 1.2); hips.add(s); }
  }
  if (ex('swordBack')) {
    const s = buildWeapon({ type: look.backWeapon ?? 'katana', color: look.backWeaponColor }, M, ink);
    s.position.set(0.1, H * 0.85, -W * 0.85); s.rotation.set(0, 0, 2.6); torso.add(s);
  }
  if (ex('truthOrbs')) {
    const og = new THREE.Group(); og.position.set(0, H * 1.0, -W * 1.4); torso.add(og);
    for (let i = 0; i < 6; i++) { const o = ink(new THREE.SphereGeometry(0.07, 12, 10), M(0x16121c, { rim: 1, rimColor: 0xb47cff }), 0.008); const a = Math.PI + (i / 5) * Math.PI; o.position.set(Math.cos(a) * 0.45, Math.sin(a) * 0.45 + 0.35, 0); og.add(o); }
    og.userData.orbs = true;
  }
  if (ex('mouthSword')) { /* added with weapon */ }

  // weapon in right hand
  let weapon = null;
  if (look.weapon && look.weapon.type !== 'none') {
    weapon = buildWeapon(look.weapon, M, ink);
    arms[1].hand.add(weapon);
    if (look.weapon.dual) { const w2 = buildWeapon(look.weapon, M, ink); arms[0].hand.add(w2); }
    if (look.weapon.mouth) { const w3 = buildWeapon(look.weapon, M, ink); w3.scale.setScalar(0.9); w3.rotation.set(0, 0, Math.PI / 2); w3.position.set(0, -0.08, B.head * 0.95); headG.add(w3); }
  }

  // aura anchor
  const auraAnchor = new THREE.Group(); auraAnchor.position.y = (hipY + H * 0.5) * B.s; root.add(auraAnchor);

  // optional permanent energy accents
  if (look.glow) {
    const gm = glowUnique(look.glow, 0.5);
    for (const a of arms) { const g = new THREE.Mesh(new THREE.SphereGeometry(B.ar * 1.8, 10, 8), gm); a.hand.add(g); }
  }

  const height = (hipY + H * 1.05 + B.head * 1.9) * B.s * (look.scale ?? 1);
  const rig = {
    type: 'human', root, body, hips, torso, head: headG, arms, legs, extraArms, cape, tail, weapon, flash, auraAnchor,
    height, build: B, scale: B.s * (look.scale ?? 1), spinners: [], wings: [], t: Math.random() * 10,
  };
  group.traverse(o => {
    if (o.userData.spin) rig.spinners.push(o);
    if (o.userData.wing) rig.wings.push(o);
    if (o.userData.orbs) rig.spinners.push(o);
  });
  group.userData.rig = rig;
  return { group, rig };
}

export function buildWeapon(w, M, ink) {
  const g = new THREE.Group();
  const col = w.color ?? 0xdfe6f0;
  const bladeM = M(col, { rim: 0.9, rimColor: w.rim ?? 0xffffff, emissive: w.emissive ?? 0, emissiveIntensity: w.emissive ? 0.6 : 1 });
  const hiltM = M(w.hilt ?? 0x2a1e1a);
  const guardM = M(w.guard ?? 0xc9a43a);
  const blade = (len, wid, th = 0.018) => {
    const shape = new THREE.Shape();
    shape.moveTo(-wid / 2, 0); shape.lineTo(-wid / 2, len * 0.9); shape.quadraticCurveTo(-wid / 2, len, wid / 2, len); shape.lineTo(wid / 2, 0); shape.lineTo(-wid / 2, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 1 });
    geo.translate(0, 0, -th / 2);
    return geo;
  };
  const handle = (len) => { const h = ink(new THREE.CylinderGeometry(0.022, 0.022, len, 8), hiltM, 0.006); h.position.y = len / 2 - 0.05; return h; };
  switch (w.type) {
    case 'katana': case 'nodachi': case 'tensa': {
      const len = w.type === 'nodachi' ? 1.05 : 0.78;
      g.add(handle(0.2));
      const gd = ink(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 14), guardM, 0.006); gd.position.y = -0.07; g.add(gd);
      const b = ink(blade(len, w.type === 'tensa' ? 0.045 : 0.05), w.type === 'tensa' ? M(0x16121c, { rim: 1, rimColor: 0xff3344 }) : bladeM, 0.008);
      b.rotation.x = Math.PI; b.position.y = -0.08; g.add(b);
      break;
    }
    case 'cleaver': {
      g.add(handle(0.26));
      const b = ink(blade(0.95, 0.2, 0.025), bladeM, 0.01); b.rotation.x = Math.PI; b.position.y = -0.1; g.add(b);
      break;
    }
    case 'kunai': case 'trikunai': {
      g.add(handle(0.12));
      const b = ink(new THREE.ConeGeometry(0.04, 0.2, 4), bladeM, 0.006); b.rotation.x = Math.PI; b.position.y = -0.16; g.add(b);
      if (w.type === 'trikunai') for (const s of [-1, 1]) { const p = ink(new THREE.ConeGeometry(0.02, 0.12, 4), bladeM, 0.005); p.position.set(s * 0.05, -0.08, 0); p.rotation.z = Math.PI + s * 0.5; g.add(p); }
      break;
    }
    case 'staff': case 'cane': case 'pole': {
      const len = w.type === 'cane' ? 0.75 : 1.2;
      const s = ink(new THREE.CylinderGeometry(0.025, 0.028, len, 8), M(w.color ?? 0x6a4a2a), 0.006); s.position.y = w.type === 'cane' ? -len / 2 + 0.1 : 0; g.add(s);
      if (w.tip) { const t = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), glowUnique(w.tip, 0.9)); t.position.y = -len / 2; g.add(t); }
      break;
    }
    case 'spear': case 'lance': {
      const len = w.type === 'lance' ? 1.3 : 0.6;
      const mat = w.type === 'lance' ? glowUnique(w.color ?? 0x5aff9a, 0.85) : bladeM;
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 8), mat); s.position.y = -len / 2 + 0.15; g.add(s);
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 6), mat); t.rotation.x = Math.PI; t.position.y = -len + 0.03; g.add(t);
      break;
    }
    case 'club': { // kanabo
      g.add(handle(0.25));
      const c = ink(new THREE.CylinderGeometry(0.1, 0.05, 1.0, 12), M(w.color ?? 0x5a4a6a), 0.01); c.position.y = -0.55; g.add(c);
      for (let i = 0; i < 10; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 5), M(0xd8d8d8)); const a = i * 2.4; sp.position.set(Math.cos(a) * 0.09, -0.3 - (i / 10) * 0.7, Math.sin(a) * 0.09); sp.lookAt(Math.cos(a) * 2, sp.position.y, Math.sin(a) * 2); sp.rotateX(Math.PI / 2); g.add(sp); }
      break;
    }
    case 'gunbai': {
      g.add(handle(0.3));
      const f = ink(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 20), M(w.color ?? 0xd0c8b0), 0.01); f.rotation.x = Math.PI / 2; f.position.y = -0.3; g.add(f);
      break;
    }
    case 'scythe': {
      const s = ink(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8), hiltM, 0.006); g.add(s);
      const b = ink(blade(0.5, 0.06), bladeM, 0.008); b.rotation.z = Math.PI / 2; b.position.set(0, -0.48, 0); g.add(b);
      break;
    }
    case 'gun': {
      const b = ink(new THREE.BoxGeometry(0.06, 0.12, 0.3), M(0x2a2a30), 0.006); b.position.set(0, -0.05, 0.12); g.add(b);
      break;
    }
    case 'orb': {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), glowUnique(w.color ?? 0x66aaff, 0.9)); o.position.y = -0.1; g.add(o);
      break;
    }
  }
  if (w.scale) g.scale.setScalar(w.scale);
  return g;
}

// ------------------------------------------------------------------------------
// Dragon rig (Kaido's dragon form): a serpentine chain of smooth segments that
// follows the head's path.
function buildDragon(look) {
  const flash = { value: 0 };
  const M = (c, o = {}) => { const m = toonUnique(c, o); m.userData.flash = flash; return m; };
  const ink = (geo, mat, th = 0.02) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; const o = new THREE.Mesh(geo, outlineMaterial(th)); m.add(o); return m; };
  const group = new THREE.Group();
  const root = new THREE.Group(); group.add(root);
  const scaleM = M(look.color ?? 0x4a6ad8, { rim: 0.7, rimColor: 0x9ad0ff });
  const bellyM = M(look.belly ?? 0xe8d9a8);
  const head = new THREE.Group(); head.position.y = 0.9; root.add(head);
  const skull = ink(new THREE.SphereGeometry(0.42, 20, 14), scaleM); skull.scale.set(1, 0.75, 1.35); head.add(skull);
  const snout = ink(new THREE.SphereGeometry(0.3, 16, 12), scaleM); snout.position.set(0, -0.08, 0.45); snout.scale.set(1, 0.6, 1.2); head.add(snout);
  for (const s of [-1, 1]) {
    const h = ink(new THREE.ConeGeometry(0.07, 0.7, 10), M(0xf4ecd8), 0.012); h.position.set(s * 0.25, 0.3, -0.2); h.rotation.set(-1.0, 0, -s * 0.35); head.add(h);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), glowUnique(0xffd04a, 1)); eye.position.set(s * 0.25, 0.08, 0.32); head.add(eye);
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.004, 0.8, 5), M(0xf4ecd8)); wh.position.set(s * 0.25, -0.12, 0.7); wh.rotation.set(1.1, 0, -s * 0.8); head.add(wh);
  }
  const mane = ink(new THREE.SphereGeometry(0.42, 14, 10), M(0xe9e1c9), 0.012); mane.position.set(0, 0.05, -0.35); mane.scale.set(1.2, 1.0, 0.8); head.add(mane);
  const segs = [];
  for (let i = 0; i < 14; i++) {
    const r = 0.36 - i * 0.018;
    const s = new THREE.Group(); root.add(s);
    const m = ink(new THREE.SphereGeometry(r, 16, 12), i % 2 ? scaleM : scaleM); m.scale.set(1, 0.95, 1.25); s.add(m);
    const b = new THREE.Mesh(new THREE.SphereGeometry(r * 0.82, 12, 8), bellyM); b.position.y = -r * 0.32; b.scale.set(0.9, 0.6, 1.2); s.add(b);
    if (i % 3 === 0) { const fin = ink(new THREE.ConeGeometry(0.06, 0.25, 6), M(0xe9e1c9), 0.008); fin.position.y = r * 0.95; s.add(fin); }
    segs.push(s);
  }
  const auraAnchor = new THREE.Group(); auraAnchor.position.y = 0.8; root.add(auraAnchor);
  const rig = { type: 'dragon', root, head, segs, trail: [], flash, auraAnchor, height: 1.8, scale: 1.4, spinners: [], wings: [], arms: [], legs: [], extraArms: [], t: 0 };
  group.userData.rig = rig;
  return { group, rig };
}

// Quadruped (shikigami wolves, ninja hounds)
function buildBeast(look) {
  const flash = { value: 0 };
  const M = (c, o = {}) => { const m = toonUnique(c, o); m.userData.flash = flash; return m; };
  const ink = (geo, mat, th = 0.018) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; const o = new THREE.Mesh(geo, outlineMaterial(th)); m.add(o); return m; };
  const s = look.scale ?? 1;
  const group = new THREE.Group(); const root = new THREE.Group(); group.add(root);
  const body = new THREE.Group(); body.scale.setScalar(s); root.add(body);
  const fur = M(look.color ?? 0x2a2a30, { rim: 0.6 }), fur2 = M(look.color2 ?? 0xf2f2f4);
  const torso = ink(new THREE.CapsuleGeometry(0.2, 0.45, 6, 12), fur); torso.rotation.x = Math.PI / 2; torso.position.y = 0.48; body.add(torso);
  const chest = ink(new THREE.SphereGeometry(0.2, 12, 10), fur2); chest.position.set(0, 0.45, 0.25); chest.scale.set(0.9, 1, 0.8); body.add(chest);
  const head = new THREE.Group(); head.position.set(0, 0.72, 0.42); body.add(head);
  head.add(ink(new THREE.SphereGeometry(0.17, 14, 12), fur));
  const snout = ink(new THREE.SphereGeometry(0.1, 12, 10), fur2); snout.scale.set(0.8, 0.7, 1.4); snout.position.set(0, -0.04, 0.16); head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), M(0x111111)); nose.position.set(0, -0.01, 0.3); head.add(nose);
  for (const x of [-1, 1]) {
    const ear = ink(new THREE.ConeGeometry(0.06, 0.16, 6), fur, 0.01); ear.position.set(x * 0.09, 0.15, -0.02); ear.rotation.z = -x * 0.25; head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), glowUnique(look.eye ?? 0xffe06a, 1)); eye.position.set(x * 0.07, 0.04, 0.13); head.add(eye);
  }
  const legs = [];
  for (const [x, z] of [[-0.12, 0.25], [0.12, 0.25], [-0.12, -0.25], [0.12, -0.25]]) {
    const hip = new THREE.Group(); hip.position.set(x, 0.42, z); body.add(hip);
    const leg = ink(new THREE.CapsuleGeometry(0.05, 0.28, 4, 8), fur, 0.01); leg.position.y = -0.2; hip.add(leg);
    legs.push({ hip, knee: hip });
  }
  const tail = ink(new THREE.CapsuleGeometry(0.05, 0.3, 4, 8), fur, 0.01); tail.position.set(0, 0.6, -0.42); tail.rotation.x = -0.8; body.add(tail);
  const auraAnchor = new THREE.Group(); auraAnchor.position.y = 0.5; root.add(auraAnchor);
  const rig = { type: 'beast', root, body, head, legs, tail, flash, auraAnchor, height: 0.9 * s, scale: s, spinners: [], wings: [], arms: [], extraArms: [], t: Math.random() * 5 };
  group.userData.rig = rig;
  return { group, rig };
}

export { lighten, darken, fresnelMaterial };

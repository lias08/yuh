// Fighter models. Humans use the sculpted SDF pipeline (modelV2 / charGen);
// Kaido's dragon form and shikigami beasts use dedicated rigs below.
import * as THREE from 'three';
import { toonUnique, outlineMaterial, glowUnique, fresnelMaterial, lighten, darken } from './toon.js';
import { buildHumanV2, prewarmLooks, isLookReady, setModelQuality, setLowEnd } from './modelV2.js';

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
 * Build a fighter model from a look descriptor. Returns { group, rig }.
 * opts.quality: 'lo' (battle) | 'hi' (lobby / detail)
 */
export function buildCharacter(look, opts = {}) {
  if (look.rig === 'dragon') return buildDragon(look);
  if (look.rig === 'beast') return buildBeast(look);
  return buildHumanV2(look, opts, { patternTexture, buildWeapon });
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
      // wrapped hilt + broad blade with angled tip and a darker spine
      const hl = ink(new THREE.CylinderGeometry(0.024, 0.024, 0.26, 10), hiltM, 0.006); hl.position.y = 0.06; g.add(hl);
      for (let i = 0; i < 5; i++) { const wr = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 12), M(0xe8e0d0)); wr.rotation.x = Math.PI / 2; wr.position.y = -0.04 + i * 0.05; wr.rotation.z = i * 0.6; g.add(wr); }
      const shape = new THREE.Shape();
      const L = 0.98, Wb = 0.2;
      shape.moveTo(-Wb * 0.45, 0); shape.lineTo(-Wb * 0.5, L * 0.8); shape.lineTo(Wb * 0.5, L); shape.lineTo(Wb * 0.5, 0.04); shape.quadraticCurveTo(Wb * 0.5, 0, Wb * 0.4, 0); shape.lineTo(-Wb * 0.45, 0);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.018, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 });
      geo.translate(0, 0, -0.009);
      const b = ink(geo, bladeM, 0.01); b.rotation.x = Math.PI; b.position.y = -0.08; g.add(b);
      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.012, L * 0.92, 0.03), M(0x9aa4b4)); spine.position.set(-Wb * 0.46, -0.08 - L * 0.42, 0); g.add(spine);
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


export { lighten, darken, fresnelMaterial, prewarmLooks, isLookReady, setModelQuality, setLowEnd };

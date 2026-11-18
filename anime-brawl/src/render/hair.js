// Procedural anime hair. A style is a list of parts placed on the head sphere:
//  cap   – smooth skull cover (hairline height configurable)
//  spike – smooth tapered cone growing from (az, el) on the head
//  drape – long hair falling down the back
//  puff  – soft spheres (cloud/afro hair)
//  bun / tail – topknot, ponytail
// az: 0 = front, +90 = character's left side (x+), 180 = back. el: 0 = equator, 90 = crown.
import * as THREE from 'three';

const D = Math.PI / 180;

function onSphere(az, el) {
  const a = az * D, e = el * D;
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
}

// shorthand generators -------------------------------------------------------
const ring = (n, el, az0, az1, len, rad, lift = 0.4, sweep = 0, jitter = 0.15) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const az = az0 + (az1 - az0) * t;
    const j = Math.sin(i * 12.9898 + el) * jitter;
    out.push({ t: 'spike', az, el, len: len * (1 + j), rad, lift, sweep });
  }
  return out;
};
const bangs = (n, az0, az1, len, rad, el = 42, drop = -0.55) => ring(n, el, az0, az1, len, rad, drop, -0.25, 0.2);

// style table ------------------------------------------------------------------
export const HAIR_STYLES = {
  none: () => [],
  bald: () => [],
  buzz: () => [{ t: 'cap', line: 0.15, scale: 1.035 }],
  short: () => [{ t: 'cap', line: 0.1 }, ...bangs(5, -40, 40, 0.16, 0.07, 40, -0.7)],
  spikyShort: () => [{ t: 'cap', line: 0.05 }, ...ring(7, 62, -150, 150, 0.2, 0.08, 0.75, 0.1), { t: 'spike', az: 0, el: 88, len: 0.22, rad: 0.09, lift: 1, sweep: 0.2 }, ...bangs(4, -30, 30, 0.13, 0.06, 45, -0.6)],
  yuji: () => [{ t: 'cap', line: 0.12, color2: true }, ...ring(8, 64, -160, 160, 0.17, 0.08, 0.85, 0.2), { t: 'spike', az: 0, el: 85, len: 0.2, rad: 0.09, lift: 1, sweep: 0.3 }, ...bangs(3, -20, 20, 0.12, 0.06, 50, -0.4)],
  gojo: () => [{ t: 'cap', line: 0.0 }, ...ring(9, 55, -170, 170, 0.26, 0.09, 0.7, 0.25, 0.3), ...ring(6, 78, -150, 150, 0.24, 0.085, 0.95, 0.15), ...bangs(5, -45, 45, 0.18, 0.07, 38, -0.35)],
  saiyan: () => [{ t: 'cap', line: 0.02 }, ...ring(5, 70, -60, 60, 0.36, 0.11, 0.95, -0.1), ...ring(6, 45, 100, 260, 0.34, 0.11, 0.35, 0.4), ...ring(4, 40, 50, 95, 0.28, 0.1, 0.25, 0.1), ...ring(4, 40, -95, -50, 0.28, 0.1, 0.25, 0.1), ...bangs(4, -35, 35, 0.2, 0.08, 40, -0.45)],
  ssj: () => [{ t: 'cap', line: 0.02 }, ...ring(7, 72, -90, 90, 0.5, 0.11, 1.4, -0.05), ...ring(7, 52, 100, 260, 0.46, 0.11, 1.2, 0.25), { t: 'spike', az: 0, el: 30, len: 0.22, rad: 0.06, lift: -0.6, sweep: -0.2 }],
  ssjLong: () => [{ t: 'cap', line: 0.02 }, ...ring(7, 70, -90, 90, 0.48, 0.12, 1.2, -0.05), { t: 'drape', len: 1.0, w: 0.34, spiky: true }, ...ring(6, 40, 110, 250, 0.5, 0.1, -0.2, 0.6)],
  vegeta: () => [{ t: 'cap', line: 0.2 }, ...ring(7, 75, -110, 110, 0.55, 0.12, 2.2, 0.05, 0.25), ...ring(5, 60, 130, 230, 0.48, 0.12, 2, 0.2)],
  gohan: () => [{ t: 'cap', line: 0.03 }, ...ring(6, 66, -120, 120, 0.34, 0.11, 1.1, 0.0), ...ring(5, 48, 130, 230, 0.3, 0.1, 0.8, 0.2), { t: 'spike', az: 0, el: 32, len: 0.24, rad: 0.06, lift: -0.8, sweep: -0.3 }],
  beast: () => [{ t: 'cap', line: 0.03 }, ...ring(9, 62, -140, 140, 0.62, 0.12, 1.4, 0.4, 0.25), ...ring(6, 45, 120, 240, 0.7, 0.12, 0.6, 0.6), { t: 'spike', az: 0, el: 32, len: 0.24, rad: 0.06, lift: -0.8, sweep: -0.3 }],
  broly: () => [{ t: 'cap', line: 0.05 }, ...ring(8, 60, -120, 120, 0.42, 0.12, 0.9, 0.3), { t: 'drape', len: 0.75, w: 0.36, spiky: true }],
  trunks: () => [{ t: 'cap', line: -0.05, scale: 1.08 }, ...bangs(7, -60, 60, 0.22, 0.08, 35, -0.85), ...ring(6, 25, 110, 250, 0.22, 0.09, -0.9, 0.1)],
  naruto: () => [{ t: 'cap', line: 0.05 }, ...ring(10, 58, -170, 170, 0.3, 0.09, 0.8, 0.15, 0.3), ...ring(6, 80, -150, 150, 0.27, 0.09, 1, 0.1), ...bangs(4, -40, 40, 0.2, 0.07, 42, -0.3)],
  sasuke: () => [{ t: 'cap', line: 0.0 }, ...ring(7, 50, 120, 240, 0.4, 0.11, 0.6, 0.9), ...bangs(5, -60, 60, 0.26, 0.07, 30, -0.85)],
  madara: () => [{ t: 'cap', line: -0.02, scale: 1.08 }, { t: 'drape', len: 1.05, w: 0.48, spiky: true }, ...ring(8, 40, 100, 260, 0.45, 0.1, -0.3, 0.8), ...bangs(4, -50, 50, 0.3, 0.07, 30, -0.9)],
  obito: () => [{ t: 'cap', line: 0.05 }, ...ring(8, 60, -150, 150, 0.2, 0.08, 0.7, 0.3), ...bangs(3, -30, 30, 0.13, 0.06, 45, -0.5)],
  itachi: () => [{ t: 'cap', line: -0.02, scale: 1.06 }, { t: 'tail', az: 180, el: -10, len: 0.55, w: 0.07 }, ...bangs(2, -55, 55, 0.3, 0.06, 20, -1.1), ...bangs(3, -25, 25, 0.15, 0.06, 45, -0.6)],
  kakashi: () => [{ t: 'cap', line: 0.05 }, ...ring(8, 60, -100, 140, 0.42, 0.1, 1.3, -0.2, 0.25).map(s => ({ ...s, tiltX: 0.35 })), ...bangs(3, -30, 30, 0.15, 0.06, 45, -0.5)],
  minato: () => [{ t: 'cap', line: 0.05 }, ...ring(10, 56, 60, 300, 0.32, 0.09, 0.7, 0.35, 0.3), ...bangs(2, -55, 55, 0.4, 0.06, 25, -1.0), ...bangs(4, -30, 30, 0.2, 0.07, 45, -0.5)],
  pain: () => [{ t: 'cap', line: 0.05 }, ...ring(12, 55, -175, 175, 0.26, 0.09, 0.85, 0.1, 0.25), ...ring(5, 80, -150, 150, 0.22, 0.09, 1, 0.1)],
  bowl: () => [{ t: 'cap', line: -0.12, scale: 1.09, bowl: true }],
  hashirama: () => [{ t: 'cap', line: -0.02, scale: 1.06 }, { t: 'drape', len: 1.05, w: 0.44 }, ...bangs(6, -60, 60, 0.2, 0.08, 32, -0.9)],
  ichigo: () => [{ t: 'cap', line: 0.03 }, ...ring(10, 55, -170, 170, 0.28, 0.1, 0.65, 0.35, 0.3), ...ring(5, 80, -140, 140, 0.24, 0.09, 1, 0.2), ...bangs(5, -45, 45, 0.22, 0.07, 38, -0.55)],
  ichigoLong: () => [{ t: 'cap', line: 0.0, scale: 1.06 }, { t: 'drape', len: 0.95, w: 0.4, spiky: true }, ...bangs(6, -55, 55, 0.3, 0.07, 32, -0.85)],
  aizen: () => [{ t: 'cap', line: 0.15 }, ...ring(8, 45, 110, 250, 0.22, 0.09, -0.3, 0.9), { t: 'spike', az: 8, el: 40, len: 0.32, rad: 0.035, lift: -1.2, sweep: -0.2 }],
  kenpachi: () => [{ t: 'cap', line: 0.05 }, ...ring(12, 50, -175, 175, 0.38, 0.06, 0.6, 0.2, 0.1).map(s => ({ ...s, bell: true })), ...ring(6, 78, -150, 150, 0.36, 0.06, 1, 0.1).map(s => ({ ...s, bell: true }))],
  byakuya: () => [{ t: 'cap', line: -0.02, scale: 1.05 }, { t: 'drape', len: 0.55, w: 0.36 }, ...bangs(3, -15, 15, 0.3, 0.04, 30, -1.1), { t: 'kenseikan' }],
  urahara: () => [{ t: 'cap', line: 0.0 }, ...bangs(6, -60, 60, 0.24, 0.07, 30, -0.9), ...ring(6, 25, 110, 250, 0.2, 0.08, -0.8, 0.2)],
  yhwach: () => [{ t: 'cap', line: 0.05, scale: 1.06 }, { t: 'drape', len: 1.0, w: 0.46 }, ...bangs(4, -60, 60, 0.3, 0.06, 30, -1.0)],
  ulquiorra: () => [{ t: 'cap', line: 0.0, scale: 1.06 }, ...ring(8, 30, 90, 270, 0.3, 0.08, -0.9, 0.1), ...bangs(5, -50, 50, 0.26, 0.06, 32, -0.95)],
  grimmjow: () => [{ t: 'cap', line: 0.12 }, ...ring(9, 55, -60, 60, 0.36, 0.08, 0.5, 1.0, 0.2), ...ring(5, 50, 120, 240, 0.25, 0.08, 0.1, 1)],
  pantera: () => [{ t: 'cap', line: 0.05, scale: 1.06 }, { t: 'drape', len: 1.25, w: 0.4, spiky: true }, ...ring(5, 60, -50, 50, 0.3, 0.08, 0.5, 1.0)],
  hitsugaya: () => [{ t: 'cap', line: 0.05 }, ...ring(11, 55, -170, 170, 0.32, 0.09, 0.9, 0.0, 0.3), ...ring(5, 78, -150, 150, 0.3, 0.09, 1.2, 0.0)],
  hitsugayaAdult: () => [{ t: 'cap', line: 0.03 }, ...ring(11, 50, -170, 170, 0.4, 0.09, 0.5, 0.4, 0.3), ...bangs(4, -40, 40, 0.24, 0.07, 38, -0.7)],
  luffy: () => [{ t: 'cap', line: 0.02 }, ...ring(9, 35, -170, 170, 0.17, 0.08, -0.4, 0.1, 0.3), ...bangs(5, -45, 45, 0.15, 0.07, 42, -0.6)],
  gear5: () => [{ t: 'puff', n: 14, r: 0.16, spread: 0.36 }, ...ring(8, 60, -170, 170, 0.32, 0.12, 1.6, 0.0, 0.35)],
  zoro: () => [{ t: 'cap', line: 0.1, scale: 1.05 }, ...ring(10, 65, -170, 170, 0.08, 0.07, 0.8, 0, 0.2)],
  sanji: () => [{ t: 'cap', line: 0.0, scale: 1.06 }, { t: 'spike', az: -25, el: 30, len: 0.32, rad: 0.12, lift: -1.2, sweep: -0.4 }, ...ring(6, 25, 110, 250, 0.2, 0.08, -0.8, 0.2)],
  shanks: () => [{ t: 'cap', line: 0.0, scale: 1.05 }, ...ring(8, 30, 70, 290, 0.28, 0.09, -0.7, 0.3), ...bangs(4, -45, 45, 0.22, 0.07, 38, -0.8)],
  kaido: () => [{ t: 'cap', line: -0.02, scale: 1.07 }, { t: 'drape', len: 1.15, w: 0.5, spiky: true }, ...ring(6, 35, 80, 280, 0.45, 0.1, -0.5, 0.7)],
  katakuri: () => [{ t: 'cap', line: 0.03 }, ...ring(10, 60, -170, 170, 0.22, 0.08, 0.9, 0.1, 0.25)],
  law: () => [{ t: 'cap', line: 0.0 }, ...bangs(5, -45, 45, 0.16, 0.06, 35, -0.8)],
  doflamingo: () => [{ t: 'cap', line: 0.15 }, ...ring(8, 60, -150, 150, 0.1, 0.06, 0.8, 0.0)],
  blackbeard: () => [{ t: 'cap', line: 0.05, scale: 1.06 }, { t: 'drape', len: 0.6, w: 0.42 }, ...ring(8, 25, 70, 290, 0.25, 0.1, -0.9, 0.3)],
  megumi: () => [{ t: 'cap', line: 0.03 }, ...ring(12, 50, -175, 175, 0.33, 0.09, 0.75, 0.2, 0.35), ...ring(6, 78, -150, 150, 0.3, 0.09, 1.2, 0.1), ...bangs(4, -40, 40, 0.2, 0.07, 40, -0.6)],
  mahito: () => [{ t: 'cap', line: -0.02, scale: 1.06 }, { t: 'drape', len: 0.55, w: 0.32 }, ...bangs(5, -50, 50, 0.3, 0.06, 30, -1.0)],
  nanami: () => [{ t: 'cap', line: 0.1 }, ...ring(6, 45, 40, 160, 0.2, 0.08, -0.4, 0.7), ...ring(4, 45, -60, -10, 0.24, 0.08, -0.4, 0.9)],
  todo: () => [{ t: 'cap', line: 0.35, scale: 1.03 }, { t: 'bun', az: 180, el: 55, r: 0.12 }],
  kashimo: () => [{ t: 'cap', line: 0.02 }, { t: 'bun', az: 180, el: 50, r: 0.15 }, ...bangs(6, -55, 55, 0.24, 0.07, 32, -0.9)],
  yuta: () => [{ t: 'cap', line: 0.0 }, ...ring(8, 40, 90, 270, 0.2, 0.08, -0.4, 0.4), ...bangs(5, -50, 50, 0.24, 0.07, 34, -0.9)],
  toji: () => [{ t: 'cap', line: 0.05 }, ...ring(8, 45, -170, 170, 0.18, 0.08, -0.2, 0.3), ...bangs(4, -35, 35, 0.18, 0.06, 40, -0.8)],
  sukunaHeian: () => [{ t: 'cap', line: 0.1 }, ...ring(9, 62, -170, 170, 0.2, 0.09, 0.9, 0.2)],
  majin: () => [{ t: 'antenna' }],
  kidbuu: () => [{ t: 'antenna', long: true }],
};

/**
 * Build a hair group for a head of radius r. color / color2 (undercut).
 */
export function buildHair(style, r, mat, mat2, outlineFn) {
  const g = new THREE.Group();
  const parts = (HAIR_STYLES[style] || HAIR_STYLES.short)();
  for (const p of parts) {
    if (p.t === 'cap') {
      const s = p.scale ?? 1.045;
      const theta = Math.PI * (0.5 - (p.line ?? 0));
      const geo = new THREE.SphereGeometry(r * s, 28, 18, 0, Math.PI * 2, 0, theta);
      const m = outlineFn(geo, mat);
      m.rotation.x = p.bowl ? -0.05 : -0.25;
      g.add(m);
      if (p.color2 && mat2) { // undercut: darker band at back/sides
        const geo2 = new THREE.SphereGeometry(r * 1.03, 24, 12, Math.PI * 0.95, Math.PI * 1.1, 0.42 * Math.PI, 0.22 * Math.PI);
        const u = outlineFn(geo2, mat2, 0); u.rotation.x = -0.25; g.add(u);
      }
      if (p.bowl) { // straight-cut fringe of the bowl cut
        const fringe = new THREE.CylinderGeometry(r * 1.1, r * 1.12, r * 0.22, 28, 1, true);
        const f = outlineFn(fringe, mat); f.position.y = r * 0.34; g.add(f);
      }
    } else if (p.t === 'spike') {
      const base = onSphere(p.az, p.el);
      let dir;
      if ((p.lift ?? 0) < 0) {
        // hanging strand (bangs / side locks): follow the skull surface downward
        const a = p.az * D, e = p.el * D;
        const down = new THREE.Vector3(-Math.sin(a) * Math.sin(e), -Math.cos(e), -Math.cos(a) * Math.sin(e));
        dir = down.add(base.clone().multiplyScalar(0.16 + Math.max(0, -(p.lift) - 0.8) * 0.15));
        dir.z += -(p.sweep ?? 0) * 0.3;
      } else {
        dir = base.clone();
        dir.y += p.lift * 0.62; dir.z -= (p.sweep ?? 0) * 0.85;
      }
      if (p.tiltX) dir.x += p.tiltX;
      dir.normalize();
      const hanging = (p.lift ?? 0) < 0;
      const rad = p.rad * (hanging ? 1.5 : 1.6), len = p.len * (hanging ? 1.25 : 1.08);
      const geo = new THREE.ConeGeometry(rad, len, 9, 2);
      // slight curvature: bend the tip backwards for a brushed look
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) + len / 2; pos.setY(i, y); pos.setZ(i, pos.getZ(i) - (y / len) * (y / len) * len * 0.18); }
      geo.computeVertexNormals();
      const m = outlineFn(geo, mat, 0.012);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      m.position.copy(base.multiplyScalar(r * (hanging ? 1.04 : 0.8)));
      if (hanging) { m.scale.set(1, 1, 0.45); m.rotateY(0); }
      g.add(m);
      if (p.bell) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), mat2 || mat);
        b.position.copy(m.position).add(dir.clone().multiplyScalar(len));
        b.userData.bell = true; g.add(b);
      }
    } else if (p.t === 'drape') {
      const len = p.len * r * 2.2, w = p.w;
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push(new THREE.Vector2(w * (0.55 + 0.45 * Math.sin(Math.min(1, t * 2.2) * Math.PI * 0.5)) * (1 - t * (p.spiky ? 0.55 : 0.25)), -t * len));
      }
      pts.push(new THREE.Vector2(0.001, -len - 0.02));
      pts.reverse();
      const geo = new THREE.LatheGeometry(pts, 20, Math.PI * 0.5, Math.PI);
      const m = outlineFn(geo, mat, 0.012);
      m.scale.set(1, 1, 0.55);
      m.position.set(0, r * 0.35, -r * 0.35);
      m.rotation.x = 0.12;
      g.add(m);
      if (p.spiky) {
        for (let i = 0; i < 7; i++) {
          const a = (i / 6 - 0.5) * 2.4;
          const geo2 = new THREE.ConeGeometry(0.06, 0.3, 7); geo2.translate(0, -0.15, 0);
          const s = outlineFn(geo2, mat, 0.01);
          s.position.set(Math.sin(a) * w * 0.55, r * 0.35 - len * 0.92, -r * 0.35 - Math.cos(a) * w * 0.3 - 0.05);
          s.rotation.set(-0.5, 0, -a * 0.35);
          g.add(s);
        }
      }
    } else if (p.t === 'puff') {
      for (let i = 0; i < p.n; i++) {
        const a = i * 2.399, y = 0.3 + (i / p.n) * 0.6;
        const rr = Math.sqrt(1 - y * y);
        const pos = new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr).multiplyScalar(r * (0.95 + p.spread * 0.5));
        const s = outlineFn(new THREE.SphereGeometry(p.r * (0.8 + (i % 3) * 0.15), 14, 10), mat, 0.012);
        s.position.copy(pos);
        if (pos.z > r * 0.5 && pos.y < r * 0.7) s.position.z -= 0.08;
        g.add(s);
      }
      const capG = new THREE.SphereGeometry(r * 1.06, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const c = outlineFn(capG, mat); c.rotation.x = -0.55; g.add(c);
    } else if (p.t === 'bun') {
      const b = outlineFn(new THREE.SphereGeometry(p.r, 16, 12), mat);
      b.position.copy(onSphere(p.az, p.el).multiplyScalar(r * 1.05));
      g.add(b);
    } else if (p.t === 'tail') {
      const geo = new THREE.CapsuleGeometry(p.w, p.len, 4, 10);
      const m = outlineFn(geo, mat, 0.01);
      m.position.set(0, -r * 0.4 - p.len * 0.4, -r * 1.0);
      m.rotation.x = 0.25; g.add(m);
    } else if (p.t === 'kenseikan') {
      for (const s of [-1, 1]) {
        const k = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), mat2 || mat);
        k.rotation.z = Math.PI / 2; k.position.set(s * r * 0.45, r * 0.75, r * 0.1); k.rotation.y = s * 0.4; g.add(k);
      }
    } else if (p.t === 'antenna') {
      const geo = new THREE.CapsuleGeometry(0.05, p.long ? 0.35 : 0.25, 4, 8);
      const m = outlineFn(geo, mat, 0.01);
      m.position.set(0, r * 1.1, -r * 0.35); m.rotation.x = -0.9; g.add(m);
    }
  }
  return g;
}

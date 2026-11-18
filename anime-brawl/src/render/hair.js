// Procedural anime hair. A style is a list of parts placed on the head sphere:
//  cap   – smooth skull cover (hairline height configurable)
//  spike – smooth tapered cone growing from (az, el) on the head
//  drape – long hair falling down the back
//  puff  – soft spheres (cloud/afro hair)
//  bun / tail – topknot, ponytail
// az: 0 = front, +90 = character's left side (x+), 180 = back. el: 0 = equator, 90 = crown.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = Math.PI / 180;

function onSphere(az, el) {
  const a = az * D, e = el * D;
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
}

import { HAIR_STYLES } from './hairStyles.js';
export { HAIR_STYLES };

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
        const fringe = new THREE.CylinderGeometry(r * 1.07, r * 1.1, r * 0.2, 28, 1, true);
        const f = outlineFn(fringe, mat); f.position.y = r * 0.42; g.add(f);
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
  return mergeHair(g, outlineFn);
}

/** Collapse all hair parts into one mesh (+ one outline) per material. */
function mergeHair(g, outlineFn) {
  const buckets = new Map();
  for (const m of g.children) {
    if (!m.isMesh) continue;
    m.updateMatrix();
    let geo = m.geometry.clone();
    if (!geo.index) geo = geo.toNonIndexed ? geo : geo;
    geo.applyMatrix4(m.matrix);
    for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') geo.deleteAttribute(k);
    if (!geo.index) { const idx = []; for (let i = 0; i < geo.attributes.position.count; i++) idx.push(i); geo.setIndex(idx); }
    if (!buckets.has(m.material)) buckets.set(m.material, []);
    buckets.get(m.material).push(geo);
  }
  const out = new THREE.Group();
  for (const [mat, list] of buckets) {
    const merged = mergeGeometries(list, false);
    if (!merged) continue;
    out.add(outlineFn(merged, mat, 0.013));
    list.forEach(x => x.dispose());
  }
  return out;
}

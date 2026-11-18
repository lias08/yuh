// Builds the 3D arena for a tile grid + theme. Walls/bushes/crates are
// instanced (one draw call per part) and individual tiles can be removed when
// destroyed by supers.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toon, outlineMaterial, darken, lighten, glow } from './toon.js';

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function floorTexture(grid, theme) {
  const T = 32;
  const cv = document.createElement('canvas'); cv.width = grid.w * T; cv.height = grid.h * T;
  const c = cv.getContext('2d');
  const hex = (n) => '#' + n.toString(16).padStart(6, '0');
  const r = rng(7);
  for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) {
    c.fillStyle = hex((x + y) % 2 ? theme.floor[0] : theme.floor[1]);
    c.fillRect(x * T, y * T, T, T);
    // subtle noise speckles
    c.fillStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < 3; i++) c.fillRect(x * T + r() * T, y * T + r() * T, 2, 2);
    const ch = grid.cells[y][x];
    if (ch === 'W') { c.fillStyle = hex(darken(theme.floor[0], 0.25)); c.fillRect(x * T, y * T, T, T); }
  }
  // centre line + spawn halos
  c.strokeStyle = hex(theme.line); c.globalAlpha = 0.35; c.lineWidth = 3;
  c.beginPath(); c.moveTo(0, cv.height / 2); c.lineTo(cv.width, cv.height / 2); c.stroke();
  c.beginPath(); c.arc(cv.width / 2, cv.height / 2, T * 2.2, 0, Math.PI * 2); c.stroke();
  c.globalAlpha = 1;
  // soft border
  const g = c.createLinearGradient(0, 0, 0, T);
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 4; c.strokeRect(2, 2, cv.width - 4, cv.height - 4);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// X-ray: dithered cut-out of wall fragments between the camera and the
// focused fighter so the player is never hidden behind cover.
const FOCUS = { value: new THREE.Vector3(0, 0, 0) };
function xray(mat) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev && prev.call(mat, sh, r);
    sh.uniforms.uFocus = FOCUS;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vXw;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 xw = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          xw = instanceMatrix * xw;
        #endif
        vXw = (modelMatrix * xw).xyz;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vXw; uniform vec3 uFocus;')
      .replace('void main() {', `void main() {
        vec2 dd = vXw.xz - uFocus.xz;
        if (uFocus.y > 0.5 && dd.y > -0.45 && dd.y < 2.8 && abs(dd.x) < 1.25 + dd.y * 0.25) {
          if (mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) < 1.0) discard;
        }`);
  };
  mat.customProgramCacheKey = () => 'xray' + (prev ? 't' : 'b');
  return mat;
}
function xrayOutline(th) {
  const m = new THREE.MeshBasicMaterial({ color: 0x1a1224, side: THREE.BackSide });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = vec3(position) + normalize(normal) * ${th.toFixed(4)};`); };
  return xray(m);
}

const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();

class InstGroup {
  constructor(parent, geo, mat, count, outline = 0.02, see = false) {
    this.mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
    this.mesh.castShadow = true; this.mesh.receiveShadow = true;
    this.mesh.count = 0;
    parent.add(this.mesh);
    if (outline > 0) {
      this.ol = new THREE.InstancedMesh(geo, see ? xrayOutline(outline) : outlineMaterial(outline), Math.max(1, count));
      this.ol.instanceMatrix = this.mesh.instanceMatrix;
      this.ol.count = 0;
      parent.add(this.ol);
    }
    this.keyToIdx = new Map();
    this.idxMats = [];
  }
  add(key, pos, rotY = 0, scale = [1, 1, 1], color) {
    const i = this.mesh.count++;
    tmpQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    tmpS.set(...scale);
    tmpM.compose(pos, tmpQ, tmpS);
    this.mesh.setMatrixAt(i, tmpM);
    this.idxMats[i] = tmpM.clone();
    if (color !== undefined) this.mesh.setColorAt(i, new THREE.Color(color));
    if (this.ol) this.ol.count = this.mesh.count;
    if (!this.keyToIdx.has(key)) this.keyToIdx.set(key, []);
    this.keyToIdx.get(key).push(i);
  }
  remove(key) {
    const list = this.keyToIdx.get(key); if (!list) return false;
    tmpM.makeScale(0, 0, 0);
    for (const i of list) this.mesh.setMatrixAt(i, tmpM);
    this.mesh.instanceMatrix.needsUpdate = true;
    this.keyToIdx.delete(key);
    return true;
  }
  finish() { this.mesh.instanceMatrix.needsUpdate = true; if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true; }
}

export function buildArena(scene, grid, theme, seed = 1) {
  const group = new THREE.Group();
  scene.add(group);
  const W = grid.w, H = grid.h;
  const r = rng(seed * 977 + 13);

  // outer ground
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), toon(darken(theme.floor[1], 0.3)));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.02; outer.receiveShadow = true;
  group.add(outer);
  // arena floor plate (raised slab with rounded edge)
  const slab = new THREE.Mesh(new RoundedBoxGeometry(W + 0.6, 0.4, H + 0.6, 2, 0.15), toon(darken(theme.floor[0], 0.35)));
  slab.position.y = -0.21; slab.receiveShadow = true; group.add(slab);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshToonMaterial({ map: floorTexture(grid, theme), gradientMap: null }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.0; floor.receiveShadow = true;
  group.add(floor);

  // counts
  let nWall = 0, nBush = 0, nWater = 0, nCrate = 0, nRope = 0;
  for (const row of grid.cells) for (const c of row) { if (c === '#') nWall++; else if (c === 'B') nBush++; else if (c === 'W') nWater++; else if (c === 'X') nCrate++; else if (c === 'R') nRope++; }

  const parts = {};
  const style = theme.wallStyle;
  const wallMat = xray(toon(theme.wall, { rim: 0.35, unique: true }));
  const topMat = xray(toon(theme.wallTop, { rim: 0.35, unique: true }));
  if (style === 'rock') {
    parts.wall = new InstGroup(group, new THREE.IcosahedronGeometry(0.62, 1), wallMat, nWall * 2, 0.025, true);
  } else if (style === 'bamboo') {
    parts.wall = new InstGroup(group, new THREE.CylinderGeometry(0.14, 0.15, 1.2, 10), wallMat, nWall * 3, 0.02, true);
    parts.wallTop = new InstGroup(group, new RoundedBoxGeometry(1.0, 0.18, 1.0, 2, 0.06), topMat, nWall, 0.02, true);
  } else {
    const h = style === 'building' ? 1.1 : 0.9;
    parts.wall = new InstGroup(group, new RoundedBoxGeometry(0.98, h, 0.98, 2, 0.12), wallMat, nWall, 0.025, true);
    if (style === 'house') {
      const roof = new THREE.ConeGeometry(0.76, 0.36, 4, 1); roof.rotateY(Math.PI / 4);
      parts.wallTop = new InstGroup(group, roof, topMat, nWall, 0.02, true);
    } else {
      parts.wallTop = new InstGroup(group, new RoundedBoxGeometry(1.02, 0.14, 1.02, 2, 0.05), topMat, nWall, 0.015, true);
    }
  }
  const bushMat = toon(theme.bush, { rim: 0.5, rimColor: lighten(theme.bush, 0.6) });
  bushMat.transparent = true;
  const bushMat2 = toon(theme.bush2, { rim: 0.5 }); bushMat2.transparent = true;
  parts.bush = new InstGroup(group, new THREE.IcosahedronGeometry(0.42, 1), bushMat, nBush * 3, 0.018);
  parts.bush2 = new InstGroup(group, new THREE.IcosahedronGeometry(0.34, 1), bushMat2, nBush * 2, 0);
  const crateGeo = new RoundedBoxGeometry(0.86, 0.86, 0.86, 2, 0.08);
  parts.crate = new InstGroup(group, crateGeo, xray(toon(theme.crate, { rim: 0.4, unique: true })), nCrate, 0.022, true);
  parts.crateBand = new InstGroup(group, new RoundedBoxGeometry(0.9, 0.16, 0.9, 1, 0.04), toon(darken(theme.crate, 0.45)), nCrate * 2, 0);
  parts.rope = new InstGroup(group, new THREE.CylinderGeometry(0.06, 0.07, 0.7, 8), toon(0x8a6a4a), nRope * 2, 0.012);
  parts.ropeBar = new InstGroup(group, new THREE.CylinderGeometry(0.03, 0.03, 1, 6), toon(0xd8c8a0), nRope * 2, 0);

  const waterMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(theme.water) } },
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * instanceMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec2 vUv; varying vec3 vW;
      void main(){ float w = sin(vW.x*3.0 + uTime*1.6)*0.5 + sin(vW.z*2.3 - uTime*1.2)*0.5; float c = smoothstep(0.75, 0.95, w*0.5+0.5);
        vec3 col = uColor * (0.85 + 0.15*w) + vec3(c)*0.35; gl_FragColor = vec4(col, 0.92); }`,
    transparent: true,
  });
  const waterGeo = new THREE.PlaneGeometry(1.0, 1.0); waterGeo.rotateX(-Math.PI / 2);
  parts.water = new InstGroup(group, waterGeo, waterMat, nWater, 0);
  parts.water.mesh.castShadow = false;

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = grid.cells[y][x];
    const px = grid.cx(x), pz = grid.cz(y);
    const key = y * W + x;
    if (c === '#') {
      if (style === 'rock') {
        parts.wall.add(key, new THREE.Vector3(px, 0.45, pz), r() * 6, [0.95 + r() * 0.2, 0.9 + r() * 0.4, 0.95 + r() * 0.2]);
        parts.wall.add(key, new THREE.Vector3(px + (r() - 0.5) * 0.2, 0.95, pz + (r() - 0.5) * 0.2), r() * 6, [0.6, 0.55, 0.6]);
      } else if (style === 'bamboo') {
        for (let i = 0; i < 3; i++) parts.wall.add(key, new THREE.Vector3(px - 0.3 + i * 0.3, 0.6, pz + (i - 1) * 0.12), 0, [1, 0.9 + r() * 0.2, 1]);
        parts.wallTop.add(key, new THREE.Vector3(px, 0.25, pz));
      } else {
        const h = style === 'building' ? 1.1 : 0.9;
        parts.wall.add(key, new THREE.Vector3(px, h / 2, pz));
        parts.wallTop.add(key, new THREE.Vector3(px, style === 'house' ? h + 0.2 : h + 0.04, pz));
      }
    } else if (c === 'B') {
      for (let i = 0; i < 3; i++) parts.bush.add(key, new THREE.Vector3(px + (r() - 0.5) * 0.45, 0.32 + r() * 0.12, pz + (r() - 0.5) * 0.45), r() * 6, [1, 0.9 + r() * 0.3, 1]);
      for (let i = 0; i < 2; i++) parts.bush2.add(key, new THREE.Vector3(px + (r() - 0.5) * 0.6, 0.55 + r() * 0.15, pz + (r() - 0.5) * 0.6), r() * 6, [1, 1, 1]);
    } else if (c === 'W') {
      parts.water.add(key, new THREE.Vector3(px, 0.03, pz));
    } else if (c === 'X') {
      parts.crate.add(key, new THREE.Vector3(px, 0.43, pz), (r() - 0.5) * 0.2);
      parts.crateBand.add(key, new THREE.Vector3(px, 0.22, pz));
      parts.crateBand.add(key, new THREE.Vector3(px, 0.66, pz));
    } else if (c === 'R') {
      parts.rope.add(key, new THREE.Vector3(px - 0.42, 0.35, pz));
      parts.rope.add(key, new THREE.Vector3(px + 0.42, 0.35, pz));
      const horiz = grid.get(x, y - 1) !== 'R' && grid.get(x, y + 1) !== 'R';
      parts.ropeBar.add(key, new THREE.Vector3(px, 0.55, pz), horiz ? Math.PI / 2 : 0, horiz ? [1, 0.9, 1] : [1, 1, 1]);
    }
  }
  // rotate rope bars to lie horizontally
  parts.ropeBar.mesh.geometry.rotateZ(Math.PI / 2);
  for (const k in parts) parts[k].finish();
  parts.bush.mesh.castShadow = false; parts.bush2.mesh.castShadow = false; parts.crateBand.mesh.castShadow = false; parts.ropeBar.mesh.castShadow = false;

  // ---------- decorative props around the arena ----------
  const props = new THREE.Group(); group.add(props);
  const ring = [];
  for (let i = 0; i < 70; i++) {
    const side = i % 4; const t = r();
    let x, z;
    const m = 1.6 + r() * 6;
    if (side === 0) { x = -W / 2 - m; z = (t - 0.5) * (H + 14); }
    else if (side === 1) { x = W / 2 + m; z = (t - 0.5) * (H + 14); }
    else if (side === 2) { z = -H / 2 - m; x = (t - 0.5) * (W + 14); }
    else { z = H / 2 + 1.2 + m * 0.6; x = (t - 0.5) * (W + 14); }
    ring.push({ x, z, s: 0.7 + r() * 0.9, rot: r() * 6 });
  }
  const P = theme.props;
  const trunkM = toon(0x6a4a32), leafM = toon(theme.bush2), leafM2 = toon(theme.bush);
  for (const p of ring) {
    // the camera looks from +z: keep the near side free of tall props
    if (p.z > H / 2 && Math.abs(p.x) < W / 2 + 4) continue;
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = p.rot; g.scale.setScalar(p.s);
    if (P === 'city') {
      const h = 2 + r() * 6;
      const b = new THREE.Mesh(new RoundedBoxGeometry(1.8, h, 1.8, 2, 0.1), toon([0x5a5c70, 0x6a6c80, 0x4a4c60][Math.floor(r() * 3)]));
      b.position.y = h / 2; b.castShadow = true; g.add(b);
      for (let k = 0; k < Math.floor(h / 0.8); k++) { const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.25), glow(r() < 0.5 ? 0xffd890 : 0x8ad8ff, 0.7)); win.position.set(0, 0.6 + k * 0.8, 0.91); g.add(win); }
    } else if (P === 'namek') {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.2, 8), trunkM); tr.position.y = 1.1; g.add(tr);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 12), toon(0x4ab890)); top.position.y = 2.4; top.castShadow = true; g.add(top);
    } else if (P === 'village' || P === 'wano') {
      if (r() < 0.55) {
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.6, 8), trunkM); tr.position.y = 0.8; tr.castShadow = true; g.add(tr);
        const lm = P === 'wano' ? toon(0xff9ac0) : leafM;
        for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 - k * 0.15, 1), lm); s.position.set((r() - 0.5) * 0.5, 1.8 + k * 0.45, (r() - 0.5) * 0.5); s.castShadow = true; g.add(s); }
      } else {
        const house = new THREE.Mesh(new RoundedBoxGeometry(1.6, 1.2, 1.4, 2, 0.08), toon(P === 'wano' ? 0x7a4a32 : 0xe8d8b8)); house.position.y = 0.6; house.castShadow = true; g.add(house);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.8, 4), toon(P === 'wano' ? 0x3a3a48 : 0xb84a3a)); roof.rotation.y = Math.PI / 4; roof.position.y = 1.6; roof.scale.z = 0.85; roof.castShadow = true; g.add(roof);
        if (P === 'wano' && r() < 0.4) { const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), glow(0xff7a3a, 0.9)); lamp.position.set(0.9, 1.0, 0); g.add(lamp); }
      }
    } else if (P === 'seireitei') {
      const wall = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.6 + r() * 1.5, 1.2, 2, 0.08), toon(0xf4f2ec)); wall.position.y = wall.geometry.parameters.height / 2; wall.castShadow = true; g.add(wall);
      const roof = new THREE.Mesh(new RoundedBoxGeometry(2.5, 0.2, 1.5, 2, 0.06), toon(0x3a4a6a)); roof.position.y = wall.geometry.parameters.height + 0.1; g.add(roof);
      if (r() < 0.4) { const tr = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), toon(0xffb0d0)); tr.position.set(1.4, 1.8, 0.8); g.add(tr); }
    }
    props.add(g);
  }
  if (P === 'wano' || P === 'village') { // torii / gate at both ends
    for (const s of [-1]) {
      const gate = new THREE.Group(); gate.position.set(0, 0, s * (H / 2 + 3.5));
      const red = toon(P === 'wano' ? 0xd8302a : 0x8a5a3a);
      for (const x of [-1.8, 1.8]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3, 10), red); p.position.set(x, 1.5, 0); p.castShadow = true; gate.add(p); }
      const beam = new THREE.Mesh(new RoundedBoxGeometry(4.8, 0.3, 0.4, 2, 0.08), red); beam.position.y = 3.05; gate.add(beam);
      const beam2 = new THREE.Mesh(new RoundedBoxGeometry(4.0, 0.2, 0.3, 2, 0.06), red); beam2.position.y = 2.55; gate.add(beam2);
      group.add(gate);
    }
  }

  // floating ambience particles (petals / leaves / embers)
  const amb = new THREE.Group(); group.add(amb);
  const ambGeo = new THREE.PlaneGeometry(0.12, 0.08);
  const ambColor = { city: 0x8ad8ff, namek: 0xd8ffd0, village: 0x9ad86a, seireitei: 0xffb0d0, wano: 0xffa0c0 }[P] ?? 0xffffff;
  const ambMat = new THREE.MeshBasicMaterial({ color: ambColor, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
  const motes = [];
  for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(ambGeo, ambMat); m.position.set((r() - 0.5) * (W + 6), 1 + r() * 4, (r() - 0.5) * (H + 6)); m.userData.v = [0.2 + r() * 0.4, -0.15 - r() * 0.2, 0.1 + r() * 0.2, r() * 6]; amb.add(m); motes.push(m); }

  const tempWalls = new Map();
  return {
    group, parts, bushMats: [bushMat, bushMat2],
    removeTile(tx, ty) { const key = ty * W + tx; let any = false; for (const k in parts) any = parts[k].remove(key) || any; return any; },
    addTemp(tx, ty, color, kind) {
      const px = grid.cx(tx), pz = grid.cz(ty);
      let m;
      if (kind === 'ice') m = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), toon(color, { rim: 0.9, opacity: 0.85 }));
      else if (kind === 'light') m = new THREE.Mesh(new RoundedBoxGeometry(0.98, 1.2, 0.98, 2, 0.1), glow(color, 0.45));
      else m = new THREE.Mesh(new RoundedBoxGeometry(0.95, 1.0, 0.95, 2, 0.15), toon(color, { rim: 0.4 }));
      m.position.set(px, kind === 'ice' ? 0.62 : 0.5, pz); m.castShadow = true;
      if (kind !== 'light') { const o = new THREE.Mesh(m.geometry, outlineMaterial(0.02)); m.add(o); }
      m.scale.set(1, 0.01, 1);
      group.add(m);
      tempWalls.set(ty * W + tx, { m, t: 0 });
      return m;
    },
    removeTemp(tx, ty) { const k = ty * W + tx; const e = tempWalls.get(k); if (e) { group.remove(e.m); tempWalls.delete(k); } },
    setFocus(x, z, on) { FOCUS.value.set(x, on ? 1 : 0, z); },
    update(dt, time) {
      waterMat.uniforms.uTime.value = time;
      for (const e of tempWalls.values()) { e.t += dt; e.m.scale.y = Math.min(1, e.t * 6); }
      for (const m of motes) { const v = m.userData.v; m.position.x += v[0] * dt; m.position.y += v[1] * dt; m.position.z += v[2] * dt; m.rotation.x += dt * 2; m.rotation.z += dt * 1.3;
        if (m.position.y < 0.1) { m.position.y = 4 + Math.random(); m.position.x = (Math.random() - 0.5) * (W + 6); m.position.z = (Math.random() - 0.5) * (H + 6); } }
    },
    dispose() { scene.remove(group); },
  };
}

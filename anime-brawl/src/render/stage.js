// Showcase stage for the lobby / brawler pages: pedestal, rim lights, ambient
// particles, idle + reaction animations. Also renders card portraits.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { buildCharacter, prewarmLooks, isLookReady } from './model.js';
import { animate } from './anim.js';
import { toon, glowUnique } from './toon.js';
import { VFX } from './vfx.js';
import { lookFor } from '../game/fighter.js';

function gradientBg(top, bottom) {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256;
  const c = cv.getContext('2d'); const g = c.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top); g.addColorStop(0.6, bottom); g.addColorStop(1, '#0b0a14');
  c.fillStyle = g; c.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Stage {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = gradientBg('#3a2a7a', '#161430');
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.scene.add(new THREE.HemisphereLight(0xd8d0ff, 0x302848, 1.3));
    const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(3, 6, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera; sc.left = -3; sc.right = 3; sc.top = 4; sc.bottom = -2;
    this.scene.add(key);
    this.rim = new THREE.DirectionalLight(0x8ad8ff, 1.6); this.rim.position.set(-4, 3, -4); this.scene.add(this.rim);
    // pedestal
    const ped = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.3, 48), toon(0x2a2448, { rim: 0.0 }));
    base.position.y = -0.15; base.receiveShadow = true; ped.add(base);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.04, 48), toon(0x3a3260, { rim: 0.0 })); top.position.y = 0.01; top.receiveShadow = true; ped.add(top);
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.035, 8, 64), glowUnique(0xffd23f, 0.9)); this.ring.rotation.x = Math.PI / 2; this.ring.position.y = 0.02; ped.add(this.ring);
    this.ring2 = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.8, 64), glowUnique(0xffd23f, 0.12)); this.ring2.rotation.x = -Math.PI / 2; this.ring2.position.y = -0.28; ped.add(this.ring2);
    this.scene.add(ped);
    // floor glow + backdrop shapes
    const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 48), new THREE.MeshBasicMaterial({ color: 0x120f24 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.31; this.scene.add(floor);
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new RoundedBoxGeometry(0.6 + Math.random(), 2 + Math.random() * 4, 0.3, 2, 0.1), glowUnique(0x6a5aff, 0.05 + Math.random() * 0.05));
      const a = -1.2 + i * 0.4; m.position.set(Math.sin(a) * 7, 1, -6 - Math.cos(a) * 2); m.rotation.y = -a; this.scene.add(m);
    }
    this.vfx = new VFX(this.scene);
    this.model = null; this.rig = null; this.t = 0; this.action = null; this.nextIdle = 3;
    this.spin = 0; this.spinTarget = 0; this.drag = null;
    this.offsetX = 0; this.zoom = 1;
  }
  setCharacter(def, skin = null, form = 'base', rarityColor = 0xffd23f) {
    const look = def.boss ? def.look : lookFor(def, skin, form);
    const req = (this.req = {});
    if (!isLookReady(look, 'hi')) {
      prewarmLooks([look], 'hi').then(() => { if (this.req === req) this._set(def, skin, form, rarityColor); });
      if (!this.model) return;
      return;
    }
    this._set(def, skin, form, rarityColor);
  }
  _set(def, skin = null, form = 'base', rarityColor = 0xffd23f) {
    if (this.model) this.scene.remove(this.model);
    this.def = def; this.form = form;
    const look = def.boss ? def.look : lookFor(def, skin, form);
    const { group, rig } = buildCharacter(look, { quality: 'hi' });
    this.model = group; this.rig = rig; this.scene.add(group);
    group.rotation.y = 0.25;
    this.ring.material.color.setHex(rarityColor); this.ring2.material.color.setHex(rarityColor);
    this.rim.color.setHex(rarityColor === 0xffffff ? 0xffe9a8 : rarityColor);
    this.frame();
    const FD = form === 'trans2' ? def.trans?.next : form === 'trans' ? def.trans : null;
    this.aura = FD ? FD.aura : null; this.aura2 = FD ? FD.aura2 : null;
  }
  frame() {
    const h = this.rig?.height ?? 1.4;
    this.camH = h;
  }
  resize(w, h) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.vfx.setScale(h); this.w = w; this.h = h; }
  react() {
    if (!this.rig) return;
    const acts = ['punch', 'slash', 'cast', 'kick', 'raise', 'spin', 'flurry'];
    const main = this.def?.main;
    const a = main?.anim ?? acts[Math.floor(Math.random() * acts.length)];
    this.action = { name: a, t: 0, dur: 0.6, alt: Math.random() < 0.5 };
    const c = main?.color ?? 0xffffff;
    this.vfx.burst({ x: 0.3, y: 0.9, z: 0.4 }, { count: 24, color: c, speed: 4, life: 0.5 });
    this.vfx.ring({ x: 0, z: 0 }, { color: c, r0: 0.3, r1: 1.6, life: 0.4 });
  }
  celebrate(color = 0xffd23f) {
    if (!this.rig) return;
    this.action = { name: 'raise', t: 0, dur: 1.0 };
    this.vfx.pillar({ x: 0, z: 0 }, { color, r: 0.9, h: 6, life: 0.8 });
    this.vfx.burst({ x: 0, y: 0.8, z: 0 }, { count: 50, color, color2: 0xffffff, speed: 5, up: 1.4, life: 0.9 });
    this.vfx.ring({ x: 0, z: 0 }, { color, r0: 0.2, r1: 2.6, life: 0.6 });
  }
  update(dt) {
    this.t += dt;
    if (!this.rig) return;
    if (this.action) { this.action.t += dt / this.action.dur; if (this.action.t >= 1) this.action = null; }
    this.nextIdle -= dt;
    if (this.nextIdle <= 0 && !this.action) { this.nextIdle = 4 + Math.random() * 4; const o = ['punch', 'slash', 'cast', 'point', 'seal']; this.action = { name: o[Math.floor(Math.random() * o.length)], t: 0, dur: 0.7 }; }
    animate(this.rig, dt, { move: 0, action: this.action, victory: false });
    if (!this.drag) { this.spinTarget += (0 - this.spinTarget) * Math.min(1, dt * 1.5); }
    this.spin += (this.spinTarget - this.spin) * Math.min(1, dt * 8);
    this.model.rotation.y = 0.25 + this.spin + Math.sin(this.t * 0.4) * 0.12;
    this.ring.rotation.z += dt * 0.4;
    if (this.aura && Math.random() < 0.9) { const p = this.rig.auraAnchor.getWorldPosition(new THREE.Vector3()); this.vfx.auraTick(p, this.aura, dt, 1.2, 1.4); if (this.aura2) this.vfx.auraTick(p, this.aura2, dt, 0.5, 1.4, 'spark'); }
    if (Math.random() < dt * 6) this.vfx.dot((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 3 - 1, 0x8a7aff, 0.12, 3, 0, 0.5, 0);
    this.vfx.update(dt);
    const h = this.camH * (this.rig.type === 'dragon' ? 1.3 : 1);
    const dist = (h * 3.1 + 2.6) / this.zoom;
    this.camera.position.set(this.offsetX * dist * 0.35, h * 0.75 + 0.7, dist);
    this.camera.lookAt(this.offsetX * dist * 0.35, h * 0.42, 0);
  }
  render(viewport) {
    const r = this.renderer;
    if (viewport) {
      r.setScissorTest(true); r.setScissor(viewport.x, viewport.y, viewport.w, viewport.h); r.setViewport(viewport.x, viewport.y, viewport.w, viewport.h);
      r.render(this.scene, this.camera); r.setScissorTest(false);
    } else r.render(this.scene, this.camera);
  }
}

// ---------------------------------------------------------------------------
// Portraits rendered once per (brawler, skin) into data URLs.
const portraitCache = new Map();
let pScene, pCam, pTarget, pCanvas;
export function portrait(renderer, def, skin = null, form = 'base') {
  const key = def.id + '|' + (skin?.id ?? 'default') + '|' + form;
  if (portraitCache.has(key)) return portraitCache.get(key);
  const S = 192;
  if (!pScene) {
    pScene = new THREE.Scene();
    pScene.add(new THREE.HemisphereLight(0xffffff, 0x404060, 1.5));
    const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(2, 3, 4); pScene.add(d);
    const rim = new THREE.DirectionalLight(0xbfd8ff, 1.5); rim.position.set(-3, 2, -3); pScene.add(rim);
    pCam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
    pTarget = new THREE.WebGLRenderTarget(S, S, { samples: 4 });
    pTarget.texture.colorSpace = THREE.SRGBColorSpace;
    pCanvas = document.createElement('canvas'); pCanvas.width = S; pCanvas.height = S;
  }
  const look = def.boss ? def.look : lookFor(def, skin, form);
  const { group, rig } = buildCharacter(look, { outline: 0.022, quality: 'lo' });
  animate(rig, 0.016, { move: 0 });
  group.rotation.y = 0.35;
  pScene.add(group);
  const h = rig.height;
  const headY = rig.type === 'dragon' ? 1.0 : rig.type === 'beast' ? 0.6 : h * 0.78;
  const dist = rig.type === 'dragon' ? 4.4 : h * 1.65 + 0.85;
  pCam.position.set(0.35, headY + 0.1, dist); pCam.lookAt(0, headY - 0.05, 0);
  const prevTarget = renderer.getRenderTarget();
  const prevClear = renderer.getClearAlpha();
  renderer.setRenderTarget(pTarget);
  renderer.setClearColor(0x000000, 0); renderer.clear();
  renderer.render(pScene, pCam);
  const buf = new Uint8Array(S * S * 4);
  renderer.readRenderTargetPixels(pTarget, 0, 0, S, S, buf);
  renderer.setRenderTarget(prevTarget);
  renderer.setClearAlpha(prevClear);
  pScene.remove(group);
  const ctx = pCanvas.getContext('2d');
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) img.data.set(buf.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
  ctx.putImageData(img, 0, 0);
  const url = pCanvas.toDataURL('image/png');
  portraitCache.set(key, url);
  group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  return url;
}
export function hasPortrait(def, skin, form = 'base') { return portraitCache.has(def.id + '|' + (skin?.id ?? 'default') + '|' + form); }

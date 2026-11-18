// Player input. Desktop: WASD + mouse aim, LMB attack, RMB/Space super,
// E gadget, F/Q transform. Touch: floating move stick on the left, drag-to-aim
// attack and super sticks on the right (tap = auto-aim), gadget + form buttons.
import * as THREE from 'three';
import { actRange } from './ai.js';
import { initAudio } from '../core/audio.js';

const ray = new THREE.Raycaster();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export class Input {
  constructor(root, canvas) {
    this.root = root; this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, inside: false, left: false };
    this.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.queue = [];
    this.move = { x: 0, z: 0 };
    this.aimActive = false; this.aimDir = { x: 0, z: -1 }; this.aimKind = 'main'; this.aimDist = 0;
    this.sticks = {};
    this.bind();
  }
  bind() {
    this.onKey = (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (e.type === 'keydown') {
        this.keys.add(k);
        if (k === ' ') { this.queue.push({ t: 'super', manual: true }); e.preventDefault(); }
        if (k === 'e') this.queue.push({ t: 'gadget' });
        if (k === 'f' || k === 'q') this.queue.push({ t: 'trans' });
        if (k === 'escape') this.queue.push({ t: 'exit' });
        if (k >= '1' && k <= '4') this.queue.push({ t: 'pin', i: +k - 1 });
      } else this.keys.delete(k);
    };
    window.addEventListener('keydown', this.onKey); window.addEventListener('keyup', this.onKey);
    this.onMouse = (e) => {
      if (e.pointerType === 'touch') { this.touchActive = true; return; }
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1; this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      this.mouse.inside = true; this.mouseUsed = true;
    };
    this.onDown = (e) => {
      if (e.pointerType === 'touch') return;
      initAudio();
      this.onMouse(e);
      if (e.button === 0) { this.mouse.left = true; this.queue.push({ t: 'attack', manual: true }); }
      if (e.button === 2) this.queue.push({ t: 'super', manual: true });
    };
    this.onUp = (e) => { if (e.button === 0) this.mouse.left = false; };
    this.canvas.addEventListener('pointermove', this.onMouse);
    this.canvas.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointerup', this.onUp);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  /** touch controls live in the HUD layer */
  buildTouch(hud) {
    const mk = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; hud.appendChild(d); return d; };
    // move stick: floating within left zone
    const zone = mk('tc-zone tc-left');
    const base = mk('tc-stick'); const knob = document.createElement('div'); knob.className = 'tc-knob'; base.appendChild(knob); base.style.display = 'none';
    const btn = (cls, label, sub) => { const b = mk('tc-btn ' + cls, `<svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/></svg><span class="lbl">${label}</span>${sub ? `<span class="key">${sub}</span>` : ''}`); return b; };
    this.btnAttack = btn('tc-attack', '<i class="ic-atk"></i>', this.touch ? '' : 'LMB');
    this.btnSuper = btn('tc-super', '<i class="ic-sup"></i>', this.touch ? '' : 'RMB / Leer');
    this.btnGadget = btn('tc-gadget', '<i class="ic-gad"></i>', this.touch ? '' : 'E');
    this.btnTrans = btn('tc-trans', '<b>FORM</b>', this.touch ? '' : 'F');
    let moveId = null, ox = 0, oy = 0;
    zone.addEventListener('pointerdown', (e) => { initAudio(); if (e.pointerType === 'touch') { this.touchActive = true; this.mouseUsed = false; } moveId = e.pointerId; ox = e.clientX; oy = e.clientY; base.style.display = 'block'; base.style.left = ox + 'px'; base.style.top = oy + 'px'; zone.setPointerCapture(e.pointerId); });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== moveId) return;
      let dx = e.clientX - ox, dy = e.clientY - oy; const L = Math.hypot(dx, dy), max = 55;
      if (L > max) { dx = dx / L * max; dy = dy / L * max; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.move.x = dx / max; this.move.z = dy / max;
    });
    const endMove = (e) => { if (e.pointerId !== moveId) return; moveId = null; this.move.x = this.move.z = 0; base.style.display = 'none'; knob.style.transform = ''; };
    zone.addEventListener('pointerup', endMove); zone.addEventListener('pointercancel', endMove);
    // aim sticks
    const aimStick = (el, kind) => {
      let id = null, sx = 0, sy = 0, t0 = 0, dragged = false;
      el.addEventListener('pointerdown', (e) => { initAudio(); e.stopPropagation(); if (e.pointerType === 'touch') { this.touchActive = true; this.mouseUsed = false; } id = e.pointerId; sx = e.clientX; sy = e.clientY; t0 = performance.now(); dragged = false; el.setPointerCapture(e.pointerId); el.classList.add('held'); if (!this.touch && e.pointerType !== 'touch') { /* mouse click on button */ } });
      el.addEventListener('pointermove', (e) => {
        if (e.pointerId !== id) return;
        const dx = e.clientX - sx, dy = e.clientY - sy, L = Math.hypot(dx, dy);
        if (L > 14) { dragged = true; this.aimActive = true; this.aimKind = kind; this.aimDir = { x: dx / L, z: dy / L }; this.aimDist = Math.min(1, L / 90); }
      });
      const up = (e) => {
        if (e.pointerId !== id) return; id = null; el.classList.remove('held');
        const quick = !dragged;
        this.queue.push({ t: kind === 'main' ? 'attack' : 'super', manual: !quick, dir: dragged ? { ...this.aimDir } : null, frac: this.aimDist });
        this.aimActive = false;
      };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    };
    aimStick(this.btnAttack, 'main'); aimStick(this.btnSuper, 'super');
    this.btnGadget.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.queue.push({ t: 'gadget' }); });
    this.btnTrans.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.queue.push({ t: 'trans' }); });
  }

  mouseWorld(world) {
    ray.setFromCamera(new THREE.Vector2(this.mouse.x, this.mouse.y), world.camera);
    const p = new THREE.Vector3();
    return ray.ray.intersectPlane(ground, p) ? p : null;
  }

  autoAim(world, f, act) {
    const range = actRange(act) + 0.8;
    let best = null, bs = 1e9;
    for (const u of world.units) {
      if (!u.alive || u.team === f.team || u.untargetable) continue;
      if (!world.isVisibleTo(u, f.team)) continue;
      const d = Math.hypot(u.x - f.x, u.z - f.z);
      if (d > range + u.r) continue;
      const s = d + (world.grid.los(f.x, f.z, u.x, u.z) ? 0 : 6) + (u.kind === 'structure' && !u.isDummy ? 3 : 0);
      if (s < bs) { bs = s; best = u; }
    }
    if (!best) return { dir: { x: Math.cos(f.face), z: Math.sin(f.face) }, dist: range * 0.7 };
    const d = Math.hypot(best.x - f.x, best.z - f.z);
    const t = d / 16;
    const tx = best.x + (best.vel?.x ?? 0) * t, tz = best.z + (best.vel?.z ?? 0) * t;
    const L = Math.hypot(tx - f.x, tz - f.z) || 1;
    return { dir: { x: (tx - f.x) / L, z: (tz - f.z) / L }, dist: L };
  }

  apply(world, f, dt) {
    // movement
    let mx = this.move.x, mz = this.move.z;
    if (this.keys.has('w') || this.keys.has('arrowup')) mz -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) mz += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) mx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) mx += 1;
    const L = Math.hypot(mx, mz);
    f.moveIn.x = L > 1 ? mx / L : mx; f.moveIn.z = L > 1 ? mz / L : mz;
    // desktop aim follows mouse
    let mouseAim = null;
    if (this.mouseUsed && !this.touchActive) {
      const p = this.mouseWorld(world);
      if (p) { const dx = p.x - f.x, dz = p.z - f.z, d = Math.hypot(dx, dz) || 1; mouseAim = { dir: { x: dx / d, z: dz / d }, dist: d }; this.aimDir = mouseAim.dir; this.aimDist = d; }
    }
    if (mouseAim) { f.liveAim = mouseAim.dir; f.aiming = true; }
    else if (this.aimActive) { f.liveAim = this.aimDir; f.aiming = true; }
    else f.aiming = false;
    if (this.mouse.left && f.attackCd <= 0 && f.ammo >= 1 && mouseAim) this.queue.push({ t: 'attack', manual: true, hold: true });
    // actions
    const q = this.queue; this.queue = [];
    for (const a of q) {
      if (a.t === 'exit') { world.o.onExit && world.o.onExit(); continue; }
      if (a.t === 'pin') { world.hud?.pin(f, a.i); continue; }
      if (a.t === 'trans') { f.tryTransform(); continue; }
      const act = a.t === 'attack' ? f.mainAct : a.t === 'super' ? f.superAct : f.gadgetAct;
      if (!act) continue;
      let aim, dist;
      if (a.dir) { aim = a.dir; dist = Math.max(1, (a.frac ?? 0.8) * actRange(act)); }
      else if (a.manual && mouseAim) { aim = mouseAim.dir; dist = mouseAim.dist; }
      else { const au = this.autoAim(world, f, act); aim = au.dir; dist = au.dist; }
      if (a.t === 'attack') f.attack(aim, dist);
      else if (a.t === 'super') f.useSuper(aim, dist);
      else f.useGadget(aim, dist);
    }
  }
  dispose() {
    window.removeEventListener('keydown', this.onKey); window.removeEventListener('keyup', this.onKey);
    window.removeEventListener('pointerup', this.onUp);
    this.canvas.removeEventListener('pointermove', this.onMouse); this.canvas.removeEventListener('pointerdown', this.onDown);
  }
}

// ---------------------------------------------------------------------------
// Ground aim indicator
export class AimIndicator {
  constructor(scene) {
    this.g = new THREE.Group(); scene.add(this.g);
    const mat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false });
    this.rect = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat()); this.rect.rotation.x = -Math.PI / 2; this.rect.position.y = 0.05;
    this.rect.geometry.translate(0.5, 0, 0);
    this.circle = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), mat()); this.circle.rotation.x = -Math.PI / 2; this.circle.position.y = 0.06;
    this.disc = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mat()); this.disc.rotation.x = -Math.PI / 2; this.disc.position.y = 0.05; this.disc.material.opacity = 0.15;
    this.sector = new THREE.Mesh(new THREE.CircleGeometry(1, 32, -0.6, 1.2), mat()); this.sector.rotation.x = -Math.PI / 2; this.sector.position.y = 0.05;
    this.g.add(this.rect, this.circle, this.disc, this.sector);
    this.g.visible = false;
  }
  update(world, input, f) {
    if (!f || !f.alive) { this.g.visible = false; return; }
    const desktop = input.mouseUsed;
    const show = input.aimActive || desktop;
    this.g.visible = show;
    if (!show) return;
    const kind = input.aimActive ? input.aimKind : (input.keys.has('shift') ? 'super' : 'main');
    const act = kind === 'super' ? f.superAct : f.mainAct;
    const color = kind === 'super' ? (f.superCharge >= 1 ? 0xffd23f : 0x888888) : f.ammo >= 1 ? 0xffffff : 0xff6a6a;
    for (const m of [this.rect, this.circle, this.disc, this.sector]) { m.material.color.setHex(color); m.visible = false; }
    this.g.position.set(f.x, 0, f.z);
    const ang = Math.atan2(input.aimDir.z, input.aimDir.x);
    const range = actRange(act);
    const k = act.kind === 'multi' ? act.list[0].kind : act.kind === 'seq' ? act.steps[0].do.kind : act.kind;
    const opac = desktop && !input.aimActive ? 0.24 : 0.36;
    if (k === 'aoe' || k === 'blink' || (k === 'custom' && /hellzone/.test(act.fn))) {
      const d = Math.min(range, input.aimActive ? input.aimDist * range : input.aimDist);
      const r = act.r ?? act.list?.[0]?.r ?? 1.5;
      this.circle.visible = this.disc.visible = true;
      this.circle.position.set(Math.cos(ang) * d, 0.06, Math.sin(ang) * d); this.disc.position.copy(this.circle.position); this.disc.position.y = 0.05;
      this.circle.scale.setScalar(r); this.disc.scale.setScalar(r);
      this.circle.material.opacity = opac + 0.2;
    } else if (k === 'nova' || k === 'domain' || k === 'summon' || k === 'buff') {
      const r = act.r ?? 3; this.circle.visible = this.disc.visible = true; this.circle.position.set(0, 0.06, 0); this.disc.position.set(0, 0.05, 0); this.circle.scale.setScalar(r); this.disc.scale.setScalar(r);
    } else if (k === 'cone') {
      this.sector.visible = true; this.sector.scale.setScalar(range); this.sector.rotation.z = -ang;
      const arc = ((act.arc ?? 90) * Math.PI) / 180; this.sector.geometry.dispose?.(); this.sector.geometry = new THREE.CircleGeometry(1, 24, -arc / 2, arc); this.sector.material.opacity = opac;
    } else {
      const w = Math.max(0.35, (act.w ?? 0.3) * 2 + (act.count > 1 ? (act.spread ?? 0) / 45 : 0));
      this.rect.visible = true; this.rect.scale.set(range, w, 1); this.rect.rotation.z = -ang; this.rect.material.opacity = opac;
    }
  }
  dispose(scene) { scene.remove(this.g); }
}

// Unique character mechanics that cannot be expressed as plain data.
import * as THREE from 'three';
import { execute, Projectile, KINDS, applyBuff, angOf, rot } from './actions.js';
import { projectileMesh } from '../render/vfx.js';
import { glowUnique } from '../render/toon.js';

const TAU = Math.PI * 2;

function swapPositions(w, a, b, color = 0xffe0a0) {
  const ax = a.x, az = a.z;
  w.vfx.burst({ x: a.x, y: 0.7, z: a.z }, { count: 16, color, speed: 3, life: 0.4 });
  w.vfx.burst({ x: b.x, y: 0.7, z: b.z }, { count: 16, color, speed: 3, life: 0.4 });
  w.vfx.lightning({ x: a.x, y: 0.8, z: a.z }, { x: b.x, y: 0.8, z: b.z }, { color, jag: 0.15, life: 0.18 });
  a.teleport ? a.teleport(b.x, b.z) : (a.x = b.x, a.z = b.z);
  b.teleport ? b.teleport(ax, az) : (b.x = ax, b.z = az);
  if (a.hooks) for (const p of a.hooks) if (p.type === 'swapSpeed') a.addStatus('speed', 2, p.mult);
}

/** best unit near the aim line (enemies first, optionally allies) */
function pickAlongAim(w, src, aim, range, { allies = false, cone = 0.55 } = {}) {
  let best = null, bs = 1e9;
  for (const u of w.units) {
    if (!u.alive || u === src || u.kind === 'structure') continue;
    const enemy = u.team !== src.team;
    if (!enemy && !allies) continue;
    if (enemy && !w.isVisibleTo(u, src.team)) continue;
    const dx = u.x - src.x, dz = u.z - src.z, d = Math.hypot(dx, dz);
    if (d > range || d < 0.3) continue;
    let da = Math.abs(angOf(dx, dz) - angOf(aim.x, aim.z)); if (da > Math.PI) da = TAU - da;
    if (da > cone) continue;
    const s = da * 4 + d * 0.15 + (enemy ? 0 : 1.5);
    if (s < bs) { bs = s; best = u; }
  }
  return best;
}

function markerCap(src) { let n = 3; for (const p of src.hooks) if (p.type === 'markerCap') n = Math.max(n, p.n); return n; }
function addMarker(w, src, x, z) {
  const list = src.mem.markers || (src.mem.markers = []);
  const p = w.findWalkable(x, z, src.x, src.z);
  const m = projectileMesh('kunai', 0xffe06a, 0.35);
  m.position.set(p.x, 0.25, p.z); m.rotation.z = 0.9;
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.35, 20), glowUnique(0xffe06a, 0.8)); halo.rotation.x = -Math.PI / 2; halo.position.y = -0.2; m.add(halo);
  w.scene.add(m);
  list.push({ x: p.x, z: p.z, mesh: m });
  while (list.length > markerCap(src)) { const old = list.shift(); w.scene.remove(old.mesh); }
}
function popMarker(w, src, newest = true) {
  const list = src.mem.markers || [];
  if (!list.length) return null;
  const m = newest ? list.pop() : list.shift();
  w.scene.remove(m.mesh);
  return m;
}

function rasengan(w, src, x, z, dmg, ctx) {
  w.vfx.sphere({ x, y: 0.7, z }, { color: 0x5ac8ff, r0: 0.3, r1: 1.6, life: 0.35 });
  w.vfx.ring({ x, z }, { color: 0xbfefff, r0: 0.3, r1: 2.2, life: 0.4 });
  w.vfx.burst({ x, y: 0.7, z }, { count: 26, color: 0x5ac8ff, color2: 0xffffff, speed: 6, life: 0.5 });
  w.vfx.shake(0.25);
  for (const u of w.unitsInRadius(x, z, 1.9, src.team)) w.damage(src, u, dmg * src.dmgMult(), { kind: ctx.kind, gain: 0, effects: { knock: 2 }, dir: { x: u.x - x, z: u.z - z } });
  w.sfx('wind', src);
}

function inRoom(w, src) {
  const room = src.mem.room;
  if (!room || room.t <= 0) return null;
  if (Math.hypot(src.x - room.x, src.z - room.z) > room.r) return null;
  return room;
}

export const SPECIALS = {
  // ── Gojo ─────────────────────────────────────────────────────────────────
  gojoBlueRed: {
    run(w, src, a, ctx) {
      src.mem.blueRed = !src.mem.blueRed;
      if (src.mem.blueRed) {
        KINDS.proj(w, src, { shape: 'void', color: 0x3a7bff, size: 0.38, speed: 10, range: 7, dmg: a.dmg * 0.85, w: 0.4, pierce: true, homing: 1.2, effects: { pull: 1.0 },
          onEnd: { kind: 'aoe', r: 1.6, landDelay: 0, dmg: 0, fx: 'ring', color: 0x3a7bff, useTarget: true, linger: { t: 0.9, tick: 0.15, dmg: 40, pull: true, color: 0x3a7bff } } }, ctx);
      } else {
        KINDS.proj(w, src, { shape: 'void', color: 0xff2a3a, size: 0.36, speed: 15, range: 6.5, dmg: a.dmg * 1.15, w: 0.36, effects: { knock: 2.4 }, explode: { r: 1.3, dmg: a.dmg * 0.4, color: 0xff2a3a, raw: true } }, ctx);
      }
    },
  },
  gojoCombo: {
    run(w, src, a, ctx) {
      // Blue first, Red follows on the same line and detonates where Blue gathered enemies
      KINDS.proj(w, src, { shape: 'void', color: 0x3a7bff, size: 0.4, speed: 12, range: 7.5, dmg: a.dmg * 0.6, w: 0.45, pierce: true, effects: { pull: 1.2 },
        onEnd: { kind: 'aoe', r: 1.8, landDelay: 0, dmg: 0, fx: 'ring', color: 0x3a7bff, useTarget: true, linger: { t: 0.6, tick: 0.12, dmg: 50, pull: true, color: 0x3a7bff } } }, ctx);
      w.schedule(0.22, () => src.alive && KINDS.proj(w, src, { shape: 'void', color: 0xff2a3a, size: 0.42, speed: 15, range: 8, dmg: a.dmg * 0.9, w: 0.42, pierce: true, effects: { knock: 2 }, explode: { r: 1.8, dmg: a.dmg * 0.7, color: 0xff2a3a, raw: true, always: true } }, ctx));
    },
  },

  // ── Mahito ───────────────────────────────────────────────────────────────
  mahitoMorph: {
    run(w, src, a, ctx) {
      const near = w.nearestEnemy(src.team, src.x, src.z, 2.3, true);
      if (near) {
        src.playAnim('slash', 0.35);
        KINDS.cone(w, src, { range: 2.1, arc: 120, dmg: a.dmg * 1.15, color: 0x9ab0d8, effects: { slow: { t: 1, f: 0.3 } } }, ctx);
        w.announceSmall(src, 'Klingenarm', 0x9ab0d8, true);
      } else {
        src.playAnim('punch', 0.35);
        KINDS.proj(w, src, { shape: 'spike', color: 0x9ab0d8, color2: 0xe8e2ea, speed: 18, range: 8, dmg: a.dmg * 0.9, w: 0.3, pierce: true }, ctx);
      }
    },
  },

  // ── Todo ─────────────────────────────────────────────────────────────────
  boogieWoogie: {
    run(w, src, a, ctx) {
      const t = pickAlongAim(w, src, ctx.aim, a.range ?? 9, { allies: true, cone: 0.6 }) || w.nearestEnemy(src.team, src.x, src.z, a.range ?? 9, true);
      w.vfx.ring({ x: src.x, z: src.z }, { color: 0xffe0a0, r0: 0.2, r1: 2.5, life: 0.3 });
      if (!t) { for (const u of w.unitsInRadius(src.x, src.z, 3, src.team)) w.damage(src, u, 200, { kind: 'super', gain: 0, effects: { stun: 0.6 } }); return; }
      swapPositions(w, src, t);
      if (t.team !== src.team) w.damage(src, t, (a.dmg ?? 400) * src.dmgMult(), { kind: 'super', gain: 0, effects: { stun: 0.9 } });
      w.hitStop(0.06);
    },
  },
  boogieAlly: {
    run(w, src, a, ctx) {
      let best = null, bh = 2;
      for (const u of w.units) if (u.alive && u !== src && u.team === src.team && u.kind === 'fighter') { const h = u.hp / u.maxHp; if (h < bh) { bh = h; best = u; } }
      if (best) swapPositions(w, src, best);
    },
  },
  boogieChain: {
    run(w, src, a, ctx) {
      const foes = w.units.filter(u => u.alive && u.team !== src.team && u.kind !== 'structure' && Math.hypot(u.x - src.x, u.z - src.z) < (a.range ?? 9) && w.isVisibleTo(u, src.team)).sort((p, q) => Math.hypot(p.x - src.x, p.z - src.z) - Math.hypot(q.x - src.x, q.z - src.z));
      if (!foes.length) return;
      src.addStatus('invuln', 1.0);
      for (let i = 0; i < 4; i++) {
        w.schedule(i * 0.16, () => {
          if (!src.alive) return;
          const live = foes.filter(f => f.alive);
          if (!live.length) return;
          const t = live[i % live.length];
          // alternate: swap self ↔ enemy, then enemy ↔ another enemy
          if (i % 2 === 0 || live.length < 2) swapPositions(w, src, t);
          else swapPositions(w, live[(i + 1) % live.length], t);
          w.damage(src, t, (a.dmg ?? 650) * src.dmgMult(), { kind: 'super', gain: 0, effects: { stun: 0.5 } });
          w.sfx('clap', src, 0.7);
        });
      }
    },
  },
  todoSwapHit: {
    onMeleeHit(w, src, u, i, hits) { if (i === hits - 1 && u.kind === 'fighter' && !u.boss) swapPositions(w, src, u); },
  },

  // ── Goku UI ──────────────────────────────────────────────────────────────
  uiAssault: {
    run(w, src, a, ctx) {
      const foes = w.units.filter(u => u.alive && u.team !== src.team && u.kind !== 'structure' && Math.hypot(u.x - src.x, u.z - src.z) < (a.range ?? 9)).slice(0, 5);
      src.addStatus('invuln', 0.3 + foes.length * 0.2);
      src.addStatus('channel', 0.2 + foes.length * 0.2);
      foes.forEach((t, i) => w.schedule(0.05 + i * 0.2, () => {
        if (!src.alive || !t.alive) return;
        const d = Math.hypot(t.x - src.x, t.z - src.z) || 1;
        w.afterimage(src);
        src.teleport(t.x - ((t.x - src.x) / d) * 0.9, t.z - ((t.z - src.z) / d) * 0.9);
        src.setFace({ x: (t.x - src.x) / d, z: (t.z - src.z) / d });
        src.playAnim('punch', 0.18);
        w.vfx.slash({ x: t.x, y: 0.7, z: t.z }, Math.random() * TAU, { color: 0xd8e4ff, r: 1.2, life: 0.18 });
        w.vfx.burst({ x: t.x, y: 0.7, z: t.z }, { count: 16, color: 0xd8e4ff, speed: 6, life: 0.35 });
        w.damage(src, t, (a.dmg ?? 1000) * src.dmgMult(), { kind: 'super', gain: 0, effects: { stun: 0.35, knock: 0.8 }, dir: { x: t.x - src.x, z: t.z - src.z } });
        w.sfx('punch', src);
      }));
      w.schedule(0.15 + foes.length * 0.2, () => src.alive && KINDS.beam(w, src, { range: 9, w: 0.55, dmg: 260, ticks: 5, gap: 0.08, charge: 0.1, color: 0xd8e4ff, color2: 0xffffff, effects: { knock: 2 }, root: true }, { ...ctx, aim: src.liveAim }));
    },
  },

  // ── Piccolo ──────────────────────────────────────────────────────────────
  hellzone: {
    run(w, src, a, ctx) {
      const d = Math.min(a.range ?? 7, ctx.dist ?? 5);
      const cx = src.x + ctx.aim.x * d, cz = src.z + ctx.aim.z * d, r = a.r ?? 2.4;
      const orbs = [];
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * TAU;
        const m = projectileMesh('orb', a.color ?? 0xffe84a, 0.3);
        m.position.set(src.x, 0.8, src.z); w.scene.add(m);
        const tx = cx + Math.cos(ang) * r, tz = cz + Math.sin(ang) * r;
        orbs.push({ m, tx, tz, ang });
        const sx = src.x, sz = src.z;
        w.tween(0.45, (k) => m.position.set(sx + (tx - sx) * k, 0.8 + Math.sin(k * Math.PI) * 0.8, sz + (tz - sz) * k));
      }
      w.vfx.telegraph({ x: cx, z: cz }, r, { color: src.team === w.playerTeam ? 0x3fb6ff : 0xff3b4c, life: 0.9 });
      w.schedule(0.9, () => {
        for (const o of orbs) {
          w.scene.remove(o.m);
          if (!src.alive) continue;
          const dx = cx - o.tx, dz = cz - o.tz, L = Math.hypot(dx, dz);
          const p = new Projectile(w, src, { shape: 'orb', color: a.color ?? 0xffe84a, speed: 12, range: L + 0.6, w: 0.35, pierce: true, explode: { r: 0.8, dmg: (a.dmg ?? 500) * 0.3 } }, { kind: 'super' }, o.tx, o.tz, dx / L, dz / L, (a.dmg ?? 500) * src.dmgMult(), 0);
          w.projectiles.push(p);
        }
        w.sfx('kiBig', src);
      });
    },
  },

  // ── Minato ───────────────────────────────────────────────────────────────
  minatoKunai: {
    run(w, src, a, ctx) {
      const n = a.count ?? 1;
      KINDS.proj(w, src, { shape: 'kunai', color: 0xffe06a, count: n, spread: n > 1 ? 24 : 0, speed: 20, range: a.range ?? 7.5, dmg: a.dmg ?? 600, w: 0.25, special: 'minatoMark', trailColor: 0xffe06a }, ctx);
    },
  },
  minatoMark: {
    onProjEnd(w, src, p) { if (src.alive) addMarker(w, src, p.x, p.z); },
  },
  minatoFTG: {
    run(w, src, a, ctx) {
      const m = popMarker(w, src, true);
      let x, z;
      if (m) { x = m.x; z = m.z; } else { const p = w.findWalkable(src.x + ctx.aim.x * 4, src.z + ctx.aim.z * 4, src.x, src.z); x = p.x; z = p.z; }
      w.afterimage(src);
      w.vfx.burst({ x: src.x, y: 0.7, z: src.z }, { count: 14, color: 0xffe06a, speed: 4, life: 0.3 });
      src.teleport(x, z);
      rasengan(w, src, x, z, a.dmg ?? 1500, ctx);
    },
  },
  minatoRecall: {
    run(w, src, a, ctx) {
      const m = popMarker(w, src, false);
      w.afterimage(src);
      if (m) src.teleport(m.x, m.z);
      else { const p = w.findWalkable(src.x - ctx.aim.x * 3, src.z - ctx.aim.z * 3, src.x, src.z); src.teleport(p.x, p.z); }
      src.addStatus('invuln', 0.4);
      w.vfx.burst({ x: src.x, y: 0.7, z: src.z }, { count: 14, color: 0xffe06a, speed: 4, life: 0.3 });
    },
  },
  minatoChain: {
    run(w, src, a, ctx) {
      const list = [...(src.mem.markers || [])];
      src.mem.markers = [];
      if (!list.length) { SPECIALS.minatoFTG.run(w, src, a, ctx); return; }
      src.addStatus('invuln', list.length * 0.18 + 0.2);
      list.forEach((m, i) => w.schedule(i * 0.18, () => {
        w.scene.remove(m.mesh);
        if (!src.alive) return;
        w.afterimage(src); src.teleport(m.x, m.z);
        rasengan(w, src, m.x, m.z, a.dmg ?? 1100, ctx);
      }));
    },
  },

  // ── Sasuke Rinnegan ──────────────────────────────────────────────────────
  amenotejikara: {
    run(w, src, a, ctx) {
      const t = pickAlongAim(w, src, ctx.aim, a.range ?? 6, { cone: 0.45 });
      if (t && t.kind === 'fighter' && !t.boss) {
        swapPositions(w, src, t, 0xb89aff);
        const d = Math.hypot(t.x - src.x, t.z - src.z) || 1;
        src.setFace({ x: (t.x - src.x) / d, z: (t.z - src.z) / d });
        KINDS.cone(w, src, { range: 2.2, arc: 110, dmg: a.dmg ?? 720, color: 0xb89aff, effects: { stun: 0.3 } }, { ...ctx, aim: { x: (t.x - src.x) / d, z: (t.z - src.z) / d } });
      } else {
        KINDS.cone(w, src, { range: 2.3, arc: 100, dmg: (a.dmg ?? 720) * 1.1, color: 0x8ad8ff, effects: { slow: { t: 0.8, f: 0.3 } } }, ctx);
      }
    },
  },

  // ── Luffy Gear 5 ─────────────────────────────────────────────────────────
  gear5Grab: {
    run(w, src, a, ctx) {
      KINDS.proj(w, src, { shape: 'fist', color: 0xfff4ea, color2: 0xffe8a0, size: 0.5, speed: 24, range: a.range ?? 7, dmg: (a.dmg ?? 800) * 0.4, w: 0.5, special: 'gear5', trail: false }, ctx);
    },
  },
  gear5: {
    onProjHit(w, src, u, p) {
      if (u.kind === 'structure' || u.boss) return;
      const fx = src.x + p.dx * 1.1, fz = src.z + p.dz * 1.1;
      const q = w.findWalkable(fx, fz, src.x, src.z);
      u.teleport ? u.teleport(q.x, q.z) : (u.x = q.x, u.z = q.z);
      u.addStatus('stun', 0.45);
      w.vfx.burst({ x: q.x, y: 0.8, z: q.z }, { count: 10, color: 0xffffff, speed: 3, life: 0.3 });
      w.schedule(0.25, () => {
        if (!src.alive) return;
        src.playAnim('overhead', 0.4);
        // cartoon slam: big white ring + star burst + bounce
        w.vfx.ring({ x: q.x, z: q.z }, { color: 0xffffff, r0: 0.4, r1: 2.6, life: 0.5 });
        w.vfx.burst({ x: q.x, y: 0.3, z: q.z }, { count: 30, color: 0xffffff, color2: 0xffe8a0, speed: 7, up: 1.5, life: 0.6, size: 0.5 });
        w.vfx.shake(0.35);
        for (const t of w.unitsInRadius(q.x, q.z, 1.6, src.team)) w.damage(src, t, (p.act.dmgSlam ?? 820) * src.dmgMult(), { kind: 'main', gain: 0.12, effects: { stun: 0.5, knock: 1.4 }, dir: { x: p.dx, z: p.dz } });
        w.sfx('rubber', src);
        w.popText(q.x, q.z, 'BOING!', '#ffffff', 1.4);
      });
    },
  },

  // ── Trafalgar Law ────────────────────────────────────────────────────────
  lawRoom: {
    run(w, src, a, ctx) {
      let r = a.r ?? 5; for (const p of src.hooks) if (p.type === 'roomBoost') r += p.add;
      const zone = w.addZone({ x: src.x, z: src.z, r, team: src.team, src, t: a.t ?? 7, tick: 0.5, dmg: 0, effects: { slow: { t: 0.6, f: 0.2 } }, room: true });
      src.mem.room = zone;
      w.vfx.domain({ x: src.x, z: src.z }, r, { color: 0x6ac8ff, color2: 0xbfefff, life: a.t ?? 7, particle: 0xbfefff });
      w.announce('ROOM', '', 0x6ac8ff, src, true);
    },
  },
  lawCut: {
    run(w, src, a, ctx) {
      const room = inRoom(w, src);
      if (room) {
        // distance from src to room edge along aim
        const ox = src.x - room.x, oz = src.z - room.z;
        const b = ox * ctx.aim.x + oz * ctx.aim.z, c = ox * ox + oz * oz - room.r * room.r;
        const t = -b + Math.sqrt(Math.max(0, b * b - c));
        KINDS.beam(w, src, { range: Math.max(2, t), w: 0.32, dmg: (a.dmg ?? 760) * 1.15, ticks: 1, color: 0x6ac8ff, color2: 0xffffff, pierceWalls: true, effects: { slow: { t: 1, f: 0.3 } } }, ctx);
        w.popText(src.x, src.z, 'AMPUTATE', '#6ac8ff', 0.9);
      } else {
        KINDS.cone(w, src, { range: 2.6, arc: 100, dmg: a.dmg ?? 760, color: 0xdfe6f0 }, ctx);
      }
    },
  },
  shambles: {
    run(w, src, a, ctx) {
      const room = inRoom(w, src);
      const r = room ? room.r * 1.6 : 4;
      const t = pickAlongAim(w, src, ctx.aim, r, { cone: 0.9 }) || w.nearestEnemy(src.team, src.x, src.z, r, true);
      if (!t || t.kind === 'structure' || t.boss) return;
      swapPositions(w, src, t, 0x6ac8ff);
      t.addStatus('stun', room ? 0.8 : 0.5);
      w.popText(src.x, src.z, 'SHAMBLES', '#6ac8ff', 1);
    },
  },

  // ── misc projectile specials ─────────────────────────────────────────────
  hookPull: {
    onProjHit(w, src, u, p) {
      if (u.kind === 'structure') return;
      const d = Math.hypot(u.x - src.x, u.z - src.z);
      if (u.knock) u.knock(src.x - u.x, src.z - u.z, Math.max(0, d - 1.1));
    },
  },
  hookSelf: {
    onProjHit(w, src, u, p) {
      const d = Math.hypot(u.x - src.x, u.z - src.z);
      if (d > 1.2 && src.startDash) src.startDash({ dx: (u.x - src.x) / d, dz: (u.z - src.z) / d, dist: d - 1.0, speed: 22, w: 0.6, dmg: 0, color: 0xffffff, trail: true, kind: 'gadget' });
    },
  },
  healAlliesOnPath: {
    onProjTick(w, src, p) {
      p.healed = p.healed || new Set();
      for (const u of w.units) if (u.alive && u.team === src.team && u !== src && u.kind === 'fighter' && !p.healed.has(u) && Math.hypot(u.x - p.x, u.z - p.z) < 0.9) { p.healed.add(u); w.heal(u, 600 * src.hpMult(), src); }
    },
  },
};

// Game modes. Each mode places objectives, runs its rules, gives bots goals,
// exposes a HUD summary and decides the winner.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toon, glow, glowUnique, outlineMaterial, fresnelMaterial } from '../../render/toon.js';
import { buildCharacter } from '../../render/model.js';
import { sfx } from '../../core/audio.js';
import { P, C, D, A, N, SUM, BM, fx, knock, stun, burn, slow } from '../../data/roster/helpers.js';
import { execute } from '../actions.js';

const TEAM_COL = (w, team) => (team === w.playerTeam ? 0x3fb6ff : 0xff3b4c);

class Mode {
  constructor(w, o) { this.w = w; this.o = o; this.cfg = o.mode; this.timeLeft = o.mode.time; this.objects = []; }
  teamSpawns(team) {
    const m = this.w.markers;
    return team === 0 ? (m['1'] || [{ x: 0, z: 8 }]) : (m['2'] || [{ x: 0, z: -8 }]);
  }
  spawnAll(lineups) {
    const idx = {};
    for (const l of lineups) {
      const list = this.teamSpawns(l.team);
      const i = (idx[l.team] = (idx[l.team] ?? -1) + 1);
      const p = list[i % list.length];
      const f = this.w.spawnFighter(l, p.x + (i >= list.length ? 0.5 : 0), p.z);
      f.spawnIdx = i;
    }
  }
  spawnPoint(f, retreat) { const list = this.teamSpawns(f.team); return list[(f.spawnIdx ?? 0) % list.length]; }
  respawnTime() { return this.cfg.respawn; }
  setup() {}
  update(dt) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0 && !this.w.over) this.onTimeUp();
  }
  onTimeUp() { this.w.finish({ winners: [], draw: true, reason: 'Zeit abgelaufen' }); }
  hud() { return {}; }
  teamAlive(team) { return this.w.fighters.filter(f => f.team === team && f.alive); }
  addMesh(m, x, z, y = 0) { m.position.set(x, y, z); this.w.scene.add(m); return m; }
  spawnPad(x, z, team) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 32), glowUnique(TEAM_COL(this.w, team), 0.45));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.03, z); this.w.scene.add(m);
  }
}

// ---------------------------------------------------------------------------
class CrystalMode extends Mode {
  setup() {
    const g = this.w.markers.G?.[0] ?? { x: 0, z: 0 };
    this.mine = g; this.gems = []; this.spawnT = 4; this.count = null;
    const base = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.25, 24), toon(0x3a3448));
    ring.position.y = 0.12; base.add(ring);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 24), glowUnique(0xb45cff, 0.6)); core.position.y = 0.27; base.add(core);
    this.mineCore = core;
    this.addMesh(base, g.x, g.z);
    for (const t of [0, 1]) for (const p of this.teamSpawns(t)) this.spawnPad(p.x, p.z, t);
  }
  gemMesh() {
    const m = new THREE.Group();
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), toon(0xc87cff, { emissive: 0x7a2ad8, emissiveIntensity: 0.6, rim: 1 }));
    c.scale.y = 1.4; m.add(c);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), glowUnique(0xb45cff, 0.25)); m.add(h);
    return m;
  }
  dropGem(x, z, vx = 0, vz = 0) {
    const mesh = this.addMesh(this.gemMesh(), x, z, 0.45);
    const gem = { x, z, vx, vz, mesh, t: 0, lock: 0.5 };
    this.gems.push(gem);
  }
  update(dt) {
    super.update(dt);
    const w = this.w;
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.gems.length < 24) {
      this.spawnT = 7;
      const a = Math.random() * Math.PI * 2;
      this.dropGem(this.mine.x, this.mine.z, Math.cos(a) * 2.5, Math.sin(a) * 2.5);
      w.vfx.burst({ x: this.mine.x, y: 0.5, z: this.mine.z }, { count: 14, color: 0xb45cff, speed: 3, up: 1.2, life: 0.6 });
    }
    this.mineCore.material.opacity = 0.4 + 0.3 * Math.sin(w.time * 3);
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i]; g.t += dt; g.lock -= dt;
      if (g.vx || g.vz) { const p = w.grid.resolve(g.x + g.vx * dt, g.z + g.vz * dt, 0.2); g.x = p.x; g.z = p.z; g.vx *= 1 - dt * 4; g.vz *= 1 - dt * 4; if (Math.abs(g.vx) + Math.abs(g.vz) < 0.05) g.vx = g.vz = 0; }
      g.mesh.position.set(g.x, 0.45 + Math.sin(g.t * 3) * 0.08, g.z); g.mesh.rotation.y += dt * 2;
      if (g.lock > 0) continue;
      for (const f of w.fighters) if (f.alive && Math.hypot(f.x - g.x, f.z - g.z) < 0.7) {
        f.gems++; w.scene.remove(g.mesh); this.gems.splice(i, 1);
        if (f.isPlayer || f.team === w.playerTeam) sfx('gem');
        break;
      }
    }
    const t0 = this.teamGems(0), t1 = this.teamGems(1);
    const leader = t0 >= 10 && t0 > t1 ? 0 : t1 >= 10 && t1 > t0 ? 1 : -1;
    if (leader >= 0) {
      if (!this.count || this.count.team !== leader) { this.count = { team: leader, t: 15 }; w.hud?.announce(leader === w.playerTeam ? 'COUNTDOWN!' : 'GEGNER IM COUNTDOWN', 'Haltet die Kristalle 15 Sekunden', leader === w.playerTeam ? '#3fb6ff' : '#ff3b4c', true); }
      this.count.t -= dt;
      if (this.count.t <= 0) w.finish({ winners: [leader], reason: 'Kristalle gesichert' });
    } else this.count = null;
  }
  teamGems(team) { return this.w.fighters.filter(f => f.team === team).reduce((s, f) => s + f.gems, 0); }
  onKill(v) {
    const n = v.gems; v.gems = 0;
    for (let i = 0; i < n; i++) { const a = (i / Math.max(1, n)) * Math.PI * 2; this.dropGem(v.x, v.z, Math.cos(a) * 3, Math.sin(a) * 3); }
  }
  onTimeUp() {
    const a = this.teamGems(0), b = this.teamGems(1);
    if (a === b) this.w.finish({ winners: [], draw: true, reason: 'Gleichstand' });
    else this.w.finish({ winners: [a > b ? 0 : 1], reason: 'Mehr Kristalle' });
  }
  botGoal(f) {
    const mine = this.teamGems(f.team), theirs = this.teamGems(1 - f.team);
    if (f.gems >= 4 && mine >= 7) return { ...this.spawnPoint(f), urgent: true };
    let best = null, bd = 1e9;
    for (const g of this.gems) { const d = Math.hypot(g.x - f.x, g.z - f.z); if (d < bd) { bd = d; best = g; } }
    if (best && bd < 9) return { x: best.x, z: best.z, urgent: bd < 3 };
    const carrier = this.w.fighters.filter(e => e.team !== f.team && e.alive && e.gems > 0).sort((a, b) => b.gems - a.gems)[0];
    if (carrier && theirs >= 5) return { x: carrier.x, z: carrier.z };
    return { x: this.mine.x + (f.spawnIdx - 1) * 2, z: this.mine.z + (f.team === 0 ? 2.5 : -2.5) };
  }
  hud() {
    const w = this.w;
    return { left: { v: this.teamGems(w.playerTeam), icon: '💎', color: '#3fb6ff' }, right: { v: this.teamGems(1 - w.playerTeam), icon: '💎', color: '#ff3b4c' }, center: this.count ? `${Math.ceil(this.count.t)}` : null, centerColor: this.count?.team === w.playerTeam ? '#3fb6ff' : '#ff3b4c' };
  }
}

// ---------------------------------------------------------------------------
class BallMode extends Mode {
  setup() {
    const w = this.w;
    this.home = w.markers.O?.[0] ?? { x: 0, z: 0 };
    this.score = [0, 0];
    this.pause = 0;
    const tex = (() => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const c = cv.getContext('2d'); c.fillStyle = '#f4f6ff'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#5a7adf'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc((i * 37) % 128, (i * 23) % 64, 8, 0, Math.PI * 2); c.fill(); } const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const ball = new THREE.Group();
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), toon(0xffffff, { map: tex, rim: 0.8, rimColor: 0x8ad8ff }));
    s.castShadow = true; ball.add(s);
    const o = new THREE.Mesh(s.geometry, outlineMaterial(0.02)); s.add(o);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 10), glowUnique(0x8ad8ff, 0.2)); ball.add(halo);
    this.ballMesh = this.addMesh(ball, this.home.x, this.home.z, 0.32);
    this.ball = { x: this.home.x, z: this.home.z, vx: 0, vz: 0, carrier: null, lock: 0, owner: null };
    // goals: 'g' top (team 0 scores), 'h' bottom (team 1 scores)
    this.goals = { 0: w.markers.g || [], 1: w.markers.h || [] };
    for (const [team, tiles] of Object.entries(this.goals)) {
      if (!tiles.length) continue;
      const xs = tiles.map(t => t.x); const cz = tiles[0].z;
      const minx = Math.min(...xs) - 0.5, maxx = Math.max(...xs) + 0.5;
      const col = +team === w.playerTeam ? 0xff3b4c : 0x3fb6ff; // goal you attack is enemy-coloured
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(maxx - minx, 1), glowUnique(col, 0.35)); floor.rotation.x = -Math.PI / 2;
      this.addMesh(floor, (minx + maxx) / 2, cz, 0.04);
      for (const x of [minx, maxx]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 10), toon(0xf2f2f4)); post.castShadow = true; this.addMesh(post, x, cz, 0.7); }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, maxx - minx, 10), toon(0xf2f2f4)); bar.rotation.z = Math.PI / 2; this.addMesh(bar, (minx + maxx) / 2, cz, 1.4);
    }
    for (const t of [0, 1]) for (const p of this.teamSpawns(t)) this.spawnPad(p.x, p.z, t);
  }
  intercept(f, kind, aim, dist) {
    if (this.ball.carrier !== f) return false;
    const strong = kind === 'super' && f.superCharge >= 1;
    this.kick(f, aim, strong ? 22 : 15);
    if (strong) { f.superCharge = 0; this.w.vfx.ring({ x: f.x, z: f.z }, { color: 0x8ad8ff, r0: 0.3, r1: 1.6 }); }
    f.playAnim('kick', 0.3); sfx('kick');
    return true;
  }
  kick(f, aim, power) {
    const b = this.ball; b.carrier = null; f.carry = null; b.lock = 0.35; b.owner = f;
    b.x = f.x + aim.x * 0.6; b.z = f.z + aim.z * 0.6; b.vx = aim.x * power; b.vz = aim.z * power;
  }
  update(dt) {
    super.update(dt);
    const w = this.w, b = this.ball;
    if (this.pause > 0) { this.pause -= dt; if (this.pause <= 0) this.resetRound(); return; }
    b.lock -= dt;
    if (b.carrier) {
      if (!b.carrier.alive) { b.carrier.carry = null; b.carrier = null; b.lock = 0.2; }
      else { b.x = b.carrier.x + Math.cos(b.carrier.face) * 0.5; b.z = b.carrier.z + Math.sin(b.carrier.face) * 0.5; }
    } else {
      const nx = b.x + b.vx * dt, nz = b.z + b.vz * dt;
      if (w.grid.blocksShot(nx, b.z) || w.grid.blocksMove(nx, b.z) && w.grid.at(nx, b.z) !== 'W') b.vx *= -0.6; else b.x = nx;
      if (w.grid.blocksShot(b.x, nz) || w.grid.blocksMove(b.x, nz) && w.grid.at(b.x, nz) !== 'W') b.vz *= -0.6; else b.z = nz;
      const hw = w.grid.w / 2 - 0.3, hh = w.grid.h / 2 - 0.3;
      if (Math.abs(b.x) > hw) { b.x = Math.sign(b.x) * hw; b.vx *= -0.6; }
      if (Math.abs(b.z) > hh + 0.6) { b.z = Math.sign(b.z) * (hh + 0.6); b.vz *= -0.6; }
      b.vx *= 1 - dt * 1.2; b.vz *= 1 - dt * 1.2;
      if (b.lock <= 0) for (const f of w.fighters) if (f.alive && f.cinematic < 0 && Math.hypot(f.x - b.x, f.z - b.z) < 0.65 && !f.isStunned()) { b.carrier = f; f.carry = 'ball'; b.vx = b.vz = 0; sfx('tap'); break; }
    }
    this.ballMesh.position.set(b.x, 0.32 + (b.carrier ? 0.1 : Math.abs(Math.sin(w.time * 6)) * Math.min(0.3, Math.hypot(b.vx, b.vz) * 0.03)), b.z);
    this.ballMesh.rotation.x += (b.vz) * dt * 3; this.ballMesh.rotation.z -= (b.vx) * dt * 3;
    // goal check
    for (const team of [0, 1]) {
      const tiles = this.goals[team]; if (!tiles.length) continue;
      const tx = w.grid.tx(b.x), ty = w.grid.ty(b.z);
      if (tiles.some(t => t.tx === tx && t.ty === ty) || (team === 0 && b.z < tiles[0].z + 0.3 && Math.abs(b.x - tiles[0].x - (tiles.length - 1) / 2) < tiles.length / 2 && b.z < -w.grid.h / 2 + 1.2) || (team === 1 && b.z > tiles[0].z - 0.3 && Math.abs(b.x - tiles[0].x - (tiles.length - 1) / 2) < tiles.length / 2 && b.z > w.grid.h / 2 - 1.2)) {
        this.goal(team); return;
      }
    }
  }
  goal(team) {
    const w = this.w;
    this.score[team]++;
    w.vfx.explosion({ x: this.ball.x, y: 0.5, z: this.ball.z }, 2.5, team === w.playerTeam ? 0x3fb6ff : 0xff3b4c, 0xffffff);
    sfx('goal');
    w.hud?.announce('TOR!', `${this.score[w.playerTeam]} : ${this.score[1 - w.playerTeam]}`, team === w.playerTeam ? '#3fb6ff' : '#ff3b4c');
    if (this.ball.carrier) this.ball.carrier.carry = null;
    this.ball.carrier = null; this.ball.vx = this.ball.vz = 0;
    if (this.score[team] >= 2) { w.finish({ winners: [team], reason: '2 Tore' }); return; }
    this.pause = 2.2;
  }
  resetRound() {
    const w = this.w;
    for (const f of w.fighters) { const p = this.spawnPoint(f); if (f.alive) { f.teleport(p.x, p.z); f.hp = f.maxHp; } else { f.respawn(p.x, p.z); f.respawnT = -1; } }
    Object.assign(this.ball, { x: this.home.x, z: this.home.z, vx: 0, vz: 0, carrier: null, lock: 0.5 });
    w.countdown = 1.6; w.lastCount = 3;
  }
  onTimeUp() {
    const [a, b] = this.score;
    if (a === b) this.w.finish({ winners: [], draw: true, reason: 'Unentschieden' }); else this.w.finish({ winners: [a > b ? 0 : 1], reason: 'Mehr Tore' });
  }
  goalCenter(team) { const t = this.goals[team]; if (!t.length) return { x: 0, z: team === 0 ? -14 : 14 }; return { x: t.reduce((s, q) => s + q.x, 0) / t.length, z: t[0].z }; }
  botGoal(f) {
    const b = this.ball;
    if (b.carrier === f) {
      const g = this.goalCenter(f.team);
      const d = Math.hypot(g.x - f.x, g.z - f.z);
      if (d < 6.5 && this.w.grid.los(f.x, f.z, g.x, g.z)) { const aim = { x: (g.x - f.x) / d, z: (g.z - f.z) / d }; this.kick(f, aim, d < 4 ? 15 : 22); }
      return { x: g.x, z: g.z, urgent: true };
    }
    if (!b.carrier) {
      const mates = this.w.fighters.filter(m => m.team === f.team && m.alive).sort((p, q) => Math.hypot(p.x - b.x, p.z - b.z) - Math.hypot(q.x - b.x, q.z - b.z));
      if (mates[0] === f || mates[1] === f) return { x: b.x, z: b.z, urgent: mates[0] === f };
    }
    if (b.carrier && b.carrier.team !== f.team) return { x: b.carrier.x, z: b.carrier.z, urgent: true };
    const g = this.goalCenter(f.team);
    return { x: (b.x + g.x) / 2 + (f.spawnIdx - 1) * 2, z: (b.z + g.z) / 2 };
  }
  hud() { const w = this.w; return { left: { v: this.score[w.playerTeam], icon: '⚽', color: '#3fb6ff' }, right: { v: this.score[1 - w.playerTeam], icon: '⚽', color: '#ff3b4c' } }; }
}

// ---------------------------------------------------------------------------
class ShowdownMode extends Mode {
  constructor(w, o) { super(w, o); this.duo = o.mode.id === 'duo'; this.camDist = 1.05; }
  teamSpawns(team) { return this.w.markers.P || [{ x: 0, z: 0 }]; }
  spawnAll(lineups) {
    const sp = [...(this.w.markers.P || [])];
    const byTeam = {};
    lineups.forEach(l => { (byTeam[l.team] ||= []).push(l); });
    let i = 0;
    for (const team of Object.keys(byTeam).sort((a, b) => a - b)) {
      const base = sp[i % sp.length];
      byTeam[team].forEach((l, k) => { const f = this.w.spawnFighter(l, base.x + k * 0.9, base.z); f.spawnIdx = i; f.sdSpawn = { x: base.x, z: base.z }; });
      i += this.duo ? 2 : 1;
    }
  }
  spawnPoint(f) { const mate = this.w.fighters.find(m => m !== f && m.team === f.team && m.alive); return mate ? { x: mate.x, z: mate.z } : f.sdSpawn; }
  respawnTime(f) { return this.duo && this.w.fighters.some(m => m !== f && m.team === f.team && m.alive) ? 8 : 0; }
  setup() {
    const w = this.w;
    this.cubes = [];
    this.half = { x: w.grid.w / 2, z: w.grid.h / 2 };
    this.safe = { ...this.half };
    this.poisonT = 0;
    this.eliminated = [];
    const mat = new THREE.MeshBasicMaterial({ color: 0x3aff6a, transparent: true, opacity: 0.28, depthWrite: false });
    this.walls = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 3.2, 1), mat); m.position.y = 1.6; w.scene.add(m); return m; });
    this.updatePoisonMeshes();
  }
  updatePoisonMeshes() {
    const W = this.half.x * 2 + 16, H = this.half.z * 2 + 16, sx = this.safe.x, sz = this.safe.z;
    const [l, r, t, b] = this.walls;
    const sideW = (W / 2 - sx);
    l.scale.set(sideW, 1, H); l.position.x = -sx - sideW / 2; l.position.z = 0;
    r.scale.set(sideW, 1, H); r.position.x = sx + sideW / 2; r.position.z = 0;
    const capH = (H / 2 - sz);
    t.scale.set(sx * 2, 1, capH); t.position.z = -sz - capH / 2; t.position.x = 0;
    b.scale.set(sx * 2, 1, capH); b.position.z = sz + capH / 2; b.position.x = 0;
  }
  dropCube(x, z) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.4, 0.4, 2, 0.06), toon(0x5aff7a, { emissive: 0x2a8a3a, emissiveIntensity: 0.6, rim: 1 }));
    this.addMesh(m, x, z, 0.4);
    this.cubes.push({ x, z, m, t: 0 });
  }
  update(dt) {
    super.update(dt);
    const w = this.w;
    this.poisonT += dt;
    if (this.poisonT > 25) {
      const shrink = dt * 0.18;
      this.safe.x = Math.max(3, this.safe.x - shrink); this.safe.z = Math.max(3, this.safe.z - shrink);
      this.updatePoisonMeshes();
      for (const m of this.walls) m.material.opacity = 0.24 + Math.sin(w.time * 2) * 0.05;
      this.tick = (this.tick ?? 0) + dt;
      if (this.tick > 0.5) {
        this.tick = 0;
        const dps = 700 + this.poisonT * 6;
        for (const f of w.fighters) if (f.alive && (Math.abs(f.x) > this.safe.x || Math.abs(f.z) > this.safe.z)) { w.damage(null, f, dps * 0.5, { kind: 'poison', gain: 0, dot: true, sure: true }); w.vfx.burst({ x: f.x, y: 0.8, z: f.z }, { count: 6, color: 0x3aff6a, speed: 1.5, up: 1, life: 0.5 }); }
      }
    }
    for (let i = this.cubes.length - 1; i >= 0; i--) {
      const c = this.cubes[i]; c.t += dt; c.m.rotation.y += dt * 2; c.m.position.y = 0.4 + Math.sin(c.t * 3) * 0.08;
      for (const f of w.fighters) if (f.alive && Math.hypot(f.x - c.x, f.z - c.z) < 0.7) {
        f.cubes++; f.maxHp += 400 * f._lv; f.hp += 400 * f._lv; w.scene.remove(c.m); this.cubes.splice(i, 1);
        w.popText(f.x, f.z, `+1 KRAFT (${f.cubes})`, '#5aff7a', 1); if (f.isPlayer) sfx('gem');
        break;
      }
    }
    // teams alive
    const alive = new Set(w.fighters.filter(f => f.alive || f.respawnT > 0).map(f => f.team));
    const player = w.player;
    const playerTeamAlive = alive.has(w.playerTeam);
    if (!playerTeamAlive && !w.over) {
      const rank = alive.size + 1;
      w.finish({ winners: [], rank, reason: `Platz ${rank}` });
    } else if (alive.size === 1 && !w.over) {
      w.finish({ winners: [[...alive][0]], rank: 1, reason: 'Letzter Überlebender' });
    }
  }
  onKill(v, killer) {
    for (let i = 0; i < v.cubes + 1; i++) { const a = Math.random() * Math.PI * 2; this.dropCube(v.x + Math.cos(a) * 0.6, v.z + Math.sin(a) * 0.6); }
    v.cubes = 0;
  }
  onTimeUp() { /* poison keeps closing; no hard time limit */ this.timeLeft = 9999; }
  botGoal(f) {
    let best = null, bd = 1e9;
    for (const c of this.cubes) { const d = Math.hypot(c.x - f.x, c.z - f.z); if (d < bd) { bd = d; best = c; } }
    const outside = Math.abs(f.x) > this.safe.x - 1.5 || Math.abs(f.z) > this.safe.z - 1.5;
    if (outside) return { x: Math.sign(-f.x) * 0.5, z: Math.sign(-f.z) * 0.5, urgent: true };
    if (best && bd < 10) return { x: best.x, z: best.z };
    // nearest power-cube crate
    let cb = null, cd = 1e9;
    for (const k of this.w.cubeCrates) { const tx = k % this.w.grid.w, ty = Math.floor(k / this.w.grid.w); const x = this.w.grid.cx(tx), z = this.w.grid.cz(ty); const d = Math.hypot(x - f.x, z - f.z); if (d < cd) { cd = d; cb = { x, z, tx, ty }; } }
    if (cb && cd < 12) {
      // shoot the crate when close
      if (cd < 3 && f.ammo >= 1) { const d = cd || 1; f.attack({ x: (cb.x - f.x) / d, z: (cb.z - f.z) / d }, d); }
      return { x: cb.x, z: cb.z };
    }
    return { x: (Math.random() - 0.5) * this.safe.x, z: (Math.random() - 0.5) * this.safe.z };
  }
  spectate() { return this.w.fighters.find(f => f.alive && f.team === this.w.playerTeam); }
  hud() {
    const w = this.w;
    const left = new Set(w.fighters.filter(f => f.alive || f.respawnT > 0).map(f => f.team)).size;
    return { center: `${left} ${this.duo ? 'Teams' : 'Kämpfer'} übrig`, left: { v: w.player?.cubes ?? 0, icon: '🟩', color: '#5aff7a' } };
  }
}

// ---------------------------------------------------------------------------
class VaultMode extends Mode {
  setup() {
    const w = this.w;
    this.safes = {};
    for (const [ch, team] of [['S', 0], ['s', 1]]) {
      const p = w.markers[ch]?.[0]; if (!p) continue;
      const g = new THREE.Group();
      const body = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.5, 1.5, 3, 0.18), toon(0x5a5e6a, { rim: 0.6 }));
      body.position.y = 0.75; body.castShadow = true; g.add(body);
      body.add(new THREE.Mesh(body.geometry, outlineMaterial(0.025)));
      const door = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 24), toon(team === w.playerTeam ? 0x3fb6ff : 0xff3b4c));
      door.rotation.x = Math.PI / 2; door.position.set(0, 0.8, team === 0 ? -0.77 : 0.77); g.add(door);
      const dial = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 20), toon(0xd8b84a)); dial.position.copy(door.position); dial.position.z += team === 0 ? -0.05 : 0.05; g.add(dial);
      const s = w.addStructure({ team, x: p.x, z: p.z, r: 0.95, hp: 42000, name: 'Tresor', mesh: g });
      this.safes[team] = s;
    }
    for (const t of [0, 1]) for (const p of this.teamSpawns(t)) this.spawnPad(p.x, p.z, t);
  }
  protectTile(tx, ty) {
    for (const s of Object.values(this.safes)) if (Math.abs(this.w.grid.cx(tx) - s.x) < 0.6 && Math.abs(this.w.grid.cz(ty) - s.z) < 0.6) return true;
    return false;
  }
  onStructureDestroyed(s) {
    this.w.vfx.explosion({ x: s.x, y: 0.6, z: s.z }, 3.5, 0xffaa33, 0xffffff);
    s.mesh.visible = false;
    this.w.finish({ winners: [1 - s.team], reason: 'Tresor geknackt' });
  }
  onTimeUp() {
    const a = 1 - this.safes[1].hp / this.safes[1].maxHp, b = 1 - this.safes[0].hp / this.safes[0].maxHp;
    if (Math.abs(a - b) < 0.005) this.w.finish({ winners: [], draw: true, reason: 'Gleicher Schaden' });
    else this.w.finish({ winners: [a > b ? 0 : 1], reason: 'Mehr Tresorschaden' });
  }
  botGoal(f) {
    const enemy = this.safes[1 - f.team], mine = this.safes[f.team];
    const threat = this.w.fighters.filter(e => e.team !== f.team && e.alive && Math.hypot(e.x - mine.x, e.z - mine.z) < 6);
    if (threat.length && f.spawnIdx === 2) return { x: threat[0].x, z: threat[0].z, urgent: true };
    return { x: enemy.x, z: enemy.z + (f.team === 0 ? 1.4 : -1.4), struct: enemy };
  }
  hud() {
    const w = this.w; const me = this.safes[w.playerTeam], them = this.safes[1 - w.playerTeam];
    return { left: { v: Math.ceil(me.hp / me.maxHp * 100) + '%', icon: '🏦', color: '#3fb6ff' }, right: { v: Math.ceil(them.hp / them.maxHp * 100) + '%', icon: '🏦', color: '#ff3b4c' }, bars: [me.hp / me.maxHp, them.hp / them.maxHp] };
  }
}

// ---------------------------------------------------------------------------
class ZoneMode extends Mode {
  setup() {
    const w = this.w;
    this.zone = w.markers.Z?.[0] ?? { x: 0, z: 0 };
    this.r = 2.3; this.prog = [0, 0];
    this.disc = new THREE.Mesh(new THREE.CircleGeometry(this.r, 40), glowUnique(0xffffff, 0.18)); this.disc.rotation.x = -Math.PI / 2; this.addMesh(this.disc, this.zone.x, this.zone.z, 0.05);
    this.edge = new THREE.Mesh(new THREE.RingGeometry(this.r - 0.12, this.r, 48), glowUnique(0xffffff, 0.8)); this.edge.rotation.x = -Math.PI / 2; this.addMesh(this.edge, this.zone.x, this.zone.z, 0.06);
    for (const t of [0, 1]) for (const p of this.teamSpawns(t)) this.spawnPad(p.x, p.z, t);
  }
  update(dt) {
    super.update(dt);
    const w = this.w;
    const inside = [0, 1].map(t => w.fighters.filter(f => f.alive && f.team === t && Math.hypot(f.x - this.zone.x, f.z - this.zone.z) < this.r).length);
    let col = 0xffffff;
    if (inside[0] && !inside[1]) { this.prog[0] = Math.min(100, this.prog[0] + dt * 1.9 * (1 + (inside[0] - 1) * 0.15)); col = TEAM_COL(w, 0); }
    else if (inside[1] && !inside[0]) { this.prog[1] = Math.min(100, this.prog[1] + dt * 1.9 * (1 + (inside[1] - 1) * 0.15)); col = TEAM_COL(w, 1); }
    else if (inside[0] && inside[1]) col = 0xffd23f;
    this.disc.material.color.setHex(col); this.edge.material.color.setHex(col);
    this.edge.rotation.z += dt * 0.5;
    for (const t of [0, 1]) if (this.prog[t] >= 100) w.finish({ winners: [t], reason: 'Zone erobert' });
  }
  onTimeUp() { const [a, b] = this.prog; if (Math.abs(a - b) < 0.5) this.w.finish({ winners: [], draw: true, reason: 'Gleichstand' }); else this.w.finish({ winners: [a > b ? 0 : 1], reason: 'Mehr Zonenkontrolle' }); }
  botGoal(f) { const a = (f.spawnIdx ?? 0) * 2.1; return { x: this.zone.x + Math.cos(a) * 1.1, z: this.zone.z + Math.sin(a) * 1.1, urgent: Math.hypot(f.x - this.zone.x, f.z - this.zone.z) > this.r + 2 && Math.random() < 0.5 }; }
  hud() { const w = this.w; return { left: { v: Math.floor(this.prog[w.playerTeam]) + '%', icon: '◎', color: '#3fb6ff' }, right: { v: Math.floor(this.prog[1 - w.playerTeam]) + '%', icon: '◎', color: '#ff3b4c' }, bars: [this.prog[w.playerTeam] / 100, this.prog[1 - w.playerTeam] / 100] }; }
}

// ---------------------------------------------------------------------------
class KnockoutMode extends Mode {
  setup() { this.wins = [0, 0]; this.round = 1; this.pause = 0; for (const t of [0, 1]) for (const p of this.teamSpawns(t)) this.spawnPad(p.x, p.z, t); }
  respawnTime() { return 0; }
  update(dt) {
    super.update(dt);
    const w = this.w;
    if (this.pause > 0) { this.pause -= dt; if (this.pause <= 0) this.nextRound(); return; }
    const a = this.teamAlive(0).length, b = this.teamAlive(1).length;
    if (a === 0 || b === 0) this.roundOver(a > 0 ? 0 : b > 0 ? 1 : -1);
  }
  roundOver(team) {
    const w = this.w;
    if (team >= 0) this.wins[team]++;
    if (this.wins[0] >= 2 || this.wins[1] >= 2) { w.finish({ winners: [this.wins[0] >= 2 ? 0 : 1], reason: `${this.wins[w.playerTeam]} : ${this.wins[1 - w.playerTeam]} Runden` }); return; }
    w.hud?.announce(team === w.playerTeam ? 'RUNDE GEWONNEN' : team < 0 ? 'RUNDE UNENTSCHIEDEN' : 'RUNDE VERLOREN', `Runde ${this.round}`, team === w.playerTeam ? '#3fb6ff' : '#ff3b4c');
    this.pause = 2.5;
  }
  nextRound() {
    const w = this.w; this.round++; this.timeLeft = this.cfg.time;
    for (const f of w.fighters) { const p = this.spawnPoint(f); f.respawn(p.x, p.z); f.respawnT = -1; f.superCharge = Math.min(f.superCharge, 1); }
    for (const z of w.zones) z.t = 0;
    w.countdown = 2; w.lastCount = 3;
  }
  onTimeUp() {
    const hp = t => this.w.fighters.filter(f => f.team === t && f.alive).reduce((s, f) => s + f.hp / f.maxHp, 0);
    const a = hp(0), b = hp(1);
    this.roundOver(Math.abs(a - b) < 0.01 ? -1 : a > b ? 0 : 1);
    this.timeLeft = 9999;
  }
  botGoal(f) { return { x: (f.spawnIdx - 1) * 3, z: f.team === 0 ? 2 : -2 }; }
  hud() { const w = this.w; return { left: { v: this.wins[w.playerTeam], icon: '★', color: '#3fb6ff' }, right: { v: this.wins[1 - w.playerTeam], icon: '★', color: '#ff3b4c' }, center: `Runde ${this.round}` }; }
}

// ---------------------------------------------------------------------------
export const BOSS_DEF = {
  id: 'boss_oni', name: 'Oni-Kaiser Goryō', anime: 'boss', rarity: 'divine', boss: true, radius: 1.0,
  desc: 'Ein uralter Dämonenkaiser, entstanden aus tausend Flüchen. Original-Boss dieses Spiels.',
  stats: { hp: 90000, speed: 2.4, reload: 1.1, ammo: 3, superHits: 3 },
  look: { skin: 0x8a3a4a, build: 'titan', scale: 1.9, hair: { style: 'kaido', color: 0xf2e8d8 }, eyes: { type: 'glow', color: 0xffd04a }, mouth: 'fangs', marks: ['sukuna'], top: { type: 'armor', color: 0x2a1a24 }, bottom: { type: 'hakama', color: 0x1a1018 }, extras: ['hornsBig', 'shoulderPads', 'cape', 'extraArms'], armorColor: 0x6a2a3a, capeColor: 0x3a0a1a, hornColor: 0xf2e8d8, weapon: { type: 'club', color: 0x2a1a2a, scale: 1.2 }, glow: 0xff3a2a },
  main: C({ range: 3.2, arc: 140, dmg: 1400, color: 0xff3a2a, effects: knock(2), anim: 'overhead', sfx: 'heavySlash' }),
  super: N({ r: 5, dmg: 2200, color: 0xff3a2a, color2: 0xffd04a, breakWalls: true, effects: fx(knock(3), stun(0.6)), anim: 'stomp', sfx: 'quake' }),
  gadgets: [], starPowers: [],
  victory: 'laugh',
};
class BossMode extends Mode {
  spawnAll(lineups) {
    const sp = this.w.markers['1'] || [{ x: 0, z: 8 }];
    lineups.filter(l => l.team === 0).forEach((l, i) => { const p = sp[i % sp.length]; const f = this.w.spawnFighter(l, p.x, p.z); f.spawnIdx = i; });
    const k = this.w.markers.K?.[0] ?? { x: 0, z: -8 };
    const players = lineups.filter(l => l.team === 0).length;
    this.boss = this.w.spawnFighter({ def: BOSS_DEF, team: 1, level: this.o.bossLevel ?? 1, name: BOSS_DEF.name }, k.x, k.z);
    this.boss.maxHp = BOSS_DEF.stats.hp * (0.6 + players * 0.15) * (1 + ((this.o.bossLevel ?? 1) - 1) * 0.12); this.boss.hp = this.boss.maxHp;
    this.boss.r = 1.0;
  }
  setup() { this.patternT = 5; this.enraged = false; this.w.camDist = 1.1; this.camDist = 1.12; }
  spawnPoint(f) { const sp = this.w.markers['1']; return sp[(f.spawnIdx ?? 0) % sp.length]; }
  update(dt) {
    super.update(dt);
    const w = this.w, b = this.boss;
    if (!b.alive) return;
    b.chargeSuper(dt / 9);
    if (!this.enraged && b.hp < b.maxHp * 0.5) { this.enraged = true; b.addStatus('dmgUp', 999, 0.35); b.addStatus('speed', 999, 0.25); w.hud?.announce('WUTANFALL!', 'Der Oni-Kaiser rast', '#ff3a2a'); w.vfx.pillar({ x: b.x, z: b.z }, { color: 0xff3a2a, r: 2, h: 10, life: 1 }); sfx('roar'); }
    this.patternT -= dt;
    if (this.patternT <= 0 && b.canAct()) {
      this.patternT = this.enraged ? 4 : 6;
      const pick = Math.floor(Math.random() * 4);
      const tgt = w.nearestEnemy(1, b.x, b.z, 30) || w.player;
      const aim = tgt ? { x: (tgt.x - b.x) / (Math.hypot(tgt.x - b.x, tgt.z - b.z) || 1), z: (tgt.z - b.z) / (Math.hypot(tgt.x - b.x, tgt.z - b.z) || 1) } : { x: 0, z: 1 };
      const ctx = { kind: 'super', aim, dist: 8 };
      if (pick === 0) { w.announce('Fluchring', '', 0xff3a2a, b, true); execute(w, b, P({ shape: 'orb', color: 0xff3a2a, color2: 0xffd04a, count: 16, spread: 337, speed: 9, range: 12, dmg: 700, w: 0.35, anim: 'raise' }), ctx); }
      else if (pick === 1) { for (const f of w.fighters.filter(f => f.team === 0 && f.alive)) execute(w, b, A({ range: 30, r: 2.2, dmg: 1500, landDelay: 1.0, lob: true, shape: 'rock', size: 0.8, color: 0xff6a2a, arcH: 6 }), { ...ctx, tx: f.x, tz: f.z, useTarget: true }); w.announce('Meteorschauer', '', 0xff3a2a, b, true); }
      else if (pick === 2) { execute(w, b, D({ dist: 9, speed: 16, dmg: 1800, w: 1.4, color: 0xff3a2a, breakWalls: true, effects: knock(3) }), ctx); w.announce('Ansturm', '', 0xff3a2a, b, true); }
      else { execute(w, b, SUM({ count: 3, unit: { name: 'Fluchgeist', hp: 2500, life: 14, speed: 3.6, rate: 0.9, color: 0xff3a2a, look: { skin: 0x5a2a3a, build: 'small', hair: { style: 'none' }, eyes: { type: 'glow', color: 0xffd04a }, mouth: 'fangs', extras: ['hornsBack', 'noEars'], top: { type: 'bare' }, bottom: { type: 'hakama', color: 0x1a1018 } }, attack: C({ range: 1.3, arc: 90, dmg: 450, color: 0xff3a2a }) } }), ctx); w.announce('Beschwörung', '', 0xff3a2a, b, true); }
    }
  }
  onKill(v) { if (v === this.boss) this.w.finish({ winners: [0], reason: 'Boss besiegt!' }); }
  respawnTime(f) { return f === this.boss ? 0 : this.cfg.respawn; }
  onTimeUp() { this.w.finish({ winners: [1], reason: 'Zeit abgelaufen' }); }
  botGoal(f) { if (f === this.boss) { const t = this.w.nearestEnemy(1, f.x, f.z, 40); return t ? { x: t.x, z: t.z } : null; } return { x: this.boss.x, z: this.boss.z + 3, struct: null }; }
  hud() { const b = this.boss; return { boss: { name: BOSS_DEF.name, v: b.hp / b.maxHp, enraged: this.enraged } }; }
}

// ---------------------------------------------------------------------------
class TrainingMode extends Mode {
  spawnAll(lineups) {
    const p = this.w.markers['1']?.[0] ?? { x: 0, z: 5 };
    const l = lineups.find(x => x.isPlayer);
    const f = this.w.spawnFighter(l, p.x, p.z); f.spawnIdx = 0;
    f.gadgets = 99; if (f.gadgetIdx < 0) { f.gadgetIdx = 0; f.gadgets = 99; }
  }
  setup() {
    const w = this.w;
    for (const d of w.markers.D || []) {
      const { group } = buildCharacter({ skin: 0xd8c8a8, build: 'muscle', hair: { style: 'none' }, eyes: { type: 'dots', color: 0x222222 }, mouth: 'flat', top: { type: 'shirt', color: 0xb83a3a }, bottom: { type: 'pants', color: 0x6a5a4a }, extras: ['noEars'] });
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8), toon(0x6a4a32)); post.position.y = 0.2; group.add(post);
      w.addStructure({ team: 1, x: d.x, z: d.z, r: 0.45, hp: 6000, name: 'Trainingspuppe', mesh: group, regen: true, respawnable: true, dummy: true });
    }
    this.timeLeft = 99999;
  }
  update(dt) {
    super.update(dt);
    const p = this.w.player;
    if (!p) return;
    if (p.superCharge < 1) p.superCharge = Math.min(1, p.superCharge + dt * 0.8);
    if (!p.transformed || p.canStage2) p.transCharge = Math.min(1, p.transCharge + dt * 0.6);
    p.gadgets = 99;
    if (p.overdrive) p.overCharge = 1;
  }
  respawnTime() { return 1; }
  botGoal() { return null; }
  hud() { return { center: 'TRAINING — Esc / ✕ zum Verlassen' }; }
}

export function createMode(id, w, o) {
  switch (id) {
    case 'crystal': return new CrystalMode(w, o);
    case 'ball': return new BallMode(w, o);
    case 'showdown': case 'duo': return new ShowdownMode(w, o);
    case 'vault': return new VaultMode(w, o);
    case 'zone': return new ZoneMode(w, o);
    case 'knockout': return new KnockoutMode(w, o);
    case 'boss': return new BossMode(w, o);
    case 'training': return new TrainingMode(w, o);
    default: return new CrystalMode(w, o);
  }
}

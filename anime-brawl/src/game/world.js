// World: one running match. Owns the scene, units, projectiles, zones and the
// damage pipeline. Rendering + simulation step happen in update().
import * as THREE from 'three';
import { Grid } from './grid.js';
import { Fighter, Minion, Unit } from './fighter.js';
import { execute, applyBuff, KINDS } from './actions.js';
import { VFX } from '../render/vfx.js';
import { buildArena } from '../render/arena.js';
import { buildCharacter } from '../render/model.js';
import { toon, glowUnique } from '../render/toon.js';
import { MAPS, THEMES } from '../data/maps.js';
import { getChar } from '../data/index.js';
import { sfx } from '../core/audio.js';
import { BotBrain } from './ai.js';
import { createMode } from './modes/index.js';

const MARKERS = new Set(['1', '2', 'G', 'O', 's', 'S', 'Z', 'g', 'h', 'P', 'K', 'D', 'C']);

// ---------------------------------------------------------------------------
export class Structure extends Unit {
  constructor(world, o) {
    super();
    this.kind = 'structure';
    this.world = world; this.team = o.team; this.x = o.x; this.z = o.z; this.r = o.r ?? 0.8;
    this.maxHp = o.hp; this.hp = o.hp; this.name = o.name; this.regen = o.regen; this.respawnable = o.respawnable;
    this.mesh = o.mesh; world.scene.add(this.mesh); this.mesh.position.set(this.x, 0, this.z);
    this.hitT = 9; this.combatT = 9; this.r0 = this.r;
    this.isDummy = !!o.dummy;
  }
  hpMult() { return 1; } dmgMult() { return 1; }
  flash() { this.hitT = 0; }
  knock() {} chargeSuper() {} chargeTrans() {}
  die() { this.alive = false; }
  update(dt) {
    this.hitT += dt; this.combatT += dt;
    const k = this.hitT < 0.15 ? 1 + Math.sin(this.hitT * 60) * 0.05 : 1;
    this.mesh.scale.setScalar(k);
    if (this.isDummy) { this.mesh.rotation.z = this.hitT < 0.4 ? Math.sin(this.hitT * 30) * 0.15 * (1 - this.hitT / 0.4) : 0; }
    if (this.regen && this.combatT > 2.5 && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * dt);
    if (!this.alive && this.respawnable) { this.deadT = (this.deadT ?? 0) + dt; if (this.deadT > 2) { this.alive = true; this.hp = this.maxHp; this.deadT = 0; this.mesh.visible = true; } }
  }
}

// ---------------------------------------------------------------------------
export class World {
  constructor(o) {
    this.o = o;
    this.renderer = o.renderer;
    this.hud = o.hud;
    this.input = o.input;
    this.modeCfg = o.mode;
    this.rules = o.rules || {};
    this.playerTeam = 0;
    this.time = 0; this.timeScale = 1; this.hitStopT = 0;
    this.listeners = {};
    this.scene = new THREE.Scene();
    const theme = THEMES[o.theme] || THEMES.shibuya;
    this.theme = theme;
    this.scene.background = new THREE.Color(theme.sky);
    this.scene.fog = new THREE.Fog(theme.fog, 26, 60);
    const mapDef = MAPS[o.map];
    this.grid = new Grid(mapDef.rows);
    this.mapName = `${theme.name}: ${mapDef.name}`;
    this.markers = {};
    for (const ch of MARKERS) { const list = this.grid.find(ch); if (list.length) this.markers[ch] = list; }
    for (const ch in this.markers) for (const m of this.markers[ch]) if (ch !== 'C') this.grid.cells[m.ty][m.tx] = '.';
    // power-cube crates stay crates
    for (const m of this.markers.C || []) { this.grid.cells[m.ty][m.tx] = 'X'; this.grid.crateHp.set(m.ty * this.grid.w + m.tx, 3000); }
    this.cubeCrates = new Set((this.markers.C || []).map(m => m.ty * this.grid.w + m.tx));
    // lights
    const hemi = new THREE.HemisphereLight(theme.hemi[0], theme.hemi[1], 1.15); this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(theme.light, 2.1);
    sun.position.set(-6, 14, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(o.quality === 'low' ? 1024 : 2048, o.quality === 'low' ? 1024 : 2048);
    const sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 50;
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
    this.scene.add(sun); this.scene.add(sun.target); this.sun = sun;
    // arena
    this.arena = buildArena(this.scene, this.grid, theme, o.seed ?? 3);
    this.vfx = new VFX(this.scene);
    // camera
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    this.camTarget = new THREE.Vector3();
    this.camZoom = 1; this.camZoomTarget = 1;
    // state
    this.units = []; this.fighters = []; this.projectiles = []; this.zones = []; this.traps = []; this.queue = []; this.tweens = [];
    this.infinityUsers = new Set();
    this.over = false; this.result = null;
    this.popThrottle = new Map();
    this.stats = { kills: 0 };
    this.botBrainClass = BotBrain;
    this.mode = createMode(o.mode.id, this, o);
    this.mode.spawnAll(o.lineups);
    this.player = this.fighters.find(f => f.isPlayer);
    for (const f of this.fighters) if (f.isBot || (f.isPlayer && o.autoplay)) f.brain = new BotBrain(this, f, o.difficulty ?? 0.5);
    this.mode.setup();
    this.camTarget.set(this.player?.x ?? 0, 0, this.player?.z ?? 0);
    this.countdown = o.mode.id === 'training' ? 0 : 3.2;
    this.lastCount = 4;
    this.resize();
  }

  // ---- events ----------------------------------------------------------------
  on(ev, fn) { (this.listeners[ev] ||= []).push(fn); }
  emit(ev, ...a) { for (const fn of this.listeners[ev] || []) fn(...a); }

  // ---- spawning ----------------------------------------------------------------
  spawnFighter(cfg, x, z) {
    const def = cfg.def || getChar(cfg.defId);
    const f = new Fighter(this, def, { ...cfg, x, z, team: cfg.team, face: cfg.team === 0 ? -Math.PI / 2 : Math.PI / 2 });
    if (this.rules.hpMult) { f.maxHp *= this.rules.hpMult; f.hp = f.maxHp; }
    if (this.rules.startSuper) f.superCharge = 1;
    if (this.rules.startTrans) f.transCharge = 1;
    if (this.rules.speedMult) f.def = { ...f.def, stats: { ...f.def.stats, speed: f.def.stats.speed * this.rules.speedMult, reload: f.def.stats.reload / this.rules.speedMult } }, f.recalcStats();
    this.units.push(f); this.fighters.push(f);
    return f;
  }
  spawnMinion(owner, def, x, z, ctx) {
    let d = def;
    for (const p of owner.hooks || []) if (p.type === 'summonBoost') d = { ...d, life: (d.life ?? 8) + (p.life ?? 0), hp: (d.hp ?? 1000) * (p.hp ?? 1) };
    const pos = this.findWalkable(x, z, owner.x, owner.z);
    const m = new Minion(this, owner, d, pos.x, pos.z);
    this.units.push(m);
    return m;
  }
  addStructure(o) { const s = new Structure(this, o); this.units.push(s); return s; }

  // ---- queries -------------------------------------------------------------------
  isVisibleTo(u, team) {
    if (u.team === team) return true;
    if (u.kind !== 'fighter') return true;
    if (!u.alive) return false;
    if (u.has('revealed')) return true;
    const invis = u.has('invis');
    if (!invis && (!u.inBush || u.reveal > 0)) return true;
    const near = invis ? 1.4 : 2.6;
    for (const o of this.fighters) if (o.alive && o.team === team && Math.hypot(o.x - u.x, o.z - u.z) < near) return true;
    return false;
  }
  nearestEnemy(team, x, z, range = 99, visibleOnly = false, filter = null) {
    let best = null, bd = range;
    for (const u of this.units) {
      if (!u.alive || u.team === team || u.untargetable) continue;
      if (filter && !filter(u)) continue;
      if (visibleOnly && !this.isVisibleTo(u, team)) continue;
      const d = Math.hypot(u.x - x, u.z - z) - u.r * 0.5;
      if (d < bd) { bd = d; best = u; }
    }
    return best;
  }
  unitsInRadius(x, z, r, team) { return this.units.filter(u => u.alive && u.team !== team && !u.untargetable && Math.hypot(u.x - x, u.z - z) < r + u.r); }
  alliesInRadius(x, z, r, team) { return this.units.filter(u => u.alive && u.team === team && u.kind === 'fighter' && Math.hypot(u.x - x, u.z - z) < r + u.r); }
  findWalkable(x, z, fx, fz) {
    const hw = this.grid.w / 2 - 0.45, hh = this.grid.h / 2 - 0.45;
    x = Math.max(-hw, Math.min(hw, x)); z = Math.max(-hh, Math.min(hh, z));
    if (!this.grid.blocksMove(x, z)) return this.grid.resolve(x, z, 0.4);
    const dx = fx - x, dz = fz - z, L = Math.hypot(dx, dz) || 1;
    for (let d = 0.25; d < L; d += 0.25) { const px = x + dx / L * d, pz = z + dz / L * d; if (!this.grid.blocksMove(px, pz)) return this.grid.resolve(px, pz, 0.4); }
    return { x: fx, z: fz };
  }

  // ---- scheduling ------------------------------------------------------------------
  schedule(delay, fn) { this.queue.push({ t: this.time + delay, fn }); }
  tween(dur, fn, done) { this.tweens.push({ t: 0, dur, fn, done }); }
  hitStop(t) { this.hitStopT = Math.min(0.08, Math.max(this.hitStopT, t)); }

  // ---- zones / traps / walls --------------------------------------------------------
  addZone(z) {
    const zone = { acc: 0, ...z, inside: new Set() };
    if (zone.domain || zone.trap) for (const u of this.unitsInRadius(z.x, z.z, z.r, z.team)) zone.inside.add(u);
    if (zone.effectsOnce) for (const u of zone.inside) this.applyEffects(z.src, u, zone.effectsOnce, { x: u.x - z.x, z: u.z - z.z });
    if (zone.color && !zone.domain && !zone.room) this.vfx.zone({ x: z.x, z: z.z }, z.r, z.t, { color: z.color });
    this.zones.push(zone);
    return zone;
  }
  addTrap(t) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.12, 16), toon(0x3a3a44));
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), glowUnique(t.color, 0.9)); light.position.y = 0.1; m.add(light);
    m.position.set(t.x, 0.06, t.z); this.scene.add(m);
    this.traps.push({ ...t, mesh: m, light, age: 0 });
  }
  addTempWalls(cells, life, color, style) {
    for (const c of cells) if (this.grid.addTemp(c.tx, c.ty, life)) this.arena.addTemp(c.tx, c.ty, color, style);
  }
  breakTile(tx, ty) {
    if (this.mode.protectTile && this.mode.protectTile(tx, ty)) return false;
    const was = this.grid.get(tx, ty);
    if (was === 'T') return false;
    if (this.grid.destroyTile(tx, ty)) {
      this.arena.removeTile(tx, ty);
      const x = this.grid.cx(tx), z = this.grid.cz(ty);
      this.vfx.burst({ x, y: 0.6, z }, { count: 10, color: was === 'B' ? this.theme.bush : this.theme.wall, speed: 4, up: 1.2, gravity: 12, life: 0.8, size: 0.35, smoke: true });
      if (was === 'X') this.onTileDestroyed(tx, ty);
      return true;
    }
    return false;
  }
  breakRadius(x, z, r) {
    const t0x = this.grid.tx(x - r), t1x = this.grid.tx(x + r), t0y = this.grid.ty(z - r), t1y = this.grid.ty(z + r);
    for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) if (Math.hypot(this.grid.cx(tx) - x, this.grid.cz(ty) - z) < r + 0.5) this.breakTile(tx, ty);
  }
  breakLine(x, z, dx, dz, len, w) { for (let d = 0; d < len; d += 0.5) this.breakRadius(x + dx * d, z + dz * d, w); }
  breakArc(x, z, ang, range, arc) { for (let a = -arc / 2; a <= arc / 2; a += 0.3) this.breakRadius(x + Math.cos(ang + a) * range * 0.8, z + Math.sin(ang + a) * range * 0.8, 0.3); }
  onTileDestroyed(tx, ty) {
    this.arena.removeTile(tx, ty);
    const k = ty * this.grid.w + tx;
    if (this.cubeCrates.has(k)) { this.cubeCrates.delete(k); this.mode.dropCube?.(this.grid.cx(tx), this.grid.cz(ty)); }
    this.vfx.burst({ x: this.grid.cx(tx), y: 0.5, z: this.grid.cz(ty) }, { count: 12, color: this.theme.crate, speed: 4, up: 1, gravity: 12, life: 0.8, size: 0.35, smoke: true });
    sfx('wood');
  }

  // ---- damage pipeline -----------------------------------------------------------------
  hooksOf(u) { return u && u.hooks ? u.hooks : []; }
  damage(src, tgt, dmg, info = {}) {
    if (!tgt || !tgt.alive || this.over) return 0;
    if (src && src.team === tgt.team) return 0;
    if (this.countdown > 0) return 0;
    const isF = tgt.kind === 'fighter';
    if (tgt.has('invuln') || tgt.untargetable) { if (!info.dot) this.popText(tgt.x, tgt.z, 'IMMUN', '#cfd8e8', 0.8, 'imm' + tgt.uid); return 0; }
    const th = this.hooksOf(tgt), sh = this.hooksOf(src);
    // --- avoidance ---
    if (isF && !info.dot && !info.sure) {
      let dodge = tgt.sv('dodge', 0);
      for (const p of th) { if (p.type === 'dodge') dodge += p.chance; if (p.type === 'intangible' && info.proj) dodge += p.chance; }
      if (dodge > 0 && Math.random() < Math.min(0.75, dodge)) { this.dodgeFx(tgt, th.some(p => p.type === 'intangible') && info.proj ? 'DURCHLÄSSIG' : 'AUSGEWICHEN'); return 0; }
      const fs = th.filter(p => p.type === 'futureSight');
      if (fs.length && tgt.futureSightCd <= 0) { tgt.futureSightCd = Math.min(...fs.map(p => p.cd)); this.dodgeFx(tgt, 'VORHERSEHUNG'); return 0; }
      let ill = 0; for (const p of th) if (p.type === 'illusion') ill += p.chance;
      if (ill > 0 && Math.random() < ill) {
        const a = Math.random() * Math.PI * 2; const pt = this.findWalkable(tgt.x + Math.cos(a) * 1.6, tgt.z + Math.sin(a) * 1.6, tgt.x, tgt.z);
        this.afterimage(tgt); tgt.teleport(pt.x, pt.z); this.popText(tgt.x, tgt.z, 'ILLUSION', '#b89aff', 1, 'ill' + tgt.uid); sfx('genjutsu'); return 0;
      }
    }
    // --- multipliers ---
    let m = 1, crit = false;
    if (this.rules.dmgMult) m *= this.rules.dmgMult;
    for (const p of sh) {
      if (p.type === 'critChance' && (!p.kinds || p.kinds.includes(info.kind)) && Math.random() < p.chance) { m *= p.mult ?? 2; crit = true; if (p.name === 'Black Flash' || p.mult >= 2.5) this.blackFlash(tgt); }
      if (p.type === 'sweetSpot' && info.sweet !== undefined && info.kind === 'main' && Math.abs(info.sweet - p.at) < p.width / 2) { m *= p.mult; crit = true; }
      if (p.type === 'highHpDmg' && src.hp / src.maxHp > (p.above ?? 0.7)) m *= p.mult;
      if (p.type === 'superDmg' && info.kind === 'super') m *= p.mult;
    }
    if (src && src.has && src.has('weaken')) m *= 1 - src.sv('weaken', 0.3);
    if (tgt.has('mark')) m *= 1 + tgt.sv('mark', 0.15);
    // --- reductions ---
    let dr = tgt.sv('dr', 0);
    for (const p of th) {
      if (p.type === 'damageReduce') dr += p.f;
      if (p.type === 'damageReduceHigh' && tgt.hp / tgt.maxHp > (p.above ?? 0.7)) dr += p.f;
      if (p.type === 'allyNearDR' && this.alliesInRadius(tgt.x, tgt.z, p.r ?? 4, tgt.team).some(a => a !== tgt)) dr += p.f;
      if (p.type === 'infinity') dr += info.proj ? p.reduce : p.reduce * 0.3;
    }
    if (info.effects?.trueDmg) dr = 0;
    dr = Math.min(0.85, dr);
    if (tgt.kind === 'minion' && tgt.def.adapt) { dr = Math.max(dr, tgt.adapt ?? 0); tgt.adapt = Math.min(0.6, (tgt.adapt ?? 0) + 0.05); }
    let amount = dmg * m * (1 - dr);
    if (amount <= 0 && !info.effects) return 0;
    // --- shield ---
    if (tgt.shield > 0 && !info.effects?.breakShield) { const a = Math.min(tgt.shield, amount); tgt.shield -= a; amount -= a; if (a > 0 && !info.dot) this.vfx.sphere({ x: tgt.x, y: 0.7, z: tgt.z }, { color: 0x8ad8ff, r0: 0.6, r1: 0.8, life: 0.15, opacity: 0.4 }); }
    if (info.effects?.breakShield) tgt.shield = 0;
    tgt.hp -= amount;
    // --- effects ---
    if (info.effects) this.applyEffects(src, tgt, info.effects, info.dir);
    for (const p of sh) if (p.type === 'onHitEffect' && (!p.kinds || p.kinds.includes(info.kind)) && (!p.chance || Math.random() < p.chance)) this.applyEffects(src, tgt, p.effects, info.dir);
    // execute (Hakai)
    if (info.effects?.execute && tgt.alive && !tgt.boss && tgt.kind !== 'structure') {
      let thr = info.effects.execute; for (const p of sh) if (p.type === 'executeBoost') thr += p.add;
      if (tgt.hp > 0 && tgt.hp / tgt.maxHp < thr) { amount += tgt.hp; tgt.hp = 0; this.popText(tgt.x, tgt.z, 'HAKAI', '#d04cff', 1.6); this.vfx.sphere({ x: tgt.x, y: 0.8, z: tgt.z }, { color: 0xd04cff, r0: 1.2, r1: 0.1, life: 0.5 }); }
    }
    // lifesteal
    if (src && src.alive && src.kind === 'fighter') {
      let ls = src.sv('lifesteal', 0); for (const p of sh) if (p.type === 'lifesteal') ls += p.f;
      if (ls > 0 && amount > 0) this.heal(src, amount * ls, src, true);
    }
    // meters
    if (src && src.chargeSuper && info.gain) src.chargeSuper(info.gain);
    if (src && src.chargeTrans && amount > 0) src.chargeTrans(amount / (src.maxHp * (tgt.kind === 'structure' && !tgt.isDummy ? 4 : 1.7)));
    if (isF && amount > 0) tgt.chargeTrans(amount / (tgt.maxHp * 2.4));
    if (src && src.stats_) src.stats_.dmg += amount;
    if (src && src.combatT !== undefined) src.combatT = 0;
    tgt.combatT = 0;
    if (isF) tgt.reveal = Math.max(tgt.reveal, 0.6);
    tgt.lastHitBy = src;
    // feedback
    if (!info.noFlash) tgt.flash && tgt.flash();
    if (amount >= 1) {
      const mine = src && src.isPlayer, me = tgt.isPlayer;
      const col = crit ? '#ffe14a' : info.dot ? '#ffa060' : me ? '#ff5a6a' : mine ? '#ffffff' : '#e8e8f0';
      if (!info.dot || amount > 60) this.popNumber(tgt, Math.round(amount), col, crit ? 1.5 : amount > 1500 ? 1.3 : 1);
      if (crit) sfx('crit'); else if (mine || me) sfx(amount > 1200 ? 'hitHeavy' : 'hit');
      if (me) this.hud?.hurt();
      if (amount > 1500) this.vfx.shake(0.12);
    }
    this.mode.onDamage?.(src, tgt, amount);
    if (tgt.hp <= 0) this.kill(tgt, src);
    return amount;
  }

  applyEffects(src, tgt, e, dir) {
    if (!tgt.alive) return;
    const th = this.hooksOf(tgt);
    const immune = new Set(); for (const p of th) if (p.type === 'immune') for (const k of p.effects) immune.add(k);
    const unstop = th.some(p => p.type === 'unstoppable') || tgt.boss;
    const rubber = th.some(p => p.type === 'rubber');
    const stunMul = unstop ? 0.25 : 1;
    let burnMul = 1; for (const p of this.hooksOf(src)) if (p.type === 'burnBoost') burnMul *= p.mult;
    const dx = dir?.x ?? (tgt.x - (src?.x ?? 0)), dz = dir?.z ?? (tgt.z - (src?.z ?? 0));
    if (e.slow && !immune.has('slow')) tgt.addStatus('slow', e.slow.t, e.slow.f);
    if (e.stun && !immune.has('stun')) { tgt.addStatus('stun', e.stun * stunMul); if (e.stun * stunMul > 0.3 && tgt.kind === 'fighter') this.popText(tgt.x, tgt.z, 'BETÄUBT', '#ffe066', 0.8, 'stun' + tgt.uid); }
    if (e.freeze && !immune.has('stun')) { tgt.addStatus('frozen', e.freeze * stunMul); this.vfx.sphere({ x: tgt.x, y: 0.7, z: tgt.z }, { color: 0xbfefff, r0: 0.7, r1: 0.75, life: e.freeze * stunMul, opacity: 0.35 }); this.popText(tgt.x, tgt.z, 'EINGEFROREN', '#bfefff', 0.8, 'frz' + tgt.uid); }
    if (e.root) tgt.addStatus('rooted', e.root * (unstop ? 0.4 : 1));
    if (e.silence) tgt.addStatus('silence', e.silence);
    if (e.noHeal) tgt.addStatus('noHeal', e.noHeal);
    if (e.reveal) tgt.addStatus('revealed', e.reveal);
    if (e.weaken) tgt.addStatus('weaken', e.weaken.t, e.weaken.f);
    if (e.mark) tgt.addStatus('mark', e.mark.t, e.mark.amp);
    if (e.burn && !immune.has('burn')) { const s = tgt.statuses.get('burn'); const dps = e.burn.dps * (src?.dmgMult ? src.dmgMult() / (src._lv || 1) * (src._lv || 1) : 1); tgt.statuses.set('burn', { t: Math.max(s?.t ?? 0, e.burn.t * burnMul), v: Math.max(s?.v ?? 0, dps), src, acc: s?.acc ?? 0 }); }
    const kMul = (unstop ? 0.15 : 1) * (rubber ? 0.5 : 1);
    if (e.knock && tgt.knock) tgt.knock(dx, dz, e.knock * kMul);
    if (e.pull && tgt.knock && src) { const d = Math.hypot(src.x - tgt.x, src.z - tgt.z); tgt.knock(src.x - tgt.x, src.z - tgt.z, Math.min(e.pull, Math.max(0, d - 1.0)) * kMul); }
  }

  heal(u, amt, src = null, silent = false) {
    if (!u.alive || u.has('noHeal') || amt <= 0) return;
    for (const p of this.hooksOf(src)) if (p.type === 'healBoost') amt *= p.mult;
    const before = u.hp;
    u.hp = Math.min(u.maxHp, u.hp + amt);
    const got = u.hp - before;
    if (src && src.stats_ && src !== u) src.stats_.heal += got;
    if (!silent && got > 40) this.popNumber(u, '+' + Math.round(got), '#6dff8a', 1);
  }

  kill(tgt, src) {
    // revive passives
    const rev = this.hooksOf(tgt).find(p => p.type === 'reviveOnce');
    if (rev && !tgt.mem?.revived) {
      tgt.mem.revived = true; tgt.hp = tgt.maxHp * rev.hp; tgt.addStatus('invuln', 1);
      this.popText(tgt.x, tgt.z, 'WIEDERBELEBT!', '#7cffb0', 1.3);
      this.vfx.pillar({ x: tgt.x, z: tgt.z }, { color: 0x7cffb0, r: 0.8, h: 5, life: 0.6 });
      return;
    }
    tgt.hp = 0;
    tgt.die(src);
    if (tgt.kind === 'minion') {
      if (tgt.def.explodeOnDeath) { const e = tgt.def.explodeOnDeath; this.vfx.explosion({ x: tgt.x, y: 0.4, z: tgt.z }, e.r, 0x9ab0d8); for (const u of this.unitsInRadius(tgt.x, tgt.z, e.r, tgt.team)) this.damage(tgt.owner, u, e.dmg * tgt.owner.dmgMult(), { kind: 'super', gain: 0 }); }
      return;
    }
    if (tgt.kind === 'structure') { this.mode.onStructureDestroyed?.(tgt, src); return; }
    const killer = src && src.kind === 'minion' ? src.owner : src;
    if (killer && killer.kind === 'fighter') {
      killer.stats_.kills++;
      for (const p of killer.hooks) {
        if (p.type === 'killHeal') this.heal(killer, killer.maxHp * p.f, killer);
        if (p.type === 'killSuper') killer.chargeSuper(p.amt);
        if (p.type === 'killSpeed') killer.addStatus('speed', p.t ?? 3, p.mult);
      }
      killer.chargeTrans(0.2);
    }
    this.vfx.burst({ x: tgt.x, y: 0.7, z: tgt.z }, { count: 30, color: tgt.team === this.playerTeam ? 0x3fb6ff : 0xff3b4c, speed: 5, life: 0.7 });
    this.vfx.ring({ x: tgt.x, z: tgt.z }, { color: 0xffffff, r0: 0.3, r1: 2, life: 0.4 });
    sfx('ko');
    this.hud?.killfeed(killer, tgt);
    if (tgt.isPlayer) this.hud?.announce('BESIEGT', '', '#ff3b5c');
    this.mode.onKill?.(tgt, killer);
    const rt = this.mode.respawnTime(tgt);
    tgt.respawnT = rt > 0 ? rt : -1;
    // clean up Minato markers etc.
    for (const m of tgt.mem.markers || []) this.scene.remove(m.mesh);
    tgt.mem.markers = [];
  }

  // ---- feedback helpers --------------------------------------------------------------
  dodgeFx(u, text) { this.afterimage(u); this.popText(u.x, u.z, text, '#bfe6ff', 0.9, 'dg' + u.uid); sfx('dodge'); }
  blackFlash(u) {
    this.vfx.burst({ x: u.x, y: 0.8, z: u.z }, { count: 24, color: 0x111111, color2: 0xff1a3a, speed: 7, life: 0.4, size: 0.45, smoke: false });
    for (let i = 0; i < 4; i++) { const a = Math.random() * Math.PI * 2; this.vfx.lightning({ x: u.x, y: 0.8, z: u.z }, { x: u.x + Math.cos(a) * 1.4, y: 0.8 + Math.random(), z: u.z + Math.sin(a) * 1.4 }, { color: i % 2 ? 0xff1a3a : 0x222222, width: 0.06, life: 0.2 }); }
    this.popText(u.x, u.z, 'BLACK FLASH', '#ff2a4a', 1.4);
    sfx('blackFlash'); this.hitStop(0.07); this.vfx.shake(0.3);
  }
  afterimage(u) {
    if (!u.model) return;
    const g = u.model.clone(true);
    g.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0.45, depthWrite: false }); if (o.userData.isOutline) o.visible = false; } });
    g.position.set(u.x, 0, u.z); g.rotation.copy(u.model.rotation);
    this.scene.add(g);
    this.tween(0.35, (k) => { g.traverse(o => { if (o.isMesh) o.material.opacity = 0.45 * (1 - k); }); }, () => this.scene.remove(g));
  }
  popNumber(u, val, color, size) { this.hud?.popup(new THREE.Vector3(u.x + (Math.random() - 0.5) * 0.4, (u.rig?.height ?? 1.3) + 0.3, u.z), String(val), color, size); }
  popText(x, z, text, color, size = 1, key = null) {
    if (key) { const t = this.popThrottle.get(key) ?? -9; if (this.time - t < 0.6) return; this.popThrottle.set(key, this.time); }
    this.hud?.popup(new THREE.Vector3(x, 1.9, z), text, color, size, true);
  }
  announce(title, sub, color, src, small = false) {
    if (src && src.team !== this.playerTeam && Math.hypot(src.x - (this.player?.x ?? 0), src.z - (this.player?.z ?? 0)) > 14) return;
    this.hud?.announce(title, sub, '#' + new THREE.Color(color).getHexString(), small);
  }
  announceSmall(u, text, color, quiet = false) { if (!quiet || u.isPlayer) this.popText(u.x, u.z, text, '#' + new THREE.Color(color).getHexString(), 0.9, 'as' + u.uid + text); }
  sfx(key, src) { if (!src || !this.player || Math.hypot(src.x - this.player.x, src.z - this.player.z) < 13) sfx(key); }

  // ---- transformation cinematic -----------------------------------------------------
  beginTransform(f) {
    const T = f.transformed && f.def.trans?.next ? f.def.trans.next : f.def.trans;
    const near = f.isPlayer || Math.hypot(f.x - (this.player?.x ?? 0), f.z - (this.player?.z ?? 0)) < 10;
    sfx('transform');
    const aura = T.aura ?? 0xffffff;
    this.vfx.pillar({ x: f.x, z: f.z }, { color: aura, r: 1.0, h: 10, life: 1.1 });
    for (let i = 0; i < 3; i++) this.schedule(i * 0.25, () => this.vfx.ring({ x: f.x, z: f.z }, { color: aura, r0: 2.2, r1: 0.2, life: 0.35 }));
    this.tween(0.9, (k) => { if (Math.random() < 0.8) this.vfx.auraTick({ x: f.x, y: 1.0, z: f.z }, aura, 0.05, 3, 1.4); });
    if (near) {
      this.slowmo = { t: 0, dur: 1.0 };
      if (f.isPlayer) this.camZoomTarget = 0.55;
      this.hud?.transformBanner(T.name, f.name, '#' + new THREE.Color(aura).getHexString(), f.def.rarity === 'divine');
    }
    this.schedule(0.9, () => {
      if (!f.alive) { f.cinematic = -1; return; }
      if (f.transformed && f.def.trans.next && f.form === 'trans') {
        f.form = 'trans2'; f.transT = T.duration ?? 14; f.transCharge = 0;
        f.buildModel(); f.hooks = f.collectHooks(); if (f.hooks.some(h => h.type === 'infinity')) this.infinityUsers.add(f); f.recalcStats();
        this.heal(f, f.maxHp * 0.25, f); f.ammo = f.stats.ammo;
        if (T.onEnter) execute(this, f, T.onEnter, { kind: 'trans', aim: { ...f.liveAim }, dist: 4, tx: f.x, tz: f.z });
      } else {
        f.applyTransform();
        if (!f.def.trans.onEnter) KINDS.nova(this, f, { r: 2.6, dmg: 300, color: aura, effects: { knock: 1.6 } }, { kind: 'trans' });
      }
      f.cinematic = -1;
      this.vfx.sphere({ x: f.x, y: 0.9, z: f.z }, { color: 0xffffff, r0: 0.5, r1: 3.5, life: 0.35, opacity: 0.9 });
      this.vfx.explosion({ x: f.x, y: 0.4, z: f.z }, 2.4, aura, 0xffffff);
      this.vfx.shake(0.5);
      if (f.isPlayer) { this.camZoomTarget = 1; this.hud?.flash('#' + new THREE.Color(aura).getHexString()); }
      this.emit('transform', f);
    });
  }

  // ---- per frame ---------------------------------------------------------------------
  resize() {
    const w = this.renderer.domElement.clientWidth || window.innerWidth, h = this.renderer.domElement.clientHeight || window.innerHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.vfx.setScale(h);
    this.aspect = w / h;
  }

  update(rawDt) {
    let dt = Math.min(0.05, rawDt);
    if (this.hitStopT > 0) { this.hitStopT -= dt; dt *= 0.12; }
    if (this.slowmo) { this.slowmo.t += rawDt; if (this.slowmo.t > this.slowmo.dur) this.slowmo = null; else dt *= 0.3; }
    this.dt = dt;
    if (this.countdown > 0) {
      this.countdown -= rawDt;
      const c = Math.ceil(this.countdown);
      if (c !== this.lastCount && c > 0) { this.lastCount = c; this.hud?.count(c); sfx('countdown'); }
      if (this.countdown <= 0) { this.hud?.count('LOS!'); sfx('start'); }
    }
    this.time += dt;
    const live = this.countdown <= 0 && !this.over;
    // input → player
    if (this.player && live && !this.player.brain) this.input.apply(this, this.player, dt);
    else if (this.player) { this.player.moveIn.x = 0; this.player.moveIn.z = 0; }
    // bots
    if (live) for (const f of this.fighters) if (f.brain && f.alive) f.brain.update(dt);
    // units
    for (const u of this.units) u.update(dt);
    for (const f of this.fighters) {
      if (!f.alive && f.respawnT > 0 && !this.over) {
        f.respawnT -= dt;
        if (f.respawnT <= 0) { const p = this.mode.spawnPoint(f); f.respawn(p.x, p.z); this.vfx.pillar({ x: p.x, z: p.z }, { color: 0xffffff, r: 0.6, h: 5, life: 0.5 }); }
      }
      if (!f.alive) f.container.visible = f.deadT < 1.4;
      else f.container.visible = this.isVisibleTo(f, this.playerTeam);
      if (f.alive && f.team === this.playerTeam && f.inBush) f.model.traverse?.(() => {});
    }
    // minion cleanup
    for (let i = this.units.length - 1; i >= 0; i--) { const u = this.units[i]; if (u.kind === 'minion' && !u.alive) { u.dispose(); this.units.splice(i, 1); } }
    // projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) { const p = this.projectiles[i]; if (p.alive) p.update(dt); if (!p.alive) this.projectiles.splice(i, 1); }
    // zones
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.t -= dt; z.acc += dt;
      if (z.trap) for (const u of z.inside) { if (!u.alive) continue; const d = Math.hypot(u.x - z.x, u.z - z.z); if (d > z.r - u.r) { const k = (z.r - u.r) / d; u.x = z.x + (u.x - z.x) * k; u.z = z.z + (u.z - z.z) * k; } }
      if (z.pull) for (const u of this.unitsInRadius(z.x, z.z, z.r, z.team)) { if (u.kind === 'structure' || u.boss) continue; const dx = z.x - u.x, dz = z.z - u.z, d = Math.hypot(dx, dz); if (d > 0.3) { const p = this.grid.resolve(u.x + dx / d * dt * 3.2, u.z + dz / d * dt * 3.2, u.r); u.x = p.x; u.z = p.z; } }
      if (z.acc >= z.tick) {
        z.acc -= z.tick;
        if (z.src && (z.src.alive || !z.domain)) {
          for (const u of this.unitsInRadius(z.x, z.z, z.r, z.team)) {
            if (z.dmg > 0) this.damage(z.src, u, z.dmg, { kind: z.kind ?? 'super', gain: 0, effects: z.effects, sure: z.domain, dot: !z.domain, noFlash: !z.domain, dir: { x: u.x - z.x, z: u.z - z.z } });
            else if (z.effects) this.applyEffects(z.src, u, z.effects, { x: u.x - z.x, z: u.z - z.z });
            if (z.slashes) this.vfx.slash({ x: u.x + (Math.random() - 0.5), y: 0.6, z: u.z + (Math.random() - 0.5) }, Math.random() * 6.28, { color: z.slashes, r: 0.9, arc: 1.2, life: 0.18 });
          }
          if (z.heal) for (const u of this.alliesInRadius(z.x, z.z, z.r, z.team)) this.heal(u, z.heal, z.src, true);
          if (z.selfBuff && z.src.alive && Math.hypot(z.src.x - z.x, z.src.z - z.z) < z.r) applyBuff(this, z.src, { ...z.selfBuff, t: z.tick + 0.1, fx: false });
          if (z.slashes) for (let k = 0; k < 3; k++) { const a = Math.random() * 6.28, rr = Math.random() * z.r; this.vfx.slash({ x: z.x + Math.cos(a) * rr, y: 0.5, z: z.z + Math.sin(a) * rr }, Math.random() * 6.28, { color: z.slashes, r: 1.0, arc: 1.3, life: 0.2 }); }
        }
      }
      if (z.t <= 0) this.zones.splice(i, 1);
    }
    // traps
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const t = this.traps[i]; t.age += dt; t.t -= dt;
      t.light.material.opacity = 0.4 + Math.sin(this.time * 6) * 0.4;
      t.mesh.visible = t.team === this.playerTeam || t.age < 0.6;
      let fire = false;
      if (t.age > t.arm) for (const u of this.unitsInRadius(t.x, t.z, t.r * 0.6, t.team)) { fire = true; break; }
      if (fire || t.t <= 0) {
        if (fire) { this.vfx.explosion({ x: t.x, y: 0.4, z: t.z }, t.r, t.color); for (const u of this.unitsInRadius(t.x, t.z, t.r, t.team)) this.damage(t.src, u, t.dmg, { kind: t.kind, gain: 0, effects: t.effects, dir: { x: u.x - t.x, z: u.z - t.z } }); sfx('explode'); }
        this.scene.remove(t.mesh); this.traps.splice(i, 1);
      }
    }
    // temp walls
    for (const t of this.grid.updateTemp(dt)) this.arena.removeTemp(t.tx, t.ty);
    // schedule + tweens
    if (this.queue.length) {
      const due = this.queue.filter(q => q.t <= this.time);
      if (due.length) { this.queue = this.queue.filter(q => q.t > this.time); for (const q of due) { try { q.fn(); } catch (e) { console.error(e); } } }
    }
    for (let i = this.tweens.length - 1; i >= 0; i--) { const t = this.tweens[i]; t.t += dt; const k = Math.min(1, t.t / t.dur); t.fn(k); if (k >= 1) { t.done && t.done(); this.tweens.splice(i, 1); } }
    // mode
    if (!this.over && this.countdown <= 0) this.mode.update(dt);
    // bushes go see-through when the player hides in one
    const inBush = this.player && this.player.alive && this.player.inBush;
    for (const m of this.arena.bushMats) m.opacity += ((inBush ? 0.55 : 1) - m.opacity) * Math.min(1, rawDt * 8);
    this.arena.setFocus(this.player?.x ?? 0, this.player?.z ?? 0, !!this.player?.alive);
    this.arena.update(dt, this.time);
    this.vfx.update(dt);
    this.updateCamera(rawDt);
    this.hud?.update(this);
  }

  updateCamera(dt) {
    let focus = this.player;
    if (focus && !focus.alive && this.mode.spectate) focus = this.mode.spectate() || focus;
    if (focus) {
      const lead = focus.isPlayer && this.input.aimActive ? 1.2 : 0;
      const tx = focus.x + (this.input.aimDir?.x ?? 0) * lead, tz = focus.z + (this.input.aimDir?.z ?? 0) * lead;
      this.camTarget.x += (tx - this.camTarget.x) * Math.min(1, dt * 6);
      this.camTarget.z += (tz - this.camTarget.z) * Math.min(1, dt * 6);
    }
    // keep the camera inside the arena bounds a bit
    const hw = Math.max(0, this.grid.w / 2 - 6), hh = Math.max(0, this.grid.h / 2 - 4);
    const cx = Math.max(-hw, Math.min(hw, this.camTarget.x)), cz = Math.max(-hh - 2, Math.min(hh + 2, this.camTarget.z));
    this.camZoom += (this.camZoomTarget - this.camZoom) * Math.min(1, dt * 5);
    const portrait = this.aspect < 1;
    const dist = (portrait ? 1.65 : 1) * this.camZoom * (this.mode.camDist ?? 1);
    const sh = this.vfx.shakeAmt;
    this.camera.position.set(cx + (Math.random() - 0.5) * sh * 0.5, 17.5 * dist + (Math.random() - 0.5) * sh * 0.5, cz + 8.6 * dist);
    this.camera.lookAt(cx, 0, cz - 0.9);
    this.sun.position.set(cx - 6, 14, cz + 8); this.sun.target.position.set(cx, 0, cz);
  }

  render() { this.renderer.render(this.scene, this.camera); }

  finish(result) {
    if (this.over) return;
    this.over = true; this.result = result;
    for (const f of this.fighters) if (f.alive && result.winners?.includes(f.team)) f.victory = true;
    this.schedule(0.01, () => {});
    setTimeout(() => this.o.onEnd && this.o.onEnd(this.buildResult(result)), 2600);
    this.hud?.announce(result.winners?.includes(this.playerTeam) ? 'SIEG!' : result.draw ? 'UNENTSCHIEDEN' : 'NIEDERLAGE', result.reason ?? '', result.winners?.includes(this.playerTeam) ? '#ffd23f' : '#ff3b5c');
    sfx(result.winners?.includes(this.playerTeam) ? 'win' : 'lose');
  }
  buildResult(r) {
    const p = this.player;
    return { ...r, mode: this.modeCfg.id, map: this.mapName, won: r.winners?.includes(this.playerTeam), draw: !!r.draw, rank: r.rank,
      player: p ? { id: p.def.id, ...p.stats_ } : null,
      fighters: this.fighters.map(f => ({ id: f.def.id, name: f.name, team: f.team, isPlayer: f.isPlayer, kills: f.stats_.kills, deaths: f.stats_.deaths, dmg: Math.round(f.stats_.dmg) })) };
  }
  dispose() {
    this.vfx.clear();
    this.scene.traverse(o => { if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose?.(); });
    this.hud?.clear();
  }
}

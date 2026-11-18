// Fighter: one brawler in a match (player, ally bot, enemy bot or boss).
import * as THREE from 'three';
import { buildCharacter } from '../render/model.js';
import { animate, flashRig } from '../render/anim.js';
import { execute } from './actions.js';
import { GEARS } from '../data/progression.js';

export function mergeLook(base, over) {
  if (!over) return base;
  const out = { ...base, ...over };
  for (const k of ['top', 'bottom', 'hair', 'eyes', 'weapon']) if (over[k] && base[k] && !over[k].replace) out[k] = { ...base[k], ...over[k] };
  if (over.extrasAdd) out.extras = [...(base.extras || []), ...over.extrasAdd];
  if (over.extrasRemove) out.extras = (out.extras || []).filter(e => !over.extrasRemove.includes(e));
  if (over.marksAdd) out.marks = [...(base.marks || []), ...over.marksAdd];
  if (over.marksRemove) out.marks = (out.marks || []).filter(e => !over.marksRemove.includes(e));
  return out;
}

export function lookFor(def, skin, form = 'base') {
  let look = def.look;
  if (skin && skin.look) look = mergeLook(look, skin.look);
  if ((form === 'trans' || form === 'trans2') && def.trans) look = mergeLook(look, def.trans.look);
  if (form === 'trans2' && def.trans?.next) look = mergeLook(look, def.trans.next.look);
  if ((form === 'trans' || form === 'trans2') && skin && skin.transLook) look = mergeLook(look, skin.transLook);
  return look;
}

/** every look a fighter may show in a match (forms, skins, summons) — for prewarming */
export function looksFor(def, skin) {
  const out = [lookFor(def, skin, 'base')];
  if (def.trans) out.push(lookFor(def, skin, 'trans'));
  if (def.trans?.next) out.push(lookFor(def, skin, 'trans2'));
  const visit = (a) => {
    if (!a || typeof a !== 'object') return;
    if (a.unit) { if (a.unit.look === 'owner') out.push(...out.slice(0, 3)); else if (a.unit.look) out.push(a.unit.look); }
    for (const k of ['list']) if (a[k]) a[k].forEach(visit);
    if (a.steps) a.steps.forEach(st => visit(st.do));
    for (const k of ['end', 'then', 'onEnd', 'after', 'onHitAction']) if (a[k]) visit(a[k]);
  };
  for (const a of [def.main, def.super, ...(def.gadgets || []), def.trans?.main, def.trans?.super, def.trans?.onEnter, def.trans?.next?.main, def.trans?.next?.super, def.trans?.next?.onEnter]) visit(a);
  return out;
}

let UID = 1;

export class Unit {
  constructor() { this.uid = UID++; this.alive = true; this.statuses = new Map(); this.shield = 0; this.shieldT = 0; this.untargetable = false; }
  addStatus(name, t, v = 1) {
    const s = this.statuses.get(name);
    if (!s || s.t < t || (v > (s.v ?? 0))) this.statuses.set(name, { t: Math.max(t, s?.t ?? 0), v: Math.max(v, s?.v ?? 0) });
  }
  has(name) { return this.statuses.has(name); }
  sv(name, d = 0) { const s = this.statuses.get(name); return s ? s.v : d; }
  isStunned() { return this.has('stun') || this.has('frozen'); }
  addShield(amt, t) { this.shield = Math.max(this.shield, amt); this.shieldT = Math.max(this.shieldT, t); }
  cleanse() { for (const k of ['slow', 'stun', 'burn', 'root', 'silence', 'frozen', 'mark']) this.statuses.delete(k); }
  hpMult() { return 1; }
  dmgMult() { return 1; }
}

export class Fighter extends Unit {
  constructor(world, def, o) {
    super();
    this.kind = 'fighter';
    this.world = world; this.def = def;
    this.team = o.team; this.name = o.name || def.name;
    this.isPlayer = !!o.isPlayer; this.isBot = !o.isPlayer;
    this.level = o.level ?? 1;
    this.skin = o.skin || null;
    this.gadgetIdx = o.gadget ?? -1;
    this.spIdx = o.starPower ?? -1;
    this.gears = o.gears || [];
    this.overdrive = !!o.overdrive;
    this.boss = !!def.boss;
    this.form = 'base';
    this.mem = {}; // scratch state for specials
    this.x = o.x ?? 0; this.z = o.z ?? 0;
    this.spawn = { x: this.x, z: this.z };
    this.r = (def.radius ?? 0.42) * (def.boss ? 1 : 1);
    this.face = o.face ?? (this.team === 0 ? -Math.PI / 2 : Math.PI / 2);
    this.liveAim = { x: Math.cos(this.face), z: Math.sin(this.face) };
    this.moveIn = { x: 0, z: 0 };
    this.vel = { x: 0, z: 0 };
    this.hooks = this.collectHooks();
    this.recalcStats();
    this.hp = this.maxHp;
    this.ammo = this.stats.ammo;
    this.superCharge = 0; this.transCharge = o.startTrans ?? 0; this.overCharge = 0;
    this.transformed = false; this.transT = 0;
    this.gadgets = this.gadgetIdx >= 0 ? 3 : 0; this.gadgetCd = 0;
    this.attackCd = 0;
    this.reveal = 0; this.hitT = 9; this.deadT = 0; this.respawnT = 0;
    this.action = null;
    this.dash = null; this.knockV = null;
    this.stats_ = { dmg: 0, kills: 0, deaths: 0, heal: 0, supers: 0, transforms: 0 };
    this.lastHitBy = null; this.combatT = 9;
    this.futureSightCd = 0;
    this.cubes = 0;
    this.cinematic = -1;
    this.carry = null; // gems/ball
    this.gems = 0;
    // model
    this.container = new THREE.Group();
    this.buildModel();
    world.scene.add(this.container);
    this.container.position.set(this.x, 0, this.z);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(this.r * 1.25 * (this.rig.scale || 1), 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.03;
    this.container.add(this.shadow);
    // team ring
    const ringCol = this.isPlayer ? 0x4cff7a : this.team === world.playerTeam ? 0x3fb6ff : 0xff3b4c;
    this.ring = new THREE.Mesh(new THREE.RingGeometry(this.r * 1.15, this.r * 1.35, 32), new THREE.MeshBasicMaterial({ color: ringCol, transparent: true, opacity: 0.85, depthWrite: false }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.04;
    this.container.add(this.ring);
    if (this.hooks.some(h => h.type === 'infinity')) world.infinityUsers.add(this);
  }

  buildModel() {
    if (this.model) this.container.remove(this.model);
    const look = lookFor(this.def, this.skin, this.form);
    const { group, rig } = buildCharacter(look);
    this.model = group; this.rig = rig;
    const vis = this.boss ? 1 : 1.22; // visual scale for readability at the battle camera
    group.scale.setScalar(vis); rig.height *= vis;
    this.container.add(group);
    this.model.rotation.y = -this.face + Math.PI / 2;
  }

  get formDef() { return this.form === 'trans2' ? this.def.trans.next : this.form === 'trans' && this.def.trans ? this.def.trans : null; }
  get canStage2() { return this.form === 'trans' && !!this.def.trans?.next; }
  get mainAct() { return (this.formDef && this.formDef.main) || this.def.main; }
  get superAct() { return (this.formDef && this.formDef.super) || this.def.super; }
  get gadgetAct() { return this.gadgetIdx >= 0 ? this.def.gadgets[this.gadgetIdx] : null; }

  get flying() { return this.hooks.some(h => h.type === 'flying'); }
  collectHooks() {
    const h = [];
    for (const p of this.def.passive || []) h.push(p);
    if (this.spIdx >= 0 && this.def.starPowers[this.spIdx]) h.push(this.def.starPowers[this.spIdx]);
    for (const g of this.gears) { const gd = GEARS.find(x => x.id === g); if (gd) h.push(gd.hook); }
    if (this.formDef) for (const p of this.formDef.passive || []) h.push(p);
    return h;
  }

  recalcStats() {
    const s = { ...this.def.stats };
    s.ammo = s.ammo ?? 3; s.superHits = s.superHits ?? 4;
    const lv = 1 + 0.08 * (this.level - 1);
    this._lv = lv;
    const hooks = this.hooks || [];
    let hpM = 1, spM = 1, rlM = 1;
    for (const p of hooks) if (p.type === 'stat') { hpM *= p.hp ?? 1; spM *= p.speed ?? 1; rlM *= p.reload ?? 1; }
    if (this.formDef?.stats) { spM *= this.formDef.stats.speed ?? 1; rlM *= this.formDef.stats.reload ?? 1; hpM *= this.formDef.stats.hp ?? 1; if (this.formDef.stats.ammo) s.ammo = this.formDef.stats.ammo; }
    s.speed = (s.speed ?? 3.2) * spM;
    s.reload = (s.reload ?? 1.6) * rlM;
    this.stats = s;
    const newMax = (s.hp ?? 4000) * lv * hpM;
    if (this.maxHp) this.hp = this.hp * (newMax / this.maxHp);
    this.maxHp = newMax;
  }

  hpMult() { return this._lv; }
  dmgMult() {
    let m = this._lv;
    m *= 1 + this.sv('dmgUp', 0);
    if (this.formDef?.stats?.dmg) m *= this.formDef.stats.dmg;
    for (const p of this.hooks) {
      if (p.type === 'stat' && p.dmg) m *= p.dmg;
      if (p.type === 'lowHpDmg' && this.hp / this.maxHp < (p.below ?? 0.5)) m *= p.mult ?? 1.3;
      if (p.type === 'rage') m *= 1 + (p.max ?? 0.5) * (1 - this.hp / this.maxHp);
    }
    if (this.cubes) m *= 1 + this.cubes * 0.1;
    return m;
  }
  speedMult() {
    let m = 1 + this.sv('speed', 0);
    if (this.has('slow')) m *= 1 - this.sv('slow', 0.3);
    for (const p of this.hooks) if (p.type === 'bushSpeed' && this.inBush) m *= p.mult ?? 1.2;
    if (this.carry === 'ball') m *= 0.92;
    for (const p of this.hooks) if (p.type === 'lowHpSpeed' && this.hp / this.maxHp < (p.below ?? 0.3)) m *= 1 + (p.mult ?? 0.2);
    return Math.max(0.15, m);
  }
  currentAim(ctx) { return ctx.aim; }

  playAnim(name, dur = 0.4) { this.mem.alt = !this.mem.alt; this.action = { name, t: 0, dur, alt: this.mem.alt }; }
  nudge(dx, dz) { const p = this.world.grid.resolve(this.x + dx, this.z + dz, this.r); this.x = p.x; this.z = p.z; }
  teleport(x, z) { const p = this.world.grid.resolve(x, z, this.r); this.x = p.x; this.z = p.z; this.dash = null; this.knockV = null; }
  startDash(d) {
    this.dash = { ...d, done: 0, hit: new Set() };
    if (d.invuln) this.addStatus('invuln', d.dist / d.speed + 0.05);
    this.playAnim(d.jump ? 'raise' : 'dash', d.dist / d.speed + 0.15);
  }
  knock(dx, dz, dist) {
    if (this.boss || this.has('unstoppable')) dist *= 0.15;
    const l = Math.hypot(dx, dz) || 1;
    this.knockV = { x: dx / l, z: dz / l, left: Math.abs(dist), speed: 12 };
    if (dist < 0) { this.knockV.x *= -1; this.knockV.z *= -1; }
  }

  canAct() { return this.alive && !this.isStunned() && !this.has('channel') && !this.dash && this.cinematic < 0; }
  canMove() { return this.alive && !this.isStunned() && !this.has('rooted') && this.cinematic < 0; }

  attack(aim, dist) {
    if (!this.canAct() || this.attackCd > 0) return false;
    if (this.world.mode.intercept && this.world.mode.intercept(this, 'attack', aim, dist)) { this.attackCd = 0.35; return true; }
    const act = this.mainAct;
    const cost = act.ammoCost ?? 1;
    if (this.ammo < cost - 1e-6) return false;
    this.ammo -= cost;
    this.attackCd = act.cd ?? 0.32;
    this.reveal = 1.2; this.combatT = 0;
    this.setFace(aim);
    execute(this.world, this, act, { kind: 'main', aim, dist, tx: this.x + aim.x * dist, tz: this.z + aim.z * dist });
    this.world.emit('attack', this);
    return true;
  }
  useSuper(aim, dist) {
    if (this.world.mode.intercept && this.carry === 'ball' && this.canAct()) return this.world.mode.intercept(this, 'super', aim, dist);
    if (!this.canAct() || this.superCharge < 1 || this.has('silence')) return false;
    this.superCharge = 0;
    const over = this.overdrive && this.overCharge >= 1;
    if (over) { this.overCharge = 0; this.addStatus('speed', 4, 0.25); this.addStatus('dr', 4, 0.15); this.world.announce('OVERDRIVE', this.superAct.name, 0xff4dd2, this); }
    this.reveal = 1.5; this.combatT = 0;
    this.setFace(aim);
    this.stats_.supers++;
    execute(this.world, this, this.superAct, { kind: 'super', aim, dist, tx: this.x + aim.x * dist, tz: this.z + aim.z * dist, overdrive: over });
    for (const p of this.hooks) {
      if (p.type === 'shieldOnSuper') this.addShield((p.amt ?? 800) * this._lv, p.t ?? 3);
      if (p.type === 'speedOnSuper') this.addStatus('speed', p.t ?? 3, p.mult ?? 0.25);
      if (p.type === 'healOnSuper') this.world.heal(this, (p.amt ?? 800) * this._lv, this);
    }
    if (this.overdrive && !over) this.overCharge = Math.min(1, this.overCharge + 0.5);
    for (const p of this.hooks) {
      if (p.type === 'superEcho') { const act = this.superAct; this.world.schedule(p.delay ?? 1, () => this.alive && execute(this.world, this, { ...act, dmg: (act.dmg ?? 0) * (p.mult ?? 0.5), anim: null, sfx: null }, { kind: 'super', aim, dist, tx: this.x + aim.x * dist, tz: this.z + aim.z * dist })); }
      if (p.type === 'superHealAllies') for (const u of this.world.alliesInRadius(this.x, this.z, p.r ?? 4, this.team)) this.world.heal(u, (p.amt ?? 800) * this._lv, this);
    }
    this.world.emit('super', this);
    return true;
  }
  useGadget(aim, dist) {
    if (!this.canAct() || this.gadgets <= 0 || this.gadgetCd > 0 || !this.gadgetAct) return false;
    this.gadgets--; this.gadgetCd = 6;
    for (const p of this.hooks) if (p.type === 'gadgetCd') this.gadgetCd *= p.mult;
    this.setFace(aim);
    execute(this.world, this, this.gadgetAct, { kind: 'gadget', aim, dist, tx: this.x + aim.x * dist, tz: this.z + aim.z * dist });
    this.world.announceSmall(this, this.gadgetAct.name, 0x7cffb0);
    return true;
  }
  tryTransform() {
    if (!this.def.trans || (this.transformed && !this.canStage2) || this.transCharge < 1 || !this.alive || this.cinematic >= 0 || this.isStunned()) return false;
    this.cinematic = 0;
    this.addStatus('invuln', 1.1);
    this.world.beginTransform(this);
    return true;
  }
  /** called by world at the peak of the transformation cinematic */
  applyTransform() {
    const T = this.def.trans;
    this.transformed = true; this.form = 'trans'; this.transT = T.duration ?? 14;
    this.stats_.transforms++;
    this.buildModel();
    this.hooks = this.collectHooks();
    if (this.hooks.some(h => h.type === 'infinity')) this.world.infinityUsers.add(this);
    this.recalcStats();
    this.world.heal(this, this.maxHp * (T.heal ?? 0.3), this);
    this.ammo = this.stats.ammo;
    if (T.superOnEnter) this.superCharge = 1;
    if (T.onEnter) execute(this.world, this, T.onEnter, { kind: 'trans', aim: { ...this.liveAim }, dist: 4, tx: this.x, tz: this.z });
  }
  endTransform() {
    if (!this.transformed) return;
    const T = this.def.trans;
    this.transformed = false; this.form = 'base'; this.transCharge = 0;
    this.buildModel();
    this.hooks = this.collectHooks();
    if (!this.hooks.some(h => h.type === 'infinity')) this.world.infinityUsers.delete(this);
    this.recalcStats();
    this.ammo = Math.min(this.ammo, this.stats.ammo);
    this.world.vfx.burst({ x: this.x, y: 0.8, z: this.z }, { count: 30, color: T.aura ?? 0xffffff, speed: 3, life: 0.6 });
    if (T.onExit) execute(this.world, this, T.onExit, { kind: 'trans', aim: { ...this.liveAim }, dist: 3 });
    this.world.announceSmall(this, 'Form endet', 0xaaaaaa);
  }

  setFace(aim) { if (aim && (aim.x || aim.z)) { this.face = Math.atan2(aim.z, aim.x); this.liveAim = { x: aim.x, z: aim.z }; } }

  chargeSuper(x) {
    let m = 1;
    for (const p of this.hooks) if (p.type === 'stat' && p.superRate) m *= p.superRate;
    if (this.formDef?.stats?.superRate) m *= this.formDef.stats.superRate;
    this.superCharge = Math.min(1, this.superCharge + x * m);
  }
  chargeTrans(x) {
    if (!this.def.trans || (this.transformed && !this.canStage2)) return;
    if (this.transformed) x *= 1.4;
    let m = 1; for (const p of this.hooks) if (p.type === 'stat' && p.transRate) m *= p.transRate;
    this.transCharge = Math.min(1, this.transCharge + x * m);
  }

  die(killer) {
    this.alive = false; this.deadT = 0; this.hp = 0;
    this.stats_.deaths++;
    this.dash = null; this.knockV = null;
    this.ring.visible = false;
    if (this.transformed) { this.transformed = false; this.form = 'base'; this.transCharge = 0; }
  }
  respawn(x, z) {
    this.alive = true; this.x = x; this.z = z;
    this.form = 'base'; this.transformed = false;
    this.buildModel(); this.hooks = this.collectHooks(); this.recalcStats();
    this.hp = this.maxHp; this.ammo = this.stats.ammo; this.statuses.clear(); this.shield = 0;
    this.addStatus('invuln', 2);
    this.ring.visible = true; this.container.visible = true;
    this.model.rotation.set(0, -this.face + Math.PI / 2, 0);
    this.rig.root.rotation.x = 0;
    this.carry = null;
  }

  update(dt) {
    const w = this.world;
    // statuses
    for (const [k, s] of this.statuses) {
      s.t -= dt;
      if (k === 'burn' && this.alive) { s.acc = (s.acc ?? 0) + dt; if (s.acc >= 0.5) { s.acc -= 0.5; w.damage(s.src || null, this, s.v * 0.5, { kind: 'dot', gain: 0, noFlash: true, color: 0xff7a2a, dot: true }); } }
      if (s.t <= 0) this.statuses.delete(k);
    }
    if (this.shieldT > 0) { this.shieldT -= dt; if (this.shieldT <= 0) this.shield = 0; }
    this.untargetable = this.has('untargetable');
    if (!this.alive) { this.deadT += dt; this.animate(dt); return; }
    this.combatT += dt; this.reveal = Math.max(0, this.reveal - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.gadgetCd = Math.max(0, this.gadgetCd - dt);
    this.futureSightCd = Math.max(0, this.futureSightCd - dt);
    // reload
    if (this.ammo < this.stats.ammo) {
      let rl = this.stats.reload; rl /= 1 + this.sv('reloadUp', 0);
      this.ammo = Math.min(this.stats.ammo, this.ammo + dt / rl);
    }
    // passive regen (out of combat ~3s like the genre) + hooks
    if (this.combatT > 3 && this.hp < this.maxHp && !this.boss) w.heal(this, this.maxHp * 0.13 * dt, null, true);
    for (const p of this.hooks) {
      if (p.type === 'regen' && this.hp < this.maxHp && this.combatT > (p.delay ?? 0)) w.heal(this, (p.amt ?? 100) * this._lv * dt, null, true);
      if (p.type === 'drain' && this.transformed) { this.hp = Math.max(1, this.hp - this.maxHp * p.perSec * dt); }
      if (p.type === 'burnAura' || p.type === 'slowAura') {
        this.mem.auraT = (this.mem.auraT ?? 0) + dt;
        if (this.mem.auraT > 0.5) { this.mem.auraT = 0; for (const u of w.unitsInRadius(this.x, this.z, p.r ?? 2, this.team)) w.damage(this, u, (p.dps ?? 0) * 0.5 * this._lv, { kind: 'aura', gain: 0, effects: p.type === 'slowAura' ? { slow: { t: 0.6, f: p.f ?? 0.3 } } : { burn: { dps: (p.dps ?? 200) * 0.5, t: 1 } }, noFlash: true, dot: true }); }
      }
    }
    // trans charge over time
    this.chargeTrans(dt / 75);
    if (this.transformed) {
      this.transT -= dt;
      if (this.transT <= 0) this.endTransform();
    }
    if (this.cinematic >= 0) { this.cinematic += dt; }
    // movement
    let vx = 0, vz = 0;
    if (this.dash) {
      const d = this.dash; const step = Math.min(d.speed * dt, d.dist - d.done);
      const nx = this.x + d.dx * step, nz = this.z + d.dz * step;
      let p;
      if (d.ghost) { p = { x: nx, z: nz }; const hw = w.grid.w / 2 - this.r, hh = w.grid.h / 2 - this.r; p.x = Math.max(-hw, Math.min(hw, p.x)); p.z = Math.max(-hh, Math.min(hh, p.z)); }
      else { if (d.breakWalls) w.breakRadius(nx + d.dx * 0.4, nz + d.dz * 0.4, 0.7); p = w.grid.resolve(nx, nz, this.r, d.jump); }
      const moved = Math.hypot(p.x - this.x, p.z - this.z);
      this.x = p.x; this.z = p.z; d.done += step;
      if (d.dmg) for (const u of w.units) {
        if (!u.alive || u.team === this.team || d.hit.has(u) || u.untargetable) continue;
        if (Math.hypot(u.x - this.x, u.z - this.z) < u.r + d.w) {
          d.hit.add(u);
          w.damage(this, u, d.dmg, { kind: d.kind, gain: d.gain, effects: d.effects, dir: { x: d.dx, z: d.dz }, melee: true, color: d.color });
          w.vfx.burst({ x: u.x, y: 0.7, z: u.z }, { count: 12, color: d.color, speed: 5, life: 0.35 });
          if (d.stopOnHit) d.done = d.dist;
        }
      }
      if (d.trail && Math.random() < 0.9) w.vfx.dot(this.x, 0.6 + Math.random() * 0.4, this.z, d.color, 0.45, 0.3);
      if (d.done >= d.dist - 1e-3 || (moved < step * 0.2 && !d.ghost)) {
        const end = d.end; this.dash = null; if (d.jump) w.vfx.ring({ x: this.x, z: this.z }, { color: d.color, r0: 0.3, r1: 1.6 }); end && end();
        if (d.ghost) { const q = w.grid.resolve(this.x, this.z, this.r); this.x = q.x; this.z = q.z; }
      }
    } else if (this.knockV) {
      const k = this.knockV; const step = Math.min(k.speed * dt, k.left);
      const p = w.grid.resolve(this.x + k.x * step, this.z + k.z * step, this.r);
      this.x = p.x; this.z = p.z; k.left -= step; if (k.left <= 0) this.knockV = null;
    } else if (this.canMove()) {
      const m = this.moveIn; const ml = Math.hypot(m.x, m.z);
      if (ml > 0.05) {
        const sp = this.stats.speed * this.speedMult() * Math.min(1, ml);
        vx = (m.x / ml) * sp; vz = (m.z / ml) * sp;
        if (!this.has('channel') && this.action?.t >= 1 !== false) { /* keep facing on attack */ }
        if (!this.aiming) this.face = Math.atan2(vz, vx);
      }
      const p = w.grid.resolve(this.x + vx * dt, this.z + vz * dt, this.r, this.flying);
      this.x = p.x; this.z = p.z;
    }
    this.vel.x = vx; this.vel.z = vz;
    this.inBush = w.grid.isBush(this.x, this.z);
    this.animate(dt);
    // aura while transformed
    const FD = this.formDef;
    if (this.transformed && FD && FD.aura) {
      const a = this.rig.auraAnchor.getWorldPosition(this._tmp || (this._tmp = new THREE.Vector3()));
      if (this.container.visible) w.vfx.auraTick(a, FD.aura, dt, FD.auraIntensity ?? 1, 1.4, FD.auraStyle ?? 'flame');
      if (FD.aura2 && this.container.visible) w.vfx.auraTick(a, FD.aura2, dt, 0.6, 1.4, 'spark');
    }
    for (const p of this.hooks) if (p.type === 'idleShield' && this.combatT > (p.delay ?? 3) && this.shield <= 0) this.addShield((p.amt ?? 600) * this._lv, 999);
    if (this.has('burn') && Math.random() < 0.3) w.vfx.dot(this.x + (Math.random() - 0.5) * 0.4, 0.5 + Math.random() * 0.6, this.z + (Math.random() - 0.5) * 0.4, 0xff7a2a, 0.3, 0.4, 0, 1.5, 0);
    if (this.isStunned() && Math.random() < 0.2) w.vfx.dot(this.x + Math.cos(w.time * 8) * 0.35, this.rig.height + 0.15, this.z + Math.sin(w.time * 8) * 0.35, 0xffee66, 0.22, 0.25);
  }

  animate(dt) {
    if (this.action) { this.action.t += dt / this.action.dur; if (this.action.t >= 1) this.action = null; }
    this.hitT += dt;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    const st = {
      move: this.dash ? 0 : Math.min(1, sp / (this.stats.speed * 0.8)), speed: sp / 3.2,
      action: this.action, hitT: this.hitT, dead: !this.alive, deadT: this.deadT,
      transformT: this.cinematic >= 0 ? this.cinematic / 1.0 : -1,
      stunned: this.isStunned(), victory: this.victory, pose: this.def.victory,
    };
    animate(this.rig, dt, st);
    this.container.position.set(this.x, 0, this.z);
    // smooth facing
    const target = -this.face + Math.PI / 2;
    let d = target - this.model.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    this.model.rotation.y += d * Math.min(1, dt * 18);
    if (this.rig.type === 'dragon') this.model.rotation.y = target;
  }
  flash() { flashRig(this.rig); this.hitT = 0; }
  dispose() { this.world.scene.remove(this.container); }
}

// ---------------------------------------------------------------------------
// Minions: summons such as shikigami, clones, Rika, Pain's paths.
export class Minion extends Unit {
  constructor(world, owner, def, x, z) {
    super();
    this.kind = 'minion';
    this.world = world; this.owner = owner; this.def = def; this.team = owner.team;
    this.x = x; this.z = z; this.r = def.r ?? 0.4;
    this.maxHp = (def.hp ?? 1500) * owner.hpMult(); this.hp = this.maxHp;
    this.life = def.life ?? 10; this.cd = 0.5; this.face = owner.face;
    this.name = def.name || 'Beschwörung';
    const look = def.look === 'owner' ? lookFor(owner.def, owner.skin, owner.form) : def.look;
    const { group, rig } = buildCharacter({ ...look, scale: (look.scale ?? 1) * (def.scale ?? 1) });
    this.model = group; this.rig = rig;
    this.container = new THREE.Group(); this.container.add(group);
    if (def.ghost) group.traverse(o => { if (o.material && !o.userData.isOutline && o.material.transparent !== undefined) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.75; } });
    world.scene.add(this.container);
    this.container.position.set(x, 0, z);
    this.action = null; this.hitT = 9; this.deadT = 0;
    world.vfx.burst({ x, y: 0.6, z }, { count: 20, color: def.color ?? 0xb48cff, speed: 3, life: 0.5 });
  }
  hpMult() { return this.owner.hpMult(); }
  dmgMult() { return this.owner.dmgMult(); }
  currentAim(ctx) { return ctx.aim; }
  playAnim(name, dur) { this.action = { name, t: 0, dur }; }
  nudge() {}
  canAct() { return this.alive; }
  chargeSuper(x) { this.owner.chargeSuper && this.owner.chargeSuper(x * 0.5); }
  chargeTrans() {}
  addShield() {}
  flash() { flashRig(this.rig); this.hitT = 0; }
  knock(dx, dz, dist) { const l = Math.hypot(dx, dz) || 1; const p = this.world.grid.resolve(this.x + dx / l * dist * 0.5, this.z + dz / l * dist * 0.5, this.r); this.x = p.x; this.z = p.z; }
  die() { this.alive = false; }
  update(dt) {
    const w = this.world;
    for (const [k, s] of this.statuses) { s.t -= dt; if (s.t <= 0) this.statuses.delete(k); }
    this.life -= dt;
    if (this.life <= 0 || !this.owner) { this.alive = false; }
    if (!this.alive) return;
    this.cd -= dt;
    const d = this.def;
    let target = w.nearestEnemy(this.team, this.x, this.z, d.aggro ?? 8, true);
    let vx = 0, vz = 0;
    if (d.follow && !target) { const dx = this.owner.x - this.x, dz = this.owner.z - this.z; const L = Math.hypot(dx, dz); if (L > 1.5) { vx = dx / L; vz = dz / L; } }
    if (target) {
      const dx = target.x - this.x, dz = target.z - this.z; const L = Math.hypot(dx, dz) || 1;
      this.face = Math.atan2(dz, dx);
      const range = d.attack?.range ?? 1.3;
      if (L > range * 0.85 && !this.isStunned() && !d.stationary) { vx = dx / L; vz = dz / L; }
      if (L <= range + target.r && this.cd <= 0 && !this.isStunned()) {
        this.cd = d.rate ?? 1;
        execute(w, this, d.attack, { kind: 'minion', aim: { x: dx / L, z: dz / L }, dist: L, tx: target.x, tz: target.z });
      }
    }
    const sp = (d.speed ?? 3) * (this.has('slow') ? 0.6 : 1);
    if (!this.isStunned()) { const p = w.grid.resolve(this.x + vx * sp * dt, this.z + vz * sp * dt, this.r, d.fly); this.x = p.x; this.z = p.z; }
    if (this.action) { this.action.t += dt / this.action.dur; if (this.action.t >= 1) this.action = null; }
    this.hitT += dt;
    animate(this.rig, dt, { move: vx || vz ? 1 : 0, speed: 1, action: this.action, hitT: this.hitT });
    this.container.position.set(this.x, d.fly ? 0.4 : 0, this.z);
    this.model.rotation.y = -this.face + Math.PI / 2;
    if (d.aura) w.vfx.auraTick({ x: this.x, y: 0.9, z: this.z }, d.aura, dt, 0.5);
  }
  dispose() { this.world.scene.remove(this.container); this.world.vfx.burst({ x: this.x, y: 0.6, z: this.z }, { count: 14, color: this.def.color ?? 0xb48cff, speed: 3, life: 0.5 }); }
}

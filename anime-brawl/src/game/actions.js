// Ability primitives. Every attack, super, gadget and transformation move in
// the roster is data composed from these kinds; truly unique mechanics live in
// specials.js and are referenced with kind:'custom'.
import { projectileMesh } from '../render/vfx.js';
import { SPECIALS } from './specials.js';

const TAU = Math.PI * 2;
export const angOf = (dx, dz) => Math.atan2(dz, dx);
export const rot = (dx, dz, a) => ({ x: dx * Math.cos(a) - dz * Math.sin(a), z: dx * Math.sin(a) + dz * Math.cos(a) });

/**
 * ctx: { kind:'main'|'super'|'gadget'|'trans', aim:{x,z} unit, dist, tx, tz (target point), overdrive }
 */
export function execute(world, src, act, ctx) {
  if (!act) return;
  const k = act.kind;
  if (act.anim) src.playAnim(act.anim, act.animDur ?? (k === 'beam' ? 0.9 : 0.4));
  if (act.sfx) world.sfx(act.sfx, src);
  if (act.selfBuff) applyBuff(world, src, act.selfBuff);
  if (act.delay) { const a2 = { ...act, delay: 0, anim: null, sfx: null, selfBuff: null }; world.schedule(act.delay, () => src.alive && execute(world, src, a2, ctx)); return; }
  const fn = KINDS[k];
  if (!fn) { console.warn('unknown action kind', k); return; }
  fn(world, src, act, ctx);
}

function gainPer(src, act, ctx, expected) {
  if (ctx.kind !== 'main') return 0;
  const sh = src.stats.superHits || 4;
  return 1 / sh / Math.max(1, expected);
}

function scaled(src, act, ctx) {
  let d = (act.dmg ?? 0) * src.dmgMult();
  if (ctx.overdrive) d *= 1.25;
  return d;
}

// ---------------------------------------------------------------------------
export class Projectile {
  constructor(world, src, act, ctx, x, z, dx, dz, dmg, gain) {
    this.world = world; this.src = src; this.team = src.team; this.act = act; this.ctx = ctx;
    this.x = x; this.z = z; this.y = act.y ?? 0.65;
    this.dx = dx; this.dz = dz;
    this.speed = act.speed ?? 14;
    this.range = act.range ?? 7;
    this.travel = 0;
    this.r = act.w ?? 0.25;
    this.dmg = dmg; this.gain = gain;
    this.hit = new Set();
    this.bounces = act.bounce ?? 0;
    this.alive = true;
    this.t = 0;
    this.returning = false;
    this.mesh = projectileMesh(act.shape || 'orb', act.color ?? 0xffffff, act.size ?? this.r * 1.4, act.color2);
    this.mesh.position.set(x, this.y, z);
    this.mesh.rotation.y = -angOf(dx, dz);
    world.scene.add(this.mesh);
    this.homingTarget = null;
  }
  update(dt) {
    const a = this.act, w = this.world;
    this.t += dt;
    // homing
    if (a.homing) {
      if (!this.homingTarget || !this.homingTarget.alive) this.homingTarget = w.nearestEnemy(this.src.team, this.x, this.z, a.homingRange ?? 6, true);
      const t = this.homingTarget;
      if (t) {
        const want = angOf(t.x - this.x, t.z - this.z), cur = angOf(this.dx, this.dz);
        let d = want - cur; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
        const turn = Math.max(-a.homing * dt, Math.min(a.homing * dt, d));
        const r = rot(this.dx, this.dz, turn); this.dx = r.x; this.dz = r.z;
      }
    }
    let sp = this.speed;
    if (a.accel) sp = this.speed = this.speed + a.accel * dt;
    // Infinity: projectiles slow down near an Infinity user
    for (const u of w.infinityUsers) {
      if (u.team === this.team || !u.alive) continue;
      const d = Math.hypot(u.x - this.x, u.z - this.z);
      if (d < 1.6) sp *= 0.25 + 0.75 * (d / 1.6);
    }
    let mx = this.dx * sp * dt, mz = this.dz * sp * dt;
    if (a.wave) { const n = { x: -this.dz, z: this.dx }; const off = Math.cos(this.t * a.wave.freq) * a.wave.amp * a.wave.freq * dt * (this.ctx.waveSign ?? 1); mx += n.x * off; mz += n.z * off; }
    const nx = this.x + mx, nz = this.z + mz;
    // walls
    if (!a.pierceWalls && w.grid.blocksShot(nx, nz)) {
      const tx = w.grid.tx(nx), ty = w.grid.ty(nz);
      if (w.grid.get(tx, ty) === 'X') { if (w.grid.damageCrate(tx, ty, this.dmg)) w.onTileDestroyed(tx, ty); }
      if (a.breakWalls) { w.breakTile(tx, ty); }
      if (this.bounces > 0) {
        this.bounces--;
        const bx = w.grid.blocksShot(nx, this.z), bz = w.grid.blocksShot(this.x, nz);
        if (bx || (!bx && !bz)) this.dx = -this.dx;
        if (bz || (!bx && !bz)) this.dz = -this.dz;
        this.hit.clear();
        return;
      }
      return this.die(true);
    }
    this.x = nx; this.z = nz;
    this.travel += Math.hypot(mx, mz);
    // units
    const grow = a.grow ? 1 + (this.travel / this.range) * a.grow : 1;
    const rr = this.r * grow;
    for (const u of w.units) {
      if (!u.alive || u.team === this.team || this.hit.has(u) || u.untargetable) continue;
      const d = Math.hypot(u.x - this.x, u.z - this.z);
      if (d < u.r + rr) {
        this.hit.add(u);
        this.onHit(u);
        if (!a.pierce) return this.die(false);
      }
    }
    if (this.travel >= this.range) {
      if (a.boomerang && !this.returning) { this.returning = true; this.travel = 0; this.dx = -this.dx; this.dz = -this.dz; this.hit.clear(); this.range = this.range; return; }
      return this.die(true);
    }
    if (a.special) SPECIALS[a.special]?.onProjTick?.(w, this.src, this);
    // visuals
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.y = -angOf(this.dx, this.dz);
    if (this.mesh.userData.spin) this.mesh.rotation.y += this.t * this.mesh.userData.spin;
    if (grow !== 1) this.mesh.scale.setScalar(grow);
    if (this.mesh.userData.pulse) this.mesh.userData.pulse.scale.setScalar((a.size ?? this.r * 1.4) * (1 + Math.sin(this.t * 30) * 0.12));
    if (this.mesh.userData.fres) this.mesh.userData.fres.uniforms.uTime.value = this.t;
    if (a.trail !== false && Math.random() < 0.85) {
      w.vfx.dot(this.x - this.dx * 0.2 + (Math.random() - 0.5) * 0.15, this.y + (Math.random() - 0.5) * 0.15, this.z - this.dz * 0.2 + (Math.random() - 0.5) * 0.15, a.trailColor ?? a.color ?? 0xffffff, (a.size ?? 0.3) * 0.9, 0.25);
    }
  }
  onHit(u) {
    const a = this.act, w = this.world;
    let dmg = this.dmg;
    if (a.falloff) dmg *= 1 - a.falloff * Math.min(1, this.travel / this.range);
    if (a.rampUp) dmg *= 1 + a.rampUp * Math.min(1, this.travel / this.range);
    w.damage(this.src, u, dmg, { kind: this.ctx.kind, gain: this.gain, effects: a.effects, dir: { x: this.dx, z: this.dz }, proj: true, color: a.color, sweet: this.travel / this.range });
    if (a.hitFx !== false) w.vfx.burst({ x: u.x, y: 0.7, z: u.z }, { count: 10, color: a.color ?? 0xffffff, color2: a.color2, speed: 4, life: 0.35, size: 0.3 });
    if (a.chain) chainFrom(w, this.src, u, a.chain, this.ctx);
    if (a.onHitAction) execute(w, this.src, a.onHitAction, { ...this.ctx, tx: u.x, tz: u.z, aim: { x: this.dx, z: this.dz }, hitUnit: u });
    if (a.special) SPECIALS[a.special]?.onProjHit?.(w, this.src, u, this);
  }
  die(atWall) {
    if (!this.alive) return;
    this.alive = false;
    const a = this.act, w = this.world;
    if (a.explode) {
      const e = a.explode;
      w.vfx.explosion({ x: this.x, y: 0.5, z: this.z }, e.r, e.color ?? a.color ?? 0xffaa33, e.color2 ?? 0xffffff);
      for (const u of w.unitsInRadius(this.x, this.z, e.r, this.team)) {
        if (this.hit.has(u) && !e.always) continue;
        w.damage(this.src, u, e.dmg !== undefined ? e.dmg * this.src.dmgMult() : this.dmg, { kind: this.ctx.kind, gain: this.gain * 0.5, effects: e.effects, dir: { x: u.x - this.x, z: u.z - this.z } });
      }
      if (e.breakWalls) w.breakRadius(this.x, this.z, e.r * 0.6);
      w.sfx('explode', this);
    }
    if (a.split) {
      for (let i = 0; i < a.split.n; i++) {
        const ang = (i / a.split.n) * TAU;
        const sub = { ...a, ...a.split.proj, split: null, explode: null };
        const p = new Projectile(w, this.src, sub, this.ctx, this.x, this.z, Math.cos(ang), Math.sin(ang), (a.split.dmg ?? this.dmg * 0.4) * this.src.dmgMult(), 0);
        for (const h of this.hit) p.hit.add(h);
        w.projectiles.push(p);
      }
    }
    if (a.onEnd) execute(w, this.src, a.onEnd, { ...this.ctx, tx: this.x, tz: this.z, aim: { x: this.dx, z: this.dz } });
    if (a.special) SPECIALS[a.special]?.onProjEnd?.(w, this.src, this);
    if (!a.explode) w.vfx.burst({ x: this.x, y: this.y, z: this.z }, { count: 6, color: a.color ?? 0xffffff, speed: 2, life: 0.25, size: 0.25 });
    w.scene.remove(this.mesh);
  }
}

export function chainFrom(w, src, from, chain, ctx) {
  let cur = from; const hit = new Set([from]);
  let extra = 0; for (const p of src.hooks || []) if (p.type === 'chainBoost') extra += p.r ?? 1;
  for (let i = 0; i < chain.n; i++) {
    let best = null, bd = (chain.r ?? 3.5) + extra;
    for (const u of w.units) { if (!u.alive || u.team === src.team || hit.has(u)) continue; const d = Math.hypot(u.x - cur.x, u.z - cur.z); if (d < bd) { bd = d; best = u; } }
    if (!best) break;
    hit.add(best);
    w.vfx.lightning({ x: cur.x, y: 0.7, z: cur.z }, { x: best.x, y: 0.7, z: best.z }, { color: chain.color ?? 0x9fdcff });
    w.damage(src, best, (chain.dmg ?? 300) * src.dmgMult(), { kind: ctx.kind, gain: 0, effects: chain.effects });
    cur = best;
  }
}

export function applyBuff(world, u, b, source = null) {
  const t = b.t ?? 3;
  if (b.speed) u.addStatus('speed', t, b.speed);
  if (b.dmg) u.addStatus('dmgUp', t, b.dmg);
  if (b.reload) u.addStatus('reloadUp', t, b.reload);
  if (b.dr) u.addStatus('dr', t, b.dr);
  if (b.invuln) u.addStatus('invuln', b.invuln);
  if (b.untargetable) u.addStatus('untargetable', b.untargetable);
  if (b.shield) u.addShield(b.shield * (source ? source.hpMult() : u.hpMult()), t);
  if (b.heal) world.heal(u, b.heal * (source ? source.hpMult() : u.hpMult()), source);
  if (b.healPct) world.heal(u, u.maxHp * b.healPct, source);
  if (b.lifesteal) u.addStatus('lifesteal', t, b.lifesteal);
  if (b.invis) u.addStatus('invis', b.invis);
  if (b.dodge) u.addStatus('dodge', t, b.dodge);
  if (b.ammo) u.ammo = Math.min(u.stats.ammo, u.ammo + b.ammo);
  if (b.superCharge) u.chargeSuper(b.superCharge);
  if (b.cleanse) u.cleanse();
  if (b.fx !== false) world.vfx.ring({ x: u.x, z: u.z }, { color: b.color ?? 0x7cffb0, r0: 0.3, r1: 1.2, life: 0.35 });
}

// ---------------------------------------------------------------------------
const KINDS = {
  proj(w, src, a, ctx) {
    let count = a.count ?? 1;
    if (ctx.kind === 'main' && src.hooks) {
      for (const p of src.hooks) {
        if (p.type === 'extraProj') count += p.add ?? 1;
        if (p.type === 'rangeBoost' && typeof a.range === 'number') a = { ...a, range: a.range + (p.add ?? 1) };
      }
    }
    const spread = ((a.spread ?? 0) * Math.PI) / 180;
    const fire = (burstIdx) => {
      if (!src.alive) return;
      const aim = src.currentAim(ctx);
      for (let i = 0; i < count; i++) {
        const off = count === 1 ? (a.jitter ? (Math.random() - 0.5) * a.jitter * Math.PI / 180 : 0) : -spread / 2 + (spread * i) / (count - 1);
        const d = rot(aim.x, aim.z, off + (a.burstSpread ? (burstIdx % 2 ? 1 : -1) * a.burstSpread * Math.PI / 180 : 0));
        const ox = src.x + d.x * 0.45, oz = src.z + d.z * 0.45;
        const p = new Projectile(w, src, a, { ...ctx, waveSign: i % 2 ? -1 : 1 }, ox, oz, d.x, d.z, scaled(src, a, ctx), gainPer(src, a, ctx, (a.burst?.n ?? 1) * count * (a.gainDiv ?? 1)));
        if (a.range === 'aim') p.range = Math.max(1.5, Math.min(a.maxRange ?? 9, ctx.dist ?? 6));
        w.projectiles.push(p);
      }
      if (a.muzzle !== false) w.vfx.burst({ x: src.x + aim.x * 0.6, y: 0.7, z: src.z + aim.z * 0.6 }, { count: 4, color: a.color ?? 0xffffff, speed: 2, life: 0.2, size: 0.25 });
    };
    if (a.burst) { for (let b = 0; b < a.burst.n; b++) w.schedule(b * a.burst.gap, () => { fire(b); if (b > 0 && a.sfx) w.sfx(a.sfx, src, 0.6); }); }
    else fire(0);
  },

  cone(w, src, a, ctx) {
    const hits = a.hits ?? 1;
    const doHit = (i) => {
      if (!src.alive) return;
      const aim = src.currentAim(ctx);
      if (a.lunge && i === 0) src.nudge(aim.x * a.lunge, aim.z * a.lunge);
      const range = a.range ?? 1.8, arc = ((a.arc ?? 90) * Math.PI) / 180;
      const ang = angOf(aim.x, aim.z);
      w.vfx.slash({ x: src.x, y: 0.6, z: src.z }, ang, { color: a.color ?? 0xffffff, r: range, arc: Math.min(arc + 0.3, 6.2), life: 0.2, tilt: (i % 2 ? 0.25 : -0.25) });
      let any = false;
      for (const u of w.units) {
        if (!u.alive || u.team === src.team || u.untargetable) continue;
        const dx = u.x - src.x, dz = u.z - src.z, d = Math.hypot(dx, dz);
        if (d > range + u.r) continue;
        let da = angOf(dx, dz) - ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
        if (Math.abs(da) > arc / 2 + 0.15 && d > u.r + 0.3) continue;
        if (!a.throughWalls && !w.grid.los(src.x, src.z, u.x, u.z)) continue;
        any = true;
        const m = a.finisher && i === hits - 1 ? a.finisher : 1;
        w.damage(src, u, scaled(src, a, ctx) * m, { kind: ctx.kind, gain: gainPer(src, a, ctx, hits), effects: i === hits - 1 ? a.effects : a.effectsEach, dir: { x: dx, z: dz }, melee: true, color: a.color, sweet: d / range });
        if (a.special) SPECIALS[a.special]?.onMeleeHit?.(w, src, u, i, hits);
        w.vfx.burst({ x: u.x, y: 0.7, z: u.z }, { count: 8, color: a.color ?? 0xffffff, speed: 4, life: 0.3, size: 0.28, dir: { x: dx, z: dz }, spread: 0.8 });
      }
      if (a.breakWalls) w.breakArc(src.x, src.z, ang, range, arc);
      if (any) w.hitStop(0.035);
      if (i > 0 && a.sfx) w.sfx(a.sfx, src, 0.7);
    };
    for (let i = 0; i < hits; i++) { if (i === 0) doHit(0); else w.schedule(i * (a.gap ?? 0.12), () => doHit(i)); }
  },

  dash(w, src, a, ctx) {
    const aim = src.currentAim(ctx);
    const dist = a.dist === 'aim' ? Math.min(a.maxDist ?? 6, ctx.dist ?? 5) : (a.dist ?? 4);
    src.startDash({
      dx: aim.x, dz: aim.z, dist, speed: a.speed ?? 18, w: a.w ?? 0.7,
      dmg: scaled(src, a, ctx), effects: a.effects, gain: gainPer(src, a, ctx, 1), kind: ctx.kind,
      invuln: a.invuln ?? false, color: a.color ?? 0xffffff, stopOnHit: a.stopOnHit, trail: a.trail ?? true,
      end: a.end ? () => execute(w, src, a.end, { ...ctx, aim: { x: aim.x, z: aim.z }, tx: src.x, tz: src.z }) : null,
      ghost: a.ghost, jump: a.jump, breakWalls: a.breakWalls,
    });
  },

  beam(w, src, a, ctx) {
    const ticks = a.ticks ?? 1;
    if (ctx.kind === 'main' && src.hooks) for (const p of src.hooks) if (p.type === 'rangeBoost') a = { ...a, range: (a.range ?? 8) + (p.add ?? 1) };
    const doTick = (i) => {
      if (!src.alive || src.isStunned()) return;
      const aim = (a.track !== false && ticks > 1 && src.liveAim) ? src.liveAim : src.currentAim(ctx);
      const len = a.pierceWalls ? a.range : w.grid.rayDist(src.x, src.z, aim.x, aim.z, a.range ?? 8);
      const ex = src.x + aim.x * len, ez = src.z + aim.z * len;
      w.vfx.beam({ x: src.x + aim.x * 0.4, y: 0.7, z: src.z + aim.z * 0.4 }, { x: ex, y: 0.7, z: ez }, { color: a.color ?? 0x66ccff, core: a.color2 ?? 0xffffff, width: (a.w ?? 0.4) * 1.2, life: Math.max(0.12, (a.gap ?? 0.1) * 1.6) });
      if (i === 0 || i === ticks - 1) w.vfx.burst({ x: ex, y: 0.7, z: ez }, { count: 12, color: a.color ?? 0x66ccff, speed: 5, life: 0.35 });
      for (const u of w.units) {
        if (!u.alive || u.team === src.team || u.untargetable) continue;
        const px = u.x - src.x, pz = u.z - src.z;
        const t = px * aim.x + pz * aim.z;
        if (t < 0 || t > len + u.r) continue;
        const perp = Math.abs(px * aim.z - pz * aim.x);
        if (perp > (a.w ?? 0.4) + u.r) continue;
        w.damage(src, u, scaled(src, a, ctx), { kind: ctx.kind, gain: gainPer(src, a, ctx, ticks), effects: i === ticks - 1 ? a.effects : a.effectsEach, dir: aim, color: a.color, proj: true, sweet: t / len });
        if (a.chainOnHit) chainFrom(w, src, u, a.chainOnHit, ctx);
      }
      if (a.breakWalls) w.breakLine(src.x, src.z, aim.x, aim.z, len + 0.5, a.w ?? 0.4);
      if (a.recoil) src.nudge(-aim.x * a.recoil, -aim.z * a.recoil);
    };
    const charge = a.charge ?? 0;
    if (a.root !== false && ticks > 1) src.addStatus('rooted', charge + ticks * (a.gap ?? 0.1));
    if (charge) {
      src.addStatus('channel', charge);
      const aim0 = src.currentAim(ctx);
      w.vfx.sphere({ x: src.x + aim0.x * 0.6, y: 0.7, z: src.z + aim0.z * 0.6 }, { color: a.color ?? 0x66ccff, r0: 0.6, r1: 0.1, life: charge, opacity: 0.9 });
    }
    for (let i = 0; i < ticks; i++) w.schedule(charge + i * (a.gap ?? 0.1), () => doTick(i));
  },

  aoe(w, src, a, ctx) {
    const aim = src.currentAim(ctx);
    let dist = a.self ? 0 : a.fixed ? a.range : Math.min(a.range ?? 7, ctx.dist ?? a.range ?? 7);
    let x = a.self ? src.x : ((ctx.tx !== undefined && (ctx.useTarget || a.useTarget)) ? ctx.tx : src.x + aim.x * dist);
    let z = a.self ? src.z : ((ctx.tz !== undefined && (ctx.useTarget || a.useTarget)) ? ctx.tz : src.z + aim.z * dist);
    if (a.scatter) { const ang = Math.random() * TAU, rr = Math.random() * a.scatter; x += Math.cos(ang) * rr; z += Math.sin(ang) * rr; }
    const r = a.r ?? 1.6;
    const delay = a.landDelay ?? 0.5;
    if (delay > 0) w.vfx.telegraph({ x, z }, r, { color: src.team === w.playerTeam ? 0x3fb6ff : 0xff3b4c, life: delay });
    if (a.lob && delay > 0) {
      const m = projectileMesh(a.shape || 'orb', a.color ?? 0xffaa33, a.size ?? 0.35, a.color2);
      w.scene.add(m);
      const sx = src.x, sz = src.z; let t = 0;
      w.tween(delay, (k) => { t = k; m.position.set(sx + (x - sx) * k, 0.7 + Math.sin(k * Math.PI) * (a.arcH ?? 2.5), sz + (z - sz) * k); }, () => w.scene.remove(m));
    }
    w.schedule(delay, () => {
      if (a.needsAlive && !src.alive) return;
      const style = a.fx ?? 'explode';
      if (style === 'explode') w.vfx.explosion({ x, y: 0.4, z }, r, a.color ?? 0xffaa33, a.color2 ?? 0xffffff);
      else if (style === 'pillar') { w.vfx.pillar({ x, z }, { color: a.color, r: r * 0.7, h: 7, life: 0.5 }); w.vfx.ring({ x, z }, { color: a.color, r0: 0.2, r1: r * 1.2, life: 0.4 }); w.vfx.burst({ x, y: 0.5, z }, { count: 26, color: a.color, color2: a.color2, speed: 6, up: 1.4, life: 0.6 }); w.vfx.shake(0.25); }
      else if (style === 'lightning') { w.vfx.lightning({ x: x + 0.3, y: 9, z: z - 1 }, { x, y: 0, z }, { color: a.color ?? 0xbfe6ff, width: 0.12, life: 0.25, segs: 10, jag: 0.8 }); w.vfx.ring({ x, z }, { color: a.color, r0: 0.2, r1: r * 1.2 }); w.vfx.burst({ x, y: 0.4, z }, { count: 20, color: a.color, speed: 6, life: 0.4 }); w.vfx.shake(0.2); }
      else if (style === 'ring') { w.vfx.ring({ x, z }, { color: a.color, r0: 0.3, r1: r, life: 0.45 }); w.vfx.burst({ x, y: 0.5, z }, { count: 18, color: a.color, speed: r * 3, up: 0.3, life: 0.45 }); }
      else if (style === 'slashes') { for (let i = 0; i < 6; i++) w.vfx.slash({ x: x + (Math.random() - 0.5) * r, y: 0.5, z: z + (Math.random() - 0.5) * r }, Math.random() * TAU, { color: a.color, r: r * 0.7, arc: 1.4, life: 0.25 }); }
      for (const u of w.unitsInRadius(x, z, r, src.team)) {
        const dx = u.x - x, dz = u.z - z;
        w.damage(src, u, scaled(src, a, ctx), { kind: ctx.kind, gain: gainPer(src, a, ctx, 1), effects: a.effects, dir: { x: dx || aim.x, z: dz || aim.z }, color: a.color });
      }
      if (a.healAllies) for (const u of w.alliesInRadius(x, z, r, src.team)) w.heal(u, a.healAllies * src.hpMult(), src);
      if (a.breakWalls) w.breakRadius(x, z, r * 0.8);
      if (a.linger) w.addZone({ x, z, r, team: src.team, src, t: a.linger.t, tick: a.linger.tick ?? 0.5, dmg: (a.linger.dmg ?? 0) * src.dmgMult(), effects: a.linger.effects, color: a.linger.color ?? a.color, heal: a.linger.heal ? a.linger.heal * src.hpMult() : 0, kind: ctx.kind, pull: a.linger.pull, slowProj: a.linger.slowProj });
      if (a.after) execute(w, src, a.after, { ...ctx, tx: x, tz: z, useTarget: true });
    });
  },

  nova(w, src, a, ctx) {
    let r = a.r ?? 2.5;
    if (ctx.kind === 'super' && src.hooks) for (const p of src.hooks) if (p.type === 'superRadius') r += p.add ?? 0.5;
    const x = src.x, z = src.z;
    w.vfx.ring({ x, z }, { color: a.color ?? 0xffffff, r0: 0.3, r1: r * 1.1, life: 0.45 });
    w.vfx.sphere({ x, y: 0.6, z }, { color: a.color ?? 0xffffff, r0: 0.3, r1: r * 0.8, life: 0.3, opacity: 0.45 });
    w.vfx.burst({ x, y: 0.6, z }, { count: 30, color: a.color ?? 0xffffff, color2: a.color2, speed: r * 4, life: 0.5, up: 0.3 });
    w.vfx.shake(0.12 + r * 0.04);
    for (const u of w.unitsInRadius(x, z, r, src.team)) {
      w.damage(src, u, scaled(src, a, ctx), { kind: ctx.kind, gain: gainPer(src, a, ctx, 1), effects: a.effects, dir: { x: u.x - x, z: u.z - z }, color: a.color });
    }
    if (a.breakWalls) w.breakRadius(x, z, r * 0.8);
    if (a.healAllies) for (const u of w.alliesInRadius(x, z, r, src.team)) w.heal(u, a.healAllies * src.hpMult(), src);
    if (a.buffAllies) for (const u of w.alliesInRadius(x, z, r, src.team)) applyBuff(w, u, a.buffAllies, src);
  },

  domain(w, src, a, ctx) {
    const r = a.r ?? 4;
    const x = src.x, z = src.z;
    w.announce(a.title ?? 'Domain Expansion', a.subtitle ?? '', a.color ?? 0x7a4cff, src);
    w.vfx.domain({ x, z }, r, { color: a.color, color2: a.color2, particle: a.particle, life: a.t ?? 4 });
    w.vfx.shake(0.4);
    w.addZone({ x, z, r, team: src.team, src, t: a.t ?? 4, tick: a.tick ?? 0.5, dmg: (a.dps ?? 300) * (a.tick ?? 0.5) * src.dmgMult() * (ctx.overdrive ? 1.25 : 1), effects: a.effects, effectsOnce: a.onEnter, color: null, kind: ctx.kind, domain: true, selfBuff: a.ownerBuff, slowProj: a.slowProj, healOwner: a.healOwner, slashes: a.slashFx ? a.color2 ?? 0xffffff : 0, pull: a.pull, trap: a.trap });
    if (a.burst) for (const u of w.unitsInRadius(x, z, r, src.team)) w.damage(src, u, a.burst * src.dmgMult(), { kind: ctx.kind, gain: 0, effects: a.burstEffects });
  },

  summon(w, src, a, ctx) {
    const aim = src.currentAim(ctx);
    const n = a.count ?? 1;
    for (let i = 0; i < n; i++) {
      const off = n === 1 ? 0 : (i - (n - 1) / 2) * 1.0;
      const px = src.x + aim.x * (a.dist ?? 1.2) - aim.z * off, pz = src.z + aim.z * (a.dist ?? 1.2) + aim.x * off;
      w.spawnMinion(src, a.unit, px, pz, ctx);
    }
  },

  buff(w, src, a, ctx) {
    const targets = a.allies ? w.alliesInRadius(src.x, src.z, a.r ?? 4, src.team) : [src];
    for (const u of targets) applyBuff(w, u, a.buff ?? a, src);
    if (a.aura) w.vfx.pillar({ x: src.x, z: src.z }, { color: a.aura, r: 0.8, h: 4, life: 0.5 });
  },

  blink(w, src, a, ctx) {
    const aim = src.currentAim(ctx);
    const dist = a.dist === 'aim' ? Math.min(a.maxDist ?? 7, ctx.dist ?? 5) : (a.dist ?? 4);
    const from = { x: src.x, z: src.z };
    let tx = src.x + aim.x * dist, tz = src.z + aim.z * dist;
    if (a.behindTarget) {
      const t = w.nearestEnemy(src.team, tx, tz, 3.5, true) || w.nearestEnemy(src.team, src.x, src.z, a.maxDist ?? 7, true);
      if (t) { const d = Math.hypot(t.x - src.x, t.z - src.z) || 1; tx = t.x + ((t.x - src.x) / d) * 0.9; tz = t.z + ((t.z - src.z) / d) * 0.9; }
    }
    const p = w.findWalkable(tx, tz, src.x, src.z);
    w.vfx.burst({ x: src.x, y: 0.7, z: src.z }, { count: 18, color: a.color ?? 0xffffff, speed: 3, life: 0.4 });
    if (a.afterimage !== false) w.afterimage(src);
    src.teleport(p.x, p.z);
    w.vfx.burst({ x: p.x, y: 0.7, z: p.z }, { count: 18, color: a.color ?? 0xffffff, speed: 3, life: 0.4 });
    if (a.lineDmg) { // damage everything along the path (flash step slash)
      const dx = p.x - from.x, dz = p.z - from.z, L = Math.hypot(dx, dz) || 1;
      w.vfx.beam({ x: from.x, y: 0.6, z: from.z }, { x: p.x, y: 0.6, z: p.z }, { color: a.color ?? 0xffffff, width: 0.15, life: 0.25 });
      for (const u of w.units) {
        if (!u.alive || u.team === src.team) continue;
        const px = u.x - from.x, pz = u.z - from.z, t = (px * dx + pz * dz) / L;
        if (t < 0 || t > L) continue;
        if (Math.abs(px * dz / L - pz * dx / L) < u.r + 0.6) w.damage(src, u, (a.lineDmg) * src.dmgMult(), { kind: ctx.kind, gain: gainPer(src, a, ctx, 1), effects: a.effects, dir: { x: dx, z: dz } });
      }
    }
    if (a.then) execute(w, src, a.then, { ...ctx, aim, tx: p.x, tz: p.z });
  },

  wall(w, src, a, ctx) {
    const aim = src.currentAim(ctx);
    const d = Math.min(a.range ?? 3, ctx.dist ?? 3);
    const cx = src.x + aim.x * d, cz = src.z + aim.z * d;
    const n = a.len ?? 5;
    const px = -aim.z, pz = aim.x;
    const cells = [];
    for (let i = 0; i < n; i++) {
      const o = i - (n - 1) / 2;
      const wx = cx + px * o, wz = cz + pz * o;
      const tx = w.grid.tx(wx), ty = w.grid.ty(wz);
      if (w.units.some(u => u.alive && w.grid.tx(u.x) === tx && w.grid.ty(u.z) === ty)) continue;
      cells.push({ tx, ty });
    }
    w.addTempWalls(cells, a.t ?? 5, a.color ?? 0x8a6a3a, a.style ?? 'wood');
  },

  hook(w, src, a, ctx) {
    // projectile that pulls the target (or pulls the user to the target)
    const proj = { ...a, kind: 'proj', pierce: false, special: a.selfPull ? 'hookSelf' : 'hookPull' };
    KINDS.proj(w, src, proj, ctx);
  },

  trap(w, src, a, ctx) {
    const aim = src.currentAim(ctx);
    const d = Math.min(a.range ?? 4, ctx.dist ?? 3);
    w.addTrap({ x: src.x + aim.x * d, z: src.z + aim.z * d, r: a.r ?? 1.2, team: src.team, src, dmg: scaled(src, a, ctx), effects: a.effects, t: a.t ?? 12, color: a.color ?? 0xffaa33, kind: ctx.kind, arm: a.arm ?? 0.5 });
  },

  seq(w, src, a, ctx) {
    for (const step of a.steps) {
      const run = () => src.alive && execute(w, src, step.do, ctx);
      if (!step.at) run(); else w.schedule(step.at, run);
    }
  },

  multi(w, src, a, ctx) { for (const s of a.list) execute(w, src, s, ctx); },

  custom(w, src, a, ctx) {
    const s = SPECIALS[a.fn];
    if (!s || !s.run) { console.warn('missing special', a.fn); return; }
    s.run(w, src, a, ctx, { execute, scaled: () => scaled(src, a, ctx), gain: (n) => gainPer(src, a, ctx, n) });
  },
};

export { KINDS };

// Bot brain: picks targets, follows the mode objective via A*, kites at its
// preferred range, leads shots, dodges projectiles, and uses super / gadget /
// transformation when they are worth it. Difficulty scales aim and reactions.
export function actRange(a) {
  if (!a) return 3;
  switch (a.kind) {
    case 'proj': return typeof a.range === 'number' ? a.range : (a.maxRange ?? 6);
    case 'cone': return (a.range ?? 1.8) + (a.lunge ?? 0);
    case 'beam': return a.range ?? 8;
    case 'aoe': return a.self ? (a.r ?? 2) : (a.range ?? 7);
    case 'nova': return (a.r ?? 2.5) * 0.85;
    case 'domain': return (a.r ?? 4) * 0.7;
    case 'dash': return typeof a.dist === 'number' ? a.dist + 1 : (a.maxDist ?? 5);
    case 'blink': return a.maxDist ?? (typeof a.dist === 'number' ? a.dist : 5);
    case 'summon': return 8;
    case 'buff': return 6;
    case 'hook': return a.range ?? 6;
    case 'multi': return Math.max(...a.list.map(actRange));
    case 'seq': return actRange(a.steps[0].do);
    case 'custom': return a.range ?? (a.fn === 'boogieWoogie' ? 8 : a.fn?.startsWith('minato') ? 7 : 6);
    default: return 5;
  }
}
const isMelee = (a) => a && (a.kind === 'cone' || (a.kind === 'multi' && a.list.some(x => x.kind === 'cone')) || (a.kind === 'custom' && /mahito|ameno|lawCut/.test(a.fn)));

export class BotBrain {
  constructor(world, f, difficulty = 0.5) {
    this.w = world; this.f = f; this.diff = Math.max(0.1, Math.min(1, difficulty));
    this.think = Math.random() * 0.3; this.path = null; this.pathT = 0; this.goal = null;
    this.target = null; this.strafe = Math.random() < 0.5 ? 1 : -1; this.strafeT = 0;
    this.react = 0; this.dodgeT = 0; this.dodgeDir = null; this.stuckT = 0; this.lastPos = { x: f.x, z: f.z };
  }
  update(dt) {
    const f = this.f, w = this.w;
    this.think -= dt; this.pathT -= dt; this.strafeT -= dt; this.react -= dt; this.dodgeT -= dt;
    if (this.think <= 0) { this.think = 0.35 + (1 - this.diff) * 0.45; this.decide(); }
    // movement intent
    let mx = 0, mz = 0;
    const tgt = this.target && this.target.alive ? this.target : null;
    const main = f.mainAct;
    const range = actRange(main);
    const melee = isMelee(main);
    if (this.dodgeT > 0 && this.dodgeDir) { mx = this.dodgeDir.x; mz = this.dodgeDir.z; }
    else if (this.retreat) { const p = this.follow(this.retreat); mx = p.x; mz = p.z; }
    else if (tgt && this.engage) {
      const dx = tgt.x - f.x, dz = tgt.z - f.z, d = Math.hypot(dx, dz) || 1;
      const want = melee ? 0.9 : range * (0.62 + 0.15 * this.diff);
      const los = w.grid.los(f.x, f.z, tgt.x, tgt.z);
      if (!los || d > want + 0.8) { const p = this.follow({ x: tgt.x, z: tgt.z }); mx = p.x; mz = p.z; }
      else {
        if (this.strafeT <= 0) { this.strafeT = 0.6 + Math.random() * 1.2; if (Math.random() < 0.5) this.strafe *= -1; }
        const toward = d > want ? 1 : d < want - 1 ? -1 : 0;
        mx = (dx / d) * toward + (-dz / d) * this.strafe * 0.8;
        mz = (dz / d) * toward + (dx / d) * this.strafe * 0.8;
      }
    } else if (this.goal) { const p = this.follow(this.goal); mx = p.x; mz = p.z; }
    const l = Math.hypot(mx, mz);
    f.moveIn.x = l > 0.01 ? mx / l : 0; f.moveIn.z = l > 0.01 ? mz / l : 0;
    // stuck detection
    if (Math.hypot(f.x - this.lastPos.x, f.z - this.lastPos.z) < 0.02 && l > 0.1) { this.stuckT += dt; if (this.stuckT > 0.6) { this.path = null; this.strafe *= -1; this.stuckT = 0; this.dodgeDir = { x: -f.moveIn.z, z: f.moveIn.x }; this.dodgeT = 0.35; } } else this.stuckT = 0;
    this.lastPos = { x: f.x, z: f.z };
    // aim + fire
    if (tgt) {
      const lead = (Math.hypot(tgt.x - f.x, tgt.z - f.z) / 16) * this.diff * 0.7;
      const tx = tgt.x + (tgt.vel?.x ?? 0) * lead, tz = tgt.z + (tgt.vel?.z ?? 0) * lead;
      const err = (0.12 + (1 - this.diff) * 0.7) * (Math.random() - 0.5);
      let dx = tx - f.x, dz = tz - f.z; const d = Math.hypot(dx, dz) || 1;
      const a = Math.atan2(dz, dx) + err;
      const aim = { x: Math.cos(a), z: Math.sin(a) };
      f.liveAim = aim;
      if (f.mainAct.kind === 'beam' || f.has('channel')) f.setFace(aim);
      const inRange = d <= range + tgt.r * 0.5 && w.grid.los(f.x, f.z, tgt.x, tgt.z);
      // transformation
      if (f.transCharge >= 1 && d < 9 && f.cinematic < 0 && Math.random() < 0.02 + this.diff * 0.05) f.tryTransform();
      // super
      if (f.superCharge >= 1 && this.react <= 0) {
        const sa = f.superAct; const sr = actRange(sa);
        const crowd = w.unitsInRadius(f.x, f.z, sr, f.team).filter(u => u.kind !== 'structure').length;
        const selfCentered = sa.kind === 'nova' || sa.kind === 'domain' || sa.kind === 'summon' || sa.kind === 'buff';
        if (((selfCentered && crowd >= 1) || (!selfCentered && d <= sr)) && Math.random() < 0.25 + this.diff * 0.5) { f.useSuper(aim, Math.min(d, sr)); this.react = 0.9; }
      }
      // gadget
      if (f.gadgets > 0 && f.gadgetCd <= 0 && Math.random() < 0.008 + this.diff * 0.015) {
        const g = f.gadgetAct;
        const heal = g && g.kind === 'buff' && (g.buff?.heal || g.buff?.healPct || g.buff?.shield || g.buff?.dr);
        if ((heal && f.hp / f.maxHp < 0.55) || (!heal && d < actRange(g))) f.useGadget(aim, d);
      }
      // main attack
      if (inRange && this.react <= 0 && f.ammo >= (main.ammoCost ?? 1)) {
        const keepAmmo = f.ammo < 1.6 && d > range * 0.8 && Math.random() < 0.6;
        if (!keepAmmo && Math.random() < 0.22 + this.diff * 0.4) { f.attack(aim, d); this.react = 0.35 + (1 - this.diff) * 0.7 + Math.random() * 0.35; }
      }
    } else if (this.structTarget && this.structTarget.alive) {
      const s = this.structTarget; const dx = s.x - f.x, dz = s.z - f.z, d = Math.hypot(dx, dz) || 1;
      const aim = { x: dx / d, z: dz / d }; f.liveAim = aim;
      if (d <= range + s.r && w.grid.los(f.x, f.z, s.x, s.z) && f.ammo >= 1 && this.react <= 0) { f.attack(aim, d); this.react = 0.3; }
      if (f.superCharge >= 1 && d <= actRange(f.superAct) + s.r) f.useSuper(aim, d);
    }
    if (f.transCharge >= 1 && !tgt && Math.random() < 0.003) f.tryTransform();
  }
  decide() {
    const f = this.f, w = this.w;
    // dodge incoming projectiles
    if (this.diff > 0.3) {
      for (const p of w.projectiles) {
        if (p.team === f.team || !p.alive) continue;
        const rx = f.x - p.x, rz = f.z - p.z; const along = rx * p.dx + rz * p.dz;
        if (along < 0 || along > 4) continue;
        const perp = rx * p.dz - rz * p.dx;
        if (Math.abs(perp) < f.r + p.r + 0.3 && Math.random() < this.diff * 0.35) { const s = perp >= 0 ? 1 : -1; this.dodgeDir = { x: p.dz * s, z: -p.dx * s }; this.dodgeT = 0.3; break; }
      }
    }
    // target
    let best = null, bs = 1e9;
    const sight = 11;
    for (const u of w.units) {
      if (!u.alive || u.team === f.team || u.kind === 'structure' || u.untargetable) continue;
      if (!w.isVisibleTo(u, f.team)) continue;
      const d = Math.hypot(u.x - f.x, u.z - f.z); if (d > sight) continue;
      const s = d + (u.hp / u.maxHp) * 3 + (u.kind === 'minion' ? 2.5 : 0) + (u.carry ? -3 : 0);
      if (s < bs) { bs = s; best = u; }
    }
    this.target = best;
    const g = w.mode.botGoal ? w.mode.botGoal(f) : null;
    this.goal = g; this.structTarget = g?.struct ?? null;
    const hpF = f.hp / f.maxHp;
    this.retreat = null;
    if (hpF < 0.3 && best && Math.random() < 0.7 && !(g && g.urgent)) {
      const sp = w.mode.spawnPoint ? w.mode.spawnPoint(f, true) : { x: f.x - (best.x - f.x), z: f.z - (best.z - f.z) };
      this.retreat = sp;
    }
    this.engage = !!best && !(g && g.urgent && Math.hypot(best.x - f.x, best.z - f.z) > actRange(f.mainAct) + 1);
  }
  follow(pt) {
    const f = this.f, w = this.w;
    if (w.grid.walkLine({ x: f.x, z: f.z }, pt)) { const dx = pt.x - f.x, dz = pt.z - f.z; const d = Math.hypot(dx, dz); return d < 0.3 ? { x: 0, z: 0 } : { x: dx / d, z: dz / d }; }
    if (!this.path || this.pathT <= 0 || !this.pathGoal || Math.hypot(this.pathGoal.x - pt.x, this.pathGoal.z - pt.z) > 1.5) {
      this.path = w.grid.path(f.x, f.z, pt.x, pt.z); this.pathT = 0.8; this.pathGoal = { ...pt }; this.pi = 1;
    }
    if (!this.path || this.path.length < 2) { const dx = pt.x - f.x, dz = pt.z - f.z; const d = Math.hypot(dx, dz) || 1; return { x: dx / d, z: dz / d }; }
    let n = this.path[Math.min(this.pi, this.path.length - 1)];
    if (Math.hypot(n.x - f.x, n.z - f.z) < 0.45 && this.pi < this.path.length - 1) { this.pi++; n = this.path[this.pi]; }
    const dx = n.x - f.x, dz = n.z - f.z; const d = Math.hypot(dx, dz) || 1;
    return { x: dx / d, z: dz / d };
  }
}

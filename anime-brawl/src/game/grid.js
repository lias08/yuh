// Tile grid: collision, line of sight, bush lookup and A* pathfinding.
// Tile codes: '.' floor, '#' wall, 'X' crate (destructible), 'W' water (blocks
// movement only), 'R' rope fence (blocks movement only), 'B' bush.
export const SOLID_MOVE = new Set(['#', 'X', 'W', 'R', 'T']);
export const SOLID_SHOT = new Set(['#', 'X', 'T']);

export class Grid {
  constructor(rows) {
    this.h = rows.length;
    this.w = rows[0].length;
    this.cells = rows.map(r => r.split(''));
    this.crateHp = new Map(); // key -> hp
    this.temp = new Map(); // key -> {life, prev}
    this.version = 0;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.cells[y][x] === 'X') this.crateHp.set(y * this.w + x, 2600);
  }
  // world <-> tile. Tile (x,y) covers world [x - w/2, x - w/2 + 1) ; centred map
  tx(wx) { return Math.floor(wx + this.w / 2); }
  ty(wz) { return Math.floor(wz + this.h / 2); }
  cx(tx) { return tx - this.w / 2 + 0.5; }
  cz(ty) { return ty - this.h / 2 + 0.5; }
  get(tx, ty) { if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return '#'; return this.cells[ty][tx]; }
  set(tx, ty, c) { if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return; this.cells[ty][tx] = c; this.version++; }
  at(wx, wz) { return this.get(this.tx(wx), this.ty(wz)); }
  blocksMove(wx, wz) { return SOLID_MOVE.has(this.at(wx, wz)); }
  blocksShot(wx, wz) { return SOLID_SHOT.has(this.at(wx, wz)); }
  isBush(wx, wz) { return this.at(wx, wz) === 'B'; }
  walkableTile(tx, ty) { return !SOLID_MOVE.has(this.get(tx, ty)); }

  /** Circle vs tile collision resolve. Returns corrected {x,z}. */
  resolve(x, z, r, ignoreWater = false) {
    const t0x = this.tx(x - r), t1x = this.tx(x + r), t0y = this.ty(z - r), t1y = this.ty(z + r);
    for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) {
      const c = this.get(tx, ty);
      if (!SOLID_MOVE.has(c)) continue;
      if (ignoreWater && (c === 'W' || c === 'R')) continue;
      const minx = tx - this.w / 2, minz = ty - this.h / 2;
      const nx = Math.max(minx, Math.min(x, minx + 1)), nz = Math.max(minz, Math.min(z, minz + 1));
      const dx = x - nx, dz = z - nz; const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-8) { const d = Math.sqrt(d2); x = nx + (dx / d) * r; z = nz + (dz / d) * r; }
        else { // centre inside tile: push out along smallest axis
          const l = x - minx, rr = minx + 1 - x, u = z - minz, dd = minz + 1 - z; const m = Math.min(l, rr, u, dd);
          if (m === l) x = minx - r; else if (m === rr) x = minx + 1 + r; else if (m === u) z = minz - r; else z = minz + 1 + r;
        }
      }
    }
    const hw = this.w / 2 - r, hh = this.h / 2 - r;
    x = Math.max(-hw, Math.min(hw, x)); z = Math.max(-hh, Math.min(hh, z));
    return { x, z };
  }

  /** distance along ray until a shot-blocking tile (DDA). */
  rayDist(x, z, dx, dz, max) {
    const step = 0.2;
    for (let d = 0; d <= max; d += step) {
      if (this.blocksShot(x + dx * d, z + dz * d)) return Math.max(0, d - step * 0.5);
    }
    return max;
  }
  los(ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az; const d = Math.hypot(dx, dz);
    if (d < 0.01) return true;
    return this.rayDist(ax, az, dx / d, dz / d, d) >= d - 0.05;
  }

  damageCrate(tx, ty, dmg) {
    const k = ty * this.w + tx;
    if (!this.crateHp.has(k)) return false;
    const hp = this.crateHp.get(k) - dmg;
    if (hp <= 0) { this.crateHp.delete(k); this.set(tx, ty, '.'); return true; }
    this.crateHp.set(k, hp); return false;
  }
  destroyTile(tx, ty) { // super-destruction of walls (heavy supers break walls like in the genre)
    const c = this.get(tx, ty);
    if (c === '#' || c === 'X' || c === 'B' || c === 'R') { if (tx <= 0 || ty <= 0 || tx >= this.w - 1 || ty >= this.h - 1) return false; this.crateHp.delete(ty * this.w + tx); this.set(tx, ty, '.'); return true; }
    return false;
  }
  addTemp(tx, ty, life) {
    const c = this.get(tx, ty);
    if (c !== '.' && c !== 'B') return false;
    this.temp.set(ty * this.w + tx, { life, prev: c, tx, ty });
    this.set(tx, ty, 'T');
    return true;
  }
  updateTemp(dt) {
    const removed = [];
    for (const [k, t] of this.temp) { t.life -= dt; if (t.life <= 0) { this.set(t.tx, t.ty, t.prev); this.temp.delete(k); removed.push(t); } }
    return removed;
  }

  /** A* on tiles. Returns array of world points or null. */
  path(sx, sz, gx, gz, maxIter = 1800) {
    const W = this.w, H = this.h;
    let s = { x: this.tx(sx), y: this.ty(sz) }, g = { x: this.tx(gx), y: this.ty(gz) };
    if (!this.walkableTile(g.x, g.y)) { // nearest walkable to goal
      let best = null, bd = 1e9;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (this.walkableTile(g.x + dx, g.y + dy)) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = { x: g.x + dx, y: g.y + dy }; } }
      if (!best) return null; g = best;
    }
    const key = (x, y) => y * W + x;
    const open = [key(s.x, s.y)];
    const gS = new Map([[open[0], 0]]), came = new Map(), f = new Map([[open[0], 0]]);
    const closed = new Set();
    let it = 0;
    const h = (x, y) => Math.hypot(x - g.x, y - g.y);
    while (open.length && it++ < maxIter) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (f.get(open[i]) < f.get(open[bi])) bi = i;
      const cur = open.splice(bi, 1)[0];
      const cx = cur % W, cy = (cur / W) | 0;
      if (cx === g.x && cy === g.y) {
        const pts = []; let k = cur;
        while (k !== undefined) { pts.push({ x: this.cx(k % W), z: this.cz((k / W) | 0) }); k = came.get(k); }
        pts.reverse(); return this.smooth(pts);
      }
      closed.add(cur);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || !this.walkableTile(nx, ny)) continue;
        if (dx && dy && (!this.walkableTile(cx + dx, cy) || !this.walkableTile(cx, cy + dy))) continue;
        const nk = key(nx, ny); if (closed.has(nk)) continue;
        const ng = gS.get(cur) + (dx && dy ? 1.414 : 1) + (this.cells[ny][nx] === 'B' ? 0.1 : 0);
        if (ng < (gS.get(nk) ?? 1e9)) { came.set(nk, cur); gS.set(nk, ng); f.set(nk, ng + h(nx, ny)); if (!open.includes(nk)) open.push(nk); }
      }
    }
    return null;
  }
  smooth(pts) {
    if (pts.length < 3) return pts;
    const out = [pts[0]]; let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !this.walkLine(pts[i], pts[j])) j--;
      out.push(pts[j]); i = j;
    }
    return out;
  }
  walkLine(a, b) {
    const d = Math.hypot(b.x - a.x, b.z - a.z); const n = Math.ceil(d / 0.25);
    for (let i = 1; i <= n; i++) {
      const t = i / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      for (const [ox, oz] of [[0.35, 0.35], [-0.35, 0.35], [0.35, -0.35], [-0.35, -0.35]]) if (this.blocksMove(x + ox, z + oz)) return false;
    }
    return true;
  }
  find(ch) { const out = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.cells[y][x] === ch) out.push({ x: this.cx(x), z: this.cz(y), tx: x, ty: y }); return out; }
}

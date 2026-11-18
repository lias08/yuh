// SDF sculpting core (pure JS, no three.js — usable in a Web Worker).
// Shapes are signed distance primitives combined with smooth unions /
// subtractions / clip planes, meshed with Surface Nets into one continuous,
// smooth-shaded surface. Also: gradient normals, baked ambient occlusion and
// automatic skin weights from bone-tagged primitives.

const BIG = 1;

// ---- vector helpers (arrays [x,y,z]) ---------------------------------------
export const v3 = (x = 0, y = 0, z = 0) => [x, y, z];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** rotation matrix (row-major 3x3) about z then y then x (world→local uses transpose) */
export function rotMat(rx = 0, ry = 0, rz = 0) {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  // R = Rz * Ry * Rx (local→world)
  return [
    cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
    sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
    -sy, cy * sx, cy * cx,
  ];
}
export const mApply = (m, p) => [m[0] * p[0] + m[1] * p[1] + m[2] * p[2], m[3] * p[0] + m[4] * p[1] + m[5] * p[2], m[6] * p[0] + m[7] * p[1] + m[8] * p[2]];
export const mApplyT = (m, p) => [m[0] * p[0] + m[3] * p[1] + m[6] * p[2], m[1] * p[0] + m[4] * p[1] + m[7] * p[2], m[2] * p[0] + m[5] * p[1] + m[8] * p[2]];
export const mMul = (a, b) => {
  const o = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  return o;
};
/** rotation taking +y onto dir */
export function matFromY(dir) {
  const y = norm(dir);
  const ref = Math.abs(y[1]) < 0.95 ? [0, 1, 0] : [0, 0, 1];
  let x = norm(cross(ref, y)); if (Math.abs(y[1]) >= 0.95) x = norm(cross([0, 0, 1], y));
  const z = cross(x, y);
  return [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
}

// ---- primitives -------------------------------------------------------------
export const P = {
  sphere: (c, r, o = {}) => ({ t: 0, c, r, ...o }),
  ellipsoid: (c, r, m = null, o = {}) => ({ t: 1, c, r, m, ...o }),
  roundCone: (a, b, ra, rb, o = {}) => ({ t: 2, a, b, ra, rb, ...o }),
  capsule: (a, b, r, o = {}) => ({ t: 2, a, b, ra: r, rb: r, ...o }),
  box: (c, h, r = 0, m = null, o = {}) => ({ t: 3, c, h, r, m, ...o }),
  // tube with rectangular cross-section around local y axis (collars, belts, bands); sx/sz: ellipse
  ring: (c, R, tw, th, rr = 0.004, m = null, sx = 1, sz = 1, o = {}) => ({ t: 4, c, R, tw, th, rr, m, sx, sz, ...o }),
};

function prep(p) {
  if (p.t === 2) { p.ba = sub(p.b, p.a); p.l2 = dot(p.ba, p.ba); p.rr = p.ra - p.rb; p.a2 = p.l2 - p.rr * p.rr; p.il2 = 1 / p.l2; }
  // bounding box
  let lo, hi;
  if (p.t === 0) { lo = sub(p.c, [p.r, p.r, p.r]); hi = add(p.c, [p.r, p.r, p.r]); }
  else if (p.t === 1) { const m = Math.max(...p.r); lo = sub(p.c, [m, m, m]); hi = add(p.c, [m, m, m]); }
  else if (p.t === 2) { const m = Math.max(p.ra, p.rb); lo = [Math.min(p.a[0], p.b[0]) - m, Math.min(p.a[1], p.b[1]) - m, Math.min(p.a[2], p.b[2]) - m]; hi = [Math.max(p.a[0], p.b[0]) + m, Math.max(p.a[1], p.b[1]) + m, Math.max(p.a[2], p.b[2]) + m]; }
  else if (p.t === 3) { const m = Math.hypot(p.h[0], p.h[1], p.h[2]) + p.r; lo = sub(p.c, [m, m, m]); hi = add(p.c, [m, m, m]); }
  else { const m = p.R * Math.max(p.sx, p.sz) + p.tw + p.th + p.rr; lo = sub(p.c, [m, m, m]); hi = add(p.c, [m, m, m]); }
  p.lo = lo; p.hi = hi;
  return p;
}

export function sd(p, x, y, z) {
  switch (p.t) {
    case 0: return Math.hypot(x - p.c[0], y - p.c[1], z - p.c[2]) - p.r;
    case 1: {
      let lx = x - p.c[0], ly = y - p.c[1], lz = z - p.c[2];
      if (p.m) { const q = mApplyT(p.m, [lx, ly, lz]); lx = q[0]; ly = q[1]; lz = q[2]; }
      const k0 = Math.hypot(lx / p.r[0], ly / p.r[1], lz / p.r[2]);
      const k1 = Math.hypot(lx / (p.r[0] * p.r[0]), ly / (p.r[1] * p.r[1]), lz / (p.r[2] * p.r[2]));
      return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -Math.min(...p.r);
    }
    case 2: { // round cone (iq)
      const pax = x - p.a[0], pay = y - p.a[1], paz = z - p.a[2];
      const ba = p.ba, l2 = p.l2;
      const yy = pax * ba[0] + pay * ba[1] + paz * ba[2];
      const zz = yy - l2;
      const xvx = pax * l2 - ba[0] * yy, xvy = pay * l2 - ba[1] * yy, xvz = paz * l2 - ba[2] * yy;
      const x2 = xvx * xvx + xvy * xvy + xvz * xvz, y2 = yy * yy * l2, z2 = zz * zz * l2;
      const rr = p.rr, a2 = p.a2, il2 = p.il2;
      const k = Math.sign(rr) * rr * rr * x2;
      if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - p.rb;
      if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - p.ra;
      return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - p.ra;
    }
    case 3: {
      let lx = x - p.c[0], ly = y - p.c[1], lz = z - p.c[2];
      if (p.m) { const q = mApplyT(p.m, [lx, ly, lz]); lx = q[0]; ly = q[1]; lz = q[2]; }
      const qx = Math.abs(lx) - p.h[0], qy = Math.abs(ly) - p.h[1], qz = Math.abs(lz) - p.h[2];
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - p.r;
    }
    case 4: {
      let lx = x - p.c[0], ly = y - p.c[1], lz = z - p.c[2];
      if (p.m) { const q = mApplyT(p.m, [lx, ly, lz]); lx = q[0]; ly = q[1]; lz = q[2]; }
      const e = Math.hypot(lx / p.sx, lz / p.sz);
      const radial = (e - p.R) * Math.min(p.sx, p.sz);
      const qx = Math.abs(radial) - p.tw, qy = Math.abs(ly) - p.th;
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - p.rr;
    }
  }
  return BIG;
}

export function smin(a, b, k) {
  if (k <= 0) return a < b ? a : b;
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
export function smax(a, b, k) { return -smin(-a, -b, k); }

// ---- field --------------------------------------------------------------------
export class Field {
  constructor(lo, hi, step) {
    this.step = step;
    this.lo = lo;
    this.nx = Math.max(3, Math.ceil((hi[0] - lo[0]) / step) + 1);
    this.ny = Math.max(3, Math.ceil((hi[1] - lo[1]) / step) + 1);
    this.nz = Math.max(3, Math.ceil((hi[2] - lo[2]) / step) + 1);
    this.d = new Float32Array(this.nx * this.ny * this.nz).fill(BIG);
  }
  range(lo, hi, pad) {
    const s = this.step, L = this.lo;
    return [
      Math.max(0, Math.floor((lo[0] - pad - L[0]) / s)), Math.min(this.nx - 1, Math.ceil((hi[0] + pad - L[0]) / s)),
      Math.max(0, Math.floor((lo[1] - pad - L[1]) / s)), Math.min(this.ny - 1, Math.ceil((hi[1] + pad - L[1]) / s)),
      Math.max(0, Math.floor((lo[2] - pad - L[2]) / s)), Math.min(this.nz - 1, Math.ceil((hi[2] + pad - L[2]) / s)),
    ];
  }
  /** op: 'u' smooth union, 's' smooth subtract, 'i' smooth intersect (only inside the prim box) */
  stamp(prim, k = 0, op = 'u') {
    if (!prim.lo) prep(prim);
    const pad = k + this.step * 2 + (op === 'u' ? 0.0 : 0.0);
    const [x0, x1, y0, y1, z0, z1] = this.range(prim.lo, prim.hi, pad);
    const s = this.step, L = this.lo, nx = this.nx, nxy = this.nx * this.ny, D = this.d;
    for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
      let i = z * nxy + y * nx + x0;
      const wy = L[1] + y * s, wz = L[2] + z * s;
      for (let x = x0; x <= x1; x++, i++) {
        const d = sd(prim, L[0] + x * s, wy, wz);
        const f = D[i];
        if (op === 'u') D[i] = smin(f, d, k);
        else if (op === 's') D[i] = smax(f, -d, k);
        else D[i] = smax(f, d, k);
      }
    }
  }
  /** apply fn(value, x, y, z) to every voxel */
  each(fn) {
    const s = this.step, L = this.lo, nx = this.nx, ny = this.ny, nz = this.nz, D = this.d;
    let i = 0;
    for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++, i++) D[i] = fn(D[i], L[0] + x * s, L[1] + y * s, L[2] + z * s);
  }
  offset(t) { const D = this.d; for (let i = 0; i < D.length; i++) if (D[i] < BIG) D[i] -= t; }
  /** keep the side where dot(n, p) < c  (n unit) */
  clip(n, c, k = 0) { this.each((v, x, y, z) => smax(v, n[0] * x + n[1] * y + n[2] * z - c, k)); }
  sample(x, y, z) {
    const s = this.step, L = this.lo;
    let fx = (x - L[0]) / s, fy = (y - L[1]) / s, fz = (z - L[2]) / s;
    fx = Math.max(0, Math.min(this.nx - 1.001, fx)); fy = Math.max(0, Math.min(this.ny - 1.001, fy)); fz = Math.max(0, Math.min(this.nz - 1.001, fz));
    const ix = fx | 0, iy = fy | 0, iz = fz | 0, tx = fx - ix, ty = fy - iy, tz = fz - iz;
    const nx = this.nx, nxy = nx * this.ny, D = this.d, i = iz * nxy + iy * nx + ix;
    const c00 = D[i] * (1 - tx) + D[i + 1] * tx, c10 = D[i + nx] * (1 - tx) + D[i + nx + 1] * tx;
    const c01 = D[i + nxy] * (1 - tx) + D[i + nxy + 1] * tx, c11 = D[i + nxy + nx] * (1 - tx) + D[i + nxy + nx + 1] * tx;
    return (c00 * (1 - ty) + c10 * ty) * (1 - tz) + (c01 * (1 - ty) + c11 * ty) * tz;
  }
  grad(x, y, z) {
    const h = this.step * 0.75;
    return norm([this.sample(x + h, y, z) - this.sample(x - h, y, z), this.sample(x, y + h, z) - this.sample(x, y - h, z), this.sample(x, y, z + h) - this.sample(x, y, z - h)]);
  }
}

// ---- surface nets -----------------------------------------------------------------
const CUBE_EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
export function surfaceNets(F, smooth = 1) {
  const { nx, ny, nz, d: D, step: s, lo: L } = F;
  const nxy = nx * ny;
  const cellIdx = new Int32Array(nx * ny * nz).fill(-1);
  const pos = [];
  const g = new Float32Array(8);
  for (let z = 0; z < nz - 1; z++) for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) {
    const i = z * nxy + y * nx + x;
    let mask = 0;
    for (let c = 0; c < 8; c++) {
      const v = D[i + (c & 1) + ((c >> 1) & 1) * nx + ((c >> 2) & 1) * nxy];
      g[c] = v; if (v < 0) mask |= 1 << c;
    }
    if (mask === 0 || mask === 255) continue;
    let px = 0, py = 0, pz = 0, n = 0;
    for (const [a, b] of CUBE_EDGES) {
      const va = g[a], vb = g[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      px += (a & 1) + ((b & 1) - (a & 1)) * t;
      py += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t;
      pz += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t;
      n++;
    }
    cellIdx[i] = pos.length / 3;
    pos.push(L[0] + (x + px / n) * s, L[1] + (y + py / n) * s, L[2] + (z + pz / n) * s);
  }
  const idx = [];
  const ax = [1, nx, nxy];
  for (let z = 0; z < nz - 1; z++) for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) {
    const i = z * nxy + y * nx + x;
    if (cellIdx[i] < 0) continue;
    const c0 = [x, y, z];
    const v0 = D[i];
    for (let a = 0; a < 3; a++) {
      const v1 = D[i + ax[a]];
      if ((v0 < 0) === (v1 < 0)) continue;
      const j = (a + 1) % 3, k = (a + 2) % 3;
      if (c0[j] === 0 || c0[k] === 0) continue;
      const A = cellIdx[i], Bq = cellIdx[i - ax[j]], C = cellIdx[i - ax[j] - ax[k]], Dq = cellIdx[i - ax[k]];
      if (A < 0 || Bq < 0 || C < 0 || Dq < 0) continue;
      if (v0 < 0) idx.push(A, Bq, C, A, C, Dq); else idx.push(A, C, Bq, A, Dq, C);
    }
  }
  const P = new Float32Array(pos);
  // Laplacian relaxation (removes voxel stair-stepping) then re-project onto the surface
  if (smooth > 0) {
    const nv = P.length / 3, acc = new Float32Array(nv * 3), cnt = new Float32Array(nv);
    for (let it = 0; it < smooth; it++) {
      acc.fill(0); cnt.fill(0);
      for (let t = 0; t < idx.length; t += 3) for (let e = 0; e < 3; e++) {
        const a = idx[t + e], b = idx[t + (e + 1) % 3];
        acc[a * 3] += P[b * 3]; acc[a * 3 + 1] += P[b * 3 + 1]; acc[a * 3 + 2] += P[b * 3 + 2]; cnt[a]++;
        acc[b * 3] += P[a * 3]; acc[b * 3 + 1] += P[a * 3 + 1]; acc[b * 3 + 2] += P[a * 3 + 2]; cnt[b]++;
      }
      for (let v = 0; v < nv; v++) if (cnt[v]) for (let c = 0; c < 3; c++) P[v * 3 + c] = P[v * 3 + c] * 0.5 + (acc[v * 3 + c] / cnt[v]) * 0.5;
      for (let v = 0; v < nv; v++) { // project back
        const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
        const f = F.sample(x, y, z); const gr = F.grad(x, y, z);
        P[v * 3] -= gr[0] * f; P[v * 3 + 1] -= gr[1] * f; P[v * 3 + 2] -= gr[2] * f;
      }
    }
  }
  const N = new Float32Array(P.length);
  for (let v = 0; v < P.length; v += 3) { const gr = F.grad(P[v], P[v + 1], P[v + 2]); N[v] = gr[0]; N[v + 1] = gr[1]; N[v + 2] = gr[2]; }
  // fix triangle winding against the gradient normal
  const I = new Uint32Array(idx);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const e1 = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], e2 = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
    const fn = cross(e1, e2);
    if (fn[0] * N[a] + fn[1] * N[a + 1] + fn[2] * N[a + 2] < 0) { const tmp = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = tmp; }
  }
  return { position: P, normal: N, index: I };
}

/** SDF ambient occlusion sampled from an occlusion field (whole character). */
export function bakeAO(mesh, occ, strength = 1) {
  const P = mesh.position, N = mesh.normal, n = P.length / 3;
  const C = new Float32Array(n * 3);
  for (let v = 0; v < n; v++) {
    let ao = 0, w = 0.5;
    for (let i = 1; i <= 5; i++) {
      const s = i * 0.022;
      const d = occ.sample(P[v * 3] + N[v * 3] * s, P[v * 3 + 1] + N[v * 3 + 1] * s, P[v * 3 + 2] + N[v * 3 + 2] * s);
      ao += Math.max(0, s - d) * w; w *= 0.6;
    }
    const k = Math.max(0.55, 1 - ao * 7 * strength);
    C[v * 3] = C[v * 3 + 1] = C[v * 3 + 2] = k;
  }
  mesh.color = C;
  return mesh;
}

/** automatic skin weights: soft-min of bone-tagged primitive distances. */
export function skinWeights(mesh, prims, sigma = 0.03) {
  const P = mesh.position, n = P.length / 3;
  const SI = new Uint16Array(n * 4), SW = new Float32Array(n * 4);
  for (const p of prims) if (!p.lo) prep(p);
  const best = new Map();
  for (let v = 0; v < n; v++) {
    const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    best.clear(); let dmin = 1e9;
    for (const p of prims) {
      const d = Math.max(0, sd(p, x, y, z));
      const b = p.bone ?? 0;
      if (!best.has(b) || best.get(b) > d) best.set(b, d);
      if (d < dmin) dmin = d;
    }
    const arr = [...best.entries()].map(([b, d]) => [b, Math.exp(-(d - dmin) / sigma)]).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const tot = arr.reduce((s, a) => s + a[1], 0);
    arr.forEach(([b, w], k) => { SI[v * 4 + k] = b; SW[v * 4 + k] = w / tot; });
  }
  mesh.skinIndex = SI; mesh.skinWeight = SW;
  return mesh;
}

/** spherical UVs around a centre (for painted faces); front (+z) at u = 0.25 like SphereGeometry */
export function sphereUV(mesh, c) {
  const P = mesh.position, n = P.length / 3, U = new Float32Array(n * 2);
  for (let v = 0; v < n; v++) {
    const x = P[v * 3] - c[0], y = P[v * 3 + 1] - c[1], z = P[v * 3 + 2] - c[2];
    const r = Math.hypot(x, y, z) || 1;
    let u = Math.atan2(z, -x) / (Math.PI * 2); if (u < 0) u += 1;
    U[v * 2] = u; U[v * 2 + 1] = 1 - Math.acos(Math.max(-1, Math.min(1, y / r))) / Math.PI;
  }
  mesh.uv = U;
  return mesh;
}

export { prep };

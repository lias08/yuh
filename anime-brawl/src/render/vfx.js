// Visual effects: pooled GPU particles plus mesh-based effects (shockwaves,
// crescent slashes, beams, lightning, explosions, domains, telegraphs, auras).
import * as THREE from 'three';
import { glowUnique, fresnelMaterial } from './toon.js';

const MAX = 4000;

class ParticlePool {
  constructor(scene, additive) {
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAX * 3);
    this.col = new Float32Array(MAX * 3);
    this.size = new Float32Array(MAX);
    this.alpha = new Float32Array(MAX);
    this.vel = new Float32Array(MAX * 3);
    this.life = new Float32Array(MAX);
    this.maxLife = new Float32Array(MAX);
    this.grav = new Float32Array(MAX);
    this.size0 = new Float32Array(MAX);
    this.drag = new Float32Array(MAX);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 400 } },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA;
        uniform float uScale;
        void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vC; varying float vA;
        void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard;
          float a = smoothstep(0.5, 0.0, r); ${additive ? 'gl_FragColor = vec4(vC * (0.6 + a*0.8), a * vA);' : 'gl_FragColor = vec4(vC, smoothstep(0.5,0.35,r) * vA);'} }`,
      transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexColors: false,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 10 : 5;
    scene.add(this.points);
    this.cursor = 0;
    this.active = 0;
  }
  spawn(x, y, z, vx, vy, vz, r, g, b, size, life, grav = 0, drag = 0) {
    const i = this.cursor; this.cursor = (this.cursor + 1) % MAX;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.col[i * 3] = r; this.col[i * 3 + 1] = g; this.col[i * 3 + 2] = b;
    this.size[i] = size; this.size0[i] = size; this.life[i] = life; this.maxLife[i] = life; this.grav[i] = grav; this.drag[i] = drag;
    this.alpha[i] = 1;
  }
  update(dt) {
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) { if (this.alpha[i] !== 0) { this.alpha[i] = 0; this.size[i] = 0; } continue; }
      this.life[i] -= dt;
      const k = Math.max(0, this.life[i] / this.maxLife[i]);
      const d = 1 - this.drag[i] * dt;
      this.vel[i * 3] *= d; this.vel[i * 3 + 2] *= d; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * d - this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      if (this.pos[i * 3 + 1] < 0.02 && this.grav[i] > 0) { this.pos[i * 3 + 1] = 0.02; this.vel[i * 3 + 1] *= -0.3; }
      this.alpha[i] = Math.min(1, k * 1.6);
      this.size[i] = this.size0[i] * (0.4 + 0.6 * k);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
    this.geo.attributes.alpha.needsUpdate = true;
  }
}

const tmpC = new THREE.Color();
const ringGeo = new THREE.RingGeometry(0.85, 1, 48);
const discGeo = new THREE.CircleGeometry(1, 40);
const sphereGeo = new THREE.SphereGeometry(1, 24, 16);
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 16, 1, true);

function crescentGeo(arc = 2.2, inner = 0.55) {
  const shape = new THREE.Shape();
  const n = 24;
  for (let i = 0; i <= n; i++) { const a = -arc / 2 + (arc * i) / n; const x = Math.cos(a), y = Math.sin(a); if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y); }
  for (let i = n; i >= 0; i--) { const a = -arc / 2 + (arc * i) / n; const t = Math.sin((i / n) * Math.PI); const r = 1 - (1 - inner) * t; shape.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  const g = new THREE.ShapeGeometry(shape); g.rotateX(-Math.PI / 2);
  return g;
}
const crescentCache = new Map();
function crescent(arc) { const k = arc.toFixed(2); if (!crescentCache.has(k)) crescentCache.set(k, crescentGeo(arc)); return crescentCache.get(k); }

export class VFX {
  constructor(scene) {
    this.scene = scene;
    this.add = new ParticlePool(scene, true);
    this.norm = new ParticlePool(scene, false);
    this.fx = [];
    this.shakeAmt = 0;
    this.time = 0;
  }
  setScale(h) { this.add.mat.uniforms.uScale.value = h * 0.9; this.norm.mat.uniforms.uScale.value = h * 0.9; }

  burst(p, o = {}) {
    const n = o.count ?? 16; tmpC.set(o.color ?? 0xffffff);
    const c2 = o.color2 !== undefined ? new THREE.Color(o.color2) : null;
    const pool = o.smoke ? this.norm : this.add;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = (o.speed ?? 4) * (0.3 + Math.random() * 0.9);
      const up = (o.up ?? 0.5) * (0.5 + Math.random());
      const col = c2 && Math.random() < 0.5 ? c2 : tmpC;
      const dir = o.dir;
      let vx = Math.cos(a) * s, vz = Math.sin(a) * s;
      if (dir) { const sp = o.spread ?? 0.5; const aa = Math.atan2(dir.z, dir.x) + (Math.random() - 0.5) * sp * 2; vx = Math.cos(aa) * s; vz = Math.sin(aa) * s; }
      pool.spawn(p.x + (Math.random() - 0.5) * (o.jitter ?? 0.2), (p.y ?? 0.5) + (Math.random() - 0.5) * (o.jitter ?? 0.2), p.z + (Math.random() - 0.5) * (o.jitter ?? 0.2),
        vx, up * s, vz, col.r, col.g, col.b, (o.size ?? 0.35) * (0.6 + Math.random() * 0.8), (o.life ?? 0.6) * (0.6 + Math.random() * 0.6), o.gravity ?? 0, o.drag ?? 2);
    }
  }
  /** single particle */
  dot(x, y, z, color, size = 0.3, life = 0.4, vx = 0, vy = 0, vz = 0, smoke = false) {
    tmpC.set(color);
    (smoke ? this.norm : this.add).spawn(x, y, z, vx, vy, vz, tmpC.r, tmpC.g, tmpC.b, size, life, 0, 1);
  }

  _push(obj, life, update, onEnd) { this.scene.add(obj); this.fx.push({ obj, life, max: life, update, onEnd }); return obj; }

  ring(p, o = {}) {
    const m = new THREE.Mesh(ringGeo, glowUnique(o.color ?? 0xffffff, o.opacity ?? 0.9));
    m.rotation.x = -Math.PI / 2; m.position.set(p.x, (p.y ?? 0.08), p.z);
    const r0 = o.r0 ?? 0.2, r1 = o.r1 ?? 2;
    return this._push(m, o.life ?? 0.4, (k, t) => { const r = r0 + (r1 - r0) * (1 - k * k); m.scale.set(r, r, r); m.material.opacity = (o.opacity ?? 0.9) * k; });
  }
  disc(p, o = {}) {
    const m = new THREE.Mesh(discGeo, glowUnique(o.color ?? 0xffffff, o.opacity ?? 0.5));
    m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.06, p.z); m.scale.setScalar(o.r ?? 1);
    return this._push(m, o.life ?? 0.4, (k) => { m.material.opacity = (o.opacity ?? 0.5) * k; });
  }
  sphere(p, o = {}) {
    const m = new THREE.Mesh(sphereGeo, glowUnique(o.color ?? 0xffffff, o.opacity ?? 0.7));
    m.position.set(p.x, p.y ?? 0.6, p.z);
    const r0 = o.r0 ?? 0.2, r1 = o.r1 ?? 1.5;
    return this._push(m, o.life ?? 0.35, (k) => { const r = r0 + (r1 - r0) * (1 - k * k * k); m.scale.setScalar(r); m.material.opacity = (o.opacity ?? 0.7) * k; });
  }
  explosion(p, r = 1.5, color = 0xffaa33, color2 = 0xff4422) {
    this.sphere(p, { color: 0xffffff, r0: 0.2, r1: r * 0.7, life: 0.18, opacity: 0.9 });
    this.sphere(p, { color, r0: 0.3, r1: r, life: 0.4, opacity: 0.6 });
    this.ring(p, { color, r0: 0.3, r1: r * 1.3, life: 0.45 });
    this.burst({ ...p, y: 0.5 }, { count: 28, color, color2, speed: r * 5, life: 0.6, size: 0.45, up: 0.6 });
    this.burst({ ...p, y: 0.4 }, { count: 10, color: 0x3a3440, speed: r * 2, life: 0.9, size: 0.8, up: 0.5, smoke: true });
    this.shake(0.15 + r * 0.05);
  }
  slash(p, angle, o = {}) {
    const arc = o.arc ?? 2.2;
    const m = new THREE.Mesh(crescent(arc), glowUnique(o.color ?? 0xffffff, o.opacity ?? 0.95));
    m.material.side = THREE.DoubleSide;
    m.position.set(p.x, p.y ?? 0.6, p.z);
    m.rotation.y = -angle;
    const r = o.r ?? 1.2;
    if (o.tilt) m.rotation.x = o.tilt;
    return this._push(m, o.life ?? 0.22, (k) => { const s = r * (1.15 - 0.15 * k); m.scale.set(s, 1, s); m.material.opacity = (o.opacity ?? 0.95) * k; });
  }
  beam(a, b, o = {}) {
    const dir = new THREE.Vector3(b.x - a.x, (b.y ?? 0.6) - (a.y ?? 0.6), b.z - a.z);
    const len = dir.length();
    const grp = new THREE.Group();
    const w = o.width ?? 0.4;
    const outer = new THREE.Mesh(cylGeo, glowUnique(o.color ?? 0x66ccff, 0.55));
    const inner = new THREE.Mesh(cylGeo, glowUnique(o.core ?? 0xffffff, 0.95));
    outer.scale.set(w, len, w); inner.scale.set(w * 0.4, len, w * 0.4);
    grp.add(outer, inner);
    grp.position.set((a.x + b.x) / 2, ((a.y ?? 0.6) + (b.y ?? 0.6)) / 2, (a.z + b.z) / 2);
    grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    const cap = new THREE.Mesh(sphereGeo, glowUnique(o.color ?? 0x66ccff, 0.7)); cap.position.set(0, -len / 2, 0); cap.scale.setScalar(w * 1.6); grp.add(cap);
    return this._push(grp, o.life ?? 0.3, (k, t) => {
      const pulse = 1 + Math.sin(t * 50) * 0.08;
      outer.scale.set(w * k * pulse, len, w * k * pulse); inner.scale.set(w * 0.4 * k, len, w * 0.4 * k);
      outer.material.opacity = 0.55 * Math.min(1, k * 2);
    });
  }
  lightning(a, b, o = {}) {
    const segs = o.segs ?? 8;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, j = i === 0 || i === segs ? 0 : (o.jag ?? 0.35);
      pts.push(new THREE.Vector3(a.x + (b.x - a.x) * t + (Math.random() - 0.5) * j, (a.y ?? 0.6) + ((b.y ?? 0.6) - (a.y ?? 0.6)) * t + (Math.random() - 0.5) * j, a.z + (b.z - a.z) * t + (Math.random() - 0.5) * j));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), segs * 3, o.width ?? 0.05, 5);
    const m = new THREE.Mesh(geo, glowUnique(o.color ?? 0x9fdcff, 1));
    return this._push(m, o.life ?? 0.15, (k) => { m.material.opacity = k; }, () => geo.dispose());
  }
  telegraph(p, r, o = {}) {
    const g = new THREE.Group(); g.position.set(p.x, 0.07, p.z);
    const fill = new THREE.Mesh(discGeo, glowUnique(o.color ?? 0xff3344, 0.18)); fill.rotation.x = -Math.PI / 2; fill.scale.setScalar(r);
    const edge = new THREE.Mesh(ringGeo, glowUnique(o.color ?? 0xff3344, 0.8)); edge.rotation.x = -Math.PI / 2; edge.scale.setScalar(r);
    const grow = new THREE.Mesh(discGeo, glowUnique(o.color ?? 0xff3344, 0.3)); grow.rotation.x = -Math.PI / 2; grow.position.y = 0.01;
    g.add(fill, edge, grow);
    const life = o.life ?? 0.6;
    return this._push(g, life, (k) => { grow.scale.setScalar(Math.max(0.001, r * (1 - k))); });
  }
  /** Big domain shell: dome + ground sigil. Returns handle with .kill() */
  domain(p, r, o = {}) {
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), fresnelMaterial(o.color ?? 0x7a4cff, 2.0, 1.6));
    g.add(dome);
    const inner = new THREE.Mesh(discGeo, glowUnique(o.floor ?? o.color ?? 0x7a4cff, 0.25)); inner.rotation.x = -Math.PI / 2; inner.position.y = 0.05; inner.scale.setScalar(r); g.add(inner);
    const sig = new THREE.Mesh(ringGeo, glowUnique(o.color2 ?? 0xffffff, 0.8)); sig.rotation.x = -Math.PI / 2; sig.position.y = 0.06; sig.scale.setScalar(r); g.add(sig);
    const sig2 = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.5, 6), glowUnique(o.color2 ?? 0xffffff, 0.6)); sig2.rotation.x = -Math.PI / 2; sig2.position.y = 0.06; sig2.scale.setScalar(r); g.add(sig2);
    const life = o.life ?? 4;
    return this._push(g, life, (k, t) => {
      const intro = Math.min(1, (life - k * life) / 0.35);
      dome.scale.setScalar(Math.max(0.01, intro));
      dome.material.uniforms.uTime.value = t;
      dome.material.uniforms.uAlpha.value = Math.min(1, k * 4);
      inner.material.opacity = 0.25 * Math.min(1, k * 4);
      sig2.rotation.z = t * 0.6;
      if (Math.random() < 0.6) { const a = Math.random() * 6.28, rr = Math.random() * r; this.dot(p.x + Math.cos(a) * rr, 0.1, p.z + Math.sin(a) * rr, o.particle ?? o.color ?? 0x7a4cff, 0.35, 1.2, 0, 1.5, 0); }
    });
  }
  /** ground-level lingering zone visual (fire, poison, ice…) */
  zone(p, r, life, o = {}) {
    const g = new THREE.Group(); g.position.set(p.x, 0.07, p.z);
    const fill = new THREE.Mesh(discGeo, glowUnique(o.color ?? 0xff6622, 0.3)); fill.rotation.x = -Math.PI / 2; fill.scale.setScalar(r); g.add(fill);
    const edge = new THREE.Mesh(ringGeo, glowUnique(o.color ?? 0xff6622, 0.6)); edge.rotation.x = -Math.PI / 2; edge.scale.setScalar(r); g.add(edge);
    return this._push(g, life, (k, t) => {
      fill.material.opacity = 0.3 * Math.min(1, k * 5) * (0.8 + Math.sin(t * 8) * 0.2);
      if (Math.random() < 0.5) { const a = Math.random() * 6.28, rr = Math.random() * r; this.dot(p.x + Math.cos(a) * rr, 0.15, p.z + Math.sin(a) * rr, o.particle ?? o.color ?? 0xff6622, 0.4, 0.7, 0, 1.6, 0); }
    });
  }
  /** pillar of light/energy (transformations, lightning strikes) */
  pillar(p, o = {}) {
    const m = new THREE.Mesh(cylGeo, glowUnique(o.color ?? 0xffffff, 0.8));
    const h = o.h ?? 8, r = o.r ?? 0.8;
    m.position.set(p.x, h / 2, p.z);
    return this._push(m, o.life ?? 0.6, (k) => { m.scale.set(r * (0.3 + k), h, r * (0.3 + k)); m.material.opacity = 0.8 * k; });
  }
  shake(a) { this.shakeAmt = Math.min(1.2, this.shakeAmt + a); }

  /** continuous aura spawner around a world position (called per frame by fighters) */
  auraTick(pos, color, dt, intensity = 1, height = 1.4, style = 'flame') {
    tmpC.set(color);
    const n = Math.ceil(dt * 60 * intensity * (style === 'spark' ? 0.6 : 1.2));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, rr = 0.25 + Math.random() * 0.3;
      if (style === 'spark') {
        this.add.spawn(pos.x + Math.cos(a) * rr, pos.y - 0.5 + Math.random() * height, pos.z + Math.sin(a) * rr, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, tmpC.r, tmpC.g, tmpC.b, 0.12, 0.15, 0, 0);
      } else {
        this.add.spawn(pos.x + Math.cos(a) * rr, pos.y - 0.6 + Math.random() * 0.4, pos.z + Math.sin(a) * rr, Math.cos(a) * 0.3, 2.2 + Math.random() * 1.6, Math.sin(a) * 0.3, tmpC.r, tmpC.g, tmpC.b, 0.42 * (0.6 + Math.random() * 0.6), 0.45 + Math.random() * 0.25, 0, 0.5);
      }
    }
  }

  update(dt) {
    this.time += dt;
    this.add.update(dt);
    this.norm.update(dt);
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life -= dt;
      const k = Math.max(0, f.life / f.max);
      f.update && f.update(k, this.time);
      if (f.life <= 0) {
        this.scene.remove(f.obj);
        f.onEnd && f.onEnd();
        this.fx.splice(i, 1);
      }
    }
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 2.5);
  }
  clear() {
    for (const f of this.fx) this.scene.remove(f.obj);
    this.fx.length = 0;
  }
}

// ---------------------------------------------------------------------------
// Projectile visuals
const projCache = {};
export function projectileMesh(shape, color, size = 0.3, color2) {
  const g = new THREE.Group();
  const c2 = color2 ?? 0xffffff;
  switch (shape) {
    case 'slash': case 'wave': {
      const m = new THREE.Mesh(crescent(shape === 'wave' ? 2.6 : 2.0), glowUnique(color, 0.95)); m.material.side = THREE.DoubleSide;
      m.scale.set(size * 2.4, 1, size * 2.4); m.rotation.y = -Math.PI / 2; m.position.y = 0;
      const core = new THREE.Mesh(crescent(1.6), glowUnique(c2, 0.9)); core.material.side = THREE.DoubleSide; core.scale.set(size * 2.1, 1, size * 2.1); core.rotation.y = -Math.PI / 2; core.position.y = 0.02;
      g.add(m, core); break;
    }
    case 'blade': { // spinning invisible-cut disc (Dismantle)
      const m = new THREE.Mesh(new THREE.RingGeometry(size * 0.3, size * 1.2, 24, 1, 0, Math.PI * 1.3), glowUnique(color, 0.9)); m.material.side = THREE.DoubleSide; m.rotation.x = -Math.PI / 2;
      g.add(m); g.userData.spin = 18; break;
    }
    case 'spike': case 'kunai': case 'ice': {
      const geo = shape === 'ice' ? new THREE.OctahedronGeometry(size, 0) : new THREE.ConeGeometry(size * 0.45, size * 2.6, 6);
      const m = new THREE.Mesh(geo, shape === 'kunai' ? new THREE.MeshToonMaterial({ color: 0x9aa4b4 }) : glowUnique(color, 0.95));
      if (shape !== 'ice') m.rotation.z = -Math.PI / 2; else m.scale.set(1.8, 0.8, 0.8);
      g.add(m);
      if (shape !== 'kunai') { const h = new THREE.Mesh(sphereGeo, glowUnique(color, 0.35)); h.scale.setScalar(size * 1.4); g.add(h); }
      break;
    }
    case 'shuriken': {
      const s = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? size * 0.35 : size * 1.1; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(r, 0); }
      const m = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: 0xb8c0cc, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; g.add(m); g.userData.spin = 20; break;
    }
    case 'fist': {
      const m = new THREE.Mesh(sphereGeo, new THREE.MeshToonMaterial({ color })); m.scale.set(size * 1.2, size, size); g.add(m);
      const h = new THREE.Mesh(sphereGeo, glowUnique(c2, 0.35)); h.scale.setScalar(size * 1.5); g.add(h); break;
    }
    case 'petal': {
      for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(size * 0.35, 5), glowUnique(color, 0.9)); p.material.side = THREE.DoubleSide; p.position.set((Math.random() - 0.5) * size * 2, (Math.random() - 0.5) * size, (Math.random() - 0.5) * size * 2); p.rotation.set(Math.random() * 3, Math.random() * 3, 0); g.add(p); }
      g.userData.spin = 6; break;
    }
    case 'void': {
      const core = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0x050308 })); core.scale.setScalar(size * 0.7); g.add(core);
      const sh = new THREE.Mesh(sphereGeo, fresnelMaterial(color, 1.6, 2.2)); sh.scale.setScalar(size * 1.15); g.add(sh);
      g.userData.fres = sh.material; break;
    }
    case 'string': {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, size * 4, 4), glowUnique(color, 0.9)); m.rotation.z = Math.PI / 2; g.add(m); break;
    }
    case 'rock': {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), new THREE.MeshToonMaterial({ color })); g.add(m); g.userData.spin = 5; break;
    }
    case 'bat': {
      const m = new THREE.Mesh(new THREE.ConeGeometry(size * 0.6, size * 1.6, 3), glowUnique(color, 0.9)); m.rotation.z = -Math.PI / 2; m.scale.z = 0.3; g.add(m); break;
    }
    default: { // orb / flame / bolt / ki
      const core = new THREE.Mesh(sphereGeo, glowUnique(c2, 1)); core.scale.setScalar(size * 0.55); g.add(core);
      const halo = new THREE.Mesh(sphereGeo, glowUnique(color, 0.6)); halo.scale.setScalar(size); g.add(halo);
      const halo2 = new THREE.Mesh(sphereGeo, glowUnique(color, 0.22)); halo2.scale.setScalar(size * 1.6); g.add(halo2);
      g.userData.pulse = halo;
    }
  }
  return g;
}

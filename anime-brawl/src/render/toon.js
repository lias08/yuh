// Cel-shading material system: 3-band toon ramp, fresnel rim light and
// normal-extruded ink outlines. Materials are cached by their parameters.
import * as THREE from 'three';

let ramp = null;
export function toonRamp() {
  if (!ramp) {
    const data = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 255, 255, 255, 255]);
    ramp = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
    ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
    ramp.needsUpdate = true;
  }
  return ramp;
}

const cache = new Map();

/**
 * Toon material with rim light.
 * opts: emissive (hex), emissiveIntensity, rim (0..1), rimColor, transparent, opacity, map
 */
export function toon(color, opts = {}) {
  const key = [color, opts.emissive ?? 0, opts.emissiveIntensity ?? 1, opts.rim ?? 0.45, opts.rimColor ?? 0xffffff,
    opts.opacity ?? 1, opts.map ? opts.map.uuid : '', opts.flat ? 1 : 0].join('|');
  if (!opts.unique && cache.has(key)) return cache.get(key);
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: toonRamp(),
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: (opts.opacity ?? 1) < 1,
    opacity: opts.opacity ?? 1,
    map: opts.map || null,
  });
  const rim = opts.rim ?? 0.45;
  const rimColor = new THREE.Color(opts.rimColor ?? 0xffffff);
  m.userData.rim = { value: rim };
  m.userData.rimColor = { value: rimColor };
  m.userData.flash = { value: 0 };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = m.userData.rim;
    shader.uniforms.uRimColor = m.userData.rimColor;
    shader.uniforms.uFlash = m.userData.flash;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uRim; uniform vec3 uRimColor; uniform float uFlash;')
      .replace('#include <opaque_fragment>', `
        float rimF = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
        rimF = smoothstep(0.55, 0.85, rimF);
        outgoingLight += uRimColor * rimF * uRim;
        outgoingLight = mix(outgoingLight, vec3(1.0), uFlash);
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'toonrim';
  if (!opts.unique) cache.set(key, m);
  return m;
}

/** Unshared clone so per-fighter flash/tint can be animated. */
export function toonUnique(color, opts = {}) { return toon(color, { ...opts, unique: true }); }

const outlineCache = new Map();
export function outlineMaterial(thickness = 0.022, color = 0x1a1224) {
  const key = thickness + '|' + color;
  if (outlineCache.has(key)) return outlineCache.get(key);
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      `vec3 transformed = vec3(position) + normalize(normal) * ${thickness.toFixed(4)};`);
  };
  m.customProgramCacheKey = () => 'outline' + thickness;
  outlineCache.set(key, m);
  return m;
}

/** Mesh + its ink outline. Returns a Group-less mesh with outline child. */
export function inked(geometry, material, thickness = 0.022) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  if (thickness > 0) {
    const o = new THREE.Mesh(geometry, outlineMaterial(thickness));
    o.userData.isOutline = true;
    mesh.add(o);
  }
  return mesh;
}

/** Additive glow material (for auras, projectiles, energy). */
const glowCache = new Map();
export function glow(color, opacity = 0.85) {
  const key = color + '|' + opacity;
  if (glowCache.has(key)) return glowCache.get(key);
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  glowCache.set(key, m);
  return m;
}
export function glowUnique(color, opacity = 0.85) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
}

/** Fresnel energy shell: bright at silhouette edges — used for auras/domains/shields. */
export function fresnelMaterial(color, power = 2.2, intensity = 1.4) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: power }, uI: { value: intensity }, uTime: { value: 0 }, uAlpha: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vW = position; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uPower; uniform float uI; uniform float uTime; uniform float uAlpha; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ float f = pow(1.0 - abs(dot(vN, vV)), uPower); float w = 0.75 + 0.25*sin(vW.y*9.0 - uTime*6.0 + vW.x*3.0);
        gl_FragColor = vec4(uColor * uI * (f*w + 0.08), clamp(f*w*uAlpha + 0.04*uAlpha, 0.0, 1.0)); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
}

export function lighten(hex, amt) {
  const c = new THREE.Color(hex); c.lerp(new THREE.Color(0xffffff), amt); return c.getHex();
}
export function darken(hex, amt) {
  const c = new THREE.Color(hex); c.lerp(new THREE.Color(0x000000), amt); return c.getHex();
}

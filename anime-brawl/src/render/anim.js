// Procedural animation for fighter rigs: idle, run cycle, attack poses,
// hit reactions, death, victory and the transformation power-up stance.
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
// envelope: fast in, hold, ease out
const env = (t) => (t < 0.18 ? t / 0.18 : t > 0.7 ? Math.max(0, 1 - (t - 0.7) / 0.3) : 1);

/**
 * st: { move:0..1, speed, action:{name,t,alt}, hitT, dead, deadT, victory, pose, transformT, stunned, channel }
 */
export function animate(rig, dt, st) {
  rig.t += dt;
  if (rig.type === 'dragon') return animateDragon(rig, dt, st);
  if (rig.type === 'beast') return animateBeast(rig, dt, st);
  const t = rig.t;
  const { arms, legs, torso, body, head, hips } = rig;
  rig.move = lerp(rig.move ?? 0, st.move ?? 0, Math.min(1, dt * 10));
  const run = rig.move;
  rig.phase = (rig.phase ?? 0) + dt * (9 + 3 * (st.speed ?? 1)) * (run > 0.05 ? 1 : 0);
  const ph = rig.phase;
  const sw = Math.sin(ph) * 0.85 * run;

  // ---- base locomotion ----
  const idle = Math.sin(t * 2.2);
  body.position.y = Math.abs(Math.sin(ph)) * 0.06 * run + idle * 0.008 * (1 - run);
  body.rotation.set(0, 0, 0);
  body.position.x = 0; body.position.z = 0;
  torso.rotation.set(0.18 * run + idle * 0.012, Math.sin(ph) * 0.12 * run, 0);
  head.rotation.set(-0.12 * run, 0, 0);
  hips.rotation.set(0, -Math.sin(ph) * 0.1 * run, 0);
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? 1 : -1;
    legs[i].hip.rotation.set(s * sw, 0, 0);
    legs[i].knee.rotation.set(Math.max(0, Math.sin(ph + (i ? Math.PI : 0) + 1.2)) * 1.1 * run, 0, 0);
    const a = arms[i];
    a.shoulder.rotation.set(-s * sw * 0.9 + idle * 0.03, 0, a.side * (0.14 + idle * 0.02));
    a.elbow.rotation.set(-0.35 - run * 0.7, 0, 0);
  }
  for (const a of rig.extraArms) { a.shoulder.rotation.set(Math.sin(t * 2 + a.side) * 0.2, 0, a.side * 0.6); a.elbow.rotation.set(-0.8, 0, 0); }
  if (rig.cape) rig.cape.rotation.x = -0.08 - run * 0.35 - Math.sin(t * 3) * 0.04;
  if (rig.tail) { let s = rig.tail.children[0]; let k = 0; while (s) { s.rotation.y = Math.sin(t * 3 + k) * 0.25; s = s.children.find(c => c.isGroup); k++; } }
  for (const sp of rig.spinners) { if (sp.userData.spin) sp.rotation.z += dt * 0.8; else sp.rotation.z = Math.sin(t * 0.8) * 0.1; }
  for (const w of rig.wings) w.rotation.y = w.userData.wing * (0.5 + Math.sin(t * 4) * 0.25);

  // ---- action overlay ----
  const act = st.action;
  if (act && act.t < 1) {
    const w = env(act.t), p = act.t;
    const R = act.alt ? arms[0] : arms[1], L = act.alt ? arms[1] : arms[0];
    const side = act.alt ? -1 : 1;
    switch (act.name) {
      case 'punch':
        R.shoulder.rotation.x = lerp(R.shoulder.rotation.x, -1.55, w);
        R.shoulder.rotation.z = lerp(R.shoulder.rotation.z, side * 0.1, w);
        R.elbow.rotation.x = lerp(R.elbow.rotation.x, -0.05, w);
        torso.rotation.y += -side * 0.45 * w;
        L.shoulder.rotation.x = lerp(L.shoulder.rotation.x, -0.5, w); L.elbow.rotation.x = lerp(L.elbow.rotation.x, -1.6, w);
        break;
      case 'slash': {
        const sweep = lerp(1.3, -1.0, clamp01(p * 2.2));
        R.shoulder.rotation.x = lerp(R.shoulder.rotation.x, -1.5, w);
        R.shoulder.rotation.y = side * sweep * w;
        R.shoulder.rotation.z = lerp(R.shoulder.rotation.z, side * (0.4 + sweep * 0.5), w);
        R.elbow.rotation.x = lerp(R.elbow.rotation.x, -0.2, w);
        torso.rotation.y += side * sweep * 0.5 * w;
        break;
      }
      case 'overhead': {
        const down = clamp01((p - 0.15) * 3);
        R.shoulder.rotation.x = lerp(R.shoulder.rotation.x, lerp(-3.0, -0.9, down), w);
        L.shoulder.rotation.x = lerp(L.shoulder.rotation.x, lerp(-3.0, -0.9, down), w);
        R.elbow.rotation.x = L.elbow.rotation.x = lerp(-0.3, -0.1, w);
        torso.rotation.x += lerp(-0.25, 0.35, down) * w;
        break;
      }
      case 'cast': case 'beam': case 'kame':
        for (const A of [R, L]) {
          A.shoulder.rotation.x = lerp(A.shoulder.rotation.x, -1.45, w);
          A.shoulder.rotation.z = lerp(A.shoulder.rotation.z, -A.side * (act.name === 'cast' ? 0.15 : 0.35), w);
          A.elbow.rotation.x = lerp(A.elbow.rotation.x, -0.1, w);
        }
        if (act.name === 'kame') { body.position.y -= 0.06 * w; torso.rotation.x += 0.2 * w; }
        break;
      case 'point':
        R.shoulder.rotation.x = lerp(R.shoulder.rotation.x, -1.6, w); R.elbow.rotation.x = lerp(R.elbow.rotation.x, 0, w);
        break;
      case 'raise':
        for (const A of [R, L]) { A.shoulder.rotation.x = lerp(A.shoulder.rotation.x, -2.9, w); A.shoulder.rotation.z = lerp(A.shoulder.rotation.z, A.side * 0.35, w); A.elbow.rotation.x = lerp(A.elbow.rotation.x, -0.1, w); }
        head.rotation.x -= 0.3 * w;
        break;
      case 'seal':
        for (const A of [R, L]) { A.shoulder.rotation.x = lerp(A.shoulder.rotation.x, -0.9, w); A.shoulder.rotation.z = lerp(A.shoulder.rotation.z, -A.side * 0.5, w); A.elbow.rotation.x = lerp(A.elbow.rotation.x, -1.5, w); }
        break;
      case 'kick':
        legs[act.alt ? 0 : 1].hip.rotation.x = lerp(legs[1].hip.rotation.x, -1.5, w);
        legs[act.alt ? 0 : 1].knee.rotation.x = lerp(0.6, 0, w) * w;
        torso.rotation.x -= 0.35 * w;
        body.position.y += 0.08 * w;
        break;
      case 'spin':
        body.rotation.y = p * Math.PI * 4;
        for (const A of [R, L]) { A.shoulder.rotation.z = lerp(A.shoulder.rotation.z, A.side * 1.4, w); A.elbow.rotation.x = 0; }
        break;
      case 'throw': {
        const fw = clamp01((p - 0.25) * 3);
        R.shoulder.rotation.x = lerp(R.shoulder.rotation.x, lerp(-2.6, -1.2, fw), w);
        R.elbow.rotation.x = lerp(R.elbow.rotation.x, lerp(-1.6, 0, fw), w);
        torso.rotation.y += side * lerp(0.5, -0.5, fw) * w;
        break;
      }
      case 'dash':
        torso.rotation.x += 0.55 * w; body.position.y += 0.04 * w;
        for (const A of [R, L]) { A.shoulder.rotation.x = lerp(A.shoulder.rotation.x, 1.0, w); A.elbow.rotation.x = -0.2; }
        legs[0].hip.rotation.x = lerp(legs[0].hip.rotation.x, -0.6, w); legs[1].hip.rotation.x = lerp(legs[1].hip.rotation.x, 0.8, w);
        break;
      case 'stomp':
        legs[1].hip.rotation.x = lerp(legs[1].hip.rotation.x, p < 0.4 ? -1.2 : 0, w);
        body.position.y -= (p > 0.4 ? 0.08 : 0) * w;
        for (const A of [R, L]) { A.shoulder.rotation.z = lerp(A.shoulder.rotation.z, A.side * 0.9, w); }
        break;
      case 'clap':
        for (const A of [R, L]) { A.shoulder.rotation.x = lerp(A.shoulder.rotation.x, -1.5, w); A.shoulder.rotation.z = lerp(A.shoulder.rotation.z, -A.side * (p < 0.4 ? 0.1 : 0.55), w); A.elbow.rotation.x = -0.2; }
        break;
      case 'flurry': {
        const k = Math.floor(p * 8) % 2;
        const A = k ? R : L, Bm = k ? L : R;
        A.shoulder.rotation.x = lerp(A.shoulder.rotation.x, -1.55, w); A.elbow.rotation.x = 0;
        Bm.shoulder.rotation.x = lerp(Bm.shoulder.rotation.x, -0.6, w); Bm.elbow.rotation.x = -1.5;
        torso.rotation.y += (k ? -0.3 : 0.3) * w;
        break;
      }
    }
  }

  // ---- channel / transformation power-up stance ----
  if (st.transformT !== undefined && st.transformT >= 0 && st.transformT < 1) {
    const p = st.transformT, w = env(p);
    for (const A of arms) { A.shoulder.rotation.x = lerp(A.shoulder.rotation.x, 0.4, w); A.shoulder.rotation.z = lerp(A.shoulder.rotation.z, A.side * 0.6, w); A.elbow.rotation.x = lerp(A.elbow.rotation.x, -1.2, w); }
    for (const Lg of legs) Lg.hip.rotation.z = 0;
    legs[0].hip.rotation.z = -0.25 * w; legs[1].hip.rotation.z = 0.25 * w;
    torso.rotation.x -= 0.35 * w; head.rotation.x -= 0.45 * w;
    body.position.y += Math.sin(p * Math.PI) * 0.35 + (Math.random() - 0.5) * 0.02 * w;
    body.position.x = (Math.random() - 0.5) * 0.03 * w;
  } else { legs[0].hip.rotation.z = 0; legs[1].hip.rotation.z = 0; }

  if (st.stunned) { head.rotation.z = Math.sin(t * 8) * 0.2; torso.rotation.x -= 0.2; }

  // ---- hit reaction ----
  if (st.hitT !== undefined && st.hitT < 0.25) {
    const k = 1 - st.hitT / 0.25;
    torso.rotation.x -= 0.35 * k; head.rotation.x -= 0.2 * k;
  }
  rig.flash.value = Math.max(0, rig.flash.value - dt * 7);

  // ---- victory / emotes ----
  if (st.victory) {
    const v = st.pose || 'fistUp';
    const bounce = Math.abs(Math.sin(t * 3.5));
    body.position.y = bounce * 0.15;
    if (v === 'fistUp') { arms[1].shoulder.rotation.set(-2.9, 0, 0.2); arms[1].elbow.rotation.x = -0.2; arms[0].shoulder.rotation.set(0, 0, -0.4); }
    else if (v === 'armsCrossed') { body.position.y = 0; for (const A of arms) { A.shoulder.rotation.set(-1.2, 0, -A.side * 0.7); A.elbow.rotation.x = -1.8; } head.rotation.x = -0.15; }
    else if (v === 'peace') { arms[1].shoulder.rotation.set(-2.5, 0, 0.8); arms[1].elbow.rotation.x = -1.7; }
    else if (v === 'swordUp') { arms[1].shoulder.rotation.set(-3.0, 0, 0.1); arms[1].elbow.rotation.x = 0; body.position.y = 0; }
    else if (v === 'flex') { for (const A of arms) { A.shoulder.rotation.set(0, 0, A.side * 1.5); A.elbow.rotation.x = -1.9; } body.position.y = bounce * 0.05; }
    else if (v === 'laugh') { torso.rotation.x = -0.4 + bounce * 0.1; for (const A of arms) { A.shoulder.rotation.set(-0.3, 0, A.side * 0.7); A.elbow.rotation.x = -1.6; } body.position.y = 0; }
    else if (v === 'bow') { torso.rotation.x = 0.7; body.position.y = 0; for (const A of arms) A.shoulder.rotation.set(0, 0, A.side * 0.1); }
    else if (v === 'float') { body.position.y = 0.25 + Math.sin(t * 2) * 0.06; for (const A of arms) { A.shoulder.rotation.set(0.2, 0, A.side * 0.5); A.elbow.rotation.x = -0.4; } }
  }

  // ---- death ----
  if (st.dead) {
    const k = clamp01(st.deadT / 0.5);
    rig.root.rotation.x = -1.45 * k;
    rig.root.position.y = -0.1 * k;
  } else { rig.root.rotation.x = 0; rig.root.position.y = 0; }
}

function animateBeast(rig, dt, st) {
  const run = st.move ?? 0;
  rig.phase = (rig.phase ?? 0) + dt * 14 * (run > 0.05 ? 1 : 0.2);
  rig.legs.forEach((l, i) => { l.hip.rotation.x = Math.sin(rig.phase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.7 * run; });
  rig.body.position.y = Math.abs(Math.sin(rig.phase)) * 0.05 * run;
  rig.head.rotation.x = st.action && st.action.t < 1 ? -0.4 * Math.sin(st.action.t * Math.PI) : Math.sin(rig.t * 3) * 0.05;
  rig.tail.rotation.z = Math.sin(rig.t * 8) * 0.4;
  rig.flash.value = Math.max(0, rig.flash.value - dt * 7);
  if (st.dead) rig.root.rotation.z = 1.4 * clamp01(st.deadT / 0.5); else rig.root.rotation.z = 0;
}

function animateDragon(rig, dt, st) {
  const t = rig.t;
  // record head path (in parent space, rig.root is the moving group)
  const head = rig.head;
  head.position.y = 0.95 + Math.sin(t * 2.5) * 0.12;
  head.rotation.x = Math.sin(t * 2.5) * 0.08 - (st.action && st.action.t < 1 ? 0.4 : 0);
  // segments trail behind along -z with sinusoidal undulation (in local space)
  rig.segs.forEach((s, i) => {
    const k = i + 1;
    s.position.set(Math.sin(t * 3 - k * 0.55) * 0.28 * Math.min(1, k / 3), 0.85 + Math.sin(t * 2.5 - k * 0.4) * 0.12 - k * 0.012, -k * 0.34);
  });
  rig.flash.value = Math.max(0, rig.flash.value - dt * 7);
  if (st.dead) rig.root.rotation.x = -1.2 * clamp01(st.deadT / 0.5); else rig.root.rotation.x = 0;
}

/** Trigger a short white hit flash on a rig. */
export function flashRig(rig, amt = 0.75) { rig.flash.value = Math.max(rig.flash.value, amt); }

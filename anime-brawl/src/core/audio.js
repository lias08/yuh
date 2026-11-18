// Procedural sound: every effect is synthesised with WebAudio (no samples),
// so each character's sound profile is original. Includes simple generative
// lobby and battle music loops.
let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
const settings = { sfx: 0.8, music: 0.45 };
const lastPlay = new Map();

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = settings.sfx; sfxBus.connect(comp);
  musicBus = ctx.createGain(); musicBus.gain.value = settings.music * 0.5; musicBus.connect(comp);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
export function setVolumes(sfx, music) {
  settings.sfx = sfx; settings.music = music;
  if (sfxBus) sfxBus.gain.value = sfx;
  if (musicBus) musicBus.gain.value = music * 0.5;
}

function env(g, t0, a, peak, dur) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
}
function osc(type, f0, f1, dur, vol = 0.3, t0 = 0, dest = sfxBus) {
  const t = ctx.currentTime + t0;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  env(g, t, 0.005, vol, dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  return o;
}
function noise(dur, vol = 0.3, type = 'bandpass', f0 = 1000, f1 = 1000, q = 1, t0 = 0, dest = sfxBus) {
  const t = ctx.currentTime + t0;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain(); env(g, t, 0.004, vol, dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
function fm(carrier, mod, index, dur, vol = 0.2, t0 = 0) {
  const t = ctx.currentTime + t0;
  const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
  c.frequency.value = carrier; m.frequency.value = mod; mg.gain.value = index;
  m.connect(mg); mg.connect(c.frequency); c.connect(g); g.connect(sfxBus);
  env(g, t, 0.002, vol, dur);
  c.start(t); m.start(t); c.stop(t + dur + 0.05); m.stop(t + dur + 0.05);
}

const R = (a, b) => a + Math.random() * (b - a);

const SFX = {
  punch: () => { osc('sine', 160, 50, 0.14, 0.5); noise(0.08, 0.25, 'lowpass', 1800, 400); },
  heavyPunch: () => { osc('sine', 120, 35, 0.3, 0.7); noise(0.2, 0.35, 'lowpass', 1200, 200); },
  punchBarrage: () => { for (let i = 0; i < 6; i++) { osc('sine', 170, 60, 0.08, 0.3, i * 0.06); noise(0.05, 0.15, 'lowpass', 1500, 400, 1, i * 0.06); } },
  kick: () => { noise(0.12, 0.3, 'bandpass', 600, 2400, 2); osc('sine', 140, 50, 0.12, 0.4); },
  slash: () => { noise(0.16, 0.35, 'bandpass', R(2500, 3500), 800, 3); osc('sawtooth', 1800, 600, 0.06, 0.05); },
  heavySlash: () => { noise(0.25, 0.45, 'bandpass', 1800, 300, 2); osc('sine', 110, 50, 0.2, 0.3); },
  slashBig: () => { noise(0.45, 0.5, 'bandpass', 3000, 200, 1.5); osc('sawtooth', 400, 60, 0.4, 0.12); osc('sine', 80, 30, 0.5, 0.5); },
  blunt: () => { osc('triangle', 220, 80, 0.18, 0.4); noise(0.12, 0.25, 'lowpass', 900, 300); },
  claw: () => { noise(0.1, 0.3, 'highpass', 2500, 4000, 2); noise(0.1, 0.25, 'highpass', 2000, 3500, 2, 0.06); },
  ki: () => { osc('sine', R(700, 900), 1400, 0.12, 0.2); osc('square', 300, 600, 0.08, 0.05); },
  kiBig: () => { osc('sawtooth', 120, 900, 0.5, 0.15); osc('sine', 200, 1200, 0.5, 0.25); noise(0.5, 0.15, 'bandpass', 400, 3000, 1); },
  kamehameha: () => { osc('sawtooth', 80, 220, 0.5, 0.18); osc('sine', 400, 900, 0.6, 0.2); noise(1.2, 0.3, 'bandpass', 300, 1800, 0.8, 0.4); osc('sine', 60, 40, 1.2, 0.5, 0.45); },
  beam: () => { osc('sawtooth', 1600, 400, 0.18, 0.12); osc('sine', 2200, 900, 0.15, 0.15); },
  beamBig: () => { osc('sawtooth', 100, 300, 0.6, 0.18); noise(1.0, 0.35, 'bandpass', 500, 2500, 0.7, 0.3); osc('sine', 55, 40, 1.0, 0.5, 0.3); },
  space: () => { osc('sine', 600, 120, 0.35, 0.25); osc('sine', 606, 118, 0.35, 0.2); noise(0.3, 0.08, 'bandpass', 3000, 300, 4); },
  purple: () => { osc('sine', 100, 50, 1.4, 0.6); osc('sawtooth', 300, 60, 1.2, 0.12); osc('sine', 1200, 200, 1.0, 0.15); noise(1.3, 0.3, 'lowpass', 3000, 100); },
  domain: () => { osc('sine', 80, 40, 2.2, 0.5); osc('triangle', 440, 110, 1.8, 0.12); osc('sine', 660, 165, 1.8, 0.1); noise(2, 0.12, 'bandpass', 200, 4000, 0.5); for (let i = 0; i < 4; i++) fm(880 * (1 + i * 0.5), 3, 40, 0.5, 0.06, i * 0.15); },
  fire: () => { noise(0.4, 0.35, 'lowpass', 1200, 300, 0.7); osc('sawtooth', 90, 60, 0.3, 0.08); },
  fireBig: () => { noise(0.9, 0.5, 'lowpass', 2000, 150, 0.6); osc('sine', 70, 35, 0.8, 0.5); },
  ice: () => { for (let i = 0; i < 4; i++) osc('sine', R(1800, 3200), R(2500, 4000), 0.25, 0.08, i * 0.04); noise(0.2, 0.15, 'highpass', 5000, 7000, 1); },
  electric: () => { fm(R(600, 900), R(40, 90), 900, 0.18, 0.18); noise(0.12, 0.2, 'highpass', 3000, 6000, 1); },
  thunder: () => { noise(0.5, 0.5, 'lowpass', 4000, 200, 0.5); fm(200, 33, 400, 0.4, 0.2); },
  thunderBig: () => { noise(1.1, 0.6, 'lowpass', 5000, 80, 0.5); fm(150, 27, 600, 0.9, 0.25); osc('sine', 50, 30, 1.0, 0.5); },
  chidori: () => { for (let i = 0; i < 8; i++) fm(R(1200, 2400), R(80, 160), 1500, 0.08, 0.08, i * 0.05); noise(0.5, 0.25, 'highpass', 4000, 8000, 1); },
  dark: () => { osc('sawtooth', 110, 55, 0.4, 0.15); osc('sine', 70, 40, 0.4, 0.3); noise(0.3, 0.1, 'lowpass', 600, 200); },
  hakai: () => { osc('sine', 1500, 60, 0.6, 0.25); osc('sawtooth', 200, 40, 0.6, 0.12); noise(0.6, 0.25, 'bandpass', 2000, 100, 2); },
  wind: () => { noise(0.4, 0.35, 'bandpass', 600, 2400, 3); noise(0.4, 0.2, 'bandpass', 1500, 500, 5); },
  water: () => { noise(0.3, 0.3, 'bandpass', 800, 300, 2); },
  wood: () => { osc('triangle', 300, 160, 0.12, 0.35); noise(0.15, 0.2, 'bandpass', 800, 400, 4); osc('triangle', 220, 120, 0.12, 0.25, 0.08); },
  rock: () => { noise(0.4, 0.5, 'lowpass', 800, 100, 0.7); osc('sine', 90, 30, 0.35, 0.5); },
  magma: () => { noise(0.5, 0.4, 'lowpass', 700, 150, 1); for (let i = 0; i < 4; i++) osc('sine', R(80, 160), 50, 0.12, 0.15, i * 0.08); },
  petal: () => { for (let i = 0; i < 6; i++) noise(0.08, 0.1, 'highpass', 5000, 7000, 3, i * 0.03); osc('sine', 2400, 3200, 0.2, 0.05); },
  string: () => { fm(R(900, 1300), 3, 200, 0.18, 0.12); noise(0.1, 0.15, 'highpass', 4000, 7000, 3); },
  rubber: () => { osc('sine', 200, 900, 0.12, 0.3); osc('sine', 900, 250, 0.15, 0.25, 0.1); },
  bajrang: () => { osc('sine', 120, 40, 1.0, 0.6, 0.3); osc('square', 200, 1000, 0.3, 0.08); noise(0.8, 0.45, 'lowpass', 2000, 100, 0.6, 0.3); },
  mochi: () => { osc('sine', 300, 120, 0.2, 0.3); noise(0.15, 0.15, 'lowpass', 600, 200, 3); },
  squish: () => { osc('sine', 400, 120, 0.15, 0.25); noise(0.12, 0.2, 'bandpass', 500, 200, 5); },
  candy: () => { for (let i = 0; i < 4; i++) osc('sine', 1200 + i * 300, 1600 + i * 300, 0.1, 0.1, i * 0.05); },
  holy: () => { for (let i = 0; i < 3; i++) osc('sine', [880, 1320, 1760][i], [880, 1320, 1760][i] * 1.01, 0.4, 0.1, i * 0.02); noise(0.2, 0.1, 'highpass', 6000, 8000); },
  cero: () => { osc('sawtooth', 300, 1200, 0.25, 0.12); osc('sine', 120, 60, 0.3, 0.3); },
  getsuga: () => { noise(0.5, 0.45, 'bandpass', 2500, 300, 1.5); osc('sawtooth', 600, 100, 0.4, 0.12); osc('sine', 90, 40, 0.5, 0.4); },
  kurohitsugi: () => { osc('sine', 60, 30, 1.2, 0.6); for (let i = 0; i < 6; i++) noise(0.1, 0.2, 'bandpass', 1000, 300, 6, 0.6 + i * 0.06); },
  kido: () => { fm(660, 2, 30, 0.4, 0.12); osc('sine', 1320, 1320, 0.3, 0.06); },
  haki: () => { osc('sawtooth', 70, 40, 0.8, 0.3); noise(0.8, 0.35, 'lowpass', 400, 80, 0.6); fm(100, 13, 300, 0.6, 0.15); },
  shinra: () => { osc('sine', 300, 40, 0.8, 0.5); noise(0.7, 0.5, 'lowpass', 3000, 100, 0.5); },
  quake: () => { osc('sine', 50, 25, 1.0, 0.7); noise(0.8, 0.4, 'lowpass', 300, 60, 0.5); for (let i = 0; i < 5; i++) noise(0.06, 0.2, 'highpass', 2000, 4000, 2, i * 0.05); },
  meteor: () => { noise(1.2, 0.25, 'bandpass', 400, 2000, 1); osc('sine', 300, 60, 1.2, 0.2); },
  explode: () => { noise(0.45, 0.5, 'lowpass', 1800, 100, 0.6); osc('sine', 90, 35, 0.4, 0.5); },
  explodeBig: () => { noise(1.0, 0.7, 'lowpass', 2500, 60, 0.5); osc('sine', 70, 25, 1.0, 0.7); },
  teleport: () => { osc('sine', 400, 1800, 0.08, 0.2); noise(0.08, 0.15, 'highpass', 4000, 8000, 2); },
  sonido: () => { noise(0.06, 0.3, 'bandpass', 3000, 6000, 3); },
  whoosh: () => { noise(0.25, 0.3, 'bandpass', 400, 2000, 2); },
  kunai: () => { noise(0.08, 0.25, 'highpass', 3000, 5000, 3); fm(2400, 7, 100, 0.06, 0.06); },
  poof: () => { noise(0.25, 0.35, 'lowpass', 2000, 300, 0.8); osc('sine', 500, 200, 0.12, 0.1); },
  genjutsu: () => { osc('sine', 300, 600, 0.6, 0.15); osc('sine', 303, 606, 0.6, 0.15); osc('sine', 150, 75, 0.6, 0.2); },
  crow: () => { for (let i = 0; i < 3; i++) fm(R(700, 900), R(30, 50), 300, 0.1, 0.1, i * 0.08); },
  shield: () => { osc('sine', 500, 900, 0.3, 0.15); osc('triangle', 1000, 1400, 0.3, 0.06); },
  heal: () => { for (let i = 0; i < 3; i++) osc('sine', [660, 880, 1100][i], [660, 880, 1100][i], 0.25, 0.12, i * 0.07); },
  powerup: () => { osc('sawtooth', 200, 800, 0.35, 0.1); osc('sine', 400, 1600, 0.35, 0.15); },
  reload: () => { osc('square', 900, 900, 0.03, 0.05); osc('square', 1200, 1200, 0.03, 0.05, 0.05); },
  clap: () => { noise(0.08, 0.6, 'bandpass', 1500, 1200, 1.5); noise(0.12, 0.25, 'bandpass', 2500, 2000, 3, 0.01); },
  voice: () => { fm(180, 5, 40, 0.5, 0.2); osc('sawtooth', 120, 100, 0.4, 0.06); },
  roar: () => { osc('sawtooth', 120, 60, 0.7, 0.25); noise(0.7, 0.35, 'bandpass', 300, 150, 1); fm(80, 23, 200, 0.6, 0.1); },
  laugh: () => { for (let i = 0; i < 4; i++) osc('sawtooth', 240 - i * 10, 200 - i * 10, 0.09, 0.08, i * 0.12); },
  steam: () => { noise(0.6, 0.3, 'highpass', 2000, 6000, 1); },
  flash: () => { osc('sine', 2000, 4000, 0.3, 0.15); noise(0.3, 0.2, 'highpass', 6000, 9000); },
  room: () => { osc('sine', 300, 300, 0.5, 0.12); osc('sine', 450, 450, 0.5, 0.08); fm(600, 4, 20, 0.5, 0.06); },
  blackFlash: () => { noise(0.08, 0.6, 'bandpass', 2000, 600, 2); osc('square', 60, 30, 0.25, 0.3); fm(400, 37, 800, 0.15, 0.15); },
  nightGuy: () => { osc('sawtooth', 60, 300, 0.8, 0.2); noise(1.2, 0.6, 'lowpass', 3000, 60, 0.4, 0.2); osc('sine', 45, 30, 1.2, 0.7, 0.2); },
  dash: () => { noise(0.2, 0.3, 'bandpass', 800, 3000, 2); },
  // ui / game
  hit: () => { osc('square', 300, 120, 0.05, 0.08); },
  hitHeavy: () => { osc('square', 200, 60, 0.08, 0.12); noise(0.06, 0.15, 'lowpass', 2000, 500); },
  crit: () => { osc('square', 900, 1800, 0.08, 0.12); osc('sine', 120, 50, 0.15, 0.3); },
  ko: () => { osc('sawtooth', 400, 80, 0.5, 0.15); noise(0.4, 0.3, 'lowpass', 1500, 200); },
  dodge: () => { noise(0.1, 0.2, 'bandpass', 2000, 4000, 4); osc('sine', 1200, 1800, 0.08, 0.05); },
  gem: () => { osc('sine', 1400, 2100, 0.12, 0.15); osc('sine', 2100, 2800, 0.12, 0.1, 0.06); },
  goal: () => { for (let i = 0; i < 5; i++) osc('square', 440 * (1 + i * 0.25), 440 * (1 + i * 0.25), 0.15, 0.08, i * 0.08); },
  transform: () => { osc('sawtooth', 80, 600, 1.0, 0.18); osc('sine', 160, 1200, 1.0, 0.2); noise(1.1, 0.4, 'bandpass', 200, 5000, 0.6); osc('sine', 60, 30, 0.8, 0.7, 0.95); noise(0.6, 0.5, 'lowpass', 3000, 100, 0.5, 0.95); },
  click: () => { osc('sine', 900, 1300, 0.05, 0.12); },
  tap: () => { osc('sine', 600, 800, 0.04, 0.08); },
  coin: () => { osc('square', 1300, 1300, 0.05, 0.06); osc('square', 1700, 1700, 0.1, 0.06, 0.05); },
  unlock: () => { for (let i = 0; i < 6; i++) osc('triangle', 440 * Math.pow(1.26, i), 440 * Math.pow(1.26, i), 0.25, 0.1, i * 0.09); noise(0.8, 0.2, 'highpass', 4000, 9000, 1, 0.5); },
  win: () => { [523, 659, 784, 1046].forEach((f, i) => osc('triangle', f, f, 0.35, 0.15, i * 0.12)); },
  lose: () => { [440, 392, 349, 262].forEach((f, i) => osc('triangle', f, f, 0.35, 0.12, i * 0.15)); },
  countdown: () => { osc('square', 880, 880, 0.08, 0.08); },
  start: () => { osc('square', 1320, 1320, 0.25, 0.1); osc('sine', 660, 660, 0.3, 0.15); },
};

export function sfx(key, vol = 1) {
  if (!ctx || settings.sfx <= 0) return;
  const f = SFX[key]; if (!f) return;
  const now = performance.now();
  if ((now - (lastPlay.get(key) ?? 0)) < 35) return;
  lastPlay.set(key, now);
  try {
    if (vol !== 1) { const prev = sfxBus.gain.value; sfxBus.gain.value = prev; }
    f();
  } catch (e) { /* audio errors are never fatal */ }
}

// ---- generative music ------------------------------------------------------
let musicTimer = null, musicKind = null, step = 0;
const SCALES = { lobby: [0, 3, 5, 7, 10, 12, 15], battle: [0, 2, 3, 7, 8, 12, 14] };
export function music(kind) {
  if (!ctx) return;
  if (musicKind === kind) return;
  stopMusic(); musicKind = kind; step = 0;
  if (!kind) return;
  const bpm = kind === 'battle' ? 132 : 92;
  const beat = 60 / bpm / 2;
  const root = kind === 'battle' ? 110 : 146.8;
  const sc = SCALES[kind] || SCALES.lobby;
  const prog = kind === 'battle' ? [0, 0, 5, 3] : [0, 5, 3, 4];
  musicTimer = setInterval(() => {
    if (!ctx || settings.music <= 0) return;
    const bar = Math.floor(step / 8) % 4; const b = step % 8;
    const chordRoot = root * Math.pow(2, (sc[prog[bar] % sc.length]) / 12);
    // bass
    if (b % 2 === 0) osc(kind === 'battle' ? 'sawtooth' : 'triangle', chordRoot / 2, chordRoot / 2, beat * 1.6, kind === 'battle' ? 0.12 : 0.16, 0, musicBus);
    // drums
    if (kind === 'battle') {
      if (b % 4 === 0) { osc('sine', 140, 40, 0.18, 0.5, 0, musicBus); }
      if (b % 4 === 2) noise(0.1, 0.18, 'bandpass', 1800, 1200, 1, 0, musicBus);
      noise(0.03, 0.05, 'highpass', 8000, 9000, 1, 0, musicBus);
    } else if (b === 0) osc('sine', 100, 50, 0.2, 0.25, 0, musicBus);
    // arp
    const note = sc[(step * 3 + bar) % sc.length];
    if (kind === 'lobby' ? b % 2 === 1 : true) osc(kind === 'battle' ? 'square' : 'sine', chordRoot * 2 * Math.pow(2, note / 12), chordRoot * 2 * Math.pow(2, note / 12), beat * 0.9, kind === 'battle' ? 0.035 : 0.07, 0, musicBus);
    // pad on bar start
    if (b === 0) for (const iv of [0, 3, 7]) osc('triangle', chordRoot * Math.pow(2, iv / 12), chordRoot * Math.pow(2, iv / 12), beat * 7.5, 0.035, 0, musicBus);
    step++;
  }, beat * 1000);
}
export function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; musicKind = null; }
